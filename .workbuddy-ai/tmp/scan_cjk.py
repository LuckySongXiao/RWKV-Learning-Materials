#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""列出英文 docx 中含中日韩字符的段落（含表格、正文），输出到 report 文件。"""
import zipfile, re, sys, json

CJK = re.compile(r'[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]')

def main(path):
    z = zipfile.ZipFile(path)
    xml = z.read('word/document.xml').decode('utf-8')
    # split into paragraphs, keep order
    paras = re.findall(r'<w:p[ >].*?</w:p>', xml, re.S)
    out = []
    for i, p in enumerate(paras):
        texts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', p, re.S)
        txt = ''.join(texts)
        txt = (txt.replace('&amp;', '&').replace('&lt;', '<')
                  .replace('&gt;', '>').replace('&quot;', '"').replace('&apos;', "'"))
        if CJK.search(txt):
            out.append({'idx': i, 'text': txt, 'runs': len(texts)})
    print(f'total paragraphs: {len(paras)}, with CJK: {len(out)}')
    with open('cjk_paras.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    for o in out:
        print(f"[{o['idx']}] runs={o['runs']} :: {o['text'][:300]}")

if __name__ == '__main__':
    main(sys.argv[1])
