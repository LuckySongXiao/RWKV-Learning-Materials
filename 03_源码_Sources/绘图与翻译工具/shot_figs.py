#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""教材插图截图：4 张 HTML -> PNG（device_scale_factor=2）"""
import asyncio, os
from playwright.async_api import async_playwright

BASE = '/home/z/my-project/share/projects/6ad85ab25dddfa3997dd173e/tmp/figs'
FIGS = [
    ('fig1_memory_compare.html', 'fig1_三种记忆方式对比.png'),
    ('fig2_wkv_ledger.html',     'fig2_WKV记账本两步.png'),
    ('fig3_timeline.html',       'fig3_RWKV演进时间线.png'),
    ('fig4_delta_rule.html',     'fig4_RWKV7先擦后写.png'),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1300, 'height': 900}, device_scale_factor=2)
        for html, png in FIGS:
            path = os.path.join(BASE, html)
            await page.goto(f'file://{path}', wait_until='networkidle')
            await page.wait_for_timeout(400)
            el = page.locator('#root')
            bbox = await el.bounding_box()
            if bbox:
                await page.set_viewport_size({'width': max(1300, int(bbox['width'] + 60)),
                                              'height': int(bbox['height'] + 80)})
                await page.wait_for_timeout(200)
            out = os.path.join(BASE, png)
            await el.screenshot(path=out)
            print(f'OK {png} {os.path.getsize(out)//1024}KB bbox={int(bbox["width"])}x{int(bbox["height"])}')
        await browser.close()

asyncio.run(main())
