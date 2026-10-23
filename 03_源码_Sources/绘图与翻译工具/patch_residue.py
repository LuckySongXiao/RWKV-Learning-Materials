#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""手译映射表：修补英文数据文件中残留的中文（按唯一文本精确匹配）"""
import json, io, sys

M = {
  'Computers don\'t have mouths, so how do they "guess"? Actually, they\'re solving a probability problem':
    'Computers don\'t have mouths, so how do they "guess"? Actually, they are solving a probability problem: for every possible next piece, they estimate how likely it is, then roll a weighted dice. (Translator note: the original Chinese example continues below.)',
  'After seeing "床前明月", the probability that the next character is "光" (guāng) is about 95%; that it\'s':
    'After seeing the famous poem line "床前明月" (chuáng qián míng yuè - moonlight before my bed), the probability that the next character is "光" (guāng) is about 95%; other characters share the remaining 5%.',
  '(Memory update: "我叫小"... the next is likely a name!)':
    '(Memory update: "I am called Xiao..." - the next piece is likely a name!)',
  '你': 'You',
  '第二个词："叫"。': 'Second word: "jiao" (called).',
  '（记忆更新：出现"我叫"……大概在说自己的名字。）': '(Memory update: "I am called" appeared... probably introducing a name.)',
  '第三个词："小"。': 'Third word: "Xiao".',
  '（记忆更新："我叫小……"后面多半是个名字！）': '(Memory update: "I am called Xiao..." - what follows is most likely a name!)',
  'Transformer (called "变换器" in Chinese, which is the architecture behind ChatGPT - note that it\'s not ':
    'Transformer (the architecture behind ChatGPT; Chinese readers call it "变换器", the "transformer") - not to be',
  'In the sentence "Xiaoming gave the apple to Xiaohong because Xiaohong was hungry," when the model pr':
    'In the sentence "Xiaoming gave the apple to Xiaohong because Xiaohong was hungry," when the model predicts the next word after "Xiaohong ate", attention must look far back to find "apple".',
  '轻松': 'easy',
  '有点累': 'a bit tired',
  '崩溃': 'exhausted',
  'Starting from RWKV-4, every formal paper reports: using Transformer-level computational power, it ac':
    'Starting from RWKV-4, every formal paper reports: using Transformer-level compute, it achieves Transformer-level quality.',
  'Fun fact: RWKV is pronounced as the four letters "R-W-K-V" or as a single word "沃克维". It is complete':
    'Fun fact: RWKV is pronounced either as the four letters "R-W-K-V" or as one word (roughly "Rwa-Kuv" in Chinese, 沃克维). It is completely open source.',
  'Receptance 接收度': 'Receptance',
  '举手的班长': 'the class monitor raising a hand',
  '决定"本次更新有多少要写进输出"，0 到 1 之间的阀门': 'a valve between 0 and 1 that decides how much of this update goes into the output',
  '分子账（第 t 步的）': 'the numerator ledger (at step t)',
  '记"加权内容总和"的账': 'tracks the weighted sum of contents',
  '第 t 个词的权重': 'weight of the t-th token',
  '这个词的发言分量': 'how much say this token gets',
  '第 t 个词的内容': 'content of the t-th token',
  '这个词的发言稿': 'the speech this token delivers',
  '当前词的加分': 'bonus score of the current token',
  '轮到"现在"这个词时的额外重视': 'extra emphasis given to the token speaking "now"',
  '本步输出': 'output of this step',
  '账本算出来的加权平均记忆': 'the weighted-average memory computed from the ledger',
  'Run (type python rwkv_core.py in the command line), and you\'ll see the first two steps match the man':
    'Run it (type python rwkv_core.py on the command line): the first two steps match the manual calculation exactly (2.000, 3.000), while the third prints 5.069 - slightly below the hand-computed 5.2. Reason: the code uses the true discount e^(-0.5) ~ 0.607 (we rounded it to 0.5 for hand arithmetic), so a bit more of the old ledger survives and the new word 8 carries slightly less weight.',
  '表达力': 'Expressiveness',
  '够用': 'adequate',
  '大幅提升（论文 Fig. 2 能力对比）': 'greatly improved (capability comparison in Fig. 2 of the paper)',
  '支持低秩式更新（像贴小纸条改大账本）': 'supports low-rank-style updates (like editing a big ledger with small sticky notes)',
  '先擦后写（Delta 减法）': 'erase-then-write (Delta subtraction)',
  'Initial card box S = 0. First word k=[1,0], v=[3,7].\nErase term: κ̂ ⊗ (S 勾 κ̂) = 0 (nothing to erase':
    'Initial card box S = 0. First token k=[1,0], v=[3,7].\nErase term: k-hat ⊗ (S retrieved by k-hat) = 0 (nothing to erase',
  'World v3 + 增量': 'World v3 + increments',
  'Beyond evaluation scores, RWKV-7 also received a "theoretical gold medal." Appendix D of the paper m':
    'Beyond evaluation scores, RWKV-7 also earned a "theoretical gold medal": Appendix D of the paper mathematically proves that its generalized Delta rule subsumes the entire family of prior linear-attention models - more expressive at equal parameter count.',
  'Run to see output: The first two writes have the same query result for both boxes (10). After changi':
    'Run to see the output: after the first two writes, both boxes answer the query with the same result (10). After the third write, the Delta box returns a clean "green" (the new value 10 on the new channel) while the additive box still mixes in the old red.',
  '训练总仓库：模型代码、训练脚本、CUDA 加速，论文的官方实现': 'The main training repo: model code, training scripts, CUDA acceleration - the official implementation of the papers',
  '推理服务器：把 RWKV 跑成本地 API，支持显卡加速，可聊天': 'Inference server: runs RWKV as a local API with GPU acceleration, ready for chat',
  '轻量推理包：上一节我们用的就是它': 'Lightweight inference package: the one we used in the previous section',
  '【Hands-on】Use WebLLM\'s demo page to have RWKV generate a self-introduction, and record one mistake i':
    '[Hands-on] Use WebLLM\'s demo page to have RWKV generate a self-introduction, and note one mistake it makes - you have just discovered a training-data gap.',
  '序列/强化': 'sequence / RL',
  '时间序列预测、机器人控制': 'time-series forecasting, robot control',
  '通用': 'general',
  '压缩算法、混合架构（RWKV-X 等）': 'compression algorithms, hybrid architectures (RWKV-X, etc.)',
  '语言': 'language',
  '语言模型、图神经网络': 'language models, graph neural networks',
  '音频/语音': 'audio / speech',
  '语音识别、音频生成': 'speech recognition, audio generation',
  'DeepEmbed (Deep Embedding): Expands and deepens the \'hidden state\' from a thin layer to create a \'di':
    'DeepEmbed (deep embedding): expands the thin "hidden state" into a deep, wide memory, raising the information a single state can carry - reportedly a 4x capacity boost.',
  'RWKV-4 架构：R/W/K/V 时间混合＋账本式状态，训练并行推理循环': 'RWKV-4 architecture: R/W/K/V time-mixing + ledger-style state; parallel training, recurrent inference',
  'RWKV-5/6：矩阵值状态＋数据依赖衰减，0.46B~7.5B 开源模型': 'RWKV-5/6: matrix-valued state + data-dependent decay; open models from 0.46B to 7.52B',
  'RWKV-7：广义 Delta 规则，上下文内学习率，3.12T 数据集': 'RWKV-7: generalized Delta rule, in-context learning rate, 3.12T-token dataset',
  '综述': 'survey',
  'RWKV 架构进化史综述（含性能基准汇编）': 'survey of RWKV architecture evolution (with a benchmark compilation)',
  'RWKV 又一篇综述：语言任务性能、生态、与 Mamba 等对比': 'another RWKV survey: language performance, ecosystem, and comparison with Mamba and others',
  '注意力（Attention）': 'Attention',
  '打分＋加权看：每个词给其他词的重要程度': 'score + weighted look: how much each token matters to every other token',
  'token（词元）': 'token',
  '模型眼里的"字"，切好的文本小块': 'the "characters" a model sees: chopped-up pieces of text',
  '隐藏状态（hidden state）': 'hidden state',
  '模型的小本本：压缩了全部历史的记忆': 'the model\'s notebook: a memory that compresses the entire history',
  '复杂度 O(T²)/O(T)': 'complexity O(T\u00b2) / O(T)',
  '句子长度翻倍，开销翻 4 倍 / 只翻 2 倍': 'sentence length doubles, cost quadruples / only doubles',
  'KV 缓存': 'KV cache',
  'Transformer 推理时背着的历史纸条，越聊越重': 'the growing bundle of notes Transformer carries during chat; gets heavier as the talk goes on',
  'Receptance（接收度）': 'Receptance',
  'R 阀门：本步输出放行多少（0~1）': 'the R valve: how much of this step\'s output passes (0~1)',
  'time decay（时间衰减）': 'time decay',
  'W 折扣：旧记忆每步打几折': 'the W discount: how much old memory keeps each step',
  '外积（⊗）': 'outer product (\u2297)',
  '标签×内容的交叉乘法，生成记忆卡片': 'label \u00d7 content cross multiplication, producing a memory card',
  'Delta 规则': 'Delta rule',
  '先擦后写：更新记忆而不是堆积记忆': 'erase-then-write: updates memory instead of piling it up',
  '上下文内学习率（a）': 'in-context learning rate (a)',
  'RWKV-7 橡皮擦的力度，现场决定': 'the strength of RWKV-7\'s eraser, decided on the spot',
  '多头（multi-head）': 'multi-head',
  '多个小卡片盒分头记账（语法、事实各管各）': 'several small card boxes keeping separate ledgers (grammar and facts each on their own)',
  '两个瘦矩阵代替大矩阵的省参数技巧': 'a parameter-saving trick: two thin matrices replace one big one',
  '量化': 'quantization',
  '把模型数字从高精度改成低精度，省内存': 'turn high-precision model numbers into low-precision ones to save memory',
  '参数量（B）': 'parameter count (B)',
  '模型的可学习旋钮总数，1B = 10 亿': 'total learnable knobs of a model; 1B = one billion',
  'state tuning（状态微调）': 'state tuning',
  '只调"小本本"不调全模型的轻量微调': 'lightweight tuning that adjusts only the "notebook", not the whole model',
  '归纳头（induction heads）': 'induction heads',
  '发现"A B … A → B"复制规律的内部电路': 'internal circuitry that discovers the copy pattern "A B ... A \u2192 B"',
  'BlackGoose 时序建模（2025）': 'BlackGoose time-series modeling (2025)',
  'RWKV-7 替代 Transformer 做时序': 'RWKV-7 replacing Transformer for time series',
  'OmniZip 多模态压缩（2026）': 'OmniZip multimodal compression (2026)',
  'RWKV-7 当压缩预测骨干': 'RWKV-7 as the compression-prediction backbone',
  'RWKVQuant 量化（2025）': 'RWKVQuant quantization (2025)',
  '给 RWKV 全家做量化省内存': 'memory-saving quantization for the whole RWKV family',
  'NinaXander 冻结模型拼接（2026）': 'NinaXander frozen-model grafting (2026)',
  'RWKV+Transformer 混合，KV 缓存减 84%': 'RWKV + Transformer hybrid, KV cache cut by 84%',
  '3D/视频': '3D / video',
  'StateLinFormer 导航（2026）': 'StateLinFormer navigation (2026)',
  '状态跨批次延续＝无限长序列学习': 'state carried across batches = unbounded-length sequence learning',
  '音频': 'audio',
  'EVA 语音代表论文（2026）': 'EVA speech representative paper (2026)',
  'RWKV 编码音频流': 'RWKV encoding audio streams',
  '医学': 'medicine',
  '多查询 RWKV 病理切片（2026）': 'multi-query RWKV pathology slides (2026)',
  '全玻片图像长序列分析': 'long-sequence analysis of whole-slide images',
  'Experiment 1 (manual calculation): The final wkv₄ ≈ 4.581; with a discount of 0.9, the out':
    'Experiment 1 (manual calculation): the final wkv\u2084 \u2248 4.581; with a discount of 0.9 the output is about 3.94 (more old memory survives, so it moves away from 8); with all v = 1 the output stays exactly 1. Experiment 2 (code): outputs 2.000 / 3.000 / 5.069 (the true discount e^(-0.5) \u2248 0.607 is slightly larger than the hand-computed 0.5, hence slightly below 5.2); with w=0.1 step 3 gives about 4.75 (sticky memory), with w=3.0 about 5.90 (goldfish memory). Experiment 3: with w=0.5 the query with token 2\'s label reads 10; with w=0.9 it rises to 18 (old cards survive more completely). Experiment 4: after the third write, the Delta box answers "apple" with a clean "green" (new value 10), while the additive box still mixes in the old red. If your numbers drift a little, first check your transcription (especially exponents and parentheses), then whether a direction got flipped.',
  '书籍与长文': 'books and long texts',
  '公版书、教材（养长记忆）': 'public-domain books, textbooks (to grow long memory)',
  '对话': 'dialogue',
  '问答对、聊天记录（练对话）': 'Q&A pairs, chat logs (to practice conversation)',
  '数学与符号': 'math and symbols',
  '数学题、公式（练推理）': 'math problems, formulas (to practice reasoning)',
  'Training a BPE vocabulary only takes three loop steps: Count → Select Champion → Merge. Le':
    'Training a BPE vocabulary takes just three loop steps: count \u2192 pick the champion pair \u2192 merge. Learn them and the 40-line MiniBPE below reads like plain English.',
  'Initial sequence (split by single characters): [低, 低, 低, 低, 低, 语, 语, 言]\nStep 1 [Count adja':
    'Initial sequence (split into single characters): [di, di, di, di, di, yu, yu, yan] (低 low, 语 language, 言 speech)\nStep 1 - count adjacent pairs: (di,di) x4 is the champion; merge them all at once. Sequence becomes [低低, 低低, 低, 语, 语, 言].\nStep 2 - recount: no pair repeats twice now, so counting finds no new champion - training stops. Vocabulary: 低, 低低, 语, 言... (低低 = the merged token "di-di").',
  'Record the merge rules (e.g., \'低+低→低低\'), and your vocabulary gains a new token. When encod':
    'Record the merge rules (e.g., 低+低 \u2192 低低), and the vocabulary gains a new token. When encoding new text later, apply the same rules in the same order - "低低低" becomes [低低, 低], two tokens instead of three: one third shorter.',
  'After running, you\'ll see that the vocabulary contains both single characters (低, 语, 言, 模,':
    'After running, you\'ll see the vocabulary holds both single characters (低, 语, 言, 模...) and merged tokens (低低, 语言, 模型...). Notice: frequent combinations got merged, rare ones stayed single - that is compression exactly where it pays.',
  '验证 loss 回升': 'validation loss rises',
  '过拟合（把训练集背下来了）': 'overfitting (memorized the training set)',
  '加数据 / 早停（回到回升前的检查点）': 'add data / early-stop (roll back to the checkpoint before the rise)',
  '梯度裁剪': 'gradient clipping',
  '通用护栏': 'universal guardrail',
  '批大小（词元/步）': 'batch size (tokens/step)',
  '经验区间下沿，显存不够就梯度累积': 'the low end of the empirical range; use gradient accumulation if VRAM runs out',
  '验证频率': 'validation frequency',
  '每 500~1000 步': 'every 500-1000 steps',
  '及时抓过拟合': 'catch overfitting in time',
  '④ Change the merge count (200 / 2000 / 20000) and train each time, then plot a "merge coun':
    'Step 4: change the merge count (200 / 2000 / 20000), train again each time, and plot "merge count vs compression ratio" - you will see the diminishing-returns curve with your own eyes.',
  '显存爆（OOM）': 'out of memory (OOM)',
  'batch 太大／上下文太长／模型太大': 'batch too large / context too long / model too big',
  '优先降 batch（用梯度累积补回来）；再考虑量化（第 15 章）；最后才是换卡': 'lower batch first (make it up with gradient accumulation); then quantization (Ch. 15); only then a bigger card',
  '上下文一长就崩': 'crashes once context grows long',
  'ctx_len 超过模型的训练长度': 'ctx_len exceeds the model\'s trained length',
  '4096 的模型别喂 8192；长文分段+摘要': 'don\'t feed 8192 to a 4096 model; split long texts + summarize',
  '推理速度极慢': 'inference extremely slow',
  'CPU 跑 fp32、没装 wkv 的 CUDA 算子': 'running fp32 on CPU, or missing the wkv CUDA kernel',
  '用社区编译好的推理项目（ai00／rwkv.cpp），别自己裸跑 for 循环': 'use community-built inference projects (ai00 / rwkv.cpp); don\'t run raw for-loops yourself',
  '浏览器跑不起来': 'browser won\'t run it',
  '浏览器不支持 WebGPU': 'browser lacks WebGPU support',
  '换 Chrome／Edge 新版本（WebGPU 要较新内核）': 'switch to a recent Chrome / Edge (WebGPU needs a modern engine)',
  '量化模型加载失败': 'quantized model fails to load',
  '量化格式版本不匹配（工具迭代快）': 'quantization format version mismatch (tools iterate fast)',
  '用与模型同期的转换工具重新量化': 're-quantize with the converter from the model\'s era',
  'PyTorch 版本对不上': 'PyTorch version mismatch',
  '算子与框架版本绑定': 'kernels are pinned to framework versions',
  '按项目 README 指定的版本装，别追新': 'install exactly the version in the project README; don\'t chase the latest',
  'WSL 里训练显存"少了一半"': 'VRAM "halved" under WSL',
  'WSL 有显存预留机制': 'WSL reserves a chunk of VRAM',
  '大型训练回到双系统或云上跑': 'run big training on dual-boot Linux or the cloud',
  '低配电脑（无独显）': 'low-end PC (no discrete GPU)',
  'rwkv.cpp（C++ 量化推理）': 'rwkv.cpp (C++ quantized inference)',
  'CPU 也能流畅跑量化后的模型': 'even a CPU runs quantized models smoothly',
  '家用游戏本／工作站': 'gaming laptop / workstation',
  'ai00_server（本地推理服务）': 'ai00_server (local inference service)',
  '显卡直跑，速度快；可搭自己的本地聊天服务': 'runs directly on the GPU, fast; build your own local chat service',
  '边缘模组（农机、物联网）': 'edge modules (farm machinery, IoT)',
  '移远通信高算力模组（WAIC 2025 已亮相）': 'Quectel high-compute modules (shown at WAIC 2025)',
  '把 RWKV 装进拖拉机、摄像头、传感器': 'putting RWKV into tractors, cameras, sensors',
  '产业（端侧）': 'industry (edge)',
  '移远通信合作模组落地物联网；Flutter APP 覆盖手机桌面': 'Quectel partnership modules landing in IoT; Flutter app covering phones and desktops',
  'WAIC 2025 亮相端侧方案': 'edge-side solution shown at WAIC 2025',
  '产业（芯片）': 'industry (chips)',
  'RPU 专用芯片计划推进中': 'dedicated RPU chip plan in progress',
  '彭博 2023 年的"决战在硬件"宣言正在兑现（第 17 章）': 'Peng Bo\'s 2023 "the decisive battle is in hardware" declaration is being cashed in (Ch. 17)',
}

# 长前缀匹配（LLM 翻译截断的混合句——按前缀精确替换整条）
PREFIX = {
  'Computers don\'t have mouths, so how do they "guess"? Actually, they\'re solving a probability problem',
  'After seeing "床前明月"',
  'Transformer (called "变换器" in Chinese',
  'In the sentence "Xiaoming gave the apple to Xiaohong',
  'Starting from RWKV-4, every formal paper reports',
  'Fun fact: RWKV is pronounced',
  'Run (type python rwkv_core.py',
  'Beyond evaluation scores, RWKV-7 also received',
  'Run to see output: The first two writes',
  'DeepEmbed (Deep Embedding)',
  'Experiment 1 (manual calculation): The final wkv',
  'Training a BPE vocabulary only takes three loop steps',
  'Initial sequence (split by single characters)',
  'Record the merge rules',
  'After running, you\'ll see that the vocabulary',
  '④ Change the merge count',
  '【Hands-on】Use WebLLM\'s demo page',
}

def main():
    files = ['textbook_en_part12.js', 'textbook_en_part345.js', 'textbook_en_part6.js', 'textbook_en_part7.js']
    # 读 residue 索引：path -> text
    residue = json.load(open('/home/z/my-project/share/projects/6ad85ab25dddfa3997dd173e/tmp/6ad85bcc973da8774906b308_residue.json'))
    # 按文件分组 path
    import re, subprocess
    patched_total = 0
    for f in files:
        path = '/home/z/my-project/share/projects/6ad85ab25dddfa3997dd173e/scripts/' + f
        s = open(path, encoding='utf-8').read()
        patched = 0
        for r in residue:
            if r['path'].split('.')[0] not in f.replace('textbook_en_', 'p').replace('.js', ''):
                # path 前缀映射 p12->part12 等
                pass
        # 简化：直接全文替换（唯一文本级替换，JSON 转义形式与源码形式都试）
        for cn, en in M.items():
            if cn in s:
                s = s.replace(cn, en)
                patched += 1
            else:
                # JSON 转义后的形式（\n、\" 等）
                jcn = json.dumps(cn, ensure_ascii=False)[1:-1]
                jen = json.dumps(en, ensure_ascii=False)[1:-1]
                if jcn in s:
                    s = s.replace(jcn, jen)
                    patched += 1
        open(path, 'w', encoding='utf-8').write(s)
        patched_total += patched
        print(f, '修补', patched, '条')
    print('合计修补', patched_total)

main()
