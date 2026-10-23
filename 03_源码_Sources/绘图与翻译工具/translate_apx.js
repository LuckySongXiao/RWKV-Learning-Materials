// appendix2 专用翻译：批5条，失败降级单条；带缓存
const ZAI = require('z-ai-web-dev-sdk').default;
const fs = require('fs');
const OUT_DIR = '/home/z/my-project/share/projects/6ad85ab25dddfa3997dd173e/scripts';
const CACHE_FILE = '/home/z/my-project/share/projects/6ad85ab25dddfa3997dd173e/tmp/6ad85bcc973da8774906b308_translate_cache.json';
const SKIP_KEYS = new Set(['code', 'formula', 'example']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let CACHE = {};
try { CACHE = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')); } catch (e) {}

function getRef(obj, path) {
  const parts = path.split('.');
  let cur = obj, lastKey = null, lastIdx = null;
  for (const part of parts) {
    const m = part.match(/^([^\[\]]+)(\[\d+\])*$/);
    if (!m) throw new Error('bad path');
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
  if (typeof obj === 'string') { if (/[\u4e00-\u9fff]/.test(obj)) out.push({ path: prefix, text: obj }); }
  else if (Array.isArray(obj)) { obj.forEach((v, i) => extractStrings(v, prefix ? prefix + '[' + i + ']' : '[' + i + ']', out)); }
  else if (obj && typeof obj === 'object') { for (const k of Object.keys(obj)) { if (SKIP_KEYS.has(k)) continue; extractStrings(obj[k], prefix ? prefix + '.' + k : k, out); } }
}
function extractExamples(obj, prefix, out) {
  if (Array.isArray(obj)) { obj.forEach((v, i) => extractExamples(v, prefix ? prefix + '[' + i + ']' : '[' + i + ']', out)); }
  else if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (k === 'example' && typeof obj[k] === 'string') { out.push({ path: prefix ? prefix + '.' + k : k, text: obj[k] }); continue; }
      extractExamples(obj[k], prefix ? prefix + '.' + k : k, out);
    }
  }
}
function robustParse(raw) {
  let s = raw.replace(/^```(json)?/m, '').replace(/```\s*$/m, '').trim();
  const i = s.indexOf('['), j = s.lastIndexOf(']');
  s = s.slice(i, j + 1);
  try { return JSON.parse(s); } catch (e) {}
  // 逐对象切分修复：按 {"path": 分割
  const objs = [];
  const re = /\{\s*"path"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"text"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    try { objs.push({ path: JSON.parse('"' + m[1] + '"'), text: JSON.parse('"' + m[2] + '"') }); } catch (e) {}
  }
  if (objs.length) return objs;
  throw new Error('JSON fail');
}
const SYS = 'You are a professional translator rendering a Chinese textbook for middle-school students into natural, clear English. Keep ALL numbers, formulas, variable names (R/W/K/V, a, b, wkv), product names, and code EXACTLY as-is. Input: JSON array of {path, text}. Output ONLY a JSON array of {path, text} with translated text.';
async function callOnce(zai, payload) {
  const res = await zai.chat.completions.create({
    messages: [{ role: 'system', content: SYS }, { role: 'user', content: JSON.stringify(payload) }],
    thinking: { type: 'disabled' }, temperature: 0.2,
  });
  return robustParse(res.choices[0].message.content.trim());
}
async function translateBatch(zai, items) {
  for (let a = 1; a <= 5; a++) {
    try {
      const arr = await callOnce(zai, items.map(x => ({ path: x.path, text: x.text })));
      if (Array.isArray(arr) && arr.length) {
        const by = {}; arr.forEach(t => by[t.path] = t.text);
        const ok = items.filter(it => typeof by[it.path] === 'string');
        if (ok.length === items.length) return arr;
        // 部分成功：返回部分，剩余单条
        if (ok.length) { return arr; }
      }
    } catch (e) {
      const msg = String(e.message || e);
      if (msg.includes('429') || msg.includes('Too many')) { console.log('  429 backoff 100s'); await sleep(100000); a--; continue; }
    }
    await sleep(6000);
  }
  // 全失败：逐条降级
  console.log('  fallback to single-item mode');
  const out = [];
  for (const it of items) {
    let done = false;
    for (let a = 1; a <= 5 && !done; a++) {
      try {
        const arr = await callOnce(zai, [{ path: it.path, text: it.text }]);
        if (Array.isArray(arr) && arr.length && typeof arr[0].text === 'string') { out.push(arr[0]); done = true; }
      } catch (e) {
        const msg = String(e.message || e);
        if (msg.includes('429') || msg.includes('Too many')) { console.log('  429 backoff 100s (single)'); await sleep(100000); a--; continue; }
      }
      if (!done) await sleep(4000);
    }
    if (!done) console.error('  GIVEUP ' + it.path);
  }
  return out;
}
(async () => {
  const zai = await ZAI.create();
  const data = require(OUT_DIR + '/textbook_appendix2.js');
  let items = [], examples = [];
  extractStrings(data.APPENDIX2, 'APPENDIX2', items);
  extractExamples(data.APPENDIX2, 'APPENDIX2', examples);
  // 回放缓存
  const all = items.concat(examples);
  for (const it of all) {
    if (CACHE[it.path]) {
      const { cur, lastKey, lastIdx } = getRef(data, it.path);
      if (lastIdx !== null) cur[lastIdx] = CACHE[it.path];
      else if (lastKey) cur[lastKey] = CACHE[it.path];
    }
  }
  items = items.filter(it => !CACHE[it.path]);
  examples = examples.filter(it => !CACHE[it.path]);
  console.log('apx remain: ' + items.length + ' str + ' + examples.length + ' ex');
  const all2 = items.concat(examples);
  for (let i = 0; i < all2.length; i++) {
    if (i > 0) await sleep(8000);
    const batch = [all2[i]];
    const arr = await translateBatch(zai, batch);
    arr.forEach(t => { if (typeof t.text === 'string') CACHE[t.path] = t.text; });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(CACHE));
    console.log('  item ' + (i + 1) + '/' + all2.length + ' done');
  }
  // 重新整体回填写出
  const data2 = require(OUT_DIR + '/textbook_appendix2.js');
  const items2 = [], ex2 = [];
  extractStrings(data2.APPENDIX2, 'APPENDIX2', items2);
  extractExamples(data2.APPENDIX2, 'APPENDIX2', ex2);
  for (const it of items2.concat(ex2)) {
    if (CACHE[it.path]) {
      const { cur, lastKey, lastIdx } = getRef(data2, it.path);
      if (lastIdx !== null) cur[lastIdx] = CACHE[it.path];
      else if (lastKey) cur[lastKey] = CACHE[it.path];
    }
  }
  const missing = items2.concat(ex2).filter(it => !CACHE[it.path]).length;
  console.log('missing: ' + missing);
  fs.writeFileSync(OUT_DIR + '/textbook_en_appendix2.js', '// AUTO-TRANSLATED ENGLISH EDITION\nconst APPENDIX2 = ' + JSON.stringify(data2.APPENDIX2, null, 2) + ';\n\nmodule.exports = { APPENDIX2 };\n');
  console.log('WROTE textbook_en_appendix2.js');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
