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
    "h3": "24.5 Prompt-level pitfalls: one space worth 63 questions (community benchmark, Oct 2026)"
  },
  {
    "para": "In October 2026, No.22 of the community project RWKV-Agent published a hardcore evaluation: a 568-question Agent exam (make the model read files, search the web, compute, write files), 17 controlled experiments on the RWKV-7 G1l 7B preview base model, 40 runs and 22,720 question-attempts in total, with per-question paired statistical tests. This benchmark turned \"how to write prompts\" from folklore into science. The four classic pitfalls below deserve to be printed on page 25."
  },
  {
    "table": {
      "header": [
        "Pitfall",
        "Measured consequence",
        "Underlying reason"
      ],
      "rows": [
        [
          "A space after the colon in \"Assistant:\"",
          "score drops 36% (175 to 112 questions); 97.8% of English questions get answered in Chinese",
          "the vocabulary has no \"colon+space\" token. English words carry a leading space (\" Hello\"); the extra space forces the model to generate a \"no-leading-space\" version it has barely seen in training"
        ],
        [
          "treating \"Let me check first\" as the final answer",
          "about 30% of questions lost",
          "the G1 family habitually says one sentence before emitting the tool call; the parser must tolerate \"commentary + call\""
        ],
        [
          "merging the tool result and the reminder into one message",
          "14.5 fewer correct questions (p=0.018)",
          "the measured optimum is \"two consecutive User messages, reminder last\" - it breaks the spec yet works best; the RNN intuition of \"closer means fresher\" fails here"
        ],
        [
          "copying the official demo sampling of T=1",
          "clearly worse in Agent scenarios",
          "an Agent must execute stably: T=0.3, top_p=0.5, presence 0.5, frequency 0.1, decay 0.996 is the measured recipe"
        ]
      ]
    }
  },
  {
    "para": "Three more lessons worth remembering: (1) the model will copy its own previous tool call - after removing the \"no tool needed\" exit tool, repeated calls jumped 30%; this kind of fault cannot be fixed by prompts, only by training data; (2) the stop condition must cover both EOS and the \"User\" marker - base models often never emit EOS and will keep writing the next turn themselves; (3) do not judge a prompt change by total score alone - when two prompts have close totals, they may be getting two entirely different sets of questions right; look at the behavior distribution. The full report is listed in Appendix A."
  },
  {
    "h3": "24.6 Post-training: teaching the model to actually use tools"
  },
  {
    "para": "Finding 6 of Section 24.5 left a loose end: the model copies its own previous tool call, and prompts cannot cure it. Why? Because a base model is fundamentally a \"sentence-continuation champion\" - in the text it has seen, if the previous turn is a tool call, the next turn looks like another tool call with high probability, so inertia carries it into a copy. The cure is post-training - extra lessons for the model. The G1 family's iteration history is a post-training textbook in itself: G1i (2026-08) to G1k (2026-09) to the G1l preview - each generation was \"find the fault, build targeted data, retrain.\""
  },
  {
    "para": "The core weapon of post-training is SFT (supervised fine-tuning; Chapter 15 covered LoRA as its budget version). Ordinary SFT teaches chatting; Agent SFT teaches working - and the unit of training data is not a sentence but a complete trajectory."
  },
  {
    "table": {
      "header": [
        "The six beats of a trajectory",
        "Example",
        "Skill the model learns"
      ],
      "rows": [
        [
          "1. receive the task",
          "User: What is hold_queue_depth for dispatch-router in staging?",
          "understanding the task"
        ],
        [
          "2. decide to call",
          "Assistant: Let me check the config file. <tool>{\"name\":\"read_file\",\"arguments\":{\"path\":\"configs/dispatch-router.yaml\"}}</tool>",
          "judging \"should I use a tool, and which one\""
        ],
        [
          "3. receive the result",
          "User (tool result): hold_queue_depth: 128",
          "taking the evidence in"
        ],
        [
          "4. wrap up and answer",
          "Assistant: hold_queue_depth is 128.",
          "\"once you have the result, answer; do not call again\""
        ],
        [
          "5. answer directly",
          "User: Hi!  Assistant: Hi, how can I help?",
          "\"do not reach for tools when none is needed\""
        ],
        [
          "6. bad samples (counter-examples)",
          "repeating the same tool call, broken JSON brackets, calling again after getting the result",
          "learning \"what not to do\" from the negative side"
        ]
      ]
    }
  },
  {
    "para": "Beats 1-3 teach \"calling\"; beat 4 specifically treats \"cannot stop\" (the copy-inertia); beat 5 treats \"itchy hands\"; beat 6 is the counter-example - research has repeatedly shown that good samples alone train slowly, while good samples plus labeled counter-examples (or preference-style contrasts) converge much faster. The jump from 40 to 49/60 in function calling measured in 24.5 came exactly from adding this kind of targeted data in the G1k era."
  },
  {
    "para": "Where does the data come from? Human annotation of one trajectory takes minutes; annotating 50,000 is a fortune. The community playbook is threefold: (1) synthesis - let a strong model (a teacher) generate tasks and trajectories from templates, with rule-based scripts auto-grading and filtering (can the JSON be parsed, does the tool name actually exist, does the answer hit); (2) backflow - record real online failure cases (the full context at the moment of a copy-loop, say) and turn them into counter-examples or corrected samples - the most precious data of all; (3) distillation - start from open Agent trajectory datasets (ToolBench, AgentInstruct and the like) and rewrite them in your own format templates. Note the twist on Section 24.5's lesson: the format inside the training data must be exactly the format used at inference (\"Assistant:\" without the space, two User messages, the envelope wrapping tool calls) - a mismatch between training format and serving format means all that training was wasted effort."
  },
  {
    "para": "Above SFT there is one more \"elective\": preference optimization (DPO/RLHF, a close cousin of Chapter 15's RLHF). Build two trajectories for the same task: one crisp (one tool call, then the wrap-up answer), one sloppy (repeated calls, or calling when a direct answer would do), then tell the model \"the first is better than the second.\" The model does not relearn knowledge; it only adjusts its choice tendencies - a small parameter change, ideal as the final polish after SFT. This layer is still early in the RWKV ecosystem, but it is on the roadmap of the official G1 release."
  },
  {
    "h3": "24.7 Fit tuning: making the application and the model mesh"
  },
  {
    "para": "Post-training changes the model - but the application side is not idle either. Real Agent experts treat \"model capability\" and \"application engineering\" as two adjustable gears that mesh with each other: when the model is not well-behaved, the application covers for it; where the application cannot cover, training data for the model is built in return. We call this craft fit tuning, and its goal is a perfect match between the model's output structure and the structure the application can consume."
  },
  {
    "para": "Step one: turn \"feels nice to use\" into a score. Build a small exam (50-100 questions is enough to start), covering your product's real scenarios (weather, file reading, arithmetic...), and write an auto-grader. The grader watches three numbers: correctness (is the answer right), format validity (can the parser eat the output), and call efficiency (how many tool calls per task on average, any repeats). With these three numbers, \"fit\" turns from an adjective into a dashboard."
  },
  {
    "table": {
      "header": [
        "The five-step loop",
        "What to do",
        "Common mistake"
      ],
      "rows": [
        [
          "1. freeze the exam",
          "lock the question set and grader once written; do not edit mid-run",
          "casually adding questions each run, invalidating all historical scores"
        ],
        [
          "2. single-variable contrast",
          "change exactly one thing (prompt / format / sampling / model version); run control and experiment 2-4 times each",
          "swapping three configs at once - the score rises but you do not know whom to thank"
        ],
        [
          "3. watch behavior distributions",
          "two configs with similar correctness: compare call rate / format error rate / repeat rate - the correctly answered questions may be two entirely different batches",
          "looking only at totals, picking a config that is \"good at chitchat, bad at work\" (the lesson of finding 5 in 24.5)"
        ],
        [
          "4. fix from both sides",
          "app side: parser tolerance, format envelopes, retry policy; model side: failed cases flow back as training data",
          "dumping every problem onto prompts, tuning ever deeper into mysticism"
        ],
        [
          "5. regression testing",
          "run the full exam on every change; roll back on any regression (like the checkpoint rollback of Chapter 21)",
          "fixing one bug and quietly breaking three"
        ]
      ]
    }
  },
  {
    "para": "Output-structure matching rests on three lines of defense - miss any one and it leaks: the prompt layer (a format specification plus the \"no tool needed\" exit tool - removing it raised repeated calls 30% in 24.5), the decoding layer (stop conditions watching both EOS and the \"User\" marker; low-temperature sampling; prefilling a legal prefix), and the parser layer (tolerant regex that strips commentary like \"Let me check first,\" repair of broken JSON, and one format-reminding retry on failure). The G1l benchmark's \"the parser must tolerate commentary plus call\" is a classic of the parser layer: one degree of application lenience buys one degree of model performance."
  },
  {
    "table": {
      "header": [
        "Common symptom",
        "Try the app side first (cheap)",
        "Then the model side (pricey but curative)"
      ],
      "rows": [
        [
          "repeated calls to the same tool",
          "a User reminder after the result; a hard cap on repeats (cut off at the 3rd)",
          "trajectory counter-examples into the training set (cures copy-inertia)"
        ],
        [
          "broken JSON brackets",
          "parser-layer repair: append the closing brackets, re-format; one retry on failure",
          "SFT data for format stability"
        ],
        [
          "English questions answered in Chinese",
          "check for the extra space after \"Assistant:\" (pitfall 1 of 24.5)",
          "more mixed-language trajectory data"
        ],
        [
          "never calls tools",
          "state explicitly in the system prompt \"which questions must be verified\"",
          "more positive beat-2 samples"
        ],
        [
          "answers never come after results",
          "the reminder as the last User message (finding 3 of 24.5)",
          "more beat-4 wrap-up samples"
        ]
      ]
    }
  },
  {
    "para": "One-sentence summary: the benchmark is the compass; the app side is light cavalry (fast, cheap, redeployable at will); the model side is heavy infantry (slow, expensive, decisive). Let the cavalry scout ahead; where the cavalry cannot pass, report the coordinates to the infantry - failed cases flow back as training data - and the next model version is naturally stronger. RWKV-Agent's three jumps from G1i to G1l walked exactly this road; your project, big or small, runs the same loop."
  },
  {
    "quiz": [
      "【Multiple Choice】What is the most common cause of garbled output? A. Graphics card is too poor  B. Tokenizer does not match the model  C. Temperature set too high",
      "【Short Answer】Why does the paper specifically include a \"numerically stable version\" of the formula? Explain using fp16 overflow.",
      "【Short Answer】With one extra space after \"Assistant:\", why do English questions get answered in Chinese? Explain using the \"leading space\" knowledge from Chapter 19.",
      "【Hands-on】Copy the four-step pitfall elimination method from 24.4 on a sticky note and post it next to your computer - run through it in order the next time a bug appears.",
      "【Multiple Choice】The most on-target cure for the model copying its previous tool call is? A. Add \"do not repeat\" to the prompt  B. Trajectory counter-examples into the training set  C. Crank the temperature to 1.0",
      "【Short Answer】Why must the format inside Agent training data be exactly the format used at inference? Give an example using the space pitfall of 24.5.",
      "【Hands-on】Design a 10-question mini exam for a small tool around you (weather lookup / notepad): write the questions, the grading rules, and the three dashboard metrics."
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
          "Browser (any computer)",
          "RWKV WebGPU Demo / WebLLM / HTMLNLM",
          "no download, run RWKV-7 locally in a web page: chat, solitaire, composing; go further with HTMLNLM and train from scratch (25.4)"
        ],
        [
          "Windows / Mac / Linux desktop",
          "RWKV Runner (by community member josStorer, only 8 MB)",
          "works out of the box: chat, continuation, composing, MIDI input; one-click LoRA fine-tuning"
        ],
        [
          "Phone / tablet",
          "RWKV APP (Flutter cross-platform)",
          "fully local and offline - a large model in your pocket"
        ],
        [
          "Low-end computers (no discrete GPU)",
          "rwkv.cpp (C++ quantized inference)",
          "quantized models run smoothly even on CPU"
        ],
        [
          "Home gaming laptops / workstations",
          "ai00_server (local inference service)",
          "runs straight on the GPU, fast; build your own local chat service"
        ],
        [
          "Edge modules (farm machinery, IoT)",
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
      "Fourth stop (a weekend): Follow Chapters 20-21 to train your own mini model, then load it with your own Runner—complete end-to-end loop.",
      "Fifth stop (if you refuse to be impressed): open HTMLNLM (25.4) - click a few buttons in the browser and watch an RWKV-v7 learn to talk from zero, without even installing Python."
    ]
  },
  {
    "h3": "25.4 HTMLNLM: one HTML file = one training factory (Oct 2026)"
  },
  {
    "para": "In October 2026, the ConsciousNode team (Kham, Kehai, and Ed) released a project of maximum defiance: HTMLNLM. It packs complete RWKV-v7 training plus inference into a single HTML file - no server, no Python, no CUDA, no install; open it in a browser and you can train a model from scratch. Their slogan is the \"xinu principle: the browser is bare metal.\" The whole model-building pipeline this book teaches across Chapters 18-23 (data to tokenizer to training to inference) - one file walks it all."
  },
  {
    "table": {
      "header": [
        "Component",
        "What it does",
        "In middle-school words"
      ],
      "rows": [
        [
          "RWKV-v7 backbone",
          "linear-time recurrent architecture, O(1) inference memory",
          "the very ledger you met in Chapters 12-14"
        ],
        [
          "BitNet b1.58",
          "ternary weights {-1, 0, +1}, with a T-MAC lookup-table microkernel replacing matrix multiplication",
          "swaps multiplication for \"looking it up in a dictionary\": weights are only -1/0/+1, and a matrix multiply becomes consulting a small table"
        ],
        [
          "OOMB backprop",
          "chunk-recurrent backprop with activation recomputation, constant memory at any sequence length",
          "do not keep every page of scratch paper - recompute whichever page you need; the memory never grows no matter how long the sequence"
        ],
        [
          "MuonOptimizer",
          "five Newton-Schulz orthogonalization passes keeping weight matrices \"healthy\"",
          "a set of anti-drift gymnastics for gradient updates (a distant cousin of Chapter 21's warmup)"
        ],
        [
          "GRPO alignment",
          "critic-free reinforcement learning alignment, z-score normalized advantages plus KL constraint",
          "a lightweight cousin of Chapter 15's RLHF: no need to hire a second model as judge"
        ],
        [
          "BPE tokenizer",
          "compiled into a WebWorker so the UI never freezes",
          "the Chapter 19 BPE running in a \"backstage worker\" - you can keep clicking the page while it trains"
        ]
      ]
    }
  },
  {
    "para": "Using it is as easy as ordering food: open HTMLNLM.html, set the model size in ARCHITECTURE (recommended start: vocab 2048, hidden 256, 4 layers, chunk 128), drop in a .txt corpus, click COMPILE BPE, ALLOCATE VM, switch to PRE-TRAIN, START LOOP - then watch it learn. Better still, it does not only eat self-trained models: the official RWKV-7 Goose (x070) .pth weights, downloaded straight from BlinkDL's releases, can be dragged in directly (no PyTorch, no conversion); .safetensors and 13 llama.cpp quantization formats (Q4_K_M, Q8_0, and friends) are all supported. Measured numbers: the 0.1B (about 190M parameters) occupies about 760 MB in a browser tab and runs at about 360 ms/token on a single cloud CPU thread; the 0.4B at Q4_K_M takes about 752 MB at 767 ms/token - less than the 0.1B's original .pth. The project even guards its food: a damaged (all-zero) weight file is refused at load with a message to re-download."
  },
  {
    "para": "The team's product line is itself a map of the RWKV frontier: on top of HTMLNLM (the stable text runtime) grew Evangelion (omnimodal: vision/audio/spatial plus SheafMemory), OmniVocal (browser TTS), RAG-Time (browser RAG), EvaROSA (neuro-symbolic \"inner monologue\"), Brymar College (a teaching edition that LoRA-fine-tunes a real RWKV-7), and the Pip Suite (a multi-model conversation workshop). The one most worth remembering is Simulacra - it calls itself \"the RWKV-v8 clean break\": ROSA entirely replaces WKV as the sequence mechanism. Section 17.3 said RWKV-8 was still on the drawing board? Someone in the community already sprinted the blueprint into something runnable. For this book's readers, HTMLNLM is the cheapest full-pipeline laboratory: to watch the loss curve fall with your own eyes, or to see what Chapter 21 looks like inside a browser, go to consciousnode.github.io/HTMLNLM and click."
  },
  {
    "quiz": [
      "【Multiple Choice】Which type of device best demonstrates RWKV's edge advantages over Transformers? A. Cloud with thousands of GPUs  B. Memory-constrained mobile/edge devices  C. Quantum computer",
      "【Short Answer】Explain using 'constant memory + no KV cache': Why don't browser tabs running RWKV become increasingly laggy during conversations?",
      "【Hands-on】Complete the first and second stops of section 25.3, take a screenshot for each, and write three sentences of experience notes (speed/quality/surprises or shortcomings).",
      "【Short Answer】HTMLNLM replaces matrix multiplication with \"ternary weights plus a lookup table.\" Using the Chapter 22 quantization mindset, explain: why does storing weights as only {-1, 0, +1} save so much memory and compute?",
      "【Hands-on】Open HTMLNLM, feed it the Appendix E mini-corpus (or 100 lines of your own Chinese), run COMPILE BPE then PRE-TRAIN, screenshot the loss curve, and mark the loss at step 100 and step 1000."
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
        ],
        [
          "Agent ecosystem",
          "community projects like RWKV-Agent teach the G1 series to use tools: read files, search the web, write files",
          "the Oct 2026 568-question benchmark turned prompt format and sampling into a science (Section 24.5)"
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
