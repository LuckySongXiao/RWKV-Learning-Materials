#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""教材数据曲线图 v2：防重叠——直接标注替代图例框、增大留白"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams['font.sans-serif'] = ['Noto Sans CJK SC', 'PingFang SC', 'Microsoft YaHei', 'WenQuanYi Zen Hei']
plt.rcParams['axes.unicode_minus'] = False

C_TEXT, C_GRID = '#1F2937', '#E5E7EB'
C_BLUE, C_TEAL, C_GRAY = '#0077BB', '#009988', '#94A3B8'
OUT = '/home/z/my-project/share/projects/6ad85ab25dddfa3997dd173e/tmp/figs'

# ── 图 5：训练计算量 O(T²) vs O(T)（第 4/9 章）—— 直接标注，无图例框 ──
T = np.array([1, 2, 4, 8, 16, 32, 64])  # 千词
fig, ax = plt.subplots(figsize=(8.6, 5.2), dpi=200, constrained_layout=True)
ax.plot(T, T**2, color=C_GRAY, lw=2.6, marker='o', ms=5.5, zorder=3)
ax.plot(T, T, color=C_TEAL, lw=2.6, marker='s', ms=5.5, zorder=3)
ax.set_yscale('log'); ax.set_xticks(T); ax.set_xticklabels([f'{t}k' for t in T])
ax.set_xlabel('序列长度（千词）', fontsize=12.5, color=C_TEXT, labelpad=8)
ax.set_ylabel('相对计算量（以 1k 词为 1 倍，对数轴）', fontsize=12.5, color=C_TEXT, labelpad=8)
# 直接标注（曲线末点右上，避开数据区）
ax.annotate('Transformer  O(T²)：×4096', xy=(64, 64**2), xytext=(14, 30000),
            fontsize=13, color='#6B7280', fontweight='bold',
            arrowprops=dict(arrowstyle='-', color='#B8C2CC', lw=0.9))
ax.annotate('RWKV  O(T)：×64', xy=(64, 64), xytext=(24, 260),
            fontsize=13, color='#007A6E', fontweight='bold',
            arrowprops=dict(arrowstyle='-', color='#7FC8BD', lw=0.9))
ax.annotate('长度翻 64 倍\n一个 ×4096，一个 ×64', xy=(0.985, 0.06), xycoords='axes fraction',
            ha='right', fontsize=12, color=C_TEXT, linespacing=1.5)
ax.grid(alpha=0.3, color=C_GRID, zorder=0)
ax.tick_params(colors=C_TEXT, labelsize=11.5)
ax.spines[['top', 'right']].set_visible(False)
fig.savefig(f'{OUT}/fig5_训练计算量对比.png', facecolor='white')
plt.close(fig)

# ── 图 6：推理内存（第 9 章）—— 顶点直接标注，无图例框 ──
L = np.array([1, 4, 16, 64, 256, 1024])  # 千词
kv = 0.5 * L * 1024  # MB（0.5MB/token）
rwkv = np.full_like(kv, 16.8, dtype=float)  # 7B Finch 状态 ~16.8MB 恒定
fig, ax = plt.subplots(figsize=(8.6, 5.2), dpi=200, constrained_layout=True)
ax.plot(L, kv, color=C_BLUE, lw=2.8, marker='o', ms=5.5, zorder=3, label='Transformer 的 KV 缓存')
ax.plot(L, rwkv, color=C_TEAL, lw=2.8, marker='s', ms=5.5, zorder=3, label='RWKV 状态（恒定）')
ax.set_xscale('log', base=2); ax.set_yscale('log')
ax.set_xticks(L); ax.set_xticklabels(['1k', '4k', '16k', '64k', '256k', '1M'])
ax.set_yticks([16, 64, 256, 1024, 4096, 16384, 65536, 262144, 524288])
ax.set_yticklabels(['16MB', '64MB', '256MB', '1GB', '4GB', '16GB', '64GB', '256GB', '512GB'])
ax.set_xlabel('对话长度（词数）', fontsize=12.5, color=C_TEXT, labelpad=8)
ax.set_ylabel('推理要背的内存（对数轴）', fontsize=12.5, color=C_TEXT, labelpad=8)
# 顶点直接标注：放曲线终点附近空白区，避让数据点
ax.annotate('Transformer：512GB\n（背下全部纸条）', xy=(1024, 524288), xytext=(190, 7000),
            fontsize=12.5, color='#005A8C', fontweight='bold', linespacing=1.5,
            arrowprops=dict(arrowstyle='-', color='#8FBBD8', lw=0.9))
ax.annotate('RWKV：16.8MB 恒定\n（只带两本账）', xy=(1024, 16.8), xytext=(190, 70),
            fontsize=12.5, color='#007A6E', fontweight='bold', linespacing=1.5,
            arrowprops=dict(arrowstyle='-', color='#7FC8BD', lw=0.9))
ax.grid(alpha=0.3, color=C_GRID, zorder=0)
ax.tick_params(colors=C_TEXT, labelsize=11.5)
ax.spines[['top', 'right']].set_visible(False)
ax.text(0.5, -0.17, '按 7B 级模型、fp16 精度估算：Transformer 每词 KV 缓存约 0.5MB；RWKV-7 状态约 16.8MB 固定不变',
        transform=ax.transAxes, ha='center', fontsize=10, color='#6B7280')
fig.savefig(f'{OUT}/fig6_推理内存对比.png', facecolor='white')
plt.close(fig)

# ── 图 7：历代训练数据演进（第 14 章）—— 柱顶标注数值 ──
gens = ['RWKV-4\nPile（2023.5）', 'RWKV-5/6\nWorld v2（2024.4）', 'RWKV-7\nWorld v3（2025.3）']
tokens = [0.33, 1.12, 3.1]
fig, ax = plt.subplots(figsize=(8.6, 5.0), dpi=200, constrained_layout=True)
bars = ax.bar(gens, tokens, width=0.5, color=['#A8C5DA', '#6FA8C0', C_TEAL],
              edgecolor=['#7EA6C4', '#4E8CAD', '#007A6E'], lw=1.2, zorder=3)
for b, v in zip(bars, tokens):
    ax.annotate(f'{v} 万亿词', xy=(b.get_x() + b.get_width()/2, v), xytext=(0, 8),
                textcoords='offset points', ha='center', fontsize=14, color=C_TEXT, fontweight='bold')
ax.set_ylabel('预训练数据量（万亿 token）', fontsize=12.5, color=C_TEXT, labelpad=8)
ax.set_title('两年半，训练数据翻了 9 倍：0.33T → 1.12T → 3.1T', fontsize=15, color=C_TEXT, pad=14)
ax.set_ylim(0, 3.75)
ax.grid(axis='y', alpha=0.25, color=C_GRID, zorder=0)
ax.tick_params(colors=C_TEXT, labelsize=11.5)
ax.spines[['top', 'right']].set_visible(False)
ax.text(0.5, -0.24, '数据来源：RWKV-4 论文（Pile 330B）、Eagle&Finch 论文（World v2 1.12T）、RWKV-7 论文（World v3 3.1T）',
        transform=ax.transAxes, ha='center', fontsize=10, color='#6B7280')
fig.savefig(f'{OUT}/fig7_训练数据演进.png', facecolor='white')
plt.close(fig)

print('OK v2 charts (direct-label, no legend-box)')
