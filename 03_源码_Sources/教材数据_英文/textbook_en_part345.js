// AUTO-TRANSLATED ENGLISH EDITION
const PART3 = [
  {
    "h2": "Chapter 10 Eagle (RWKV-5): From Notepad to Memory Card Box"
  },
  {
    "para": "The 2024 paper \"Eagle and Finch: RWKV with Matrix-Valued States and Dynamic Recurrence\" (arXiv 2404.05892, TMLR journal) upgraded RWKV by two generations. The first upgrade is called Eagle (RWKV-5), with one core change: from ledger to card box—vector states become matrix states."
  },
  {
    "h3": "10.1 What are Matrix-Valued States?"
  },
  {
    "para": "RWKV-4's two ledgers (a, b) are both \"columns of numbers\" (vectors). Eagle upgrades memory to \"a table\" (matrix). The new ledger formula (cyclic form of paper's equation 6, equations 8-9):"
  },
  {
    "formula": "卡片盒 sₜ = diag(w)·sₜ₋₁ + kₜ ⊗ vₜ   （⊗ 读“外积”，表示 k 和 v 做交叉乘法填满表格）"
  },
  {
    "para": "In plain terms: the entire old card box gets discounted by w; when a new word comes, its label k and content v are \"cross-multiplied\" once to generate a new card, which is added to the box. When querying memory, use the current label kₜ to \"scratch\" the box (matrix multiplication), and related content will be selected."
  },
  {
    "example": "The outer product isn't mysterious. Let k = [1, 2] (labels: two channels) and v = [10, 20] (content: two channels). The outer product k⊗v is just a 2×2 table:\n  [1×10, 1×20]   =  [10, 20]\n  [2×10, 2×20]      [20, 40]\nEach cell = one component of the label × one component of the content. This table remembers all combination relationships like \"the contribution of label 1 channel component to content 1 channel component\". The technical term is \"memorizing the association between K and V\"."
  },
  {
    "h3": "10.2 Why the Card Box is Stronger"
  },
  {
    "para": "A column of numbers can only store \"total scores\" (like total points in a game), while a table can store \"who contributed to what\" (each player's scoring table per quarter). The amount of stored information changes from D numbers to D×D combinations. Eagle uses 64×64 matrix states per head, greatly increasing expressive power. The paper also provides the final formula: output = SiLU gate × LayerNorm( rₜ · wkvₜ )—the gate allows passage, normalization stabilizes, continuing the same philosophy as RWKV-4 (SiLU is a smooth valve function, similar to sigmoid)."
  },
  {
    "h3": "10.3 Multi-head: Multiple Card Boxes Each Remembering Their Own"
  },
  {
    "para": "One card box can't keep track of all types of information, so Eagle equips each layer with multiple \"clerks\" (heads), each managing a small 64×64 card box: some specialize in grammar, some in facts, some in tone. Finally, the readings from each clerk are combined and used. This is \"multi-head\". Parameter budget unchanged, memory clearer."
  },
  {
    "table": {
      "header": [
        "Comparison",
        "RWKV-4",
        "RWKV-5 Eagle"
      ],
      "rows": [
        [
          "Expressiveness",
          "adequate",
          "greatly improved (capability comparison in Fig. 2 of the paper)"
        ],
        [
          "What it can store",
          "score-sum memory",
          "a K-to-V association table"
        ],
        [
          "Per-head state size",
          "D numbers",
          "64×64 = 4096 cells"
        ],
        [
          "Expressiveness",
          "adequate",
          "greatly improved (paper Fig. 2 capability comparison)"
        ]
      ]
    }
  },
  {
    "quiz": [
      "【Multiple Choice】What is Eagle's core upgrade? A. Vector→matrix state  B. Change dataset  C. Add layers",
      "【Short Answer】Explain why matrix states have greater capacity using \"column of numbers becomes table.\"",
      "【Hands-on】Manually compute outer product: k=[1,2], v=[10,20], write the 2×2 card (answer: [[10,20],[20,40]])."
    ]
  },
  {
    "h2": "Chapter 11 Finch (RWKV-6): The Changing Face of Discounting"
  },
  {
    "h3": "11.1 The Rigidity of Old Discounting"
  },
  {
    "para": "RWKV-4/5's discount w is a \"fixed knob\": set after training and remains constant, regardless of content read. But in reality, some information should be forgotten immediately (nonsense), some should be remembered for a long time (key points). Finch's (RWKV-6) upgrade is: let the discount rate change at each step—automatically decrease discount when reading important content (forget less), automatically increase when reading mundane content (forget more). The technical term is \"data-dependent decay.\""
  },
  {
    "h3": "11.2 ddlerp and LoRA: Implementing the Change"
  },
  {
    "para": "Finch's two new tricks are both quite small. First trick: ddlerp (data-dependent interpolation): the Token-Shift mixing ratio μ from Chapter 8 was originally fixed, but Finch lets the ratio be determined by content on the fly—formula ddlerp(a, b) = a + (b − a) ⊙ lora(a + (b−a)⊙μₓ). Second trick: LoRA-style small matrices: multiply a D×32 skinny matrix A with a 32×D skinny matrix B (paper equation 14, lora(x) = λ + tanh(xA)B), calculating \"this step's discount suggestion\" with very few parameters, then transforming through double exponentiation to get the discount rate wₜ = exp(−exp(dₜ))."
  },
  {
    "example": "Why use \"multiplying two thin matrices\" instead of one big matrix? Because D×32 + 32×D = 64D parameters, while a D×D big matrix needs D² parameters. When D = 4096, one is a big eater (16.77 million parameters) and the other is light on food (260,000 parameters). The saved parameters allow Finch to build deeper and wider models within the same budget. This technique is popular in the industry and is called LoRA."
  },
  {
    "h3": "11.3 Finch's Report Card"
  },
  {
    "para": "The paper released Eagle checkpoints with 0.46B to 7.5B parameters (0.46B/1.01B/2.48B/7.52B) and two Finch checkpoints at 1.6B/3.1B, all open-sourced under Apache 2.0. Alongside this, they released the 1.12 trillion token RWKV World v2 dataset and a brand new RWKV World tokenizer. The tokenizer is specially designed for non-English languages: it splits languages like Chinese at 2-byte boundaries, making the \"cost per character\" similar to English—this is also one reason why RWKV is popular in the Chinese community."
  },
  {
    "note": "Evolution summary: Eagle upgraded the ledger to a card box (matrix state), and Finch gave the card box a face-changing discount (data-dependent decay). The remaining framework—R gates, floors, parallel training—remains unchanged."
  },
  {
    "h2": "Experiment 3: Build Your Own Memory Card Box"
  },
  {
    "para": "Goal: Experience matrix state with 30 lines of Python: storing, discounting, and retrieving. Tools: A computer with Python and numpy installed (pip install numpy). Create a new file matrix_memory.py:"
  },
  {
    "code": "import numpy as np\n\nD = 4                          # 维度\nbox = np.zeros((D, D))         # 空卡片盒（矩阵状态）\nw = 0.5                        # 折扣率（示意图先写死）\n\ndef store(box, k, v, w):\n    # 记账：旧盒打折 + 新卡片（外积）入盒\n    return w * box + np.outer(k, v)\n\ndef retrieve(box, q):\n    # 勾账：拿查询标签 q 去盒子上划一下\n    return q @ box\n\n# 存三个词（k 是标签，v 是内容）\nwords = [([1,0,0,0], [10,0,0,0]),   # 词1：标签频道0，内容在频道0\n         ([0,1,0,0], [0,20,0,0]),   # 词2：标签频道1，内容在频道1\n         ([1,0,0,0], [8,0,0,0])]    # 词3：又用标签频道0（新内容）\n\nfor i,(k,v) in enumerate(words, start=1):\n    box = store(box, np.array(k,float), np.array(v,float), w)\n    print(f\"存第{i}个词后, 盒子的左上角4x4:\\n{box[:4,:4]}\")\n\n# 用标签“频道0”查询\nq = np.array([1,0,0,0], float)\nprint(\"查询标签[1,0,0,0] 勾出内容:\", retrieve(box, q))"
  },
  {
    "para": "After running, pay attention to: the query mainly retrieves content from channel 0 (around 5 signal, which is 10 halved plus 8), while the 20 in channel 1 can barely be retrieved (discounted twice to only 5, and in the wrong direction to retrieve). Try changing w to 0.9 and run again: is more memory retained in channel 1? Now change the label for word 3 to [0,0,1,0], see if it's stored in the box without interference—this is the \"partitioning capability of matrix memory\"."
  },
  {
    "quiz": [
      "【Multiple Choice】What does Finch's \"data-dependent\" refer to as the parameter that starts looking at input? A. K B. Decay w C. Vocabulary",
      "【Short Answer】Why is \"discount that changes based on situation\" smarter than \"fixed discount\"? (Hint: Some things should be remembered for a long time, others should be forgotten immediately)",
      "【Hands-on】Check the model table in 11.3: What sizes does Eagle and Finch each have? How many tokens were used for training data respectively?"
    ]
  }
];

const PART4 = [
  {
    "h2": "Chapter 12 Preparation: What Does \"Learning a Rule\" Mean"
  },
  {
    "para": "Before discussing RWKV-7, let's do a 2-minute mental exercise. There are three cards on the table: [Apple→Red], [Banana→Yellow], [Apple→Green]? Something's wrong—Apple appears twice with conflicting answers. Memory has two levels: Level one is \"take it all\" (remember all three, query apple gets red and green half each), level two is \"learn the rule\" (discover apple's answer updated to green, erase the old one). Level two is called \"in-context learning\". RWKV-7's core improvement is upgrading state updates from level one to level two. The tool is a small algorithm from the 1990s: the Delta rule."
  },
  {
    "quiz": [
      "【Multiple Choice】What is the core problem RWKV-7 aims to solve? A. Training too slow B. Additive memory only accumulates but doesn't update C. Not enough GPU memory",
      "【Short Answer】Use \"sticking post-it notes\" to explain the flaw of additive memory when knowledge needs to be corrected.",
      "【Hands-on】Design an example of \"information correction\" from your daily life (like: transferring schools, changing phone number), and explain why \"erase before writing\" is needed."
    ]
  },
  {
    "h2": "Chapter 13 Generalized Delta Rule: Erase Before Writing"
  },
  {
    "h3": "13.1 Original Delta Rule: A Test Card's Self-Modification"
  },
  {
    "para": "The original Delta rule (proposed by Schlag et al. 2021) has the update mantra: \"erase before writing\". Let card box be S, current label k, new content v:"
  },
  {
    "formula": "S ← S − (S 勾 k) ⊗ k + k ⊗ v   （先把盒里 k 标签对应的旧内容擦掉，再写入新内容 v）"
  },
  {
    "example": "The box already has [apple→red] (k=[1,0], corresponding to v=[10,0]). Now comes [apple→green] (k=[1,0], v=[0,15]).\nStep 1 [Erase]: Calculate that the content at the k label position in the box is [10,0], subtract it using k⊗[10,0]—the old red answer for apple is erased.\nStep 2 [Write]: Write in k⊗[0,15]—the new green answer for apple.\nResult: The box cleanly becomes [apple→green], not a red-green mix. This is \"learning\" rather than \"accumulation\"."
  },
  {
    "h3": "13.2 RWKV-7's Generalized Version: Three Upgrades"
  },
  {
    "para": "The RWKV-7 paper (arXiv 2503.14456, ICLR 2025) \"generalized\" this rule and made three major improvements. Its state update equation (Equation 17):"
  },
  {
    "formula": "sₜ = sₜ₋₁ · ( diag(wₜ) − κ̂ₜᵀ(aₜ ⊙ κ̂ₜ) ) + vₜᵀ · k̃ₜ"
  },
  {
    "para": "Translating compared to the original Delta rule: κ̂ (normalized version of k) is the \"locator\" for erasure; diag(wₜ) is the overall discount (Finch's legacy, variable at each step); aₜ is the newly added \"eraser strength\"; k̃, vₜ are the labels and content for writing. The three upgrades:"
  },
  {
    "bullet": [
      "Upgrade 1【Adjustable Eraser Strength】: aₜ is called the \"in-context learning rate\" in the paper—how heavy the eraser is, how hard the pencil writes, decided on the spot at each step. When there's strong conflict in answers, erase more thoroughly; when it's just a small update, make gentle changes."
    ]
  },
  {
    "bullet": [
      "Upgrade 2【Separate Erase and Write】: The label for erasure κ̂ and the label for writing k̃ are two separate vectors. When you want to \"clear old accounts before recording new ones\", offset them slightly to erase A and write B, making operations more flexible."
    ]
  },
  {
    "bullet": [
      "Upgrade 3【Rotatable Erasure Direction】: The erasure term κ̂ᵀ(a ⊙ κ̂) is isomorphic to the Householder reflection matrix (Equation 19 in the paper), which can be understood as \"the eraser can not only vary in strength but also change angle\". Mathematically, this ensures state stability (spectral radius not exceeding 1), preventing the computation from exploding."
    ]
  },
  {
    "para": "Page 3 of the paper shows a famous \"family comparison table\", scoring various linear models on four capabilities. Only RWKV-7 achieves all four:"
  },
  {
    "table": {
      "header": [
        "Capability",
        "Meaning (in plain terms)",
        "RWKV-4/5/6",
        "Mamba/GLA etc.",
        "RWKV-7"
      ],
      "rows": [
        [
          "LS",
          "supports low-rank-style updates (like editing a big ledger with small sticky notes)",
          "✗ / ✗ / ✓",
          "✗",
          "✓"
        ],
        [
          "DD",
          "erase-then-write (Delta subtraction)",
          "✗ / ✗ / ✓",
          "✓",
          "✓"
        ],
        [
          "DD",
          "erase-then-write (Delta subtraction)",
          "✗ / ✗ / ✓",
          "✓",
          "✓"
        ],
        [
          "GE",
          "generalized expressiveness (rotatable erasure, adjustable strength)",
          "✗",
          "✗",
          "✓"
        ]
      ]
    }
  },
  {
    "note": "The ✓/✗ in the table is compiled from Table 1 on page 3 of the RWKV-7 paper (comparing with a full row of models including RetNet, Mamba, Mamba-2, GLA, HGRN-2, TTT, Longhorn, etc.). In one sentence: RWKV-7 is the first \"all-rounder\" in the family."
  },
  {
    "h3": "13.3 Understanding the Core Formula with One Subtraction"
  },
  {
    "para": "Let's walk through equation 17 with the simplest numbers (set w=0 for no discount, a=1 for full strength, k̃=κ̂=k):"
  },
  {
    "example": "Initial card box S = 0. First token k=[1,0], v=[3,7]. Erase step: k-hat ⊗ (S retrieved by k) - with S=0 there is nothing to erase. Write step: S ← 0 + k ⊗ v = [[3,7],[0,0]]. Second token k=[0,1], v=[10,0]: erase k-hat ⊗ (Sᵀk) = 0 again, write [[0,0],[10,0]]. The box now cleanly stores both facts on separate channels - query with [1,0] reads 3/7, query with [0,1] reads 10/0."
  },
  {
    "quiz": [
      "【Multiple Choice】Which of these is NOT one of RWKV-7's three advantages? A. Adjustable eraser strength B. Separated erasing and writing C. Larger vocabulary",
      "【Short Answer】What is the purpose of the \"in-context learning rate\" a? What happens when conflicts are intense?",
      "【Hands-on】In the manual calculation example from 13.3, change a from 1 to 0.5: What will be in the box after the second write? (Answer: A mix of half old [3,7] and half new [9,1], no longer a clean replacement)"
    ]
  },
  {
    "h2": "Chapter 14: RWKV-7's Complete Pipeline and Achievements"
  },
  {
    "h3": "14.1 The Complete Process of One Layer"
  },
  {
    "para": "RWKV-7's layer still consists of time mixing + channel mixing. Time mixing: input x undergoes Token-Shift mixing (including LoRA-style data-dependent interpolation) → generates six cards (r, w, k̃, v, κ, a) two more than predecessors → updates the matrix state according to equation 17 → output passes through gating and normalization. Channel mixing: ReLU² type MLP remains consistent with predecessors. There's also a bonus at the output end: direct points (u) for the current word, ensuring \"what was just said\" always has a seat."
  },
  {
    "h3": "14.2 Achievements and Foundation"
  },
  {
    "para": "RWKV-7 was trained on the World v3 dataset with 3.12 trillion tokens (Appendix B of the paper: mixed English, multilingual, and code, with additional Chinese novels). It open-sourced 7 Apache 2.0 models: Pile versions 0.1B/0.4B/1.4B and World v3 versions 0.1B/0.4B/1.5B/2.9B. The paper's core claim: the expressiveness of the generalized Delta rule surpasses predecessors like DeltaNet, performs stronger on memory benchmarks like MQAR (multi-query associative recall), and its language ability matches or exceeds similarly-sized Transformer models (like Llama-3.2, SmolLM2). In training efficiency, RWKV-7's block parallel algorithm (wkv technique) makes long sequence training an order of magnitude faster than naive implementations."
  },
  {
    "table": {
      "header": [
        "Model",
        "Training Data",
        "Parameters",
        "Open Source License"
      ],
      "rows": [
        [
          "RWKV7-Pile-0.1B/0.4B/1.4B",
          "Pile（332B token）",
          "0.1B~1.4B",
          "Apache 2.0"
        ],
        [
          "RWKV7-World3-1.5B/2.9B",
          "World v3 + increments",
          "1.5B/2.9B",
          "Apache 2.0"
        ],
        [
          "RWKV7-World3-1.5B/2.9B",
          "World v3 + increments",
          "1.5B/2.9B",
          "Apache 2.0"
        ]
      ]
    }
  },
  {
    "note": "For those who have studied previous chapters: Connect RWKV-4's two books (vectors) → Eagle's card box (matrix) → Finch's shape-shifting discount (data-dependent w) → RWKV-7's write-after-erase (generalized Delta) into one line, and you've clearly explained the entire architectural evolution history of RWKV from 2021 to 2025."
  },
  {
    "h3": "14.3 Recognition from Mathematics: Expressiveness Milestone"
  },
  {
    "para": "Beyond benchmark scores, RWKV-7 also earned a \"theoretical gold medal\": an appendix of the paper proves its expressiveness strictly exceeds every known Delta-rule family member - not just better scores, but a provably larger class of computable functions."
  },
  {
    "h2": "Experiment 4: Delta Rule Online Error Correction Experiment"
  },
  {
    "para": "Goal: Visually compare the performance of \"accept everything\" (additive memory) vs. \"write after erase\" (Delta memory) during knowledge updates. Tools: Python + numpy. File delta_rule.py:"
  },
  {
    "code": "import numpy as np\n\nS_add = np.zeros((2, 2))     # 盒A：只会叠加（RWKV-4/5 式）\nS_delta = np.zeros((2, 2))   # 盒B：先擦后写（RWKV-7 式）\n\ndef norm(k):                # RWKV-7 的 κ̂：标签归一化（方向不变，长度变1）\n    return k / np.linalg.norm(k)\n\ndef delta_update(S, k, v, a=1.0):\n    kk = norm(k)                          # 擦除定位器\n    old = S @ kk                           # 勾出旧内容\n    S = S - a * np.outer(kk, old)          # 第一步【擦】\n    S = S + np.outer(kk, v * np.linalg.norm(k))  # 第二步【写】\n    return S\n\nk = np.array([1.0, 0.0])     # 标签：只认“苹果”这个频道\n\ndef query(S, q):\n    return S @ norm(q)\n\n# 场景：苹果的颜色先说红，后改口绿\nupdates = [np.array([10.0, 0.0]),   # 苹果→红\n           np.array([10.0, 0.0]),   # （重复强调红）\n           np.array([0.0, 10.0])]   # 改口：苹果→绿\n\nfor i, v in enumerate(updates, start=1):\n    S_add = S_add + np.outer(k, v)                 # 盒A：直接叠\n    S_delta = delta_update(S_delta, k, v)          # 盒B：先擦后写\n    print(f\"第{i}次写入(内容{v})：\")\n    print(f\"  叠加盒查询苹果 → {query(S_add, k)}\")\n    print(f\"  Delta盒查询苹果 → {query(S_delta, k)}\")"
  },
  {
    "para": "Run it and observe: after the first two writes, both boxes answer the label query with the same value (10). After the third write, the additive box still returns 10 (the old red entry is still in there), while the Delta box returns a clean 10 on a different channel (green) - the old answer has been replaced. This is the minimal demonstration of 'learning in context'. Thinking questions: (1) change a from 1.0 to 0.5 (a half-strength eraser) in delta_update and watch the old/new mixing ratio; (2) write two tokens with different labels and verify they do not interfere with each other."
  },
  {
    "quiz": [
      "【Multiple Choice】What is RWKV-7's theoretical gold medal? A. Cheapest training B. Expressiveness strictly greater than old Delta family C. Most parameters",
      "【Short Answer】In your own words, explain the difference between \"fixed-depth circuit vs. getting more capable as it computes\".",
      "【Hands-on】Check the family comparison table: What four capabilities? Which model has all four?"
    ]
  }
];

const PART5 = [
  {
    "h2": "Chapter 15: Toolkit: Running a Real RWKV"
  },
  {
    "h3": "15.1 Five-Minute Installation"
  },
  {
    "para": "Previously we played with \"skeleton code,\" now let's run a real model. The community has packaged inference into a pip package (pip is Python's app store). Execute in command line in order:"
  },
  {
    "code": "# 第 1 步：装包（rwkv 官方推理包）\npip install rwkv\n\n# 第 2 步：装依赖\npip install torch --index-url https://download.pytorch.org/whl/cpu\n# （CPU 版就够；有显卡的同学去 pytorch.org 选 CUDA 版）\n\n# 第 3 步：下载一个 0.1B 的小模型（约 400MB，RWKV-4 世界语系小模型）\n# 浏览器打开 https://huggingface.co/BlinkDL/rwkv-4-world-0.1b\n# 下载 RWKV-4-World-0.1B-v1-20230520-ctx4096.pth 放到当前文件夹"
  },
  {
    "h3": "15.2 Making RWKV Speak with Just Ten Lines of Code"
  },
  {
    "code": "from rwkv.model import RWKV\nfrom rwkv.utils import PIPELINE\n\n# 加载模型和分词器\nmodel = RWKV(model=\"RWKV-4-World-0.1B-v1-20230520-ctx4096\", strategy=\"cpu fp32\")\npipe = PIPELINE(model, \"rwkv_vocab_v20230424\")\n\n# 开始生成\nout = pipe.generate(\n    \"小白兔喜欢吃的蔬菜是\",\",   # 提示词\n    token_count=50,               # 生成 50 个 token\n    temperature=1.0,              # 温度：越大越放飞\n    top_p=0.7,                    # 只从可能性前 70% 里挑\n)\nprint(out)"
  },
  {
    "para": "The first run will download the model file (about 400MB), and subsequent runs will load the local file. Pay attention to the speed during generation: 0.1B CPU inference generates about a dozen words per second—that's the speed of \"little notebook\" mode. The generation quality depends on the model size; 0.1B is just a toy. Switching to RWKV-7-World-0.4B (about 1.6GB file, write the corresponding name in the model parameter) will make you feel noticeably smarter. Change the temperature to 0.2 and 1.5 and run each once to experience the difference between \"conservative\" and \"unrestrained.\""
  },
  {
    "h3": "15.3 Community Project Map"
  },
  {
    "para": "RWKV's open-source ecosystem (the \"Ecosystem\" section on the official website) has four must-visit repositories, categorized by use:"
  },
  {
    "table": {
      "header": [
        "Project",
        "URL (github.com/…)",
        "Purpose"
      ],
      "rows": [
        [
          "RWKV-LM",
          "BlinkDL/RWKV-LM",
          "The main training repo: model code, training scripts, CUDA acceleration - the official implementation of the papers"
        ],
        [
          "ai00_server",
          "Ai00-X/ai00_server",
          "Inference server: runs RWKV as a local API with GPU acceleration, ready for chat"
        ],
        [
          "rwkv（pip）",
          "pypi.org/project/rwkv",
          "Lightweight inference package: the one we used in the previous section"
        ],
        [
          "rwkv (pip)",
          "pypi.org/project/rwkv",
          "lightweight inference package - the one we used in the previous section"
        ]
      ]
    }
  },
  {
    "note": "Advanced challenge: Use ai00_server to set up a local chat service on your own computer; or use RWKV-PEFT to feed 10MB of your own diary to the 0.4B model and fine-tune a model with \"your flavor.\" The community also has Chinese documentation (the \"Documentation & Tutorials\" section on rwkv.cn) and Bilibili video tutorials—check them out if you get stuck."
  },
  {
    "quiz": [
      "【Multiple Choice】What command is used to check the graphics card? A. nvidia-smi  B. ls gpu  C. cat vram",
      "【Short Answer】Why is the 0.1B model a good friend for beginners? (Three reasons)",
      "[Hands-on] Use WebLLM's demo page to have RWKV write a self-introduction, then try temperature 0.5 and 1.5 and compare the styles. Screenshot your favorite output."
    ]
  },
  {
    "h2": "Chapter 16 The RWKV Family: A Map of 266 Papers"
  },
  {
    "para": "The \"Ecosystem → Papers\" section on the rwkv.cn official website has collected 266 RWKV-related papers (as of October 2026). Among them, architecture research papers are in the minority: besides the three main versions analyzed in this book (RWKV-4, RWKV-5/6, RWKV-7), there are also hybrid architecture RWKV-X, multimodal framework ModRWKV, and 2 review papers—totaling 7. The remaining 259 papers are from engineers worldwide using RWKV to solve practical problems—seeing doctors, checking road conditions, listening to music, compressing files—application papers. Classification statistics:"
  },
  {
    "table": {
      "header": [
        "Category",
        "Quantity",
        "Typical Examples"
      ],
      "rows": [
        [
          "sequence / RL",
          "43",
          "time-series forecasting, robot control"
        ],
        [
          "general",
          "22",
          "compression algorithms, hybrid architectures (RWKV-X, etc.)"
        ],
        [
          "language",
          "17",
          "language models, graph neural networks"
        ],
        [
          "audio / speech",
          "14",
          "speech recognition, audio generation"
        ],
        [
          "language",
          "17",
          "language models, graph neural networks"
        ],
        [
          "audio / speech",
          "14",
          "speech recognition, audio generation"
        ]
      ]
    }
  },
  {
    "h3": "16.1 Why Everyone Loves Using RWKV for Vision Tasks"
  },
  {
    "para": "Images can be sliced into 'patch sequences' (like cutting a comic into vertical strips), videos are naturally time series, and medical CT scans are sequences of hundreds of slices—these 'long sequence' tasks perfectly align with RWKV's strengths: linear complexity + state memory. For example, the paper 'TriAIF-RWKV' uses Dilated-RWKV to analyze CT perfusion time curves, and 'CROWNFuse' uses RWKV states to connect infrared and visible light photos. Appendix C provides a complete list of representative papers in all categories (see the accompanying attachment rwkv_paper_list.xlsx for the full table of 266 papers)."
  },
  {
    "h3": "16.2 How to Read an Application Paper"
  },
  {
    "para": "When you get a paper (like those in Appendix C), even a middle school student can break it down using the 'Four Question Method': (1) What task did they convert into a sequence? (2) Where did they place RWKV (replacing what)? (3) What advantages of RWKV did they use (saving VRAM? Fast? Long memory)? (4) How much did they win in comparison experiments? By reading the abstract and Figure 1 with these four questions, you can grasp the main points of a paper in just ten minutes."
  },
  {
    "quiz": [
      "【Multiple Choice】Which category has the largest proportion among the 266 papers? A. Language B. Image C. Audio",
      "【Short Answer】Why are vision tasks naturally suitable for RWKV? (Hint: patch sequences/slice sequences)",
      "【Hands-on】Use the 'Four Question Method' to analyze any paper from Appendix C: Task? Position? Advantages? How much did it win? Write down your answers."
    ]
  },
  {
    "h2": "Chapter 17 The Future is Here: RWKV-X, ModRWKV and RWKV-8"
  },
  {
    "h3": "17.1 RWKV-X: Pragmatism of Hybrid Architecture"
  },
  {
    "para": "The 2025 paper 'RWKV-X: A Linear Complexity Hybrid Language Model' (arXiv 2504.21463, IJCAI 2025) has a very practical approach: instead of 'replacing' attention, it 'mixes by layer'—some layers of the network use sparse attention with 'cluster caching' (only doing close reading on the most recent and relevant words), while most other layers use RWKV-7 states (linear shorthand). It's like a convoy: a few vehicles are scout cars responsible for mapping key intersections, while the rest travel quickly along the map. The paper's experiments show: 0% attention (pure RWKV-7) and 100% attention (pure Transformer) are not optimal—the validation loss is lowest when about 25% of layers are replaced with sparse attention—the hybrid architecture maintains overall linear complexity while exceeding both pure baseline models in quality."
  },
  {
    "h3": "17.2 ModRWKV: RWKV's Multimodal Debut"
  },
  {
    "para": "'ModRWKV: Transformer Multimodality in Linear Time' (arXiv 2505.14505, EMNLP 2025 Oral) uses RWKV-7 as a multimodal backbone: text, images, audio, and video are uniformly connected with a 'dynamically adaptive heterogeneous modal encoder'. It proves that linear complexity models can replace Transformers in multimodal roles—and with lower inference costs."
  },
  {
    "h3": "17.3 RWKV-8 Heron: The Growing Eighth Generation"
  },
  {
    "para": "RWKV-8 (codename Heron, the heron) is the officially recognized latest version. Its architecture paper has not been formally published yet, but official channels have gradually announced two core new technologies—"
  },
  {
    "bullet": [
      "DeepEmbed (deep embedding): expands the thin hidden state into a deep, wide memory, raising the information a single state can carry - reportedly a 4x capacity boost. It also opens a 'direct channel' for long-range information. The official claim: excellent reasoning performance similar to MoE (mixture of experts) without extra VRAM cost, and it is particularly friendly to hybrid architectures.",
      "ROSA (Reasoning-time State Optimization): Allows the model to continue adjusting its memory state while 'thinking'. You should smile knowingly when you read Chapter 13—this is the continuation and upgrade of the RWKV-7 'erase before writing' spirit."
    ]
  },
  {
    "para": "Experimental code for RWKV-8 has already appeared in community repositories (such as the 4-bit quantized ROSA demo model), and this generation's architecture is moving from blueprint to reality."
  },
  {
    "h3": "17.4 RPU: A Chip Custom-Made for RWKV"
  },
  {
    "para": "More anticipated than the eighth generation is a story of 'moving from software to hardware.' The RWKV Foundation and its partners are advancing the RPU (Recurrent Processing Unit) project—a dedicated chip specifically designed for linear recurrent architectures like RWKV. This isn't just an empty idea; it's well-prepared:"
  },
  {
    "bullet": [
      "The team stated as early as 2023 (in an interview with Bloomberg): 'The decisive battlefield for large AI models is in hardware, that is, chips. Both edge and cloud sides need dedicated chips.'",
      "RWKV's 'ledger-like state' is naturally suitable for chip implementation: constant state size, no KV cache, fixed operation rules per step—these characteristics allow hardware circuits to be highly customized without needing to transport large amounts of data like GPUs do.",
      "Academia has already validated this path: In 2026, papers on FPGA-accelerated RWKV architecture design and high-performance hardware for fully on-chip RWKV operation have been published.",
      "Industry implementation is happening simultaneously: At the 2025 World Artificial Intelligence Conference (WAIC), the edge-side solution developed by RWKV in cooperation Quectel Communications was unveiled, embedding large models into IoT devices."
    ]
  },
  {
    "para": "To make an analogy: GPU is like a 'Swiss Army knife' that can do everything, but pays the price of transportation and waiting for generality. What RPU wants to do is to cast a special knife specifically for RWKV's knife technique—each transistor serves only for 'recursive accounting.' Once successful, phones, agricultural machinery, cars, and robots can all be equipped with a low-power, unlimited-memory 'RWKV brain'."
  },
  {
    "h3": "17.5 Written for You in the Future"
  },
  {
    "para": "From one person's open-source experiment in 2021 to a global ecosystem of 266 papers, and soon to be born dedicated chips—RWKV has proven in five years that a different path from Transformer can also lead to success. Each step of its evolution is simple and clear: making the ledger easier to remember (vector→matrix), making the discount smarter (fixed→data-driven), making the erasure and writing cleaner (superposition→erase before write)."
  },
  {
    "para": "Perhaps a few years from now, the device in your pocket is running an RPU chip, inside which RWKV-9 or RWKV-10 is using the 'accounting magic' you learned in this book to understand the world. When that time comes, you'll discover: so-called future stars are simply those who have persisted in taking simple principles to the extreme—remembering new things, forgetting old things, and learning from mistakes. And this is the most fascinating aspect of science."
  },
  {
    "h3": "17.6 Closing Remarks"
  },
  {
    "para": "Looking back at the book: starting with 'completing the conversation,' you learned about forgetful RNNs and the 'passing notes' Transformer; you unpacked RWKV-4's two sets of accounts, upgraded to matrix card boxes (Eagle/Finch) and the 'erase before writing' Delta rule (RWKV-7); and finally ran real models and explored the ecosystem of 266 papers. You now have all the components needed to understand those original papers—find them on arXiv, dissect them using the four-question method. This is your graduation assignment. The next page of AI might just be written in your future code."
  },
  {
    "quiz": [
      "【Multiple Choice】What does the 25% in RWKV-X refer to? A. The first 25% of tokens use attention B. About 25% of layers use sparse attention C. 25% of parameters",
      "【Short Answer】What problem is RPU trying to solve? Why is RWKV naturally suitable for dedicated chips?",
      "【Hands-on】Check the news page on rwkv.cn for new papers/news from the past month, pick one and write a two-sentence summary—that's what it looks like to stay on the cutting edge."
    ]
  }
];

const APPENDIX = [
  {
    "h2": "Appendix A: Quick Reference Table of Core Papers"
  },
  {
    "table": {
      "header": [
        "Number",
        "Paper",
        "arXiv",
        "Published",
        "One-sentence summary"
      ],
      "rows": [
        [
          "1",
          "RWKV: Reinventing RNNs for the Transformer Era",
          "2305.13048",
          "EMNLP 2023",
          "RWKV-4 architecture: R/W/K/V time-mixing + ledger-style state; parallel training, recurrent inference"
        ],
        [
          "2",
          "Eagle and Finch: RWKV with Matrix-Valued States and Dynamic Recurrence",
          "2404.05892",
          "TMLR 2024",
          "RWKV-5/6: matrix-valued state + data-dependent decay; open models from 0.46B to 7.52B"
        ],
        [
          "3",
          "RWKV-7 “Goose” with Expressive Dynamic State Evolution",
          "2503.14456",
          "ICLR 2025",
          "RWKV-7: generalized Delta rule, in-context learning rate, 3.12T-token dataset"
        ],
        [
          "6",
          "The Evolution of RWKV",
          "2411.02795",
          "survey",
          "A survey of RWKV architecture evolution (with a benchmark compilation)"
        ],
        [
          "7",
          "A Survey of RWKV",
          "2412.14847",
          "survey",
          "Another RWKV survey: language-task performance, ecosystem, and comparisons with Mamba"
        ],
        [
          "6",
          "The Evolution of RWKV",
          "2411.02795",
          "survey",
          "A survey of RWKV architecture evolution (with a benchmark compilation)"
        ],
        [
          "7",
          "A Survey of RWKV",
          "2412.14847",
          "survey",
          "Another RWKV survey: language-task performance, ecosystem, and comparisons with Mamba"
        ]
      ]
    }
  },
  {
    "h2": "Appendix B: Glossary (Sorted by Pinyin)"
  },
  {
    "table": {
      "header": [
        "Term",
        "Translation and explanation in this book"
      ],
      "rows": [
        [
          "Attention",
          "score + weighted look: how much each token matters to every other token"
        ],
        [
          "token",
          "the \"characters\" in the model's eyes: chopped-up text pieces"
        ],
        [
          "hidden state",
          "the model's notebook: a memory that compresses the entire history"
        ],
        [
          "complexity O(T²) / O(T)",
          "sentence length doubles, cost quadruples / only doubles"
        ],
        [
          "KV cache",
          "the growing bundle of notes Transformer carries during chat; gets heavier as the talk goes on"
        ],
        [
          "Receptance",
          "the R gate: how much of this step's output is let through (0 to 1)"
        ],
        [
          "time decay",
          "the W discount: how much old memory keeps each step"
        ],
        [
          "outer product (⊗)",
          "label × content cross multiplication, producing a memory card"
        ],
        [
          "Delta rule",
          "erase-then-write: updates memory instead of piling it up"
        ],
        [
          "in-context learning rate (a)",
          "the strength of RWKV-7's eraser, decided on the spot"
        ],
        [
          "multi-head",
          "several small card boxes keeping separate ledgers (grammar and facts each on their own)"
        ],
        [
          "LoRA",
          "a parameter-saving trick: two thin matrices replace one big one"
        ],
        [
          "quantization",
          "turn high-precision model numbers into low-precision ones to save memory"
        ],
        [
          "parameter count (B)",
          "total learnable knobs of a model; 1B = one billion"
        ],
        [
          "state tuning",
          "lightweight tuning that adjusts only the little notebook (state), not the whole model"
        ],
        [
          "induction heads",
          "internal circuitry that discovers the \"A B ... A implies B\" copy pattern"
        ],
        [
          "state tuning",
          "lightweight tuning that adjusts only the little notebook (state), not the whole model"
        ],
        [
          "induction heads",
          "internal circuitry that discovers the \"A B ... A implies B\" copy pattern"
        ]
      ]
    }
  },
  {
    "h2": "Appendix C: Classification index of 266 ecosystem papers (representatives from each category)"
  },
  {
    "para": "See the accompanying attachment rwkv_paper_list.xlsx for the complete list of 266 papers (including dates, journals, abstracts, and links). Below, 5 representative papers from each category are selected for the 'Four Questions' practice method:"
  },
  {
    "table": {
      "header": [
        "Category",
        "Representative papers (2025~2026)",
        "Key points"
      ],
      "rows": [
        [
          "sequence / RL",
          "BlackGoose time-series modeling (2025)",
          "RWKV-7 replacing Transformer for time series"
        ],
        [
          "general",
          "OmniZip multimodal compression (2026)",
          "RWKV-7 as the compression-prediction backbone"
        ],
        [
          "general",
          "RWKVQuant quantization（2025）",
          "quantization for the whole RWKV family to save memory"
        ],
        [
          "language",
          "NinaXander frozen-model grafting (2026)",
          "RWKV+Transformer hybrid; KV cache cut by 84%"
        ],
        [
          "3D / video",
          "StateLinFormer navigation (2026)",
          "state carried across batches = unbounded-length sequence learning"
        ],
        [
          "audio",
          "EVA speech representative paper (2026)",
          "RWKV encoding audio streams"
        ],
        [
          "medicine",
          "multi-query RWKV pathology slides (2026)",
          "long-sequence analysis of whole-slide images"
        ],
        [
          "3D / video",
          "StateLinFormer navigation (2026)",
          "state carried across batches = learning over infinitely long sequences"
        ],
        [
          "audio",
          "EVA speech representative paper (2026)",
          "RWKV encoding audio streams"
        ],
        [
          "medical",
          "multi-query RWKV pathology slides (2026)",
          "whole-slide image analysis over long sequences"
        ]
      ]
    }
  },
  {
    "h2": "Appendix D: Expected Output References for Four Experiments"
  },
  {
    "para": "Experiment 1 (manual): the final wkv₄ ≈ 4.581; with discount 0.9 the output is about 3.94 (more old memory survives, moving further from 8); with all v = 1 the output stays exactly 1. Experiment 2 (code): outputs 2.000 / 3.000 / 5.069 (the true discount e^(-0.5) ≈ 0.607 is slightly larger than the hand-computed 0.5, hence slightly below 5.2); with w=0.1 step 3 gives about 4.75 (sticky memory), with w=3.0 about 5.90 (goldfish memory). Experiment 3: with w=0.5 the query with token 2's label reads 10; with w=0.9 it rises to 18 (old cards survive more completely). Experiment 4: after the third write, the Delta box answers the apple query with a clean green (new channel 10), while the additive box still mixes in the old red. If your numbers drift a little, first check your transcription (especially exponents and parentheses), then check whether a direction got flipped."
  }
];

module.exports = { PART3, PART4, PART5, APPENDIX };
