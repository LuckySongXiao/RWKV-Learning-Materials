// AUTO-TRANSLATED ENGLISH EDITION
const PART1 = [
  {
    "h2": "Foreword: How to Read This Book"
  },
  {
    "para": "This book will introduce you to a \"large model architecture\" called RWKV. When you hear about ChatGPT, ERNIE Bot, or Tongyi Qianwen, they all have a \"blueprint design\" behind them, and this design is called an architecture. RWKV is a new architecture primarily designed by Chinese researchers, aiming to be: smart, memory-efficient, and fast."
  },
  {
    "para": "Reading this book doesn't require advanced math skills. As long as you know basic arithmetic operations and understand fractions, we'll take it step by step. For every difficult concept, I'll first explain it with a real-life example, then show the formula, and finally work through a calculation together. The book contains 5 experiments total - the first 4 focus on understanding, and the last one (the capstone project) guides you to build something real, all of which can be completed on an ordinary computer."
  },
  {
    "note": "Learning path of the book: First, understand the three classic protagonists - \"language models, RNN (Recurrent Neural Networks), Transformer\" (Part 1); then take apart RWKV-4 to see its components (Part 2); then see how it evolved into RWKV-5/6 and RWKV-7 (Parts 3 and 4); then learn to run models yourself and read research papers (Part 5); then build from scratch - create your own data, tokenizer, and training framework to build your own model (Part 6); finally, take away a community troubleshooting guide and a panoramic map (Part 7). From simple to complex, each step builds on the previous one."
  },
  {
    "h2": "Chapter 1: Language Models - A \"Conversation Continuation\" Game"
  },
  {
    "h3": "1.1 How Computers Continue Conversations"
  },
  {
    "para": "You've definitely played conversation continuation: \"Before my bed -\" \"Moonlight!\" \"Moonlight!\" What language models do is exactly this: given the first half of a sentence, they guess what the next character (or word) is. After guessing one, they append it and guess the next, and so on, until a complete paragraph is \"continued.\""
  },
  {
    "para": "Computers do not have mouths, so how do they \"guess\"? Actually, they are solving a probability problem: for every possible next piece of text, they estimate how likely it is, then roll a weighted dice to pick one."
  },
  {
    "example": "After seeing the famous poem line \"床前明月\" (moonlight before my bed), the probability that the next character is \"光\" (light) is about 95%; all other characters share the remaining 5%. The model picks \"光\" because its probability tower over the rest."
  },
  {
    "para": "So the essence of a language model is a \"next character predictor.\" The reason it can chat as if it understands you is because it has done millions of \"fill-in-the-blank\" exercises on massive amounts of text, developing an intuition for language patterns."
  },
  {
    "h3": "1.2 Why It Needs \"Memory\""
  },
  {
    "para": "Conversation continuation has a challenge: as the conversation gets longer, the earlier information must be remembered. For example: \"My name is Xiaoming, and my favorite color is blue. Question: What is my favorite color?\" To answer this correctly, the computer must remember the word \"blue.\" This \"memory\" capability is the star of the next two chapters: RNN and Transformer solve it in two completely different ways, while RWKV offers a third approach."
  },
  {
    "note": "Keyword card: token - the \"character\" in the model's eyes. Models don't directly see Chinese characters; instead, they first break text into small pieces (which might be a single character or half a word), and each piece is called a token. Throughout this book, we can simply understand token as \"word.\""
  },
  {
    "quiz": [
      "【Multiple Choice】What is the essential task of a language model? A. Translating sentences  B. Predicting the next token given the previous text  C. Correcting typos",
      "【Short Answer】Using \"conversation continuation,\" explain: why can it continue predicting after guessing one word? Should the guessed word be appended back to the previous text?",
      "【Hands-on】Find a sentence and cover the last three characters. Have a family member act as the \"language model\" and continue word by word - record how long they hesitate at each step, and experience how \"high-probability words are easier to guess.\""
    ]
  },
  {
    "h2": "Chapter 2: RNN - The Smart Student with Poor Memory"
  },
  {
    "h3": "2.1 How RNN Works: Single-Person Message Passing"
  },
  {
    "para": "RNN (Recurrent Neural Network) is the oldest \"memory-enabled\" model. Its working method is like a single-person message passing game: a student stands in the classroom, you show them a word on a slip of paper, they mentally remember it, then update their \"memory\"; then they see the next word and update their memory again... After seeing the entire sentence, the memory in their mind is a condensed version of the whole sentence."
  },
  {
    "dialog": [
      "You",
      "(Memory update: \"wo jiao xiao...\" - the next piece is very likely a name!)",
      [
        "You",
        "Second word: \"jiao\" (called)."
      ],
      [
        "RNN",
        "(Memory update: \"wo jiao\" - I am called... - this is probably a self-introduction.)"
      ],
      [
        "You",
        "Third word: \"xiao\" (little)."
      ],
      [
        "RNN",
        "(Memory update: \"wo jiao xiao...\" - the next piece is very likely a name!)"
      ]
    ]
  },
  {
    "para": "This \"memory\" in RNN's mind is technically called the hidden state. You can think of it as RNN's \"mental state\": every time it sees a new word, the mental state refreshes. The RWKV official documentation uses the same analogy - the hidden state is like \"key information\" in the human brain, constantly updating as the content of thought changes."
  },
  {
    "h3": "2.2 RNN's Fatal Weakness: Memory Gets \"Diluted\""
  },
  {
    "para": "Single-person message passing has a big problem: the longer the message is passed, the easier the earlier content gets diluted. If a sentence has 100 words, by the 50th word, the information from the first word has gone through 49 \"updates\" and has long been scrambled beyond recognition. This is like dropping a drop of ink into a constantly stirred large water tank - the more you stir, the more diluted it becomes. This flaw is called vanishing gradients (which can be understood as \"the echo of memory getting weaker and weaker\")."
  },
  {
    "para": "RNN also has a small issue: it must process words one by one in sequence, like having only one person working, which isn't fast. So in 2017, a new architecture emerged with a completely different approach."
  },
  {
    "quiz": [
      "【Multiple Choice】What are the two major problems of RNN when processing long sentences? A. Square computational complexity + high memory usage  B. Memory dilution + only sequential processing  C. Too expensive + too difficult to understand",
      "【Short Answer】Using the \"single-person message passing\" analogy, explain \"vanishing gradients\": why by the 50th word, the information from the first word is gone?",
      "【Hands-on】Assume that each time information is passed, only 70% remains. How much of the first word's information remains when it reaches the 10th word? (0.7 to the 9th power, calculate with a calculator and write the result)"
    ]
  },
  {
    "h2": "Chapter 3: Transformer - Passing Notes in the Whole Class"
  },
  {
    "h3": "3.1 Attention Mechanism: Focus on What's Important"
  },
  {
    "para": "Transformer (the architecture behind ChatGPT; Chinese readers call it 变换器, \"the transformer\"): every word can directly look at every other word - like the whole class exchanging notes at once. Three magic parts: Q (query), K (label), V (content)."
  },
  {
    "example": "In the sentence \"Xiaoming gave the apple to Xiaohong because Xiaohong was hungry,\" when the model processes \"hungry,\" the word \"apple\" gets a high attention score - the model \"sees\" who was hungry and what they might want to eat. This is how attention captures relationships across the sentence."
  },
  {
    "para": "This scoring mathematically involves the coordination of three roles: each word prepares a \"Query card\" (Q), a \"Key card\" (K), and a \"Value card\" (V). The Query card looks for others' Key cards to match, and when matched, it copies from their Value card, with the amount copied determined by the degree of match. Remember this Q, K, V design - RWKV has similar roles later on."
  },
  {
    "h3": "3.2 The Square Pitfall: Too Many Notes Will Overwhelm You"
  },
  {
    "para": "There's a hidden danger when passing notes throughout the entire class: the number of notes grows quadratically with the number of people. 3 people passing notes to each other means 3×3=9 notes, 100 people means 100×100=10,000 notes, and 10,000 people means one hundred million notes! In technical terms: the computational cost of a Transformer is quadratic with respect to sentence length (O(T²), read as \"T squared\")."
  },
  {
    "table": {
      "header": [
        "Sentence Length (Words)",
        "Notes (Computations)",
        "Growth Feeling"
      ],
      "rows": [
        [
          "10",
          "100",
          "easy"
        ],
        [
          "100",
          "10,000",
          "a bit tired"
        ],
        [
          "10,000",
          "100,000,000",
          "exhausted"
        ],
        [
          "10,000",
          "100,000,000",
          "meltdown"
        ]
      ]
    }
  },
  {
    "para": "That's why today's large models can only \"see\" tens of thousands to hundreds of thousands of words at once, and the longer the context, the more power and memory it consumes. Engineers have been wondering: can we preserve the \"global view\" intelligence of attention while changing the quadratic cost to linear (O(T), where doubling the length only doubles the cost)? This is where our hero enters the stage."
  },
  {
    "quiz": [
      "【Multiple Choice】What is the correct division of labor for Q, K, and V? A. Q is content, K is query, V is label  B. Q queries, K labels, V content  C. All three are content",
      "【Short Answer】How many pairwise scoring operations are needed for attention in a 10,000-word sentence? Write the formula and explain the \"square pitfall.\"",
      "【Hands-on】Draw an arrow diagram for the \"Xiao Hong is hungry\" scoring example: label \"Xiao Hong/apple/Xiao Ming\" with scores of 8/3/1 respectively, with arrow thickness representing the score."
    ]
  },
  {
    "h2": "Chapter 4 RWKV: The Best of Both Worlds"
  },
  {
    "h3": "4.1 A \"Hybrid\" Architecture"
  },
  {
    "para": "RWKV's name comes from the first letters of its four most important internal parameters: R (Receptance), W (Weight), K (Key), and V (Value). It was initiated by Peng Bo (online name BlinkDL) in the open-source community in 2021 and has been continuously developed by volunteers worldwide, evolving from RWKV-1 to today's RWKV-8. Its design goal can be summarized in one sentence:"
  },
  {
    "formula": "训练时像 Transformer 一样“全班看黑板”（并行，快），推理时像 RNN 一样“带小本本”（只记状态，省）。"
  },
  {
    "para": "Why is this \"dual nature\" so valuable? Let's break down the costs separately."
  },
  {
    "h3": "4.2 The Training Cost: Parallel Processing"
  },
  {
    "para": "When training a model, we need to process thousands of long sentences simultaneously. RNNs can only update memory word by word sequentially, which is slow. Transformers can process entire sentences in parallel, which is fast. RWKV's cleverness lies in: although its formula looks like \"cyclic accounting,\" it can be rewritten in matrix form for \"whole-sentence calculation\" (details in Chapter 9). Therefore, during training, RWKV enjoys the same GPU benefits as Transformers and is fast."
  },
  {
    "h3": "4.3 The Inference Cost: Carrying Only a Small Notebook"
  },
  {
    "para": "During inference (when users ask questions and the model responds), every time a Transformer generates a word, it must carry all the previous \"notes\" (technically called KV cache) with it. The longer the conversation, the heavier the burden, and memory and computational costs continue to grow with conversation length. During inference, RWKV only needs to carry a fixed-size \"small notebook\" (hidden state): no matter whether the previous conversation had one thousand words or one million words, the notebook remains the same size, and turning pages is always equally fast. This is called constant overhead and linear complexity."
  },
  {
    "table": {
      "header": [
        "Comparison Item",
        "Transformer",
        "RNN",
        "RWKV"
      ],
      "rows": [
        [
          "Computational cost per unit length",
          "Quadratic O(T²)",
          "Linear O(T)",
          "Linear O(T)"
        ],
        [
          "Inference memory (as chat grows)",
          "grows with the chat",
          "fixed",
          "fixed"
        ],
        [
          "Long-text memory",
          "limited by the window",
          "unreliable",
          "state can extend indefinitely"
        ],
        [
          "Compute per unit length",
          "quadratic O(T²)",
          "linear O(T)",
          "linear O(T)"
        ]
      ]
    }
  },
  {
    "para": "Starting from RWKV-4, every formal paper reports: with Transformer-level training compute, it achieves Transformer-level performance on language benchmarks - the \"as smart, but cheaper to run\" claim is measured, not marketing."
  },
  {
    "note": "Fun fact: RWKV is pronounced either as the four letters \"R-W-K-V\" or as one word, \"wa-ku-wei\" (沃克维). It is fully open source (Apache 2.0): free for anyone to use, study, and even sell."
  },
  {
    "quiz": [
      "【Multiple Choice】What are the \"two faces\" of RWKV? A. Can change faces B. Training parallel + inference loop C. Dual personality",
      "【Short Answer】Why doesn't RWKV's memory increase during inference as the conversation gets longer? (Hint: KV cache vs. little notebook)",
      "【Hands-on】Memorize the three memory methods in Figure 1 corresponding to three architectures, and retell to your family \"why the messenger is the winner\"."
    ]
  }
];

const PART2 = [
  {
    "h2": "Chapter 5 R, W, K, V: The Four Protagonists in the Name"
  },
  {
    "para": "Now let's break down the first official machine: RWKV-4 (paper \"RWKV: Reinventing RNNs for the Transformer Era\", published at EMNLP in 2023, arXiv number 2305.13048). In this chapter, we'll first get to know the four components, and see how they assemble in chapters 6 and 7."
  },
  {
    "para": "Each \"floor\" (layer) in RWKV-4 has two rooms: one responsible for time-mixing (dealing with past information), and one for channel-mixing (processing and transforming information). Both rooms use four characters: R, W, K, and V. Let's use a class officer election as an analogy:"
  },
  {
    "table": {
      "header": [
        "Character",
        "English Full Name",
        "Class Officer Analogy",
        "What it Does"
      ],
      "rows": [
        [
          "R",
          "Receptance",
          "the class monitor raising a hand",
          "a valve between 0 and 1 deciding how much of this update flows into the output"
        ],
        [
          "W",
          "Weight (time weight)",
          "the discipline monitor of time",
          "decides the discount on past memories - the older, the deeper the cut"
        ],
        [
          "K",
          "Key",
          "each student's name tag",
          "the label each word in a sentence carries"
        ],
        [
          "V",
          "Value",
          "each student's speech script",
          "the actual content each word carries"
        ]
      ]
    }
  },
  {
    "para": "Compared to Transformer's Q, K, V, you'll find: RWKV keeps K and V (labels and content), replaces Q with R (reception valve), and adds W (time discount). This W is the soul of RWKV—Transformer has no concept of time, but RWKV does."
  },
  {
    "note": "Value conventions for the four characters: R goes through a sigmoid function, always between 0 and 1 (how open the valve is); K takes an exponent first (becomes positive, used as weight); V is just a regular number; W also goes through exponential processing to ensure it's a discount rate between 0 and 1. We'll explain in more detail when we use it in Chapter 6."
  },
  {
    "quiz": [
      "【Multiple Choice】What are the Chinese translations of R, W, K, V in order? A. Reception/Weight/Key/Value B. Key/Value/Reception/Weight C. Weight/Key/Value/Reception",
      "【Short Answer】Why does R range from 0 to 1? What would happen if R were constantly 1? What if it were constantly 0?",
      "【Hands-on】Label the four life analogies \"interrupting/discounting/secret code/shipping\" with the corresponding letters (R/W/K/V)."
    ]
  },
  {
    "h2": "Chapter 6 Time Mixing: The Weighted Class Notebook"
  },
  {
    "h3": "6.1 The Notebook's Rules"
  },
  {
    "para": "Time mixing is RWKV's most important invention. Its task: after reading a sentence, make a judgment on \"what should be output now\"—and this judgment must draw from the weighted history of the entire sentence. RWKV-4 paper equations 19-22 write it as two books of accounts, so let's directly look at the account books."
  },
  {
    "formula": "第 19 式（初始）：a₀ = 0，b₀ = 0 （两本账都从空账开始）"
  },
  {
    "formula": "第 20 式（读账）：wkv_t = ( aₜ₋₁ + e^(u+kₜ)·vₜ ) ÷ ( bₜ₋₁ + e^(kₜ) )"
  },
  {
    "formula": "第 21 式（记分子账）：aₜ = e^(−w)·aₜ₋₁ + e^(kₜ)·vₜ"
  },
  {
    "formula": "第 22 式（记分母账）：bₜ = e^(−w)·bₜ₋₁ + e^(kₜ)"
  },
  {
    "para": "Looks scary? Actually, the four lines only tell three things: old accounts get discounted, new accounts are added, and output is a weighted average. Let's translate each symbol into plain language:"
  },
  {
    "table": {
      "header": [
        "Symbol",
        "Plain Language Translation",
        "Notebook Analogy"
      ],
      "rows": [
        [
          "aₜ",
          "the numerator ledger (at step t)",
          "the ledger of the weighted sum of contents"
        ],
        [
          "e^(kₜ)",
          "weight of the t-th token",
          "how much say this token gets"
        ],
        [
          "vₜ",
          "content of the t-th token",
          "the speech this token delivers"
        ],
        [
          "e^u",
          "bonus score of the current token",
          "extra weight given to the current token"
        ],
        [
          "wkvₜ",
          "output of this step",
          "the weighted-average memory computed from the ledger"
        ],
        [
          "e^u",
          "bonus for the current token",
          "extra weight when it is this token's turn"
        ],
        [
          "wkvₜ",
          "the step's output",
          "the weighted-average memory computed from the ledger"
        ]
      ]
    }
  },
  {
    "h3": "6.2 Manual Calculation (Three Steps)"
  },
  {
    "para": "The rule is: for each new word, first \"read the ledger\" to calculate the output, then \"update the ledger\" to update both ledgers. For easier manual calculation, we set all exponents to convenient numbers: discount rate e^(−w) = 0.5, current word bonus e^u = 1, and each word's weight e^(k) = 1. The content v of the three words are 2, 4, and 8 respectively (imagine the speaking weight of three classmates). Let's begin:"
  },
  {
    "example": "【Step 1】New word v₁ = 2 arrives.\nRead ledger: wkv₁ = (a₀ + 1×2) ÷ (b₀ + 1) = (0+2) ÷ (0+1) = 2.\nUpdate ledger: a₁ = 0.5×0 + 1×2 = 2; b₁ = 0.5×0 + 1 = 1.\n(Empty ledger, first entry relies entirely on the new word itself.)"
  },
  {
    "example": "【Step 2】New word v₂ = 4 arrives.\nRead ledger: wkv₂ = (a₁ + 1×4) ÷ (b₁ + 1) = (2+4) ÷ (1+1) = 6÷2 = 3.\nUpdate ledger: a₂ = 0.5×2 + 1×4 = 1+4 = 5; b₂ = 0.5×1 + 1 = 1.5.\n(The new word 4 and old memory 2 each account for half, so the output is 3.)"
  },
  {
    "example": "【Step 3】New word v₃ = 8 arrives.\nRead ledger: wkv₃ = (a₂ + 1×8) ÷ (b₂ + 1) = (5+8) ÷ (1.5+1) = 13÷2.5 = 5.2.\nUpdate ledger: a₃ = 0.5×5 + 1×8 = 2.5+8 = 10.5; b₃ = 0.5×1.5 + 1 = 1.75.\n(The new word 8 has pulled the average to 5.2—newer words have greater impact—that's the effect of discounting.)"
  },
  {
    "para": "Get it? wkv always equals the weighted average of \"discounted history + current emphasis\". A discount rate of 0.5 means: with each new word, the old ledger is halved. So newer information automatically has higher weight, while older information becomes blurrier—just like human memory! And this \"blur\" is controllable: w is a learnable parameter, the model decides how fast to forget."
  },
  {
    "h3": "6.3 Why This Works for Entire Sentences"
  },
  {
    "para": "Key insight: the ledgers a and b are \"compressed history\". In the ledger at step 100, hides the weighted sum of the previous 99 words. So as long as the model carries these two ledgers, it carries the memory of the entire sentence—that's the hidden state! The ledger size is fixed (two ledgers per dimension), independent of sentence length. This is the mathematical implementation of the \"little notebook\"."
  },
  {
    "h3": "6.4 Complete Flow of W, K, V, R in a Layer"
  },
  {
    "para": "In the real model, each word first becomes a string of numbers (word vector x), then goes through three \"translators\" to get three cards: R̃, K̃, Ṽ (the four roles from Chapter 5). K̃ must go through exponential (to become positive), R̃ must go through sigmoid (to become a 0~1 valve), then calculate wkv using the ledger rules above, and finally the valve controls: rₜ × wkvₜ is the official output of the time mixing room. The previous steps are done in parallel for each numerical dimension, that's all."
  },
  {
    "note": "Advanced glance: The paper actually uses numerically stable formulas (equations 23~26)—because e^k might overflow in computers, so we first subtract a \"current maximum\" before taking exponent, like scientific notation first adjusting the magnitude. The idea is exactly the same, just making computation more stable for computers. For middle school level, understanding the ledger version is completely sufficient."
  },
  {
    "quiz": [
      "【Multiple Choice】When a new word arrives, the ledger update order is? A. Update ledger first, then read ledger B. Read ledger first, then update ledger C. Only update ledger",
      "【Short Answer】Who decides the w parameter? What ability does it control in the model (how fast to forget)?",
      "【Hands-on】Redo the Chapter 6 manual calculation: change v to [3, 6, 9], discount 0.5, calculate three-step wkv (check your answer: 3 / 4.8 / 7.2)."
    ]
  },
  {
    "h2": "Chapter 7 Channel Mixing: The Sorting Center"
  },
  {
    "para": "Time mixing handles \"remembering the past\", channel mixing handles \"deep processing the present\". It's like a sorting center: goods (word vectors) come in, first get recombined and repackaged in the warehouse (large matrix transformation), then go through \"unboxing inspection\" (ReLU² activation—zero out negatives, square positives to make important items stand out), and finally the R valve decides how much to let through."
  },
  {
    "formula": "通道混合：rₜ = σ(R̃ₜ)（阀门）；kₜ = exp(K̃ₜ)（打包重量）；输出 = rₜ × W × ReLU²(kₜ)（放行的货）"
  },
  {
    "para": "You don't need to remember the formulas, just remember the division of labor: time mixing handles \"memory\", channel mixing handles \"processing\". One RWKV layer = time mixing room + channel mixing room, connected in series. Real models have dozens of layers, information is refined layer by layer, becoming more abstract as you go higher."
  },
  {
    "quiz": [
      "【Multiple Choice】What is the function of channel mixing? A. Apply discounts to time B. Process the content dug up by time mixing into output C. Generate the vocabulary",
      "【Short Answer】Why does channel mixing need to \"look back\" at the previous word's x? (Hint: series connection)",
      "【Hands-on】Calculate σ(0) and SiLU(0), then verify with Python (Answers: both are 0.5 and 0)."
    ]
  },
  {
    "h2": "Chapter 8 Token-Shift: \"Mixing\" Old and New Words"
  },
  {
    "para": "RWKV-4 also has a clever trick: before each word enters time mixing, it first \"mixes blood\" with the previous word. The formula is extremely simple—"
  },
  {
    "formula": "混搭ₜ = xₜ₋₁ + μ · (xₜ − xₜ₋₁)  （μ 是每个通道自己学的比例，0 到 1）"
  },
  {
    "example": "This is like mixing juice: 20% of the leftover from the last cup mixed with 80% new (when μ=0.8). Why mix? Because if you only look at the current word for \"each word's label and content\", the information is too thin; mix in some of the previous word, and the model can capture \"cross-word combinations\" (like \"not\" and \"good\" together form \"not good\"). Mathematically, this is equivalent to a 1D convolution of length 2, with almost zero cost but great benefits."
  },
  {
    "para": "Don't underestimate this mixing—the subsequent paper \"Eagle and Finch\" section 4.2 specifically points out: precisely because each head's mixing ratio can be learned separately, RWKV can form \"induction heads\" within a single block (circuits that discover patterns like \"A B … A → B\", a concept from Elhage and Olah's 2022 classic research). Simply put: knowing how to mix enables learning from analogy."
  },
  {
    "quiz": [
      "【Multiple Choice】What operation is Token-Shift equivalent to? A. 1D convolution of length 2 B. Fully connected C. Attention",
      "【Short Answer】\"Not\" and \"good\" need to be connected to form \"not good\"—explain how mixing helps the model capture such cross-word combinations.",
      "【Hands-on】Change μ from 0.5 to 0.9, calculate the mixing result for \"new word 8, old word 2\" (formula: xₜ₋₁+μ(xₜ−xₜ₋₁); answer: 7.4)."
    ]
  },
  {
    "h2": "Chapter 9 Two Sides of One Coin: Training Like Transformer, Inference Like RNN"
  },
  {
    "h3": "9.1 Two Faces of the Same Formula"
  },
  {
    "para": "The ledger formula from Chapter 6 is the \"recurrent face\": step by step. But when mathematicians expand it, they find that a and b can actually be written as \"weighted sum of all historical words\"—each word's contribution is e^(−(t−i)w)·e^(kᵢ) (more discount for older words). Since each step only depends on input, not on \"intermediate results being calculated\", all steps of the entire sentence can be computed in parallel! This is the \"parallel face\"."
  },
  {
    "example": "Imagine calculating the average height of the whole class: one method is adding them up one by one (recurrent face, slow); another is each person multiplying their height by weights, everyone showing their cards simultaneously, then summing up at once (parallel face, fast). The ledger formula supports both—training uses the parallel face to leverage GPU, inference uses the recurrent face to save memory."
  },
  {
    "h3": "9.2 Inference: Why the Burden Never Gets Heavier"
  },
  {
    "para": "During inference, RWKV uses a recurrent face: for each word generated, it only does two things—read the wkv from the current ledger, then update the ledger. The ledger (5 tensors: x, y, a′, b′, p, with a total size of about 5×D×L, where D is the word vector dimension and L is the number of layers) is the entire baggage. So no matter how long the conversation, each step of RWKV has the same cost. The paper shows that RWKV-4 has better memory usage and throughput than similarly-sized Transformers in long-context scenarios."
  },
  {
    "table": {
      "header": [
        "Scenario",
        "Which face to use",
        "Why"
      ],
      "rows": [
        [
          "Inference (generating word by word)",
          "Recurrent face",
          "Only carries the ledger, not the entire sentence, saving memory"
        ],
        [
          "Inference (generating word by word)",
          "the recurrent face",
          "carry only the ledger, not the whole sentence - saves memory"
        ]
      ]
    }
  },
  {
    "note": "One-sentence summary of RWKV-4: R valve controls admission, W discount controls forgetting, K label controls weight, V content controls substance; two ledgers a and b record history; training is parallel, inference is recurrent. Next, we'll upgrade it."
  },
  {
    "quiz": [
      "【Multiple Choice】Why is training fast? A. Uses a faster graphics card B. The formula can be rewritten into a matrix form for parallel sentence processing C. Smaller vocabulary",
      "【Short Answer】Using the parallel formula from Appendix E.7: Why can parallel processing work when \"each step only depends on input, not on intermediate values\"?",
      "【Hands-on】Copy the three state comparisons from section 9.2 onto small cards and memorize which architecture \"training O(T)/inference O(1)/memory O(1)\" belongs to."
    ]
  },
  {
    "h2": "Experiment 1: Manual WKV calculation (pen-and-paper version)"
  },
  {
    "para": "Goal: Manually verify the ledger rules from Chapter 6 and experience \"discounted memory\". Tools: One sheet of paper, one pen. Set discount rate e^(−w) = 0.6, bonus e^u = 1, weight e^(k) = 1, and content values v = 1, 2, 4, 8 for four words. Please calculate step by step according to the table below (read ledger first, then update ledger):"
  },
  {
    "table": {
      "header": [
        "Step t",
        "Read ledger wkvₜ = (aₜ₋₁+8)/(bₜ₋₁+1)",
        "Update ledger aₜ = 0.6aₜ₋₁+8ₜ",
        "Update ledger bₜ = 0.6bₜ₋₁+1"
      ],
      "rows": [
        [
          "1",
          "(0+1)/(0+1) = 1",
          "0+1 = 1",
          "0+1 = 1"
        ],
        [
          "2",
          "(1+2)/(1+1) = 1.5",
          "0.6+2 = 2.6",
          "0.6+1 = 1.6"
        ],
        [
          "3",
          "(2.6+4)/(1.6+1) ≈ 2.538",
          "1.56+4 = 5.56",
          "0.96+1 = 1.96"
        ],
        [
          "4",
          "(5.56+8)/(1.96+1) ≈ 4.581",
          "3.336+8 = 11.336",
          "1.176+1 = 2.176"
        ]
      ]
    }
  },
  {
    "para": "After calculating, answer three thinking questions: (1) Which is larger, the output of step 4 (4.581) or the last word's value (8)? Why? (2) If you change the discount rate to 0.9 (forgets slowly, retains more old memory), will the output be farther from or closer to 8? (3) If you change v to 1, 1, 1, 1, what would the output be approximately? Write your answers in your notebook, and in Experiment 2, we'll verify with a computer."
  },
  {
    "h2": "Experiment 2: Write a mini RWKV memory kernel in Python"
  },
  {
    "para": "Goal: Turn the Chapter 6 ledger into real code, run it, and see the numbers. Tools: Any computer with Python 3 installed (you can also use apps like \"Pyto\" or \"QPython\" on a phone). Create a new file rwkv_core.py and copy the code below line by line (the comments are explanations for you):"
  },
  {
    "code": "import math\n\nw = 0.5          # 折扣率的来源（代码里存 w，用时取 e^{-w}）\nu = 0.0          # 当前词加分 e^u\na, b = 0.0, 0.0  # 两本账：分子账 a、分母账 b\n\nvs = [2, 4, 8]   # 三个词的内容（发言分量）\n\nfor t, v in enumerate(vs, start=1):\n    k = 0.0  # 简化：让每个词的权重 e^k = 1\n\n    # 第一步【读账】：旧账 + 新词，算加权平均\n    wkv = (a + math.exp(u + k) * v) / (b + math.exp(u + k))\n\n    # 第二步【记账】：旧账打折扣（e^{-w}），新账入册（e^k）\n    a = math.exp(-w) * a + math.exp(k) * v\n    b = math.exp(-w) * b + math.exp(k)\n\n    print(f\"第{t}步: 输出 wkv = {wkv:.3f}, 分子账 a = {a:.3f}, 分母账 b = {b:.3f}\")"
  },
  {
    "para": "Run it (type python rwkv_core.py on the command line): the first two steps match the hand calculation exactly (2.000, 3.000), and step three outputs 5.069 - slightly below the hand-computed 5.2. Reason: the code uses the true discount e^(-0.5) ≈ 0.607 (the hand version rounded it to 0.5 for easy arithmetic), so the old ledger survives a bit more and the new token 8 gets slightly diluted. Reminder: approximations are fine for hand calculation, but always verify against the code's true values."
  },
  {
    "note": "Congratulations! You've just written the recurrent skeleton of RWKV time mixing. The real RWKV-4 just expands this ledger from \"one number\" to \"thousands of dimensions\" and then adds layers and translators. The skeleton is exactly the same."
  }
];

module.exports = { PART1, PART2 };
