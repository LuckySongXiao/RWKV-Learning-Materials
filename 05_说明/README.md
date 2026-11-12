# RWKV 论文详解项目 · 完整资料包

本资料包包含 RWKV 系列论文详细讲解项目的全部成果：一册中文教材（73 页）、一册英文对照教材（74 页）、双语插图、全部生成源码与 27 篇论文原文。

## 目录结构

```
RWKV_Textbook_Project/
├── 01_教材_Textbooks/
│   ├── RWKV大模型入门教材_初中生版.docx   # 中文版（V5 社区智慧版，73 页 · 26 章 · 26 组随堂测试）
│   └── RWKV_Textbook_English_Edition.docx # 英文对照版（74 页，结构与中文版一一对应）
├── 02_插图_Figures/
│   ├── 中文版/     # 7 张插图（4 结构图 + 3 数据图）
│   └── English/    # 7 张英文版插图 + 结构图 HTML 源文件
├── 03_源码_Sources/
│   ├── 教材数据_中文/      # 5 个 JS 数据文件（全书内容，块结构化）
│   ├── 教材数据_英文/      # 5 个英文数据文件（机器翻译 + 人工精修）
│   ├── 渲染引擎/           # generate_textbook.js / _en.js（Node.js + docx 库）
│   └── 绘图与翻译工具/     # matplotlib 绘图、Playwright 截图、LLM 批量翻译脚本
├── 04_论文_Papers/
│   ├── 核心论文/   # 7 篇：RWKV-4 / 5+6 Eagle&Finch / 7 Goose / RWKV-X / ModRWKV / 两篇综述
│   └── 生态论文/   # 20 篇：视觉、时序、医学、量化、混合架构等
└── 05_说明/        # 本文件
```

## 教材内容一览（中英对照）

| 部分 | 章节 | 主题 |
|---|---|---|
| 前言 | — | 怎么读这本书 |
| Part 1 | 第 1–4 章 | 打地基：语言模型、RNN、Transformer、RWKV 总览 |
| Part 2 | 第 5–9 章 | 拆开 RWKV-4：R/W/K/V、时间混合、通道混合、一体两面 |
| Part 3 | 第 10–11 章 | 升级 RWKV-5/6：矩阵卡片盒、数据依赖衰减 |
| Part 4 | 第 12–14 章 | RWKV-7：先擦后写、广义 Delta、流水线战绩 |
| Part 5 | 第 15–17 章 | 社区实战：跑模型、266 篇论文地图、未来 |
| Part 6 | 第 18–23 章 | 从零实战：数据构建、BPE 分词器、训练框架、参数计算、质量判断、权威测评 |
| Part 7 | 第 24–26 章 | 社区智慧：排坑手册、全设备地图、全景布局 |
| 实验 | 1–5 | 手算 WKV、迷你记忆核、卡片盒、Delta 规则、60 行 BPE 分词器 |
| 附录 | A–G | 论文速查、术语表、生态分布、实验答案、公式手册（17 式逐个验算）、随堂测试答案、进阶路线图 |

## 如何重新生成教材

```bash
# 依赖：Node.js 18+，npm install docx（渲染引擎目录内已含 package.json）
cd 03_源码_Sources/渲染引擎
node generate_textbook.js      # 生成中文教材
node generate_textbook_en.js   # 生成英文教材
```

插图重绘：
```bash
python3 03_源码_Sources/绘图与翻译工具/draw_perf_charts.py   # 3 张数据图
python3 03_源码_Sources/绘图与翻译工具/shot_figs.py           # 4 张结构图截图（需 Playwright）
```

## 关键事实校验记录

- 教材全部数字（softmax/交叉熵/困惑度/Chinchilla 配比/warmup 曲线/WKV 递推与并行式一致性）均经 Python 逐项验算；
- 并行式与递推式在 e^{-w}=0.5、v=[2,4,8] 下严格一致（2.0/3.0/5.2）；
- 266 篇论文、27 篇 PDF、各代模型数据量（0.33T/1.12T/3.1T）、MQAR 72.9%、MMLU 62.2% 等均来自论文或官网原文；
- 设备端项目（RWKV Runner / RWKV APP / WebGPU Demo / 移远模组）均经网络检索核实。

英文版说明：正文由 LLM 批量翻译后人工精修；公式、代码、数字与中文素材（BPE 中文分词示例、诗句接话茬例子）按教学设计保留原样。
