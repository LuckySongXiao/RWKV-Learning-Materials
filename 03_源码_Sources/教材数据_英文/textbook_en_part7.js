// AUTO-TRANSLATED ENGLISH EDITION
const PART7 = [
  {
    "h2": "Chapter 24 Debugging Handbook: The Sweat and Tears of Those Who Came Before"
  },
  {
    "para": "This chapter is a \"collection of common pitfalls for beginners.\" In community forums and GitHub issue sections, the same pitfalls are stepped on again and again by newcomers—having them in your mind ahead of time can save you dozens of hours. The golden rule for debugging is simple: first, read the last line of the error message, then suspect the most commonly problematic part."
  },
  {
    "h3": "24.1 Classic Pitfalls: Nine Out of Ten Beginners Fall Into These"
  },
  {
    "table": {
      "header": [
        "Symptom",
        "Cause",
        "Solution"
      ],
      "rows": [
        [
          "out of memory (OOM)",
          "batch too large / context too long / model too big",
          "lower batch size first (recover it with gradient accumulation); then quantization (Chapter 15); only then a bigger card"
        ],
        [
          "crashes once context grows long",
          "ctx_len exceeds the model's trained length",
          "don't feed 8192 to a 4096 model; split long texts + summarize"
        ],
        [
          "inference extremely slow",
          "running fp32 on CPU, or missing the wkv CUDA kernel",
          "use community-built inference projects (ai00 / rwkv.cpp); don't run raw for-loops yourself"
        ],
        [
          "browser won't run it",
          "browser lacks WebGPU support",
          "switch to a recent Chrome / Edge (WebGPU needs a modern engine)"
        ],
        [
          "quantized model fails to load",
          "quantization format version mismatch (tools iterate fast)",
          "re-quantize with a converter from the same era as the model"
        ],
        [
          "inference is extremely slow",
          "running fp32 on CPU; the wkv CUDA kernel is not installed",
          "use community-built inference projects (ai00 / rwkv.cpp); do not run a bare for-loop"
        ],
        [
          "the browser build fails",
          "the browser does not support WebGPU",
          "switch to a recent Chrome / Edge (WebGPU needs a recent engine)"
        ],
        [
          "quantized model fails to load",
          "quantization format version mismatch (tools iterate fast)",
          "re-quantize with a converter from the same era as the model"
        ]
      ]
    }
  },
  {
    "h3": "24.2 Environmental Pitfalls: The Hidden Reefs of Operating Systems and Graphics Cards"
  },
  {
    "table": {
      "header": [
        "Pitfall",
        "Truth",
        "Solution"
      ],
      "rows": [
        [
          "PyTorch version mismatch",
          "kernels are pinned to framework versions",
          "install exactly the version in the project README; don't chase the latest"
        ],
        [
          "VRAM seems \"cut in half\" under WSL",
          "WSL reserves a chunk of VRAM",
          "run big training on dual-boot Linux or the cloud"
        ],
        [
          "the Mac build is slow",
          "the MPS backend lacks optimization for some kernels",
          "fine for small models; for big training rent cloud GPUs"
        ],
        [
          "PyTorch version mismatch",
          "kernels are tied to framework versions",
          "install the version pinned in the project README; do not chase the newest"
        ],
        [
          "VRAM seems \"cut in half\" under WSL",
          "WSL reserves a chunk of VRAM",
          "do large training under dual-boot or in the cloud"
        ]
      ]
    }
  },
  {
    "h3": "24.3 Niche Pitfalls: Only Those Who've Been There Know"
  },
  {
    "bullet": [
      "fp16 e^u overflow: In time mixing, e^(u+k) easily overflows to inf in fp16—this is precisely why the paper specifically includes a \"numerically stable version\" formula (log-space accounting, Equations 23~26 in Chapter 9). When implementing it yourself, faithfully copy the paper's stable version and don't try to \"optimize\" it.",
      "Loss curve goes down then up: Not necessarily overfitting—first check your data pipeline (did shuffle leak validation data into training data? Is the wrong version of tokenizer being used?). Data bugs are far better disguised than overfitting.",
      "Performance degrades after resuming from checkpoint: Besides the model, optimizer state and RNG (random number generator seed state) must also be saved. Saving only weights without the optimizer is like letting a doctor forget the medical records.",
      "\"Why can't my 0.1B model solve math problems\": Not a bug, but a capacity boundary (Chapter 22)—a 0.1B card box can't hold long reasoning chains. Suspect capacity boundaries before bugs."
    ]
  },
  {
    "h3": "24.4 Pitfall Elimination Methodology: Create a Flowchart for Yourself"
  },
  {
    "para": "When encountering problems, follow these four steps: (1) Read the last line of the error message (for Python errors, read from bottom to top—the first line is human-readable, the last few lines are the stack trace); (2) Minimize reproduction—reduce the problem to 10 lines of code or less; (3) Binary localization—change the model? Change the data? Change the parameters? Only change one at a time; (4) Search the GitHub issue area—you're 99% not the first person to encounter this pitfall. Learn the art of asking questions: post the complete error message, specify your environment (graphics card/system/versions), and provide a minimal reproduction code."
  },
  {
    "quiz": [
      "【Multiple Choice】What is the most common cause of garbled output? A. Graphics card is too poor  B. Tokenizer doesn't match the model  C. Temperature set too high",
      "【Short Answer】Why does the paper specifically include a \"numerically stable version\" formula? Explain using fp16 overflow.",
      "【Hands-on】Copy the four-step pitfall elimination method from 24.4 on a sticky note and post it next to your computer—next time you encounter a bug, follow the steps in order."
    ]
  },
  {
    "h2": "Chapter 25: The Full Device Map: Where RWKV Can Run"
  },
  {
    "para": "RWKV's 'little notebook' architecture (constant inference memory, no KV cache) makes it naturally suitable for running 'anywhere'. This chapter is a family photo: from the phone in your pocket to computing clusters in the cloud, there are ready-to-use community projects for every type of device."
  },
  {
    "h3": "25.1 Six Types of Terminals × Available Projects"
  },
  {
    "table": {
      "header": [
        "Terminal",
        "Representative Project",
        "What to Experience"
      ],
      "rows": [
        [
          "low-end PC (no discrete GPU)",
          "rwkv.cpp (C++ quantized inference)",
          "quantized models run smoothly even on CPU"
        ],
        [
          "gaming laptop / workstation",
          "ai00_server (local inference service)",
          "runs directly on the GPU, fast; build your own local chat service"
        ],
        [
          "edge modules (farm machinery, IoT)",
          "Quectel high-compute modules (shown at WAIC 2025)",
          "putting RWKV into tractors, cameras, sensors"
        ],
        [
          "low-end computers (no discrete GPU)",
          "rwkv.cpp (C++ quantized inference)",
          "quantized models run smoothly even on CPU"
        ],
        [
          "home gaming laptops / workstations",
          "ai00_server (local inference service)",
          "runs straight on the GPU, fast; build your own local chat service"
        ],
        [
          "edge modules (farm machinery, IoT)",
          "Quectel high-compute modules (shown at WAIC 2025)",
          "put RWKV into tractors, cameras, and sensors"
        ]
      ]
    }
  },
  {
    "h3": "25.2 Why RWKV is the 'King of Edge Computing'"
  },
  {
    "para": "Looking at the device map with the three advantages from Chapter 9: constant memory—even a phone with 4GB memory can run long conversations; no KV cache—browser tabs won't get slower as the conversation continues; sequential inference—doesn't require massive parallel computing power, CPUs and edge chips can handle it. Comparison: Transformer's memory bill expands linearly with length (Figure 4), and what edge devices lack most is memory. This is why edge collaborations (Quectel) and chip plans (RPU, Chapter 17) have chosen RWKV."
  },
  {
    "h3": "25.3 Recommended Experience Path (from Easy to Hard)"
  },
  {
    "bullet": [
      "First stop (5 minutes): Open WebGPU Demo in browser—zero installation, first see what a 'model in the browser' looks like.",
      "Second stop (half hour): Download RWKV Runner, automatically download models, start local chatting.",
      "Third stop (an afternoon): Use ai00 or rwkv.cpp to run the same model, compare speed differences, understand the value of 'inference engines'.",
      "Fourth stop (a weekend): Follow Chapters 20-21 to train your own mini model, then load it with your own Runner—complete end-to-end loop."
    ]
  },
  {
    "quiz": [
      "【Multiple Choice】Which type of device best demonstrates RWKV's edge advantages over Transformers? A. Cloud with thousands of GPUs  B. Memory-constrained mobile/edge devices  C. Quantum computer",
      "【Short Answer】Explain using 'constant memory + no KV cache': Why don't browser tabs running RWKV become increasingly laggy during conversations?",
      "【Hands-on】Complete the first and second stops of section 25.3, take a screenshot for each, and write three sentences of experience notes (speed/quality/surprises or shortcomings)."
    ]
  },
  {
    "h2": "Chapter 26: The Panoramic Layout of RWKV: One Person's Experiment, One Ecosystem's Ambition"
  },
  {
    "h3": "26.1 Five Frontlines"
  },
  {
    "table": {
      "header": [
        "Frontline",
        "Current Status",
        "Key Milestones"
      ],
      "rows": [
        [
          "industry (edge)",
          "Quectel partnership modules landing in IoT; Flutter app covering phones and desktops",
          "edge-side solution shown at WAIC 2025"
        ],
        [
          "industry (chips)",
          "dedicated RPU chip plan in progress",
          "Peng Bo's 2023 \"the decisive battle is in hardware\" declaration is being fulfilled (Chapter 17)"
        ],
        [
          "open-source community",
          "fully open under Apache 2.0; incubated by the LFAI & Data foundation; global volunteers",
          "projects like RWKV-Runner / ai00 / rwkv.cpp emerged spontaneously"
        ],
        [
          "industry (edge side)",
          "Quectel modules landing in IoT; the Flutter APP covers phones and desktops",
          "edge solution shown at WAIC 2025"
        ],
        [
          "industry (chips)",
          "the RPU dedicated-chip plan is moving forward",
          "Peng Bo's 2023 \"the decisive battle is in hardware\" declaration is being fulfilled (Chapter 17)"
        ]
      ]
    }
  },
  {
    "h3": "26.2 'The Android of the AI Era'"
  },
  {
    "para": "In a 2023 interview, Bloomberg shared an ambition: to become 'the Android of the AI era.' Android's strategy isn't to build the fastest phones, but to open-source the system for all manufacturers, letting the ecosystem grow naturally. RWKV follows the same path: architecture and models are fully open-sourced under Apache 2.0, allowing anyone to use them commercially for free; comprehensive layout on edge, cloud, and chip sides; multilingual fairness (World data covers 100+ languages, not biased toward English). As Transformer training and inference bills continue to mount, the 'fast, efficient, and open' approach has carved out its own space for survival."
  },
  {
    "h3": "26.3 Your Place in This Ecosystem"
  },
  {
    "para": "Understanding the layout, think about where you can fit in: if you like hands-on work—Chapters 18-23's model creation path plus Chapter 25's device map are enough for you to create your first 'own AI product'; if you like research—pick a thread (vision/timeseries/medicine) from the 266 papers in Appendix C to explore deeply; if you like engineering—the operators and inference engine directions in Appendix G's advanced roadmap always welcome new talent in community projects. The ecosystem's ambition must be realized through the hands-on work of generation after generation of newcomers."
  },
  {
    "quiz": [
      "【Multiple Choice】What is the core of the 'Android of the AI era' metaphor? A. Building the fastest model B. Open ecosystem with full layout C. Only making phone systems",
      "【Short Answer】RWKV uses Apache 2.0 protocol for open source. What does this mean for ecosystem expansion? (Compare with 'closed-source and paid')",
      "【Hands-on】Referring to the five frontlines in 26.1, write one sentence about the specific project/paper/direction you're most interested in in each, and circle one as your 'entry point'."
    ]
  }
];

module.exports = { PART7 };
