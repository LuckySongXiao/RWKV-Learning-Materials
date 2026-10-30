#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""逐段修正英文版 docx 中的中文残留。

三级处理：
  A. 字符级：全角方括号 【】 -> []；独立成 run 的中文标签（例/提示/擦/写...）-> 英文
  B. 段落级：格式统一（同一 rPr）的段落整体改写，合并为单 run
  C. 分组级：格式混合但只有一个正文分组的段落（如 [Tip] + 正文），按分组各自合并
仅保留两类"中文即研究对象"的字符：诗句「床前明月/光」与 BPE 中文语料，且全部加英文注释。
"""
import re
import shutil
import zipfile

SRC = 'D:/GitHub/RWKV-Learning-Materials/01_教材_Textbooks/RWKV_Textbook_English_Edition.docx'

LABEL_WORDS = {
    '例': 'Example',
    '提示': 'Tip',
    '读账': 'read the ledger',
    '记账': 'write the ledger',
    '擦': 'erase',
    '写': 'write',
}

# 需要整段改写（格式统一）的段落
PATCH = {
13: 'Contents',
150: 'After opening this document, right-click the table of contents and choose "Update Field" to refresh the page numbers.',

167: ('After seeing the famous poem line "床前明月" (chuáng qián míng yuè, "moonlight before my bed"), '
      'the probability that the next character is "光" (guāng, "light") is about 95%; all other characters '
      'share the remaining 5%. The model picks "光" because its probability towers over the rest.'),

197: ('Transformer (the architecture behind ChatGPT): every word can directly look at every other word - '
      'like the whole class exchanging notes at once. Three magic parts: Q (query), K (label), V (content).'),

232: ('During training it behaves like a Transformer, "the whole class looking at the blackboard" '
      '(parallel, fast); during inference it behaves like an RNN, "carrying a little notebook" '
      '(state only, cheap).'),

302: ('[Multiple Choice] What do R, W, K, V stand for, in order? '
      'A. Receptance / Weight / Key / Value  B. Key / Value / Receptance / Weight  '
      'C. Weight / Key / Value / Receptance'),

312: 'Eq. 19 (initial): a₀ = 0, b₀ = 0  (both ledgers start empty)',
314: 'Eq. 20 (read the ledger): wkv_t = ( aₜ₋₁ + e^(u+kₜ)·vₜ ) ÷ ( bₜ₋₁ + e^(kₜ) )',
316: 'Eq. 21 (record the numerator ledger): aₜ = e^(−w)·aₜ₋₁ + e^(kₜ)·vₜ',
318: 'Eq. 22 (record the denominator ledger): bₜ = e^(−w)·bₜ₋₁ + e^(kₜ)',

381: ('Channel mixing: rₜ = σ(R̃ₜ) (the valve); kₜ = exp(K̃ₜ) (packing weight); '
      'output = rₜ × W × ReLU²(kₜ) (the goods let through)'),

392: 'mixₜ = xₜ₋₁ + μ · (xₜ − xₜ₋₁)  (μ is a per-channel learned ratio between 0 and 1)',

462: 'w = 0.5          # where the discount comes from (code stores w, uses e^{-w} at run time)',
463: 'u = 0.0          # bonus score for the current token, e^u',
464: 'a, b = 0.0, 0.0  # two ledgers: numerator a, denominator b',
466: 'vs = [2, 4, 8]   # contents of the three tokens (how much say each one gets)',
469: '    k = 0.0  # simplification: make every token weight e^k = 1',
471: '    # Step 1 [read the ledger]: old ledger + new token, take the weighted average',
474: '    # Step 2 [write the ledger]: discount the old (e^{-w}), book the new (e^k)',
478: '    print(f"step {t}: wkv = {wkv:.3f}, numerator a = {a:.3f}, denominator b = {b:.3f}")',

492: ('card box  sₜ = diag(w)·sₜ₋₁ + kₜ ⊗ vₜ   (⊗ is read "outer product": k and v multiply '
      'crosswise to fill the table)'),

543: 'D = 4                          # dimension',
544: 'box = np.zeros((D, D))         # empty card box (matrix state)',
545: 'w = 0.5                        # discount rate (hard-coded for this demo)',
548: '    # write: discount the old box + put the new card (outer product) in',
552: '    # read: swipe the query label q across the box',
555: '# store three tokens (k is the label, v is the content)',
556: 'words = [([1,0,0,0], [10,0,0,0]),   # token 1: label on channel 0, content on channel 0',
557: '         ([0,1,0,0], [0,20,0,0]),   # token 2: label on channel 1, content on channel 1',
558: '         ([1,0,0,0], [8,0,0,0])]    # token 3: label on channel 0 again (new content)',
562: '    print(f"after storing token {i}, top-left 4x4 of the box:\\n{box[:4,:4]}")',
564: '# query with the label "channel 0"',
566: 'print("label [1,0,0,0] retrieves:", retrieve(box, q))',

593: ('S ← S − (S read by k) ⊗ k + k ⊗ v   (first erase the old content stored under label k, '
      'then write the new content v)'),

661: 'Pile (332B tokens)',

681: 'S_add = np.zeros((2, 2))     # box A: additive only (RWKV-4/5 style)',
682: 'S_delta = np.zeros((2, 2))   # box B: erase-then-write (RWKV-7 style)',
684: 'def norm(k):                # RWKV-7 κ̂: normalise the label (same direction, length 1)',
688: '    kk = norm(k)                          # erasure locator',
689: '    old = S @ kk                           # read out the old content',
690: '    S = S - a * np.outer(kk, old)          # step 1 [erase]',
691: '    S = S + np.outer(kk, v * np.linalg.norm(k))  # step 2 [write]',
694: 'k = np.array([1.0, 0.0])     # label: only the "apple" channel',
699: '# scenario: the colour of the apple is red at first, then corrected to green',
700: 'updates = [np.array([10.0, 0.0]),   # apple -> red',
701: '           np.array([10.0, 0.0]),   # (red repeated for emphasis)',
702: '           np.array([0.0, 10.0])]   # correction: apple -> green',
705: '    S_add = S_add + np.outer(k, v)                 # box A: stack directly',
706: '    S_delta = delta_update(S_delta, k, v)          # box B: erase then write',
707: '    print(f"write #{i} (content {v}):")',
708: '    print(f"  additive box queries apple -> {query(S_add, k)}")',
709: '    print(f"  Delta box queries apple -> {query(S_delta, k)}")',

726: '# step 1: install the package (the official rwkv inference package)',
729: '# step 2: install the dependencies',
731: '# (the CPU build is enough; if you have a GPU, pick the CUDA build at pytorch.org)',
733: '# step 3: download a small 0.1B model (~400MB, an RWKV-4 World-series model)',
734: '# open https://huggingface.co/BlinkDL/rwkv-4-world-0.1b in your browser',
735: '# download RWKV-4-World-0.1B-v1-20230520-ctx4096.pth into the current folder',
741: '# load the model and the tokenizer',
745: '# start generating',
747: '    "The vegetable that a little rabbit likes to eat is",   # prompt',
748: '    token_count=50,               # generate 50 tokens',
749: '    temperature=1.0,              # temperature: the higher, the wilder',
750: '    top_p=0.7,                    # sample only from the top 70% of the probability mass',
766: 'rwkv (pip)',

893: ('Training a BPE vocabulary takes just three loop steps: count → pick the champion → merge. '
      'Let us run the full process on the mini-corpus 低低 低低 低 语 语 言 '
      '(read "di-di di-di di yu yu yan", meaning roughly "low low low low low language language speech"; '
      'imagine these characters come from real text).'),
895: ('Initial sequence (split into single characters): [低, 低, 低, 低, 低, 语, 语, 言] '
      '(di, di, di, di, di, yu, yu, yan)'),
896: 'Step 1 [count adjacent pairs]: (低,低) appears 4 times, (语,语) 1 time, (语,言) 1 time, (低,语) 1 time.',
897: 'Step 2 [pick the champion]: (低,低) with 4 wins.',
898: ('Step 3 [merge]: the sequence becomes [低低, 低低, 低, 语, 语, 言]. The vocabulary gains the token '
      '低低 (the merged pair, read "di-di").'),
901: ('Record the merge rules (for example: 低+低 → 低低), and the vocabulary gains a new token. '
      'When encoding new text later, apply the same rules in the same order: the string 低低低 becomes '
      '[低低, 低] - two tokens instead of three, one third shorter. Decoding is just looking up the table '
      'to restore the original text. You can implement this whole process by hand - here is a complete '
      'working implementation:'),

908: '        self.merges = []          # learned merge rules (ordered!)',
909: '        self.vocab = {}           # token -> id',
920: '        # split the corpus on whitespace into "words", then each word into single characters',
927: '            if pairs[best] < 2:      # gain too small, stop early',
930: "            # apply the merge: replace 'a b' with 'ab'",
935: '        # ids: first every character that appears, then the merged tokens',
944: "        syms = list(text.replace(' ', '\\n'))  # placeholder first, so spaces don't interfere",
946: '        for a, b in self.merges:               # apply the rules in the order they were learned',
952: "bpe.train('低低 低低 低 语 语 言 language language 模型', 10)   # 模型 = \"model\"",
953: "print('vocabulary:', bpe.vocab)",
954: 'print(\'encode "低低language":\', bpe.encode(\'低低language\'))',
956: ('After running, you will see the vocabulary holding both single characters (低, 语, 言, 模, 型...) and '
      'merged tokens (低低, 语言...). Encode a fresh sentence, decode it back, and check character by '
      'character that nothing was lost - this "lossless round-trip" is the acceptance test for any tokenizer.'),

972: ('fetch a batch → forward pass computes the loss → backward pass computes gradients → '
      'optimizer updates → (periodically) save a checkpoint and check the validation loss'),
976: '    batch = next(data_iter)              # ① grab a batch of token ids (B, T)',
977: '    logits = model(batch[:, :-1])        # ② forward: predict the next token',
978: '    loss = cross_entropy(logits, batch[:, 1:])   #     compare against the true answer',
979: '    loss.backward()                      # ③ backward: how far each parameter should move',
980: '    clip_grad_norm_(model.parameters(), 1.0)     #     gradient clipping (the guardrail)',
981: '    optimizer.step()                     # ④ update the parameters',
983: '        save_ckpt(model); print(val_loss(model))  # ⑤ checkpoint + health check',

1495: 'RWKVQuant quantization (2025)',
}

# 格式混合、但只需替换"标签 run + 正文 run 组"的段落
PATCH_GROUPS = {
261: ('[Tip]', 'Fun fact: RWKV is pronounced either as the four letters "R-W-K-V" or as one word, '
             '"wa-ku-wei". It is fully open source (Apache 2.0): free for anyone to use, study, and even sell.'),
}

# 代码块为 Consolas 9pt，单行约 84 字符上限；超长会折行破坏对齐，此处收窄注释
PATCH.update({
462: 'w = 0.5          # discount source (code stores w, applies e^{-w})',
471: '    # Step 1 [read the ledger]: old ledger + new token, weighted average',
478: '    print(f"step {t}: wkv={wkv:.3f}, num a={a:.3f}, den b={b:.3f}")',
556: 'words = [([1,0,0,0], [10,0,0,0]),   # t1: label on ch 0, content on ch 0',
557: '         ([0,1,0,0], [0,20,0,0]),   # t2: label on ch 1, content on ch 1',
558: '         ([1,0,0,0], [8,0,0,0])]    # t3: label on ch 0 again (new content)',
684: 'def norm(k):                # RWKV-7 κ̂: normalise label (length 1, same dir)',
731: '# (CPU build is enough; with a GPU pick the CUDA build at pytorch.org)',
750: '    top_p=0.7,                    # sample from the top 70% of probability',
920: '        # split the corpus on whitespace into "words", then into characters',
944: "        syms = list(text.replace(' ', '\\n'))  # placeholder for spaces",
946: '        for a, b in self.merges:               # apply rules in learned order',
978: '    loss = cross_entropy(logits, batch[:, 1:])   #     vs. the true answer',
979: '    loss.backward()                      # ③ backward: gradient per parameter',
980: '    clip_grad_norm_(model.parameters(), 1.0)     #     gradient clipping',
})

RUN_RE = re.compile(r'<w:r(?: [^>]*)?>.*?</w:r>', re.S)
T_RE = re.compile(r'<w:t(?: [^>]*)?>(.*?)</w:t>', re.S)


def unesc(s):
    return (s.replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"')
             .replace('&apos;', "'").replace('&amp;', '&'))


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def run_text(run):
    return unesc(''.join(T_RE.findall(run)))


def para_text(p):
    return unesc(''.join(T_RE.findall(p)))


def make_t(text):
    return '<w:t xml:space="preserve">' + esc(text) + '</w:t>'


def collapse_runs(p, newtext):
    """把段落所有 run 合并成一个（保留首个 run 的格式）"""
    runs = list(RUN_RE.finditer(p))
    if not runs:
        raise RuntimeError('no runs')
    fr = runs[0].group(0)
    body = T_RE.sub('', fr).replace('<w:t/>', '')
    body = body.replace('</w:r>', make_t(newtext) + '</w:r>')
    out = p[:runs[0].start()] + body
    prev = runs[0].end()
    for m in runs[1:]:
        out += p[prev:m.start()]
        prev = m.end()
    out += p[prev:]
    return out


def collapse_groups(p, newtexts):
    """按 rPr 分组，每组保留首个 run 的格式，写入对应新文本"""
    runs = list(RUN_RE.finditer(p))
    groups = []          # [(rpr, [runmatch,...])]
    for m in runs:
        rm = re.search(r'<w:rPr>.*?</w:rPr>', m.group(0), re.S)
        rpr = rm.group(0) if rm else ''
        if groups and groups[-1][0] == rpr:
            groups[-1][1].append(m)
        else:
            groups.append((rpr, [m]))
    if len(groups) != len(newtexts):
        raise RuntimeError(f'group mismatch: {len(groups)} vs {len(newtexts)}')

    out = p[:runs[0].start()]
    prev = runs[0].start()
    for (rpr, ms), nt in zip(groups, newtexts):
        out += p[prev:ms[0].start()]
        fr = ms[0].group(0)
        body = T_RE.sub('', fr).replace('<w:t/>', '')
        body = body.replace('</w:r>', make_t(nt) + '</w:r>')
        out += body
        prev = ms[-1].end()
    out += p[prev:]
    return out


def char_fix(p):
    """字符级：全角方括号转半角；整 run 的中文标签词转英文"""
    def fix_run(m):
        run = m.group(0)
        txt = run_text(run)
        if not txt:
            return run
        new = txt.replace('【', '[').replace('】', ']')
        if new.strip() in LABEL_WORDS:
            new = LABEL_WORDS[new.strip()]
        for k, v in LABEL_WORDS.items():
            new = new.replace('[' + k + ']', '[' + v + ']')
        if new == txt:
            return run
        return T_RE.sub(lambda mm: make_t(new), run, count=1)
    return RUN_RE.sub(fix_run, p)


def ensure_space_after_label(p):
    """段落以 [Label] 开头且紧跟非空格字符时，在 ']' 后补一个空格"""
    text = para_text(p)
    if not re.match(r'^\[[^\]]{1,40}\](?=\S)', text):
        return p
    runs = list(RUN_RE.finditer(p))
    for m in runs:
        run = m.group(0)
        txt = run_text(run)
        if ']' in txt:
            newtxt = txt.replace(']', '] ', 1)
            return p[:m.start()] + T_RE.sub(lambda mm: make_t(newtxt), run, count=1) + p[m.end():]
    return p


def space_before_bracket(p):
    """'Upgrade 1[Label]' -> 'Upgrade 1 [Label]'（仅用于行内英文标签）"""
    for m in RUN_RE.finditer(p):
        if run_text(m.group(0)) == '[':
            return (p[:m.start()]
                    + T_RE.sub(lambda mm: make_t(' ['), m.group(0), count=1)
                    + p[m.end():])
    return p


def main():
    shutil.copy2(SRC, SRC.replace('.docx', '_backup.docx'))
    zin = zipfile.ZipFile(SRC)
    items = [(i.filename, zin.read(i.filename)) for i in zin.infolist()]
    zin.close()
    data = dict(items)

    xml = data['word/document.xml'].decode('utf-8')
    ps = list(re.finditer(r'<w:p[ >].*?</w:p>', xml, re.S))
    print('paragraphs:', len(ps))

    pieces, last, n_full, n_grp, n_char, n_space = [], 0, 0, 0, 0, 0
    for idx, m in enumerate(ps):
        p = m.group(0)
        newp = p
        if idx in PATCH:
            newp = collapse_runs(p, PATCH[idx])
            n_full += 1
        elif idx in PATCH_GROUPS:
            newp = collapse_groups(p, list(PATCH_GROUPS[idx]))
            n_grp += 1
        if '【' in newp or '】' in newp or any(w in newp for w in LABEL_WORDS):
            before = newp
            newp = char_fix(newp)
            if newp != before:
                n_char += 1
        spaced = ensure_space_after_label(newp)
        if spaced != newp:
            newp = spaced
            n_space += 1
        if idx in (606, 607, 608):
            newp = space_before_bracket(newp)
        if newp != p:
            pieces.append(xml[last:m.start()])
            pieces.append(newp)
            last = m.end()
    pieces.append(xml[last:])
    newxml = ''.join(pieces)

    core = data['docProps/core.xml'].decode('utf-8')
    core = core.replace(
        '<dc:creator>Un-named</dc:creator>',
        '<dc:title>RWKV Textbook - English Edition</dc:title>'
        '<dc:creator>RWKV Learning Materials</dc:creator>')
    core = core.replace('<cp:lastModifiedBy>精神 抖擞</cp:lastModifiedBy>',
                        '<cp:lastModifiedBy>RWKV Learning Materials</cp:lastModifiedBy>')

    tmp = SRC + '.tmp'
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
        for n, d in items:
            if n == 'word/document.xml':
                zout.writestr(n, newxml.encode('utf-8'))
            elif n == 'docProps/core.xml':
                zout.writestr(n, core.encode('utf-8'))
            else:
                zout.writestr(n, d)
    shutil.move(tmp, SRC)
    print(f'full={n_full} group={n_grp} char={n_char} space={n_space}')


if __name__ == '__main__':
    main()
