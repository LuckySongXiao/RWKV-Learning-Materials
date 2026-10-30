#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""补齐英文版附录 A 核心论文表中缺失的第 4、5 篇（RWKV-X / ModRWKV）。"""
import re
import shutil
import zipfile

SRC = 'D:/GitHub/RWKV-Learning-Materials/01_教材_Textbooks/RWKV_Textbook_English_Edition.docx'
T = re.compile(r'<w:t(?: [^>]*)?>(.*?)</w:t>', re.S)
TC = re.compile(r'<w:tc>.*?</w:tc>', re.S)

NEW_ROWS = [
    ['4', 'RWKV-X: A Linear Complexity Hybrid Language Model', '2504.21463', 'IJCAI 2025',
     'Attention and RWKV-7 mixed layer by layer (about one quarter of the layers use sparse attention)'],
    ['5', 'ModRWKV: Transformer Multimodality in Linear Time', '2505.14505', 'EMNLP 2025',
     'RWKV-7 as the multimodal backbone, with a dynamic adaptive modality encoder'],
]


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def set_cells(row, texts):
    cells = list(TC.finditer(row))
    assert len(cells) == len(texts), f'cells {len(cells)} vs {len(texts)}'
    out, last = [], 0
    for m, txt in zip(cells, texts):
        cell = m.group(0)
        new_cell = T.sub(lambda mm: '<w:t>' + esc(txt) + '</w:t>', cell, count=1)
        # 清掉该单元格里多余的 w:t（若有）
        rest = T.findall(new_cell)
        if len(rest) > 1:
            first = True
            def keep(mm):
                nonlocal first
                if first:
                    first = False
                    return mm.group(0)
                return ''
            new_cell = T.sub(keep, new_cell)
        out.append(row[last:m.start()])
        out.append(new_cell)
        last = m.end()
    out.append(row[last:])
    return ''.join(out)


def main():
    zin = zipfile.ZipFile(SRC)
    items = [(i.filename, zin.read(i.filename)) for i in zin.infolist()]
    zin.close()
    xml = dict(items)['word/document.xml'].decode('utf-8')

    rows = []
    for m in re.finditer(r'<w:tr(?: [^>]*)?>', xml):
        e = xml.find('</w:tr>', m.end())
        rows.append((m.start(), e + 7))
    # 定位"3 | RWKV-7 Goose"那一行
    target = None
    for i, (s, e) in enumerate(rows):
        if '2503.14456' in xml[s:e]:
            target = i
            break
    assert target is not None, 'paper 3 row not found'
    s, e = rows[target]
    base = xml[s:e]
    print('clone base row', target)

    ins = ''.join(set_cells(base, t) for t in NEW_ROWS)
    xml = xml[:e] + ins + xml[e:]

    tmp = SRC + '.tmp'
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
        for n, d in items:
            zout.writestr(n, xml.encode('utf-8') if n == 'word/document.xml' else d)
    shutil.move(tmp, SRC)
    print('inserted', len(NEW_ROWS), 'rows')


if __name__ == '__main__':
    main()
