// AUTO-TRANSLATED ENGLISH EDITION
const PART6 = [
  {
    "h2": "Chapter 18 Training Data: How to Cook the \"Food\" for Models"
  },
  {
    "h3": "18.1 What Did Each Generation of Models Eat?"
  },
  {
    "para": "Recall Figure 6: RWKV-4 ate Pile (0.33 trillion words), RWKV-5/6 ate World v2 (1.12 trillion words), and RWKV-7 ate World v3 (3.1 trillion words). Pile is a collection of 22 data sources pieced together by the English community (papers, code, web pages, books); the World series is a multilingual corpus created by the RWKV team, covering over 100 languages. After being scraped from web pages, it undergoes three processes: cleaning (removing garbled text, ads), deduplication (keeping only one copy of identical paragraphs), and proportioning (balancing code, math, and multiple languages to prevent bias)."
  },
  {
    "para": "What this teaches you: Data determines the ceiling of a model's capability, while architecture only affects how efficiently you approach that ceiling. Garbage in, garbage out—this industry saying is the first lesson for all training engineers."
  },
  {
    "h3": "18.2 binidx: RWKV's \"Compressed Biscuit\" Format"
  },
  {
    "para": "The RWKV-LM training framework doesn't eat text files; it only consumes binidx format—first passing the text through a tokenizer to convert each token into a number, then packing all numbers into a binary file (.bin), accompanied by a small index file (.idx) that records the length. Benefits: faster reading (no need to tokenize each time) and space-saving (each token occupies only 2 bytes, with uint16 representing up to 65,536 token types). Production process:"
  },
  {
    "bullet": [
      "Step 1: Prepare a jsonl file (each line is a JSON: {\"text\": \"a piece of text...\"})—this is the most common exchange format for training data.",
      "Step 2: Use a tokenizer to split the text into token ID sequences (in Chapter 19, you'll make one yourself).",
      "Step 3: Write the ID sequence into .bin (each ID stored as 2 bytes), and write the sample count and length into .idx.",
      "Step 4: The training framework uses dataidx to read the library, randomly batches samples, and starts training."
    ]
  },
  {
    "note": "Naming reference: RWKV's official vocabulary file is called rwkv_vocab_v20230424 (65,536 tokens, exactly filling uint16). You can start with the official vocabulary to get things working, then switch to your own vocabulary from Chapter 19."
  },
  {
    "h3": "18.3 Proportioning Reference for Custom Datasets"
  },
  {
    "table": {
      "header": [
        "Component",
        "Recommended Proportion",
        "Example Sources"
      ],
      "rows": [
        [
          "books and long texts",
          "10%~20%",
          "public-domain books, textbooks (to grow long memory)"
        ],
        [
          "dialogue",
          "10%~15%",
          "Q&A pairs and chat logs (to practice dialogue)"
        ],
        [
          "math and symbols",
          "5%~10%",
          "math problems, formulas (to practice reasoning)"
        ],
        [
          "dialogue",
          "10%~15%",
          "Q&A pairs and chat logs (to practice dialogue)"
        ],
        [
          "math and symbols",
          "5%~10%",
          "math problems, formulas (to practice reasoning)"
        ]
      ]
    }
  },
  {
    "para": "Two iron rules: (1) Copyright must be clean—only use materials with clear, commercial origins; (2) Deduplication must be thorough—if the same article appears 100 times, the model won't get smarter, just more verbose."
  },
  {
    "quiz": [
      "【Multiple Choice】How many bytes does a token ID occupy in binidx format? A. 1 byte  B. 2 bytes  C. 4 bytes",
      "【Short Answer】Why is it said that \"data determines the ceiling, while architecture determines efficiency of approach\"? In one sentence, explain your understanding of \"garbage in, garbage out.\"",
      "【Hands-on】Collect 10 Chinese text paragraphs from different sources (news/encyclopedia/novel/code comments), observe their differences in punctuation, length, and format, and write three \"cleaning rules.\""
    ]
  },
  {
    "h2": "Chapter 19 Writing a BPE Tokenizer from Scratch: Teaching Models to Recognize Words"
  },
  {
    "h3": "19.1 Why Do We Need Tokenizers?"
  },
  {
    "para": "Models don't read 'characters', they only read 'numbers'. A tokenizer is the translator that breaks text streams into tokens and assigns numbers to these tokens. If you split too finely (character by character), the sequence becomes longer and computation slows down. If you split too coarsely (entire sentences), the vocabulary explodes and new words can't be represented. BPE (Byte Pair Encoding) is the master of compromise: starting with individual characters, it merges the most frequently adjacent pairs that appear 'hand-in-hand' in the corpus into new tokens, continuing until you're satisfied."
  },
  {
    "h3": "19.2 BPE Three-Step Algorithm (With Manual Calculation)"
  },
  {
    "para": "Training a BPE vocabulary takes just three loop steps: count → pick the champion → merge. Let us run the full process on the mini-corpus 低低 低低 低 语 语 言 (imagine these characters come from real text)."
  },
  {
    "example": "Initial sequence (split into single characters): [低, 低, 低, 低, 低, 语, 语, 言]\nStep 1 [count adjacent pairs]: (低,低) appears 4 times, (语,语) 1 time, (语,言) 1 time, (低,语) 1 time.\nStep 2 [pick the champion]: (低,低) with 4 wins.\nStep 3 [merge]: the sequence becomes [低低, 低低, 低, 语, 语, 言]. The vocabulary gains the token 低低.\nRepeat the three steps on the new sequence until no pair repeats, or the vocabulary reaches the preset size. The merge rules are learned strictly from frequency - no human tells the model which pairs matter."
  },
  {
    "para": "Record the merge rules (for example: 低+低 → 低低), and the vocabulary gains a new token. When encoding new text later, apply the same rules in the same order: the string 低低低 becomes [低低, 低] - two tokens instead of three, one third shorter. Decoding is just looking up the table to restore the original text. You can implement this whole process by hand - here is a complete working implementation:"
  },
  {
    "h3": "19.3 Complete Code (60 Lines, Can Train and Use)"
  },
  {
    "code": "import re\nfrom collections import Counter\n\nclass MiniBPE:\n    def __init__(self, vocab_size=50):\n        self.merges = []          # 学到的合并规则（有序！）\n        self.vocab = {}           # 词元 -> 编号\n\n    def _pairs(self, words_freq):\n        cnt = Counter()\n        for word, freq in words_freq.items():\n            syms = word.split()\n            for i in range(len(syms) - 1):\n                cnt[(syms[i], syms[i+1])] += freq\n        return cnt\n\n    def train(self, corpus, n_merges):\n        # 语料按空白切成“词”，词内按单字拆开（字间加空格）\n        words_freq = Counter(' '.join(w) for w in corpus.split())\n        for _ in range(n_merges):\n            pairs = self._pairs(words_freq)\n            if not pairs:\n                break\n            best = max(pairs, key=pairs.get)\n            if pairs[best] < 2:      # 收益太小，提前收工\n                break\n            self.merges.append(best)\n            # 应用合并：把 'a b' 换成 'ab'\n            new_freq = {}\n            for word, freq in words_freq.items():\n                new_freq[word.replace(' '.join(best), ''.join(best))] = freq\n            words_freq = new_freq\n        # 编号：先给所有出现的字符，再给合并词元\n        tokens = set()\n        for word in words_freq:\n            tokens.update(word.split())\n        for m in self.merges:\n            tokens.add(''.join(m))\n        self.vocab = {t: i for i, t in enumerate(sorted(tokens))}\n\n    def encode(self, text):\n        syms = list(text.replace(' ', '\\n'))  # 先占位，避免空格干扰\n        seq = ' '.join(syms)\n        for a, b in self.merges:               # 按学习顺序应用规则\n            seq = seq.replace(f'{a} {b}', f'{a}{b}')\n        seq = seq.replace('\\n', ' ')\n        return [self.vocab.get(t, 0) for t in seq.split()]\n\nbpe = MiniBPE()\nbpe.train('低低 低低 低 语 语 言 language language 模型', 10)\nprint('词表:', bpe.vocab)\nprint('编码“低低language”:', bpe.encode('低低language'))"
  },
  {
    "para": "After running, you will see the vocabulary holding both single characters (低, 语, 言, 模, 型...) and merged tokens (低低, 语言...). Encode a fresh sentence, decode it back, and check character by character that nothing was lost - this \"lossless round-trip\" is the acceptance test for any tokenizer."
  },
  {
    "note": "Compared to the feast you might eat: the official 65,536 vocabulary is trained on trillion-level corpora with thousands of merge rounds—the principle is identical to this 60-line implementation. Hugging Face's tokenizers library accelerates the same process by a hundred times using Rust—after understanding the principle, you can directly use industrial libraries."
  },
  {
    "h3": "19.4 Three Metrics for Tokenizer Performance"
  },
  {
    "bullet": [
      "Compression ratio: How many characters does an average token represent? The higher this ratio, the shorter the sequence and the faster the inference (official Chinese vocabulary is about 1.5~2.5 characters/token).",
      "Coverage: The proportion of 'word not found' in new text (OOV). BPE is inherently OOV-free—at worst, it degrades to single bytes.",
      "Training cost: Number of merge rounds × corpus size. Start with 100MB of corpus for practice, don't try to swallow 1TB right away."
    ]
  },
  {
    "quiz": [
      "【Multiple Choice】What does BPE merge in each round? A. The longest sentence in the corpus B. The most frequently occurring adjacent pair C. The least frequently occurring single character",
      "【Short Answer】Why can BPE never have 'word not found' (OOV)? Hint: What unit does it degrade to in the worst case?",
      "【Hands-on】Run the code from 19.3, replace the corpus with your own diary excerpts (at least 200 characters), set the merge count to 30, print the vocabulary, and use encode to encode a sentence. Check the pattern of 'stop when merge benefit decreases'."
    ]
  },
  {
    "h2": "Chapter 20 Building a Training Program: RWKV-LM Framework Breakdown"
  },
  {
    "h3": "20.1 The Five-Beat Rhythm of Training Loops"
  },
  {
    "para": "Any large model training program (including RWKV-LM, including your future self-developed framework) follows the same five-beat loop:"
  },
  {
    "formula": "取批次 → 前向算损失 → 反向算梯度 → 优化器更新 → （定期）存检查点、看验证损失"
  },
  {
    "para": "Translated into code skeleton (combined with concepts you've already learned):"
  },
  {
    "code": "for step in range(1, total_steps+1):\n    batch = next(data_iter)              # ① 取一批词元编号 (B, T)\n    logits = model(batch[:, :-1])        # ② 前向：预测下一个词元\n    loss = cross_entropy(logits, batch[:, 1:])   #    和真答案比对\n    loss.backward()                      # ③ 反向：算每个参数该调多少\n    clip_grad_norm_(model.parameters(), 1.0)     #    gradient clipping（护栏）\n    optimizer.step()                     # ④ 更新参数\n    if step % 1000 == 0:\n        save_ckpt(model); print(val_loss(model))  # ⑤ 存档+体检"
  },
  {
    "h3": "20.2 RWKV-LM's Family Tree and Division of Labor"
  },
  {
    "bullet": [
      "RWKV-LM repository (maintained by BlinkDL): Main training framework. dataidx.py reads binidx, train.py runs the five-beat loop, model.py contains RWKV's various generation architectures, and configuration yaml defines hyperparameters.",
      "Configuration trio: ctx_len (context length, start with 1024), vocab_size (vocabulary size, must match your tokenizer), n_layer/n_embd (number of layers and width per layer).",
      "Multi-GPU acceleration: deepspeed zero (distributes parameters, gradients, and optimizer states across multiple GPUs); for single GPU, torch.compile is sufficient."
    ]
  },
  {
    "h3": "20.3 Notes: What to Do When Training Crashes"
  },
  {
    "table": {
      "header": [
        "Symptom",
        "Most Likely Cause",
        "Emergency Fix"
      ],
      "rows": [
        [
          "validation loss rises",
          "overfitting (memorized the training set)",
          "add data / early-stop (roll back to the checkpoint before the rise)"
        ],
        [
          "loss stays flat for a long time",
          "learning rate too small, or data too dirty",
          "multiply lr by 3 and retry; spot-check 100 samples by eye"
        ],
        [
          "VRAM explodes",
          "batch too large",
          "reduce batch or use gradient accumulation (small batches, accumulate, then step)"
        ],
        [
          "validation loss rises",
          "overfitting (the model memorized the training set)",
          "add data / early-stop (roll back to the checkpoint before the rise)"
        ]
      ]
    }
  },
  {
    "note": "RWKV-specific safeguards: The paper uses AdamW with ε=1e-18 (ε is a small value to prevent division by zero; regular models use 1e-8; RWKV-7 gradients are extremely small, requiring a smaller ε to \"feel\" them) and special initialization (making time mixing w start near 0, with discount factor near 1—remember everything first, then learn to forget)."
  },
  {
    "quiz": [
      "【Multiple Choice】In the five-step cycle, when does \"gradient clipping\" occur? A. Forward pass B. Backward pass C. Save checkpoint",
      "【Short Answer】Why does RWKV-7 need to set AdamW's ε to 1e-18 instead of the common 1e-8?",
      "【Hands-on】Transform the five-step cycle from 20.1 into a \"gradient accumulation version\": accumulate 4 small batches before updating once (hint: divide loss by 4, only step() every 4 steps)."
    ]
  },
  {
    "h2": "Chapter 21: How to Set Training Parameters: A Computable Checklist"
  },
  {
    "h3": "21.1 Data Volume: The 20x Rule"
  },
  {
    "para": "\"How much data should I feed my model?\"—The Chinchilla study provides an empirical ratio: optimal data volume ≈ parameters × 20. Verification:"
  },
  {
    "example": "0.1B parameters (100 million knobs) → optimal about 0.1 × 20 = 2B (2 billion) tokens.\n1.4B parameters → 1.4 × 20 = 28B tokens.\nCompare with official: RWKV-7's 2.9B model uses 3.1T tokens—about 53 times the ratio, which is \"overtraining\" (modern practice: inference cost accounts for the majority of total cost, training once more for smarter inference each time is cost-effective). For your small model, start with 20x; if you want to replicate the \"overtraining\" strategy and have enough data, you can train to 5~10x."
  },
  {
    "h3": "21.2 Learning Rate: Warmup, Peak, and Decay"
  },
  {
    "para": "Learning rate (lr) is \"the magnitude of parameter adjustment per step.\" Too large → oscillation without convergence; too small → training until the end of time. The three-stage approach is standard:"
  },
  {
    "bullet": [
      "Warmup: Linearly increase from 0 to peak over first N steps—like a new driver starting slowly. Formula: lr(t) = peak × t/N. Verification (peak 6e-4, N=2000): Step 500 = 6e-4 × 0.25 = 1.5e-4; Step 2000 = 6e-4.",
      "Peak reference: Small models (0.1B) 3e-4 ~ 6e-4; Large models (1B+) 1e-4 ~ 3e-4. Smaller is more stable, larger is faster.",
      "Decay: After peak, gradually return to 1/10 using cosine or exponential—reduce step size as you approach the finish line to avoid \"kicking the ball away at the last moment.\""
    ]
  },
  {
    "h3": "21.3 Batch Size and Effective Batch"
  },
  {
    "para": "Batch size × sequence length = how many tokens per step (token batch). Experience range: Small models 0.5M~2M tokens per step. When GPU memory is insufficient, use gradient accumulation to achieve effective batch: 4 small batches of 0.125M = 1 effective batch of 0.5M, with similar results but 3/4 less memory usage."
  },
  {
    "h3": "21.4 Quick Reference Table"
  },
  {
    "table": {
      "header": [
        "Parameter",
        "Starting value for 0.1B",
        "Calculation basis"
      ],
      "rows": [
        [
          "gradient clipping",
          "1.0",
          "general guardrails"
        ],
        [
          "batch size (tokens/step)",
          "0.5M",
          "the low end of the empirical range; use gradient accumulation if VRAM runs out"
        ],
        [
          "validation frequency",
          "every 500-1000 steps",
          "catch overfitting in time"
        ],
        [
          "gradient clipping",
          "1.0",
          "a general guardrail"
        ],
        [
          "batch size (tokens/step)",
          "0.5M",
          "lower end of the empirical range; use gradient accumulation if VRAM runs out"
        ],
        [
          "validation frequency",
          "every 500~1000 steps",
          "catch overfitting early"
        ]
      ]
    }
  },
  {
    "quiz": [
      "【Multiple Choice】According to the 20x rule, what is the optimal data amount for a 0.4B parameter model? A. 8B tokens B. 2B tokens C. 80B tokens",
      "【Short Answer】Why does warmup need to \"linearly climb from 0\" instead of using the peak learning rate from the start? Explain using a driving analogy.",
      "【Hands-on】Write one line of Python for your planned 0.1B model: Given a peak of 6e-4, warmup of 2000 steps, and cosine annealing to 1/10, print the learning rate at steps 100, 1000, 3000, and 10000 (hint: lr = peak × min(t/2000, 1) × (0.1 + 0.9 × 0.5 × (1 + cos(π × min(t, T)/T))))."
    ]
  },
  {
    "h2": "Chapter 22 Evaluating Model Quality: Giving Your Model a Health Check"
  },
  {
    "h3": "22.1 Understanding Training Through Three Curves"
  },
  {
    "para": "During training, monitor three graphs (with time as the x-axis for loss curves): training loss should steadily decrease; validation loss should first decrease then plateau (if it rises = overfitting warning); compare the learning rate curve to confirm the \"warmup-annealing\" rhythm is normal. Healthy pattern: training loss looks like a slide, validation loss looks like a slide connecting to a gentle slope at the end."
  },
  {
    "h3": "22.2 Perplexity: How \"Conflicted\" Is Your Model"
  },
  {
    "para": "Perplexity (PPL) is the universal thermometer for evaluating language models: PPL = e^(average cross-entropy). Its intuitive meaning is \"the average number of candidates the model hesitates among when guessing each word.\" Manual calculation:"
  },
  {
    "example": "The model calculates cross-entropy for 5 consecutive positions: 1.8, 2.1, 1.5, 2.4, 1.6.\nAverage cross-entropy = (1.8+2.1+1.5+2.4+1.6) ÷ 5 = 1.88.\nPPL = e^1.88 ≈ 6.6—the model is like choosing from about 7 words at each step (the closer to 1, the more certain).\nCode verification: import math; math.exp(1.88) = 6.55."
  },
  {
    "note": "PPL can only be compared under the same tokenizer (different tokenization methods have different denominators). For cross-model comparisons, use the standard exams in the next chapter."
  },
  {
    "h3": "22.3 Performance Boundaries: The \"Floor\" and \"Ceiling\" of Model Capabilities"
  },
  {
    "bullet": [
      "Memory boundary: RWKV has limited state capacity (64×64 card boxes per head). Paper measurement: RWKV-7's 8192-dimensional state can store about 4480 bits of information (information density 0.547 bits/dimension) - content exceeding capacity will overwrite each other.",
      "Context boundary: During training ctx_len=1024, loss increases when inference exceeds this, called \"extrapolation failure.\" Solution: Use long-text fine-tuning (paper's approach) or hybrid architecture (RWKV-X concept).",
      "Knowledge boundary: Models only know what's in their training data. Your small model hasn't seen astronomical data, so testing it on black holes is like testing someone who hasn't read the preceding text."
    ]
  },
  {
    "para": "Practical method to define boundaries: Take 3 sets of 100 texts each (in training set / new text in same domain / unfamiliar domain), and measure PPL for each. Compare the three numbers, and your model's \"comfort zone, extrapolatable zone, and blind spot\" become clear at a glance."
  },
  {
    "quiz": [
      "【Multiple Choice】PPL = e^2.0 is approximately? A. 2 B. 7.4 C. 100",
      "【Short Answer】What does rising validation loss indicate? What are the two solutions?",
      "【Hands-on】Write a function ppl(losses) for the formula in 22.2, verify it outputs 6.55 with [1.8, 2.1, 1.5, 2.4, 1.6], then create a set of losses that reduces PPL below 3 (hint: average CE < 1.1)."
    ]
  },
  {
    "h2": "Chapter 23 Authoritative Evaluation and Inference Deployment: Getting Your Model Ready for Exams"
  },
  {
    "h3": "23.1 Four Standard Exams"
  },
  {
    "table": {
      "header": [
        "Exam",
        "What is tested",
        "How it's tested",
        "Reference score (RWKV-7 2.9B World3)"
      ],
      "rows": [
        [
          "Multilingual LAMBADA",
          "Cross-language understanding",
          "Same as above, with multilingual data",
          "See Table 4 in the paper"
        ],
        [
          "MMLU",
          "57-subject multiple choice (knowledge breadth)",
          "5-shot ABCD selection",
          "large-model class: tens of billions of parameters to reach 60"
        ],
        [
          "MQAR",
          "multi-query associative recall (memory capacity)",
          "hide KV pairs, then quiz",
          "72.9% at 256 pairs (paper)"
        ],
        [
          "multilingual LAMBADA",
          "cross-lingual understanding",
          "same protocol, multilingual corpora",
          "see paper Table 4"
        ]
      ]
    }
  },
  {
    "para": "Scoring algorithm example (MMLU): Number of correct answers ÷ Total questions × 100%. Manual calculation: 871 correct out of 1400 questions → 871 ÷ 1400 × 100% = 62.2%. Note the meaning of \"n-shot\": n example questions with answers are provided before the test questions to help the model understand the answer format—not open-book cheating, but standardized exam instructions."
  },
  {
    "h3": "23.2 Generation as Inference: Sampling Temperature"
  },
  {
    "para": "During inference, the model outputs a probability distribution over the entire vocabulary at each step (softmax scoring). How do we pick a word from this distribution? Temperature controls randomness:"
  },
  {
    "example": "The model calculates logits = [2.0, 1.0, 0.1] (raw scores for three candidate words).\nStep 1 [softmax to probabilities]: e^2.0=7.39, e^1.0=2.72, e^0.1=1.11; sum 11.21.\nProbabilities = [7.39, 2.72, 1.11] ÷ 11.21 = [0.659, 0.242, 0.099].\nStep 2 [Temperature=1, directly sample by probability]: about 66% chance to select the first word.\nTemperature=0.5: first divide logits by 0.5 (widening the gap) then softmax → distribution becomes sharper, more \"daring to be certain\"; Temperature=2: divide by 2 (narrowing the gap) → distribution becomes flatter, more \"divergent\". Use 0.7~1.0 for writing, 1.2~1.5 for brainstorming."
  },
  {
    "h3": "23.3 Deploy Your Model"
  },
  {
    "bullet": [
      "Minimal inference engine: Load checkpoint → Forward pass each step → Temperature sampling → Append new token back to input loop. Can be implemented in about a hundred lines of code (adapted from the framework in 20.1).",
      "Production deployment: WebLLM (runs RWKV in browser), ai00_server (local API service) both support custom checkpoints.",
      "Quantization to save costs: Compress weights from fp16 to int4 (size ÷4, speed increases several times, score drops by about 1-2 points)."
    ]
  },
  {
    "para": "Here, your \"from scratch\" closed loop is complete: Create your own data (Chapter 18) → Build your own tokenizer (Chapter 19) → Set up your own training framework (Chapters 20-21) → Self-evaluation (Chapter 22) → Self-testing and deployment (Chapter 23). Mastering these five steps independently means you're not just a user of models, but a creator of models."
  },
  {
    "quiz": [
      "【Multiple Choice】When temperature decreases from 1 to 0.5, the output style will? A. More random and divergent B. More deterministic and conservative C. Unchanged",
      "【Short Answer】Why does the MQAR score directly reflect \"flashcard capacity\"? What is its relationship with the information boundary in 22.3?",
      "【Hands-on】Implement the softmax calculation from 23.2 in Python: Calculate probability distributions for [2.0, 1.0, 0.1] with temperatures 0.5/1/2, verifying the \"low temperature → sharp distribution\" pattern (np.exp(z/T)/np.exp(z/T).sum())."
    ]
  },
  {
    "h2": "Experiment 5: 60-line BPE Tokenizer (Capstone Project)"
  },
  {
    "para": "Goal: Train your own Chinese tokenizer and use it to encode/decode a piece of your own text. Tools: MiniBPE code from 19.3 + at least 200KB of Chinese corpus (can use Wikipedia abstracts, public domain novels). Steps:"
  },
  {
    "bullet": [
      "① Corpus cleaning: Remove HTML tags, remove garbled text, split by sentences.",
      "② Adjust MiniBPE.vocab_size / merge count (recommended 2000), and observe the compression ratio (original character count ÷ token count).",
      "③ encode a 100-character new text, decode it back, and check character by character whether it's lossless.",
      "Step 4: change the merge count (200 / 2000 / 20000), train again each time, and plot \"merge count vs compression ratio\" - you will see the diminishing-returns curve with your own eyes."
    ]
  },
  {
    "para": "Passing criteria: encoding and decoding must be completely reversible (lossless) + compression ratio ≥ 1.3 + ability to explain why compression rate improvement slows as merge count increases. After completing this experiment, you have mentally rehearsed the first step of \"building a model\"."
  },
  {
    "note": "Final project (optional): Use your own tokenizer + 200KB corpus to train a 2-layer mini RWKV (parameters <1M), targeting PPL < 8. Stack: MiniBPE + 20.1 training skeleton + 22.2 health check function. Those who complete the entire pipeline have already acquired the ability to build models independently."
  }
];

module.exports = { PART6 };
