# RWKV 论文详解 · 学习资料包

**RWKV Papers Explained · Learning Materials**

*从零到看懂下一代大模型架构 · From zero to understanding the next-generation AI architecture*

[中文](#中文) · [English](#english)

---

## 中文

### 这是什么

本仓库是「RWKV 系列论文详解」项目的完整成果包：一册中文教材、一册逐段对照的英文教材、双语插图、全部生成源码，以及 21 篇论文原文。

教材面向**初中生与零基础读者**：不讲微积分，从"接话茬""传纸条""记账本"这类生活比喻出发，把 RWKV 的四代架构拆到可以手算的程度，最后带你从零训练一个自己的小模型。

### 内容清单

| 内容 | 数量 | 说明 |
|---|---|---|
| 中文教材 | 1 册 · 76 页 | 26 章 + 5 个实验 + 附录 A–G |
| 英文教材 | 1 册 · 约 82 页 | 与中文版逐章对应 |
| 插图 | 7 张 × 2 语言 | 4 张结构图 + 3 张数据图 |
| 论文原文 | 21 篇 PDF | 核心 7 篇 + 生态 14 篇 |
| 论文索引 | 266 篇 | 见教材第 16 章与附录 C |
| 生成源码 | 10 个 JS 数据文件 + 2 个渲染引擎 + 绘图/翻译工具 | 可完整重建两版教材 |

### 目录结构

```
.
├── 01_教材_Textbooks/
│   ├── RWKV大模型入门教材_初中生版.docx      # 中文版（76 页）
│   ├── RWKV_Textbook_English_Edition.docx    # 英文版（约 82 页）
│   └── 资料包说明.md
├── 02_插图_Figures/
│   ├── 中文版/    # 7 张 PNG
│   └── English/   # 7 张 PNG + 4 个结构图 HTML 源文件
├── 03_源码_Sources/
│   ├── 教材数据_中文/   # 5 个 JS 数据文件（块结构化全书内容）
│   ├── 教材数据_英文/   # 5 个 JS 数据文件
│   ├── 渲染引擎/        # generate_textbook.js / _en.js（Node.js + docx）
│   └── 绘图与翻译工具/  # matplotlib 绘图、Playwright 截图、翻译脚本
├── 04_论文_Papers/
│   ├── 核心论文/   # 7 篇：RWKV-4 / 5+6 Eagle&Finch / 7 Goose / RWKV-X / ModRWKV / 两篇综述
│   └── 生态论文/   # 14 篇：视觉、时序、医学、量化、混合架构等
├── 05_说明/
└── LICENSE
```

### 教材结构

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

### 如何重新生成

```bash
# 依赖：Node.js 18+
cd 03_源码_Sources/渲染引擎
npm install docx
node generate_textbook.js      # 生成中文教材
node generate_textbook_en.js   # 生成英文教材
```

插图重绘：

```bash
python3 03_源码_Sources/绘图与翻译工具/draw_perf_charts.py   # 3 张数据图
python3 03_源码_Sources/绘图与翻译工具/shot_figs.py          # 4 张结构图截图（需 Playwright）
```

> **注意**：两册 docx 是当前交付版本，已做人工精修。`教材数据_英文/` 中的数据文件是较早的机器翻译稿，尚未与 docx 的修订同步——直接重新生成会覆盖掉这些修订。若要重新生成英文版，请先把数据文件对齐到 docx。

### 质量保证

- 教材中的数字（softmax / 交叉熵 / 困惑度 / Chinchilla 配比 / warmup 曲线 / WKV 递推与并行式一致性）均用 Python 逐项验算；
- 并行式与递推式在 e^{-w}=0.5、v=[2,4,8] 下严格一致（2.0 / 3.0 / 5.2）；
- 266 篇论文、各代模型数据量（0.33T / 1.12T / 3.1T）、MQAR 72.9%、MMLU 62.2% 等均取自论文或官网原文；
- 设备端项目（RWKV Runner / RWKV APP / WebGPU Demo / 移远模组）均经网络检索核实；
- 英文版已逐段校订：含中文字样的段落由 213 段降至 10 段，且仅保留 BPE 中文语料与古诗示例（属教学内容，均附英文释义）。

### 许可

见 [LICENSE](LICENSE)。论文原文版权归各论文作者所有，仅用于学习研究。

---

## English

### What this is

This repository is the complete deliverable of the "RWKV Papers Explained" project: one Chinese textbook, one paragraph-by-paragraph English edition, bilingual figures, all source code used to generate them, and 21 original papers.

The textbook is written for **middle-school students and absolute beginners**. No calculus required — it starts from everyday analogies ("finishing someone's sentence", "passing notes in class", "keeping a ledger"), takes the four generations of RWKV apart down to hand-computable arithmetic, and ends with you training your own small model from scratch.

### What's inside

| Item | Amount | Notes |
|---|---|---|
| Chinese textbook | 1 volume · 76 pages | 26 chapters + 5 experiments + appendices A–G |
| English textbook | 1 volume · ~82 pages | Chapter-by-chapter counterpart |
| Figures | 7 × 2 languages | 4 architecture diagrams + 3 data charts |
| Original papers | 21 PDFs | 7 core + 14 ecosystem |
| Paper index | 266 papers | See Chapter 16 and Appendix C |
| Source code | 10 JS data files + 2 renderers + drawing/translation tools | Enough to rebuild both editions |

### Repository layout

```
.
├── 01_教材_Textbooks/
│   ├── RWKV大模型入门教材_初中生版.docx      # Chinese edition (76 pp.)
│   ├── RWKV_Textbook_English_Edition.docx    # English edition (~82 pp.)
│   └── 资料包说明.md
├── 02_插图_Figures/
│   ├── 中文版/    # 7 PNGs
│   └── English/   # 7 PNGs + 4 HTML sources for the architecture diagrams
├── 03_源码_Sources/
│   ├── 教材数据_中文/   # 5 JS data files (the whole book, block-structured)
│   ├── 教材数据_英文/   # 5 JS data files
│   ├── 渲染引擎/        # generate_textbook.js / _en.js (Node.js + docx)
│   └── 绘图与翻译工具/  # matplotlib charts, Playwright screenshots, translation scripts
├── 04_论文_Papers/
│   ├── 核心论文/   # 7: RWKV-4 / 5+6 Eagle & Finch / 7 Goose / RWKV-X / ModRWKV / 2 surveys
│   └── 生态论文/   # 14: vision, time series, medical, quantization, hybrid architectures, ...
├── 05_说明/
└── LICENSE
```

### Book structure

| Part | Chapters | Topic |
|---|---|---|
| Foreword | — | How to read this book |
| Part 1 | Ch. 1–4 | Foundations: language models, RNN, Transformer, RWKV overview |
| Part 2 | Ch. 5–9 | Taking RWKV-4 apart: R/W/K/V, time mixing, channel mixing, two faces |
| Part 3 | Ch. 10–11 | Upgrading to RWKV-5/6: matrix card box, data-dependent decay |
| Part 4 | Ch. 12–14 | RWKV-7: erase before writing, generalized Delta rule, pipeline results |
| Part 5 | Ch. 15–17 | Community practice: run a model, the 266-paper map, what's next |
| Part 6 | Ch. 18–23 | Build from scratch: data, BPE tokenizer, training framework, parameter math, quality checks, benchmarks |
| Part 7 | Ch. 24–26 | Community wisdom: troubleshooting, the device map, the big picture |
| Experiments | 1–5 | Hand-computed WKV, a mini memory kernel, the card box, the Delta rule, a 60-line BPE tokenizer |
| Appendices | A–G | Paper quick reference, glossary, ecosystem index, experiment answers, formula handbook (17 formulas verified), quiz answers, study roadmap |

### Rebuilding the books

```bash
# Requires Node.js 18+
cd 03_源码_Sources/渲染引擎
npm install docx
node generate_textbook.js      # build the Chinese edition
node generate_textbook_en.js   # build the English edition
```

Redrawing the figures:

```bash
python3 03_源码_Sources/绘图与翻译工具/draw_perf_charts.py   # 3 data charts
python3 03_源码_Sources/绘图与翻译工具/shot_figs.py          # 4 diagram screenshots (needs Playwright)
```

> **Note**: the two `.docx` files are the delivered artifacts and carry hand-edited revisions. The data files under `教材数据_英文/` are an earlier machine-translation draft and are **not yet in sync** with those revisions — regenerating the English edition would overwrite them. Re-align the data files first if you intend to rebuild.

### Quality notes

- Every number in the book (softmax / cross-entropy / perplexity / Chinchilla ratio / warmup curve / equivalence of the recurrent and parallel WKV forms) was verified with Python;
- The parallel and recurrent forms agree exactly at e^{-w} = 0.5 with v = [2, 4, 8] (2.0 / 3.0 / 5.2);
- The 266 papers, per-generation training data (0.33T / 1.12T / 3.1T), MQAR 72.9% and MMLU 62.2% are taken from the papers or official sites;
- On-device projects (RWKV Runner / RWKV APP / WebGPU demo / Quectel modules) were verified against public sources;
- The English edition was proofread paragraph by paragraph: paragraphs containing Chinese dropped from 213 to 10, and the remainder is deliberate teaching material (the BPE Chinese mini-corpus and the classical-poem example), each glossed in English.

### License

See [LICENSE](LICENSE). The original papers remain copyright of their respective authors and are included for study and research only.
