// Batch translate v2: example blocks handled separately (line-level)
const ZAI = require('z-ai-web-dev-sdk').default;
const fs = require('fs');
const OUT_DIR = '/home/z/my-project/share/projects/6ad85ab25dddfa3997dd173e/scripts';
const SKIP_KEYS = new Set(['code', 'formula', 'example']);

function getRef(obj, path) {
  const parts = path.split('.');
  let cur = obj, lastKey = null, lastIdx = null;
  for (const part of parts) {
    const m = part.match(/^([^\[\]]+)(\[\d+\])*$/);
    if (!m) throw new Error('bad path ' + path);
    const base = m[1];
    if (base) { if (lastKey !== null || lastIdx !== null) cur = (lastIdx !== null) ? cur[lastIdx] : cur[lastKey]; lastKey = base; lastIdx = null; }
    const idxs = (m[2] || '').match(/\[(\d+)\]/g) || [];
    for (const raw of idxs) {
      if (lastKey !== null) { cur = cur[lastKey]; lastKey = null; }
      else if (lastIdx !== null) cur = cur[lastIdx];
      lastIdx = parseInt(raw.slice(1, -1), 10);
    }
  }
  return { cur, lastKey, lastIdx };
}

function extractStrings(obj, prefix, out) {
  if (typeof obj === 'string') {
    if (/[\u4e00-\u9fff]/.test(obj)) out.push({ path: prefix, text: obj });
  } else if (Array.isArray(obj)) {
    obj.forEach((v, i) => extractStrings(v, prefix ? prefix + '[' + i + ']' : '[' + i + ']', out));
  } else if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (SKIP_KEYS.has(k)) continue;
      extractStrings(obj[k], prefix ? prefix + '.' + k : k, out);
    }
  }
}
// 收集 example（值可能中文+代码混合多行）
function extractExamples(obj, prefix, out) {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => extractExamples(v, prefix ? prefix + '[' + i + ']' : '[' + i + ']', out));
  } else if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (k === 'example' && typeof obj[k] === 'string') { out.push({ path: prefix ? prefix + '.' + k : k, text: obj[k] }); continue; }
      extractExamples(obj[k], prefix ? prefix + '.' + k : k, out);
    }
  }
}

const SYS = 'You are a professional translator rendering a Chinese textbook for middle-school students into natural, clear English. Rules: keep ALL numbers, formulas, variable names (R/W/K/V, a, b, wkv), product names (RWKV, Pile, World v2, DeepEmbed, ROSA, RPU, LAMBADA, MMLU, WebGPU, LoRA), and code snippets EXACTLY as-is. Keep the same friendly teacher tone. Input is a JSON array of objects {path, text}. Output ONLY a JSON array of objects {path, text} with translated text. No extra commentary.';

function robustParse(raw) {
  let s = raw.replace(/^```(json)?/m, '').replace(/```\s*$/m, '').trim();
  const i = s.indexOf('['), j = s.lastIndexOf(']');
  s = s.slice(i, j + 1);
  try { return JSON.parse(s); } catch (e) {}
  // 修复常见问题：未转义的内部引号少见的换行 —— 尝试宽松修复
  try {
    const fixed = s.replace(/"(path|text)"\s*:/g, '"$1":').replace(/[\r\n]+/g, '\\n');
    return JSON.parse(fixed);
  } catch (e) { throw new Error('JSON fail'); }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function translateBatch(zai, items, sysPrompt) {
  const payload = items.map(x => ({ path: x.path, text: x.text }));
  let rateLimited = 0;
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      const res = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: sysPrompt || SYS },
          { role: 'user', content: JSON.stringify(payload) },
        ],
        thinking: { type: 'disabled' },
        temperature: 0.2,
      });
      const arr = robustParse(res.choices[0].message.content.trim());
      if (Array.isArray(arr) && arr.length) return arr;
      throw new Error('bad array');
    } catch (e) {
      const msg = String(e.message || e);
      if (msg.includes('429') || msg.includes('Too many')) {
        rateLimited++;
        console.log('  429 rate-limited, backoff 90s (' + rateLimited + ')');
        await sleep(90000);
        attempt--; // 429 不计入重试次数
        continue;
      }
      console.error('  retry', attempt, msg.slice(0, 60));
      if (attempt >= 6) throw e;
      await sleep(5000);
    }
  }
}

async function translateFile(zai, inFile, outFile, exportNames) {
  const data = require(inFile);
  let items = [], examples = [];
  for (const n of exportNames) {
    extractStrings(data[n], n, items);
    extractExamples(data[n], n, examples);
  }
  console.log(inFile.split('/').pop() + ': ' + items.length + ' strings + ' + examples.length + ' examples');
  const apply = (arr, batch) => {
    const byPath = {};
    for (const t of arr) byPath[t.path] = t.text;
    let miss = 0;
    batch.forEach(it => {
      const en = byPath[it.path];
      if (typeof en !== 'string') { miss++; return; }
      CACHE[it.path] = en;
      const { cur, lastKey, lastIdx } = getRef(data, it.path);
      if (lastIdx !== null) cur[lastIdx] = en;
      else if (lastKey) cur[lastKey] = en;
    });
    cacheSave();
    if (miss) console.error('  MISS x' + miss);
  };
  // 先回放缓存
  for (const it of items.concat(examples)) {
    if (CACHE[it.path]) {
      const { cur, lastKey, lastIdx } = getRef(data, it.path);
      if (lastIdx !== null) cur[lastIdx] = CACHE[it.path];
      else if (lastKey) cur[lastKey] = CACHE[it.path];
    }
  }
  items = items.filter(it => !CACHE[it.path]);
  examples = examples.filter(it => !CACHE[it.path]);
  console.log('  after cache: ' + items.length + ' strings + ' + examples.length + ' examples remain');
  const B = 30;
  for (let i = 0; i < items.length; i += B) {
    if (i > 0) await sleep(15000);
    const batch = items.slice(i, i + B);
    apply(await translateBatch(zai, batch), batch);
    console.log('  str batch ' + (i / B + 1) + ' (' + Math.min(i + B, items.length) + '/' + items.length + ')');
  }
  const EXB = 4;
  for (let i = 0; i < examples.length; i += EXB) {
    const batch = examples.slice(i, i + EXB);
    const sysEx = SYS + ' IMPORTANT: the "text" fields contain MIXED content: Chinese explanation lines and Python code lines. Translate ONLY the Chinese parts into English; keep every code line EXACTLY as-is (including Chinese comments inside code - keep those Chinese comments unchanged). Preserve line breaks as \\n in the JSON string.';
    apply(await translateBatch(zai, batch, sysEx), batch);
    console.log('  ex batch ' + (i / EXB + 1) + ' (' + Math.min(i + EXB, examples.length) + '/' + examples.length + ')');
  }
  const parts = exportNames.map(n => 'const ' + n + ' = ' + JSON.stringify(data[n], null, 2) + ';').join('\n\n');
  fs.writeFileSync(outFile, '// AUTO-TRANSLATED ENGLISH EDITION\n' + parts + '\n\nmodule.exports = { ' + exportNames.join(', ') + ' };\n');
  console.log('WROTE ' + outFile.split('/').pop());
}


const CACHE_FILE = '/home/z/my-project/share/projects/6ad85ab25dddfa3997dd173e/tmp/6ad85bcc973da8774906b308_translate_cache.json';
let CACHE = {};
try { CACHE = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')); } catch (e) {}
function cacheSave() { try { fs.writeFileSync(CACHE_FILE, JSON.stringify(CACHE)); } catch (e) {} }

async function main() {
  const zai = await ZAI.create();
  const jobs = [
    ['textbook_part345.js', 'textbook_en_part345.js', ['PART3', 'PART4', 'PART5', 'APPENDIX']],
    ['textbook_part6.js', 'textbook_en_part6.js', ['PART6']],
    ['textbook_part7.js', 'textbook_en_part7.js', ['PART7']],
    ['textbook_appendix2.js', 'textbook_en_appendix2.js', ['APPENDIX2']],
  ];
  for (const [inF, outF, names] of jobs) {
    if (fs.existsSync(OUT_DIR + '/' + outF)) { console.log('SKIP ' + outF); continue; }
    await translateFile(zai, OUT_DIR + '/' + inF, OUT_DIR + '/' + outF, names);
  }
  console.log('ALL DONE');
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
