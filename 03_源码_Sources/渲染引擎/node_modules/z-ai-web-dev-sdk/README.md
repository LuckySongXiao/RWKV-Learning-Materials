# Z AI SDK 使用指南

这个指南说明如何使用 `z-ai-sdk` 与自定义 AI 接口进行交互，包括聊天对话、图片生成、音频处理等功能。

## 目录

- [Z AI SDK 使用指南](#z-ai-sdk-使用指南)
  - [目录](#目录)
  - [1. 配置](#1-配置)
  - [2. 安装](#2-安装)
  - [3. JavaScript/TypeScript API](#3-javascripttypescript-api)
    - [3.1 聊天完成](#31-聊天完成)
    - [3.2 视觉模型聊天](#32-视觉模型聊天)
    - [3.3 文本转语音 (TTS)](#33-文本转语音-tts)
      - [流式传输格式](#流式传输格式)
    - [3.4 语音转文本 (ASR)](#34-语音转文本-asr)
    - [3.5 图片生成](#35-图片生成)
    - [3.6 视频生成](#36-视频生成)
    - [3.7 异步结果查询](#37-异步结果查询)
    - [3.8 函数调用](#38-函数调用)
      - [3.8.1 网页搜索 (web\_search)](#381-网页搜索-web_search)
      - [3.8.2 网页阅读器 (page\_reader)](#382-网页阅读器-page_reader)
  - [4. CLI 工具](#4-cli-工具)
    - [4.1 安装 CLI](#41-安装-cli)
    - [4.2 命令列表](#42-命令列表)
      - [主命令](#主命令)
      - [聊天完成 (`chat`)](#聊天完成-chat)
      - [视觉聊天 (`vision`)](#视觉聊天-vision)
      - [文本转语音 (`tts`)](#文本转语音-tts)
      - [语音转文本 (`asr`)](#语音转文本-asr)
      - [图片生成 (`image`)](#图片生成-image)
      - [视频生成 (`video`)](#视频生成-video)
      - [异步结果查询 (`async-result`)](#异步结果查询-async-result)
      - [函数调用 (`function`)](#函数调用-function)
    - [4.3 使用示例](#43-使用示例)
      - [基本示例](#基本示例)
      - [高级示例](#高级示例)
      - [查看帮助](#查看帮助)
  - [5. 错误处理](#5-错误处理)
  - [6. TypeScript 支持](#6-typescript-支持)
  - [7. 注意事项](#7-注意事项)
  - [许可证](#许可证)
  - [更新日志](#更新日志)
    - [v0.0.11+](#v0011)

## 1. 配置

在使用 SDK 之前，您必须创建一个名为 `.z-ai-config` 的配置文件。SDK 会按以下顺序搜索此文件：

1. 当前项目目录 (`./.z-ai-config`)
2. 用户主目录 (`~/.z-ai-config`)
3. 系统目录 (`/etc/.z-ai-config`)

配置文件必须是有效的 JSON 格式，具有以下结构：

```json
{
  "baseUrl": "YOUR_API_BASE_URL",
  "apiKey": "YOUR_API_KEY",
  "chatId": "OPTIONAL_CHAT_ID",
  "userId": "OPTIONAL_USER_ID"
}
```

**注意**: `baseUrl` 应该包含 `/v1` 前缀（例如：`https://api.example.com/v1`）

## 2. 安装

```bash
npm install z-ai-web-dev-sdk
```

## 3. JavaScript/TypeScript API

### 3.1 聊天完成

```javascript
import ZAI from 'z-ai-web-dev-sdk';

async function main() {
  try {
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: 'Hello, who are you?'
        }
      ],
      thinking: { type: 'disabled' }, // 可选，默认: disabled，可设置为 enabled
      // 其他参数如 temperature, max_tokens 等可以在这里添加
    });

    console.log('完整 API 响应:', completion);
    const messageContent = completion.choices[0]?.message?.content;
    if (messageContent) {
      console.log('助手回复:', messageContent);
    }
  } catch (error) {
    console.error('发生错误:', error.message);
  }
}

main();
```

### 3.2 视觉模型聊天

```javascript
import ZAI from 'z-ai-web-dev-sdk';

async function visionChat() {
  try {
    const zai = await ZAI.create();

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '描述这张图片'
            },
            {
              type: 'image_url',
              image_url: {
                url: 'https://example.com/image.jpg' // url
              }
            },
            {
              type: 'video_url',
              video_url: {
                url: 'https://example.com/image.mp4' // mp4, mkv, mov
              }
            },
            {
              type: 'file_url',
              file_url: {
                url: 'https://example.com/image.pdf' // pdf、txt、word、jsonl、xlsx、pptx...
              }
            }
          ]
        }
      ],
      thinking: { type: 'disabled' } // 可选，默认: disabled，可设置为 enabled
    });

    console.log('视觉模型回复:', response.choices[0]?.message?.content);
  } catch (error) {
    console.error('视觉聊天失败:', error.message);
  }
}

visionChat();
```

### 3.3 文本转语音 (TTS)

```javascript
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function textToSpeech() {
  try {
    const zai = await ZAI.create();

    const response = await zai.audio.tts.create({
      input: '你好，世界！',
      voice: 'tongtong', // 可选，默认: tongtong
      speed: 1.0, // 可选，0.5-2.0
      response_format: 'wav', // 可选: wav, pcm。流式生成音频时，仅支持pcm
      stream: false // 可选: true 为流式输出
    });

    // 返回 Response 对象，可以获取 headers 和 body
    const contentType = response.headers.get('content-type') || '';
    console.log('音频类型:', contentType);
    
    // 获取音频数据
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));
    fs.writeFileSync('./output.wav', buffer);
    console.log('音频已保存到 output.wav');
  } catch (error) {
    console.error('TTS 失败:', error.message);
  }
}

textToSpeech();
```

#### 流式传输格式

当 `stream: true` 时，TTS API 返回 Server-Sent Events (SSE) 格式的流式数据。响应是一个 `ReadableStream`，每行以 `data: ` 开头，包含 JSON 格式的数据。

**流式响应格式示例**：

```
data: {"id":"202512161623516be8a51d20774ea4","created":1765873431,"model":"glm-tts","choices":[{"index":0,"delta":{"role":"assistant","content":"AAAAU74AWAGKAt4DggVMB1IIYwlGCgcLPAs=","return_sample_rate":24000,"return_format":"pcm"}}]}

data: {"id":"202512161623516be8a51d20774ea4","created":1765873431,"model":"glm-tts","choices":[{"index":1,"delta":{"role":"assistant","content":"cAoECYAHAAAAAAAAAAAAAA","return_sample_rate":24000,"return_format":"pcm"}}]}

data: {"choices":[{"finish_reason":"stop","index":3}],"created":1765873432,"id":"202512161623516be8a51d20774ea4","model":"glm-tts"}
```

**流式传输使用示例**：

```javascript
import ZAI from 'z-ai-web-dev-sdk';
import { Readable } from 'stream';

async function streamTTS() {
  try {
    const zai = await ZAI.create();

    const response = await zai.audio.tts.create({
      input: '你好，世界！',
      voice: 'tongtong',
      response_format: 'pcm', // 流式传输仅支持 pcm 格式
      stream: true
    });

    // 从 Response 对象获取 ReadableStream
    if (!response.body) {
      throw new Error('流式响应不可用');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let audioChunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 将 Uint8Array 转换为字符串
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6); // 移除 "data: " 前缀
          if (jsonStr.trim() === '') continue;

          try {
            const data = JSON.parse(jsonStr);
            
            // 检查是否是结束标记
            if (data.choices && data.choices[0]?.finish_reason === 'stop') {
              console.log('流式传输完成');
              break;
            }

            // 提取音频数据（base64 编码的 PCM 数据）
            if (data.choices && data.choices[0]?.delta?.content) {
              const audioBase64 = data.choices[0].delta.content;
              const audioBuffer = Buffer.from(audioBase64, 'base64');
              audioChunks.push(audioBuffer);
              console.log(`收到音频块，大小: ${audioBuffer.length} 字节`);
            }
          } catch (e) {
            console.error('解析 JSON 失败:', e, '原始数据:', jsonStr);
          }
        }
      }
    }

    // 合并所有音频块
    if (audioChunks.length > 0) {
      const finalAudio = Buffer.concat(audioChunks);
      fs.writeFileSync('./output.pcm', finalAudio);
      console.log('流式音频已保存到 output.pcm');
    }
  } catch (error) {
    console.error('流式 TTS 失败:', error.message);
  }
}

streamTTS();
```

**响应数据结构**：

- **中间数据块**：包含 `choices[].delta.content` 字段，值为 base64 编码的 PCM 音频数据
- **结束数据块**：包含 `choices[].finish_reason: "stop"` 字段，表示流式传输结束
- 每个数据块都包含 `id`、`created`、`model` 等元数据字段

**注意事项**：
- 流式传输时，`response_format` 必须设置为 `pcm`
- `content` 字段中的音频数据是 base64 编码的 PCM 格式
- 需要手动解析 SSE 格式并提取音频数据块
- 所有音频块需要合并后才能得到完整的音频文件

### 3.4 语音转文本 (ASR)

```javascript
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function speechToText() {
  try {
    const zai = await ZAI.create();

    // 读取音频文件并转换为 base64
    const audioFile = fs.readFileSync('./audio.wav');
    const base64 = audioFile.toString('base64');

    const response = await zai.audio.asr.create({
      file_base64: base64 // 或使用 file 参数
    });

    console.log('识别结果:', response.text);
  } catch (error) {
    console.error('ASR 失败:', error.message);
  }
}

speechToText();
```

### 3.5 图片生成

```javascript
import ZAI from 'z-ai-web-dev-sdk';

async function generateImage() {
  try {
    const zai = await ZAI.create();

    const response = await zai.images.generations.create({
      prompt: '一只可爱的小猫咪', // 必需
      size: '1024x1024' // 可选：1024x1024, 768x1344, 864x1152, 1344x768, 1152x864, 1440x720, 720x1440
    });

    // 获取 base64 格式的图片数据
    const imageBase64 = response.data[0].base64;
    console.log('图片 base64 数据:', imageBase64);

    // 可以直接在 HTML 中使用：
    // <img src="data:image/png;base64,${imageBase64}" alt="Generated Image" />
  } catch (error) {
    console.error('图片生成失败:', error.message);
  }
}

generateImage();
```

**支持的尺寸**: `1024x1024`, `768x1344`, `864x1152`, `1344x768`, `1152x864`, `1440x720`, `720x1440`

### 3.6 视频生成

视频生成是异步任务，需要先创建任务，然后查询结果。

```javascript
import ZAI from 'z-ai-web-dev-sdk';

async function generateVideo() {
  try {
    const zai = await ZAI.create();

    // 创建视频生成任务
    const task = await zai.video.generations.create({
      prompt: 'A cat is playing with a ball.',
      quality: 'speed', // 或 'quality'
      with_audio: false,
      size: '1920x1080',
      fps: 30,
      duration: 5
    });

    console.log('Task ID:', task.id);
    console.log('Task Status:', task.task_status);

    // 轮询查询结果
    let result = await zai.async.result.query(task.id);
    let pollCount = 0;
    const maxPolls = 60;
    const pollInterval = 5000; // 5 seconds

    while (result.task_status === 'PROCESSING' && pollCount < maxPolls) {
      pollCount++;
      console.log(`Polling ${pollCount}/${maxPolls}: Status is ${result.task_status}`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      result = await zai.async.result.query(task.id);
    }

    if (result.task_status === 'SUCCESS') {
      // 获取视频URL
      const videoUrl = result.video_result?.[0]?.url || 
                       result.video_url || 
                       result.url || 
                       result.video;
      console.log('Video URL:', videoUrl);
    } else {
      console.log('Task failed or still processing');
    }
  } catch (error) {
    console.error('Video generation failed:', error.message);
  }
}

generateVideo();
```

**支持的参数**:
- `prompt` (可选): 视频的文本描述
- `image_url` (可选): 图片URL，可以是字符串（单张图片）或字符串数组（首尾帧模式，2张图片）
- `quality` (可选): 输出模式 `speed` 或 `quality`（默认: `speed`）
- `with_audio` (可选): 是否生成AI音效（默认: `false`）
- `size` (可选): 视频分辨率，如 `"1920x1080"`
- `fps` (可选): 视频帧率 `30` 或 `60`（默认: `30`）
- `duration` (可选): 视频时长（秒）`5` 或 `10`（默认: `5`）
- `model` (可选): 模型名称

**响应格式**:
- 创建任务返回: `{ id: string, task_status: 'PROCESSING' | 'SUCCESS' | 'FAIL', ... }`
- 查询结果返回: `{ task_status: 'PROCESSING' | 'SUCCESS' | 'FAIL', video_result: [{ url: string }], ... }`

### 3.7 异步结果查询

查询任何异步任务的结果（如视频生成）：

```javascript
import ZAI from 'z-ai-web-dev-sdk';

async function queryAsyncResult() {
  try {
    const zai = await ZAI.create();

    const taskId = 'your-task-id';
    const result = await zai.async.result.query(taskId);

    console.log('Task Status:', result.task_status);
    
    if (result.task_status === 'SUCCESS') {
      // 视频生成结果
      const videoUrl = result.video_result?.[0]?.url || 
                       result.video_url || 
                       result.url || 
                       result.video;
      if (videoUrl) {
        console.log('Video URL:', videoUrl);
      }
    } else if (result.task_status === 'PROCESSING') {
      console.log('Task is still processing');
    } else {
      console.log('Task failed');
    }
  } catch (error) {
    console.error('Query failed:', error.message);
  }
}

queryAsyncResult();
```

### 3.8 函数调用

#### 3.8.1 网页搜索 (web_search)

```javascript
import ZAI from 'z-ai-web-dev-sdk';

async function invokeWebSearch() {
  try {
    const zai = await ZAI.create();

    // 调用 web_search 函数
    const results = await zai.functions.invoke('web_search', {
      query: 'TypeScript 最新特性',
      num: 5,
      recency_days: 10
    });

    console.log('搜索结果:', results);
  } catch (error) {
    console.error('函数调用失败:', error.message);
  }
}

invokeWebSearch();
```

#### 3.8.2 网页阅读器 (page_reader)

`page_reader` 函数可以读取并解析网页内容，返回页面的 HTML、标题、发布时间等信息。

```javascript
import ZAI from 'z-ai-web-dev-sdk';

async function invokePageReader() {
  try {
    const zai = await ZAI.create();

    // 调用 page_reader 函数
    const result = await zai.functions.invoke('page_reader', {
      url: 'https://example.com'
    });

    console.log('页面标题:', result.data.title);
    console.log('页面URL:', result.data.url);
    console.log('发布时间:', result.data.publishedTime);
    console.log('HTML内容:', result.data.html);
    console.log('Token使用量:', result.data.usage.tokens);
  } catch (error) {
    console.error('函数调用失败:', error.message);
  }
}

invokePageReader();
```

**返回数据结构**:
- `code`: 响应代码
- `data`: 页面数据
  - `html`: 页面的 HTML 内容
  - `title`: 页面标题
  - `url`: 页面 URL
  - `publishedTime`: 发布时间（可选）
  - `usage.tokens`: Token 使用量
- `meta`: 元数据
  - `usage.tokens`: Token 使用量
- `status`: 状态码

## 4. CLI 工具

SDK 提供了功能完整的命令行工具，支持所有 API 功能。

### 4.1 安装 CLI

全局安装 SDK 以使用 CLI 命令：

```bash
npm install -g z-ai-web-dev-sdk
```

安装后可以使用以下命令：
- `z-ai` - 主命令（推荐）
- `z-ai-generate` - 图片生成命令（向后兼容）

### 4.2 命令列表

#### 主命令

```bash
z-ai <命令> [选项]
```

可用命令：
- `chat` - 聊天完成
- `vision` - 视觉模型聊天
- `tts` - 文本转语音
- `asr` - 语音转文本
- `image` - 图片生成
- `video` - 视频生成
- `async-result` - 查询异步结果
- `function` - 函数调用

#### 聊天完成 (`chat`)

```bash
z-ai chat --prompt "你好" --output response.json
z-ai chat -p "解释量子计算" --system "你是一个专业的物理学家" --thinking
```

**参数**:
- `--prompt, -p <文本>`: **必需** - 用户消息内容
- `--system, -s <文本>`: 可选 - 系统提示词
- `--thinking, -t`: 可选 - 启用思维链（默认: disabled，传入此参数即启用）
- `--output, -o <路径>`: 可选 - 输出文件路径（JSON格式）
- `--stream`: 可选 - 流式输出

#### 视觉聊天 (`vision`)

```bash
z-ai vision --prompt "描述这张图片" --image "https://example.com/image.jpg"
z-ai vision -p "这是什么？" -i "./photo.jpg" -i "./photo2.jpg" --thinking -o response.json
```

**参数**:
- `--prompt, -p <文本>`: **必需** - 用户消息内容
- `--image, -i <URL或路径>`: 可选 - 图片URL或本地文件路径（可多次使用添加多张图片）
- `--thinking, -t`: 可选 - 启用思维链（默认: disabled，传入此参数即启用）
- `--output, -o <路径>`: 可选 - 输出文件路径（JSON格式）
- `--stream`: 可选 - 流式输出

#### 文本转语音 (`tts`)

```bash
z-ai tts --input "你好，世界" --output "./output.wav"
z-ai tts -i "Hello World" -o "./hello.mp3" --voice "tongtong" --speed 1.2
```

**参数**:
- `--input, -i <文本>`: **必需** - 要转换的文本
- `--output, -o <路径>`: **必需** - 输出音频文件路径
- `--voice, -v <声音>`: 可选 - 声音类型（默认: tongtong）
- `--speed, -s <数字>`: 可选 - 语速（0.5-2.0，默认: 1.0）
- `--format, -f <格式>`: 可选 - 输出格式（wav, mp3, pcm，默认: wav）
- `--stream`: 可选 - 流式输出

#### 语音转文本 (`asr`)

```bash
z-ai asr --file "./audio.wav" --output transcript.json
z-ai asr -f "./recording.mp3" -o result.json
```

**参数**:
- `--file, -f <路径>`: **必需**（与 --base64 二选一） - 音频文件路径
- `--base64, -b <base64>`: **必需**（与 --file 二选一） - 音频文件的base64编码
- `--output, -o <路径>`: 可选 - 输出文件路径（JSON格式）
- `--stream`: 可选 - 流式输出

#### 图片生成 (`image`)

```bash
z-ai image --prompt "一只可爱的小猫" --output "./cat.png"
z-ai image -p "美丽的风景" -o "./landscape.png" -s 1344x768
```

**参数**:
- `--prompt, -p <文本>`: **必需** - 图片描述文本
- `--output, -o <路径>`: **必需** - 输出图片文件路径（png 格式）
- `--size, -s <尺寸>`: 可选 - 图片尺寸（默认: 1024x1024）
  - 支持的尺寸: `1024x1024`, `768x1344`, `864x1152`, `1344x768`, `1152x864`, `1440x720`, `720x1440`

#### 视频生成 (`video`)

```bash
z-ai video --prompt "A cat is playing with a ball" --poll
z-ai video -p "Beautiful landscape" -q quality --size "1920x1080" --fps 60 --poll
z-ai video --image-url "https://example.com/image.png" --prompt "Make the scene move" --poll
```

**参数**:
- `--prompt, -p <文本>`: 可选 - 视频的文本描述
- `--image-url, -i <URL>`: 可选 - 图片URL（单张图片或首尾帧数组，用逗号分隔）
- `--quality, -q <模式>`: 可选 - 输出模式 `speed` 或 `quality`（默认: `speed`）
- `--with-audio`: 可选 - 是否生成AI音效（默认: `false`）
- `--size, -s <尺寸>`: 可选 - 视频分辨率，如 `"1920x1080"`
- `--fps <帧率>`: 可选 - 视频帧率 `30` 或 `60`（默认: `30`）
- `--duration, -d <时长>`: 可选 - 视频时长（秒）`5` 或 `10`（默认: `5`）
- `--model, -m <模型>`: 可选 - 模型名称
- `--poll`: 可选 - 自动轮询直到任务完成
- `--poll-interval <秒>`: 可选 - 轮询间隔（秒）（默认: `5`）
- `--max-polls <次数>`: 可选 - 最大轮询次数（默认: `60`）
- `--output, -o <路径>`: 可选 - 输出结果文件路径（JSON格式）

**示例**:
```bash
# 创建视频生成任务（不轮询）
z-ai video --prompt "A cat playing" --size "1920x1080"

# 创建任务并自动轮询直到完成
z-ai video --prompt "Beautiful sunset" --poll

# 使用图片生成视频
z-ai video --image-url "https://example.com/image.png" --prompt "Make it move" --poll

# 首尾帧模式（两张图片）
z-ai video --image-url "https://example.com/frame1.png,https://example.com/frame2.png" --prompt "Smooth transition" --poll
```

#### 异步结果查询 (`async-result`)

```bash
z-ai async-result --id "16591731777601843-8059626559669415615"
z-ai async-result -i "task-id-123" --poll
z-ai async-result --id "task-id-123" --poll --poll-interval 10 --max-polls 30
```

**参数**:
- `--id, -i <任务ID>`: **必需** - 任务ID
- `--poll`: 可选 - 自动轮询直到任务完成
- `--poll-interval <秒>`: 可选 - 轮询间隔（秒）（默认: `5`）
- `--max-polls <次数>`: 可选 - 最大轮询次数（默认: `60`）
- `--output, -o <路径>`: 可选 - 输出结果文件路径（JSON格式）

**示例**:
```bash
# 查询一次结果
z-ai async-result --id "task-id-123"

# 自动轮询直到完成
z-ai async-result -i "task-id-123" --poll

# 自定义轮询参数
z-ai async-result --id "task-id-123" --poll --poll-interval 10 --max-polls 30 -o result.json
```

#### 函数调用 (`function`)

**网页搜索示例**:
```bash
z-ai function --name "web_search" --args '{"query": "AI", "num": 5}'
z-ai function -n web_search -a '{"query": "TypeScript", "num": 3}' -o result.json
```

**网页阅读器示例**:
```bash
z-ai function --name "page_reader" --args '{"url": "https://example.com"}'
z-ai function -n page_reader -a '{"url": "https://www.google.com"}' -o page.json
```

**参数**:
- `--name, -n <函数名>`: **必需** - 函数名称（如: `web_search`, `page_reader`）
- `--args, -a <JSON>`: **必需** - 函数参数（JSON格式）
  - `web_search`: `{"query": "搜索关键词", "num": 5, "recency_days": 10}`
  - `page_reader`: `{"url": "https://example.com"}`
- `--output, -o <路径>`: 可选 - 输出文件路径（JSON格式）

### 4.3 使用示例

#### 基本示例

```bash
# 聊天对话
z-ai chat -p "什么是人工智能？" -o response.json

# 视觉分析
z-ai vision -p "这张图片里有什么？" -i "./photo.jpg"

# 文本转语音
z-ai tts -i "欢迎使用 Z AI SDK" -o welcome.wav

# 语音识别
z-ai asr -f recording.wav -o transcript.json

# 图片生成
z-ai image -p "未来城市" -o future_city.png

# 函数调用 - 网页搜索
z-ai function -n web_search -a '{"query": "最新AI技术", "num": 5}'

# 函数调用 - 网页阅读器
z-ai function -n page_reader -a '{"url": "https://example.com"}' -o page.json

# 视频生成（自动轮询）
z-ai video -p "A beautiful sunset" --poll

# 查询异步结果
z-ai async-result -i "task-id-123" --poll
```

#### 高级示例

```bash
# 带系统提示词的聊天
z-ai chat \
  --prompt "解释相对论" \
  --system "你是一个物理学家，用简单易懂的方式解释复杂概念" \
  --output physics_explanation.json

# 多图片视觉分析
z-ai vision \
  -p "比较这两张图片的差异" \
  -i "./image1.jpg" \
  -i "./image2.jpg" \
  -o comparison.json

# 高质量语音生成
z-ai tts \
  -i "这是一段高质量的语音合成测试" \
  -o high_quality.wav \
  --voice "tongtong" \
  --speed 1.1 \
  --format wav

# 生成宽屏图片
z-ai image \
  -p "壮观的日出景色，4K高清" \
  -o sunrise.png \
  -s 1440x720

# 视频生成并自动轮询
z-ai video \
  -p "A cat playing with a ball" \
  --quality quality \
  --size "1920x1080" \
  --fps 60 \
  --poll \
  -o video_task.json

# 使用图片生成视频
z-ai video \
  --image-url "https://example.com/image.png" \
  -p "Make the scene move" \
  --poll

# 查询异步结果（自动轮询）
z-ai async-result \
  -i "task-id-123" \
  --poll \
  --poll-interval 10 \
  --max-polls 30 \
  -o result.json
```

#### 查看帮助

```bash
# 主帮助
z-ai --help

# 命令帮助
z-ai chat --help
z-ai vision --help
z-ai tts --help
z-ai asr --help
z-ai image --help
z-ai video --help
z-ai async-result --help
z-ai function --help
```

## 5. 错误处理

```javascript
try {
  const zai = await ZAI.create();
  // API 调用...
} catch (error) {
  if (error.message.includes('Configuration file not found')) {
    console.error('请创建 .z-ai-config 配置文件');
  } else if (error.message.includes('API request failed')) {
    console.error('API 请求失败，请检查网络连接和配置');
  } else {
    console.error('未知错误:', error.message);
  }
}
```

## 6. TypeScript 支持

SDK 完全支持 TypeScript，提供完整的类型定义：

```typescript
import ZAI, {
  CreateChatCompletionBody,
  CreateChatCompletionVisionBody,
  CreateAudioTTSBody,
  CreateAudioASRBody,
  CreateImageGenerationBody,
  CreateVideoGenerationBody,
  VideoGenerationResponse,
  AsyncResultResponse,
  ImageGenerationResponse,
  VisionMessage,
  VisionMultimodalContentItem
} from 'z-ai-web-dev-sdk';

// 聊天完成
const chatRequest: CreateChatCompletionBody = {
  messages: [
    { role: 'user', content: 'Hello' }
  ]
};

// 视觉聊天
const visionRequest: CreateChatCompletionVisionBody = {
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: '描述图片' },
        { type: 'image_url', image_url: { url: 'https://example.com/img.jpg' } }
      ]
    }
  ]
};

// 图片生成
const imageRequest: CreateImageGenerationBody = {
  prompt: '美丽的花朵',
  size: '1024x1024'
};

// 视频生成
const videoRequest: CreateVideoGenerationBody = {
  prompt: 'A cat playing with a ball',
  quality: 'speed',
  size: '1920x1080',
  fps: 30,
  duration: 5
};
```

## 7. 注意事项

- ✅ 确保配置文件中的 `baseUrl` 和 `apiKey` 正确
- ✅ `baseUrl` 应该包含 `/v1` 前缀
- ✅ CLI 工具会自动创建输出目录（如果不存在）
- ✅ 图片生成返回 base64 格式，可直接用于 HTML
- ✅ TTS 和 ASR 支持多种音频格式
- ✅ 视觉模型支持多图片输入
- ✅ 函数调用提供类型安全的接口（支持 `web_search` 和 `page_reader`）
- ✅ 视频生成是异步任务，需要轮询查询结果
- ✅ 视频生成支持文本转视频、图片转视频、首尾帧转视频等多种模式
- ✅ 建议在生产环境中添加适当的错误处理和重试机制
- ✅ 所有 CLI 命令都支持 `--help` 查看详细帮助

## 许可证

ISC

## 更新日志

### v0.0.11+
- ✨ 新增视觉模型聊天支持
- ✨ 新增文本转语音 (TTS) 功能
- ✨ 新增语音转文本 (ASR) 功能
- ✨ 新增函数调用功能
- ✨ 新增视频生成功能
- ✨ 新增异步结果查询功能
- ✨ 完整的 CLI 工具支持所有功能
- 🔄 保持向后兼容性
