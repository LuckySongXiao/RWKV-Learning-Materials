#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import zipfile, re, json

CJK = re.compile(r'[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]')
LABEL = re.compile(r'^【[^】]{1,20}】')

def paras(path):
    xml = zipfile.ZipFile(path).read('word/document.xml').decode('utf-8')
    ps = re.findall(r'<w:p[ >].*?</w:p>', xml, re.S)
    out = []
    for i, p in enumerate(ps):
        ts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', p, re.S)
        t = ''.join(ts)
        t = (t.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
              .replace('&quot;', '"').replace('&apos;', "'"))
        out.append(t)
    return out, ps

ps, raw = paras('D:/GitHub/RWKV-Learning-Materials/01_教材_Textbooks/RWKV_Textbook_English_Edition.docx')
cats = {}
for i, t in enumerate(ps):
    if not CJK.search(t):
        continue
    body = LABEL.sub('', t)
    n = len(CJK.findall(body))
    if t.strip() in ('【例】',):
        c = 'label-only'
    elif LABEL.match(t) and n == 0:
        c = 'label-prefix-only'
    elif t.lstrip().startswith('#') or '  # ' in t:
        c = 'code-comment'
    elif re.match(r'^\s*第\s*\d+\s*式', t):
        c = 'equation'
    elif n <= 3:
        c = 'tiny'
    elif n < 20:
        c = 'small'
    else:
        c = 'prose'
    cats.setdefault(c, []).append((i, n, t))

for c, items in cats.items():
    print(f'\n##### {c}: {len(items)}')
    for i, n, t in items:
        print(f'  [{i}] cjk={n} :: {t[:160]}')
