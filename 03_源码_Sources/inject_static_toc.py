#!/usr/bin/env python3
# inject_static_toc.py —— 把 TOC 占位条目里的 PAGEREF 域降级为静态页码文本
# 背景：LibreOffice 对 PAGEREF 域渲染不稳定（部分条目页码显示为空）。
# 做法：删除 fldChar begin/instrText(PAGEREF)/separate/end 四个 run，
#       保留 标题文本 run + tab run + 页码文本 run；外层 TOC 域原样保留。
# 用法：python3 inject_static_toc.py <docx>

import sys, zipfile, shutil, re
from lxml import etree

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS = {'w': W}

def main(path):
    with zipfile.ZipFile(path, 'r') as z:
        names = z.namelist()
        data = {n: z.read(n) for n in names}
    root = etree.fromstring(data['word/document.xml'])

    degraded = 0
    # 找所有含 PAGEREF instrText 的容器（hyperlink 或段落）
    for instr in list(root.iter(f'{{{W}}}instrText')):
        if not instr.text or 'PAGEREF' not in instr.text:
            continue
        r_instr = instr.getparent()          # <w:r> 内含 instrText
        container = r_instr.getparent()      # <w:hyperlink> 或 <w:p>
        runs = [r for r in container if r.tag in (f'{{{W}}}r', f'{{{W}}}hyperlink')]
        # 定位 fldChar begin / separate / end 所在 run（在 container 直接子层）
        def fld_run(t):
            for r in container.iter(f'{{{W}}}r'):
                fc = r.find(f'{{{W}}}fldChar')
                if fc is not None and fc.get(f'{{{W}}}fldCharType') == t:
                    # 确保这个 run 是 container 的直接子层
                    if r.getparent() is container:
                        return r
            return None
        r_begin, r_sep, r_end = fld_run('begin'), fld_run('separate'), fld_run('end')
        if r_begin is None or r_sep is None or r_end is None:
            continue
        # 检查 begin 与 end 之间是否就是本 PAGEREF（防跨域误删）：按文档序
        order = list(container.iter())
        try:
            if not (order.index(r_begin) < order.index(r_instr) < order.index(r_sep) < order.index(r_end)):
                continue
        except ValueError:
            continue
        # 删除四个域结构 run，保留其余（标题文本/tab/页码）
        for r in (r_begin, r_instr, r_sep, r_end):
            r.getparent().remove(r)
        degraded += 1

    data['word/document.xml'] = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
    tmp = path + '.tmp'
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as z:
        for n in names:
            z.writestr(n, data[n])
    shutil.move(tmp, path)
    print(f'[{path.split("/")[-1]}] PAGEREF 域降级为静态页码: {degraded} 处')

if __name__ == '__main__':
    main(sys.argv[1])
