// ============================================================
// RWKV 初中生教材 —— docx 渲染引擎
// 结构：封面(R4/DM-1) → 目录(罗马页码) → 正文(阿拉伯页码)
// ============================================================
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableLayoutType, TableOfContents, VerticalAlign, ImageRun,
} = require("docx");
const fs = require("fs");

const p12 = require("./textbook_part12.js");
const p345 = require("./textbook_part345.js");
const p6 = require("./textbook_part6.js");
const p7 = require("./textbook_part7.js");
const apx2 = require("./textbook_appendix2.js");
const ALL = [...p12.PART1, ...p12.PART2, ...p345.PART3, ...p345.PART4, ...p345.PART5, ...p6.PART6, ...p7.PART7, ...p345.APPENDIX, ...apx2.APPENDIX2];

// ── DM-1 调色板（AI 科技）──
const P = {
  bg: "162235", accent: "37DCF2",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  table: { headerBg: "1B6B7A", headerText: "FFFFFF", accentLine: "1B6B7A", innerLine: "C8DDE2", surface: "EDF3F5" },
};
const H1_COLOR = "1B6B7A";

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

const emptyPara = () => new Paragraph({ spacing: { before: 0, after: 0 }, children: [] });

// ── 标题宽度与换行（中英混合）──
function estimateTextWidth(text, pt) {
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    const isCJK = (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF) ||
      (code >= 0x3000 && code <= 0x303F) || (code >= 0xFF00 && code <= 0xFFEF);
    width += isCJK ? pt * 20 : pt * 11;
  }
  return width;
}
function splitTitleLines(title, maxWidthTwips, pt) {
  const lines = [];
  let cur = "";
  for (const ch of title) {
    if (estimateTextWidth(cur + ch, pt) > maxWidthTwips && cur) { lines.push(cur); cur = ch; }
    else cur += ch;
  }
  if (cur) lines.push(cur);
  if (lines.length >= 2 && lines[lines.length - 1].length === 1) {
    const last = lines.pop(); lines[lines.length - 1] += last;
  }
  return lines;
}
function calcTitleLayout(title, maxWidthTwips, preferredPt = 36, minPt = 24) {
  let titlePt = preferredPt, lines;
  while (titlePt >= minPt) {
    lines = splitTitleLines(title, maxWidthTwips, titlePt);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  return { titlePt, titleLines: lines };
}

// ── R4 封面（Top Color Block）──
function buildCoverR4(config) {
  const padL = 1000, padR = 1000;
  const { titlePt, titleLines } = calcTitleLayout(config.title, 11906 - padL - padR, 36, 24);
  const titleSize = titlePt * 2;
  const titleBlockHeight = titleLines.length * (titlePt * 23 + 200);
  const labelH = config.englishLabel ? (9 * 23 + 500) : 0;
  const subtitleH = config.subtitle ? (12 * 23 + 200) : 0;
  const upperContentH = labelH + titleBlockHeight + subtitleH;
  const UPPER_MIN = 7500;
  const UPPER_H = Math.max(UPPER_MIN, upperContentH + 1500 + 800);
  const DIVIDER_H = 60;
  const spacerIntrinsic = 280;
  const contentEstimate = labelH + titleLines.length * (titlePt * 23 + 200) + subtitleH;
  const topSpacing = Math.max(UPPER_H - contentEstimate - spacerIntrinsic - 800, 400);

  const upperBlock = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: UPPER_H, rule: "exact" },
      children: [new TableCell({
        shading: { fill: P.bg }, borders: noBorders, verticalAlign: "top",
        margins: { left: padL, right: padR },
        children: [
          new Paragraph({ spacing: { before: topSpacing } }),
          config.englishLabel ? new Paragraph({
            spacing: { after: 500 },
            children: [new TextRun({ text: config.englishLabel.split("").join(" "), size: 18, color: P.accent, font: { ascii: "Calibri" } })],
          }) : null,
          ...titleLines.map((line, i) => new Paragraph({
            spacing: { after: i < titleLines.length - 1 ? 100 : 200 },
            children: [new TextRun({ text: line, size: titleSize, bold: true, color: P.cover.titleColor, font: { eastAsia: "SimHei", ascii: "Arial" } })],
          })),
          config.subtitle ? new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: config.subtitle, size: 24, color: P.cover.subtitleColor, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
          }) : null,
        ].filter(Boolean),
      })],
    })],
  });

  const divider = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: DIVIDER_H, rule: "exact" },
      children: [new TableCell({ borders: noBorders, shading: { fill: P.accent }, children: [emptyPara()] })],
    })],
  });

  const lowerContent = [
    new Paragraph({ spacing: { before: 800 } }),
    ...(config.metaLines || []).map(line => new Paragraph({
      indent: { left: padL }, spacing: { after: 100 },
      children: [new TextRun({ text: line, size: 28, color: "475569", font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    })),
    new Paragraph({ spacing: { before: 2000 } }),
    new Paragraph({
      indent: { left: padL },
      children: [
        new TextRun({ text: config.footerLeft || "", size: 22, color: "909090" }),
        new TextRun({ text: "          " }),
        new TextRun({ text: config.footerRight || "", size: 22, color: "909090" }),
      ],
    }),
  ];

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: "FFFFFF" }, borders: noBorders,
        verticalAlign: "top",
        children: [upperBlock, divider, ...lowerContent],
      })],
    })],
  })];
}

// ── 正文段落渲染器 ──
const BODY_FONT = { eastAsia: "SimSun", ascii: "Times New Roman" };
const HEAD_FONT = { eastAsia: "SimHei", ascii: "Arial" };

function bodyPara(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 336, after: 140 },
    indent: { firstLine: 480 },
    children: [new TextRun({ text, size: 24, color: "262626", font: BODY_FONT, ...opts })],
  });
}

function framedBlock(children, fill) {
  // 1x1 表格框：浅底纹 + 左侧 accent 粗边
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: NB, bottom: NB, right: NB,
      left: { style: BorderStyle.SINGLE, size: 18, color: P.table.accentLine },
      insideHorizontal: NB, insideVertical: NB,
    },
    rows: [new TableRow({
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        children,
      })],
    })],
  });
}

function codeBlock(code) {
  const lines = code.split("\n");
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      cantSplit: false,
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: "F4F6F8" },
        margins: { top: 140, bottom: 140, left: 220, right: 220 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "D8DEE4" },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "D8DEE4" },
          left: { style: BorderStyle.SINGLE, size: 12, color: "8A9BA8" },
          right: { style: BorderStyle.SINGLE, size: 4, color: "D8DEE4" },
        },
        children: lines.map(l => new Paragraph({
          spacing: { line: 260, lineRule: "atLeast", after: 0 },
          children: [new TextRun({ text: l.length ? l : " ", size: 18, color: "1F2933", font: { ascii: "Consolas", eastAsia: "SimSun" } })],
        })),
      })],
    })],
  });
}

function dataTable(header, rows) {
  const mkCell = (text, isHeader, colIdx) => new TableCell({
    shading: { type: ShadingType.CLEAR, fill: isHeader ? P.table.headerBg : (colIdx % 2 === 0 ? "FFFFFF" : "FAFCFD") },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { line: 280, after: 0 },
      children: [new TextRun({ text, size: isHeader ? 21 : 20, bold: isHeader, color: isHeader ? P.table.headerText : "262626", font: BODY_FONT })],
    })],
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: P.table.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: P.table.accentLine },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: P.table.innerLine },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: P.table.innerLine },
    },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: header.map((h, i) => mkCell(h, true, i)) }),
      ...rows.map(r => new TableRow({ cantSplit: true, children: r.map((c, i) => mkCell(String(c), false, i)) })),
    ],
  });
}

function renderBlock(blk) {
  const out = [];
  const type = Object.keys(blk)[0];
  const val = blk[type];
  switch (type) {
    case "h2":
      out.push(new Paragraph({
        heading: HeadingLevel.HEADING_1, outlineLevel: 0,
        spacing: { before: 480, after: 240, line: 340 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "9FB6C6", space: 6 } },
        children: [new TextRun({ text: val, size: 32, bold: true, color: H1_COLOR, font: HEAD_FONT })],
      }));
      break;
    case "h3":
      out.push(new Paragraph({
        heading: HeadingLevel.HEADING_2, outlineLevel: 1,
        spacing: { before: 340, after: 170, line: 320 },
        border: { left: { style: BorderStyle.SINGLE, size: 22, color: "4E8CAD", space: 10 } },
        children: [new TextRun({ text: val, size: 27, bold: true, color: "2C3E50", font: HEAD_FONT })],
      }));
      break;
    case "para":
      out.push(bodyPara(val));
      break;
    case "bullet": {
      const items = Array.isArray(val) ? val : [val];
      items.forEach(t => out.push(new Paragraph({
        spacing: { line: 312, after: 80 },
        indent: { left: 640, hanging: 240 },
        children: [
          new TextRun({ text: "\u2022 ", size: 24, bold: true, color: H1_COLOR, font: BODY_FONT }),
          new TextRun({ text: t, size: 24, color: "262626", font: BODY_FONT }),
        ],
      })));
      break;
    }
    case "quiz": {
      out.push(framedBlock([
        new Paragraph({
          spacing: { line: 300, after: 60 },
          children: [new TextRun({ text: "\u968f\u5802\u6d4b\u8bd5", size: 24, bold: true, color: "0F3A44", font: HEAD_FONT })],
        }),
        ...val.map((q, i) => new Paragraph({
          spacing: { line: 300, after: i === val.length - 1 ? 0 : 50 },
          indent: { left: 200, hanging: 200 },
          children: [new TextRun({ text: q, size: 21, color: "1F2933", font: BODY_FONT })],
        })),
        new Paragraph({
          spacing: { line: 280, before: 60, after: 0 },
          children: [new TextRun({ text: "\uff08\u53c2\u8003\u7b54\u6848\u89c1\u9644\u5f55 F\uff1b\u52a8\u624b\u9898\u4ee5\u8dd1\u901a\u4ee3\u7801\u4e3a\u901a\u8fc7\u6807\u51c6\uff09", size: 18, italics: true, color: "8A9BA8", font: BODY_FONT })],
        }),
      ], "EEF4F7"));
      out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      break;
    }
    case "dialog":
      out.push(framedBlock([new Paragraph({
        spacing: { line: 312, after: 0 },
        children: [new TextRun({ text: val, size: 24, italics: true, color: "3D4A5C", font: BODY_FONT })],
      })], "FFFFFF"));
      out.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
      break;
    case "example": {
      const lines = val.split("\n");
      out.push(framedBlock([
        new Paragraph({
          spacing: { line: 280, after: 50 },
          children: [new TextRun({ text: "\u3010\u4f8b\u3011", size: 21, bold: true, color: "8A6D3B", font: { eastAsia: "SimHei", ascii: "Arial" } })],
        }),
        ...lines.map((l, i, arr) => new Paragraph({
          spacing: { line: 300, after: i === arr.length - 1 ? 0 : 40 },
          children: [new TextRun({ text: l.length ? l : " ", size: 21, color: "1F2933", font: { eastAsia: "SimSun", ascii: "Consolas" } })],
        })),
      ], "FDFBF5"));
      out.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
      break;
    }
    case "formula":
      out.push(framedBlock([new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 320, after: 0 },
        children: [new TextRun({ text: val, size: 23, bold: true, color: "0F3A44", font: { eastAsia: "SimSun", ascii: "Cambria" } })],
      })], "F2F7F5"));
      out.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
      break;
    case "code":
      out.push(codeBlock(val));
      out.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
      break;
    case "note":
      out.push(framedBlock([new Paragraph({
        spacing: { line: 312, after: 0 },
        children: [
          new TextRun({ text: "\u3010\u63D0\u793A\u3011", size: 24, bold: true, color: H1_COLOR, font: HEAD_FONT }),
          new TextRun({ text: val, size: 24, color: "262626", font: BODY_FONT }),
        ],
      })], P.table.surface));
      out.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
      break;
    case "table":
      out.push(dataTable(val.header, val.rows));
      out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      break;
  }
  return out;
}

// ── 部分分隔页 ──
function partDivider(title, desc, chapters) {
  return [
    new Paragraph({ spacing: { before: 3200 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 300 },
      children: [new TextRun({ text: title, size: 44, bold: true, color: H1_COLOR, font: HEAD_FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 500 },
      children: [new TextRun({ text: desc, size: 24, color: "5A6B7A", font: BODY_FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 120 },
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: P.table.innerLine, space: 8 } },
      children: [new TextRun({ text: chapters, size: 21, color: "8A9BA8", font: BODY_FONT })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

const PART_DIVIDERS = {
  1: partDivider("第一部分  打地基", "认识三大主角：语言模型、RNN、Transformer，看懂 RWKV 要解决的问题。", "前言 \u00b7 第 1\u20144 章"),
  2: partDivider("第二部分  拆开 RWKV-4 看零件", "对照第一篇论文（arXiv 2305.13048），把 RWKV-4 的每个零件拆开、擦亮、装回去。", "第 5\u20149 章 \u00b7 实验 1\u20132"),
  3: partDivider("第三部分  升级：RWKV-5/6", "对照论文《Eagle and Finch》（arXiv 2404.05892）：账本升级成卡片盒，折扣学会看人下菜。", "第 10\u201411 章 \u00b7 实验 3"),
  4: partDivider("第四部分  最强形态：RWKV-7", "对照论文《RWKV-7 Goose》（arXiv 2503.14456）：记忆不再只靠叠加，还能先擦后写。", "第 12\u201414 章 \u00b7 实验 4"),
  5: partDivider("第五部分  社区实战与全景", "用社区项目跑真模型，看懂 266 篇论文拼出的 RWKV 地图，再眺望 RWKV-8 的未来。", "第 15\u201417 章"),
  6: partDivider("第六部分  从零实战：造你自己的模型", "自造数据、自造分词器、自搭训练框架、自定参数、自测质量——五步闭环，从模型使用者变成模型创造者。", "第 18\u201423 章 · 实验 5"),
  7: partDivider("第七部分  社区智慧与全景布局", "前人踩过的坑提前避开；六类终端的体验地图；一条开源生态的野心之路。", "第 24\u201426 章"),
};

// ── 组装正文 ──
// 教材插图：h2 标题（含关键词）渲染后插入对应图
const FIGS = "/home/z/my-project/share/projects/6ad85ab25dddfa3997dd173e/tmp/figs";
const FIG_AFTER_H2 = [
  { match: "\u7b2c 4 \u7ae0", file: "fig1_\u4e09\u79cd\u8bb0\u5fc6\u65b9\u5f0f\u5bf9\u6bd4.png", w: 1180, h: 442, cap: "\u56fe 1\uff5c\u4e09\u79cd\u8bb0\u5fc6\u65b9\u5f0f\u5bf9\u6bd4\uff1a\u5168\u73ed\u4f20\u7eb8\u6761 vs \u5355\u4eba\u4f20\u8bdd vs \u4f1a\u8bb0\u8d26\u7684\u4f20\u8bdd\u4eba" },
  { match: "\u7b2c 6 \u7ae0", file: "fig2_WKV\u8bb0\u8d26\u672c\u4e24\u6b65.png", w: 1120, h: 592, cap: "\u56fe 2\uff5cWKV \u8bb0\u8d26\u672c\uff1a\u6bcf\u6765\u4e00\u4e2a\u65b0\u8bcd\u53ea\u505a\u4e24\u6b65\uff08\u8bfb\u8d26\u2192\u8bb0\u8d26\uff09" },
  { match: "\u7b2c 9 \u7ae0", file: "fig5_\u8bad\u7ec3\u8ba1\u7b97\u91cf\u5bf9\u6bd4.png", w: 1720, h: 1040, cap: "\u56fe 3\uff5c\u8bad\u7ec3\u8ba1\u7b97\u91cf\u968f\u5e8f\u5217\u957f\u5ea6\u7684\u589e\u957f\uff08\u7406\u8bba\u66f2\u7ebf\uff09\uff1a\u957f\u5ea6\u7ffb 64 \u500d\uff0cTransformer \u8981\u591a\u7b97 4096 \u500d\uff0cRWKV \u53ea\u591a\u7b97 64 \u500d" },
  { match: "\u7b2c 9 \u7ae0", file: "fig6_\u63a8\u7406\u5185\u5b58\u5bf9\u6bd4.png", w: 1720, h: 1040, cap: "\u56fe 4\uff5c\u63a8\u7406\u5185\u5b58\u5bf9\u6bd4\uff087B \u6a21\u578b fp16 \u4f30\u7b97\uff09\uff1aTransformer \u7684 KV \u7f13\u5b58\u968f\u957f\u5ea6\u7ebf\u6027\u81a8\u80c0\uff0cRWKV \u72b6\u6001\u6052\u5b9a\u4e0d\u53d8" },
  { match: "\u7b2c 13 \u7ae0", file: "fig4_RWKV7\u5148\u64e6\u540e\u5199.png", w: 1120, h: 399, cap: "\u56fe 5\uff5cRWKV-7 \u5148\u64e6\u540e\u5199\uff1a\u8d34\u7eb8\u5899\u4e0a\u6495\u65e7\u8d34\u65b0\uff08\u5e7f\u4e49 Delta \u89c4\u5219\uff09" },
  { match: "\u7b2c 14 \u7ae0", file: "fig7_\u8bad\u7ec3\u6570\u636e\u6f14\u8fdb.png", w: 1720, h: 1000, cap: "\u56fe 6\uff5c\u5386\u4ee3\u9884\u8bad\u7ec3\u6570\u636e\u89c4\u6a21\u6f14\u8fdb\uff08\u8bba\u6587\u771f\u5b9e\u6570\u5b57\uff09\uff1a\u4e24\u5e74\u534a\u589e\u957f\u7ea6 9 \u500d" },
  { match: "\u7b2c 16 \u7ae0", file: "fig3_RWKV\u6f14\u8fdb\u65f6\u95f4\u7ebf.png", w: 1240, h: 317, cap: "\u56fe 7\uff5cRWKV \u67b6\u6784\u6f14\u8fdb\u65f6\u95f4\u7ebf\uff082021\u20142026\uff09" },
];
function figParas(f) {
  const W = f.w > 1500 ? 600 : 580, H = Math.round(f.h * W / f.w);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 120, after: 40 },
      keepNext: true,
      children: [new ImageRun({
        type: "png",
        data: fs.readFileSync(`${FIGS}/${f.file}`),
        transformation: { width: W, height: H },
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 140 },
      children: [new TextRun({ text: f.cap, size: 18, color: "888888", font: { eastAsia: "SimSun", ascii: "Arial" } })],
    }),
  ];
}

const partMap = [[1, p12.PART1], [2, p12.PART2], [3, p345.PART3], [4, p345.PART4], [5, p345.PART5], [6, p6.PART6], [7, p7.PART7]];
const bodyChildren = [];
for (const [num, blocks] of partMap) {
  bodyChildren.push(...PART_DIVIDERS[num]);
  for (const blk of blocks) {
    bodyChildren.push(...renderBlock(blk));
    if (blk.h2) {
      for (const f of FIG_AFTER_H2) {
        if (blk.h2.startsWith(f.match)) bodyChildren.push(...figParas(f));
      }
    }
  }
}
bodyChildren.push(...PART_DIVIDERS ? [] : []);
// 附录（无分隔页，直接接在后）A~D + E~G
for (const blk of p345.APPENDIX) bodyChildren.push(...renderBlock(blk));
for (const blk of apx2.APPENDIX2) bodyChildren.push(...renderBlock(blk));

// ── 页眉 / 页脚 ──
const bodyHeader = new Header({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "C8DDE2", space: 4 } },
    children: [new TextRun({ text: "RWKV \u5927\u6a21\u578b\u5165\u95e8\u6559\u6750\uff08\u521d\u4e2d\u751f\u7248\uff09", size: 18, color: "8A9BA8", font: BODY_FONT })],
  })],
});
const numFooter = new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "8A9BA8", font: { ascii: "Arial" } })],
  })],
});

// ── 目录 section ──
const tocChildren = [
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 200, after: 300 },
    children: [new TextRun({ text: "\u76ee\u5f55", size: 36, bold: true, color: H1_COLOR, font: HEAD_FONT })],
  }),
  new TableOfContents("\u76ee\u5f55", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({
    spacing: { before: 200 },
    children: [new TextRun({
      text: "\u6253\u5f00\u6587\u6863\u540e\uff0c\u8bf7\u53f3\u952e\u70b9\u51fb\u76ee\u5f55\u5e76\u9009\u62e9\u201c\u66f4\u65b0\u57df\u201d\u4ee5\u5237\u65b0\u9875\u7801\u3002",
      size: 18, italics: true, color: "8A9BA8", font: BODY_FONT,
    })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ── 文档 ──
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: BODY_FONT, size: 24, color: "262626" } },
    },
  },
  features: { updateFields: true },
  sections: [
    { // 封面
      properties: { page: { margin: { top: 0, bottom: 0, left: 0, right: 0 }, size: { width: 11906, height: 16838 } } },
      children: buildCoverR4({
        title: "RWKV \u5927\u6a21\u578b\u5165\u95e8\u6559\u6750",
        subtitle: "\u4ece\u96f6\u5f00\u59cb\uff0c\u8bfb\u61c2\u4e2d\u56fd\u4eba\u81ea\u4e3b\u8bbe\u8ba1\u7684\u65b0\u4e00\u4ee3 AI \u67b6\u6784",
        englishLabel: "RWKV FOR BEGINNERS",
        metaLines: [
          "\u9002\u7528\u8bfb\u8005\uff1a\u521d\u4e2d\u751f\u53ca\u96f6\u57fa\u7840\u8bfb\u8005",
          "\u5b66\u4e60\u8def\u7ebf\uff1a\u7531\u7b80\u5165\u6df1 \u00b7 \u591a\u4e3e\u4f8b\u5b50 \u00b7 \u624b\u628a\u624b\u5b9e\u9a8c",
          "\u8bba\u6587\u4f9d\u636e\uff1aRWKV-4 / 5+6 / 7 \u4e09\u7bc7\u6838\u5fc3\u8bba\u6587\u9010\u6b65\u62c6\u89e3",
          "\u8d44\u6599\u6765\u6e90\uff1arwkv.cn \u5b98\u7f51\u6536\u5f55\u5168\u90e8 266 \u7bc7\u8bba\u6587",
        ],
        footerLeft: "RWKV \u7cfb\u5217\u8bba\u6587\u8be6\u7ec6\u8bb2\u89e3 \u00b7 \u9879\u76ee\u6559\u6750",
        footerRight: "2026 \u5e74 10 \u6708",
      }),
    },
    { // 目录（罗马页码）
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 }, pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } } },
      footers: { default: numFooter },
      children: tocChildren,
    },
    { // 正文（阿拉伯页码从 1）
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 }, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      headers: { default: bodyHeader },
      footers: { default: numFooter },
      children: bodyChildren,
    },
  ],
});

const OUT = process.argv[2] || "/home/z/my-project/share/projects/6ad85ab25dddfa3997dd173e/tmp/6ad85bcc973da8774906b308_textbook.docx";
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("DOCX generated:", OUT, buf.length, "bytes");
});
