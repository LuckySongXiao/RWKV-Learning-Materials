#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""删除英文版 docx 中重复的表格行，并修正术语表的英文化标题。"""
import re
import shutil
import zipfile

SRC = 'D:/GitHub/RWKV-Learning-Materials/01_教材_Textbooks/RWKV_Textbook_English_Edition.docx'
T = re.compile(r'<w:t(?: [^>]*)?>(.*?)</w:t>', re.S)

# 重复行块的第二份（行号按当前文档顺序，从 0 开始）
DUP_ROWS = [85, 93, 111, 112, 120, 121, 225, 226, 244, 245]

TEXT_FIX = {
    'Appendix B: Glossary (Sorted by Pinyin)': 'Appendix B: Glossary',
    'Translation and explanation in this book': 'Explanation in this book',
}


def row_spans(xml):
    spans = []
    for m in re.finditer(r'<w:tr(?: [^>]*)?>', xml):
        e = xml.find('</w:tr>', m.end())
        spans.append((m.start(), e + len('</w:tr>')))
    return spans


def main():
    zin = zipfile.ZipFile(SRC)
    items = [(i.filename, zin.read(i.filename)) for i in zin.infolist()]
    zin.close()
    data = dict(items)
    xml = data['word/document.xml'].decode('utf-8')

    spans = row_spans(xml)
    print('rows:', len(spans))

    # 删除重复行（从后往前，避免位置失效）
    for idx in sorted(DUP_ROWS, reverse=True):
        s, e = spans[idx]
        print('  remove row', idx, repr(''.join(T.findall(xml[s:e]))[:60]))
        xml = xml[:s] + xml[e:]

    for old, new in TEXT_FIX.items():
        if old in xml:
            xml = xml.replace(old, new)
            print('  text fix:', old[:40], '->', new[:40])

    tmp = SRC + '.tmp'
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
        for n, d in items:
            zout.writestr(n, xml.encode('utf-8') if n == 'word/document.xml' else d)
    shutil.move(tmp, SRC)
    print('done')


if __name__ == '__main__':
    main()
