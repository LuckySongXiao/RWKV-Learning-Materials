#!/usr/bin/env bun
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
// Dynamically import ZAI, supporting global installation (Node.js and Bun)
async function getZAI() {
    try {
        // Try importing from package name (when globally installed)
        const packageName = 'z-ai-web-dev-sdk';
        const { default: ZAI } = await import(packageName);
        return ZAI;
    }
    catch (error1) {
        try {
            // Try importing directly from global node_modules (container environment fix)
            const globalPackagePath = '/usr/lib/node_modules/z-ai-web-dev-sdk/dist/index.js';
            const { default: ZAI } = await import(globalPackagePath);
            return ZAI;
        }
        catch (error2) {
            try {
                // Dynamically get global path (supporting Node.js and Bun)
                const { execSync } = await import('child_process');
                let globalRoot = '';
                // Detect runtime environment: check Bun global object or process.versions.bun
                const isBun = (typeof globalThis.Bun !== 'undefined') ||
                    (typeof process !== 'undefined' && process.versions.bun);
                if (isBun) {
                    // Bun environment: try multiple ways to find global package path
                    const homeDir = os.homedir();
                    const possiblePaths = [
                        path.join(homeDir, '.bun', 'install', 'global'),
                        path.join(homeDir, '.bun', 'bin', 'node_modules'),
                        '/usr/local/lib/bun/install/global',
                    ];
                    // Try using bun pm cache command to get cache path
                    try {
                        const bunCache = execSync('bun pm cache', { encoding: 'utf-8' }).trim();
                        possiblePaths.unshift(path.join(bunCache, 'global'));
                    }
                    catch {
                        // Ignore error, continue with other paths
                    }
                    // Try each possible path
                    let found = false;
                    for (const possiblePath of possiblePaths) {
                        try {
                            const testPath = path.join(possiblePath, 'z-ai-web-dev-sdk', 'dist', 'index.js');
                            await fs.access(testPath);
                            globalRoot = possiblePath;
                            found = true;
                            break;
                        }
                        catch {
                            // Continue trying next path
                        }
                    }
                    // If all paths failed, use the first default path
                    if (!found) {
                        globalRoot = possiblePaths[0];
                    }
                }
                else {
                    // Node.js environment: use npm root -g
                    globalRoot = execSync('npm root -g', { encoding: 'utf-8' }).trim();
                }
                // Ensure globalRoot is assigned
                if (!globalRoot) {
                    throw new Error('Unable to determine global package path');
                }
                const globalPackagePath = path.join(globalRoot, 'z-ai-web-dev-sdk', 'dist', 'index.js');
                const { default: ZAI } = await import(globalPackagePath);
                return ZAI;
            }
            catch (error3) {
                // Finally fallback to relative path import (for development)
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = path.dirname(__filename);
                const indexPath = path.resolve(__dirname, './index.js');
                const { default: ZAI } = await import(indexPath);
                return ZAI;
            }
        }
    }
}
// Generic parameter parsing function
function parseKeyValueArgs(args) {
    const result = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const nextArg = args[i + 1];
            if (nextArg && !nextArg.startsWith('--')) {
                result[key] = nextArg;
                i++;
            }
            else {
                result[key] = 'true';
            }
        }
        else if (arg.startsWith('-') && arg.length === 2) {
            const key = arg.slice(1);
            const nextArg = args[i + 1];
            if (nextArg && !nextArg.startsWith('-')) {
                result[key] = nextArg;
                i++;
            }
            else {
                result[key] = 'true';
            }
        }
    }
    return result;
}
// Show main help information
function showMainHelp() {
    console.log(`
Z-AI SDK CLI - Multi-purpose AI Tool

Usage:
  z-ai <command> [options]
  z-ai-generate [options]  # Backward compatible: image generation

Commands:
  chat         Chat completion
  vision       Vision model chat
  tts          Text to speech
  asr          Speech to text
  image        Image generation
  image-edit   Image editing
  image-search Image search (ZAI in-house, returns OSS-hosted URLs)
  video        Video generation
  async-result Query async result
  function     Function invocation

Use "z-ai <command> --help" to view help for specific commands
`);
}
// Show chat completion help
function showChatHelp() {
    console.log(`
Z-AI SDK CLI - Chat Completion

Usage:
  z-ai chat [options]

Options:
  --prompt, -p <text>     Required: User message content
  --system, -s <text>    Optional: System prompt
  --thinking, -t         Optional: Enable thinking chain (default: disabled)
  --output, -o <path>     Optional: Output file path (JSON format)
  --stream                Optional: Stream output
  --help, -h              Show help information

Examples:
  z-ai chat --prompt "Hello" --output response.json
  z-ai chat -p "Explain quantum computing" --system "You are a professional physicist" --thinking
`);
}
// Show vision chat help
function showVisionHelp() {
    console.log(`
Z-AI SDK CLI - Vision Model Chat

Usage:
  z-ai vision [options]

Options:
  --prompt, -p <text>        Required: User message content
  --image, -i <URL or path>  Optional: Image URL or local file path (can be used multiple times)
  --thinking, -t             Optional: Enable thinking chain (default: disabled)
  --output, -o <path>         Optional: Output file path (JSON format)
  --stream                    Optional: Stream output
  --help, -h                  Show help information

Examples:
  z-ai vision --prompt "Describe this image" --image "https://example.com/image.jpg"
  z-ai vision -p "What is this?" -i "./photo.jpg" --thinking -o response.json
`);
}
// Show TTS help
function showTTSHelp() {
    console.log(`
Z-AI SDK CLI - Text to Speech

Usage:
  z-ai tts [options]

Options:
  --input, -i <text>       Required: Text to convert
  --output, -o <path>      Required: Output audio file path
  --voice, -v <voice>     Optional: Voice type (default: tongtong)
  --speed, -s <number>    Optional: Speech rate (0.5-2.0, default: 1.0)
  --format, -f <format>   Optional: Output format (wav, mp3, pcm, default: wav)
  --stream                 Optional: Stream output
  --help, -h               Show help information

Examples:
  z-ai tts --input "Hello, world" --output "./output.wav"
  z-ai tts -i "Hello World" -o "./hello.mp3" -v "tongtong" -s 1.2
`);
}
// Show ASR help
function showASRHelp() {
    console.log(`
Z-AI SDK CLI - Speech to Text

Usage:
  z-ai asr [options]

Options:
  --file, -f <path>        Required: Audio file path (or use --base64)
  --base64, -b <base64>    Optional: Base64 encoded audio file
  --output, -o <path>       Optional: Output file path (JSON format)
  --stream                  Optional: Stream output
  --help, -h                Show help information

Examples:
  z-ai asr --file "./audio.wav" --output transcript.json
  z-ai asr -f "./recording.mp3" -o result.json
`);
}
// Show image generation help
function showImageHelp() {
    console.log(`
Z-AI SDK CLI - Image Generation

Usage:
  z-ai image [options]
  z-ai-generate [options]  # Backward compatible

Options:
  --prompt, -p <text>     Required: Image description text
  --output, -o <path>     Required: Output image file path (png format)
  --size, -s <size>       Optional: Image size (default: 1024x1024)
                         Supported sizes: 1024x1024, 768x1344, 864x1152, 
                                        1344x768, 1152x864, 1440x720, 720x1440
  --help, -h              Show help information

Examples:
  z-ai image --prompt "A cute kitten" --output "./cat.png"
  z-ai-generate -p "Beautiful landscape" -o "./landscape.png" -s 1344x768
`);
}
// Show image edit help
function showImageEditHelp() {
    console.log(`
Z-AI SDK CLI - Image Editing

Usage:
  z-ai image-edit [options]

Options:
  --prompt, -p <text>     Required: Image editing description
  --image, -i <URL/path>  Required: Original image URL or local file path
  --output, -o <path>     Required: Output image file path (png format)
  --size, -s <size>       Optional: Image size (default: 1024x1024)
                         Supported sizes: 1024x1024, 768x1344, 864x1152,
                                        1344x768, 1152x864, 1440x720, 720x1440
  --help, -h              Show help information

Examples:
  z-ai image-edit --prompt "把背景改成蓝天白云" --image "./photo.png" --output "./edited.png"
  z-ai image-edit -p "Add a hat to the person" -i "https://example.com/image.png" -o "./result.png"
`);
}
// Show image search help
function showImageSearchHelp() {
    console.log(`
Z-AI SDK CLI - Image Search (ZAI in-house service)

Usage:
  z-ai image-search [options]

Searches public web images for a natural-language query, re-hosts each hit on
OSS so the URL is embeddable, and (by default) attaches a short Gemini caption.

Options:
  --query, -q <text>      Required: natural-language description of the image
  --count, -c <n>         Optional: number of results, default 10, max ~20
  --gl <region>           Optional: region code, default cn (cn|us|jp|kr|...)
  --no-rank               Optional: disable Gemini captioning (faster)
  --output, -o <path>     Optional: write full JSON response to file
  --help, -h              Show help information

Examples:
  z-ai image-search -q "a cute orange tabby kitten playing with yarn"
  z-ai image-search -q "vintage red sports car" --count 5 --gl us --no-rank
  z-ai image-search -q "中国传统水墨山水画" -c 8 -o results.json
`);
}
// Show video generation help
function showVideoHelp() {
    console.log(`
Z-AI SDK CLI - Video Generation

Usage:
  z-ai video [options]

Options:
  --prompt, -p <text>          Optional: Video description text
  --image-url, -i <URL>        Optional: Image URL (single image or first/last frame array)
  --quality, -q <mode>         Optional: Output mode speed or quality (default: speed)
  --with-audio                 Optional: Generate AI audio (default: false)
  --size, -s <size>            Optional: Video resolution, e.g. "1920x1080"
  --fps <fps>                  Optional: Video frame rate 30 or 60 (default: 30)
  --duration, -d <seconds>     Optional: Video duration in seconds 5 or 10 (default: 5)
  --model, -m <model>         Optional: Model name
  --poll                       Optional: Auto-poll until task completes
  --poll-interval <seconds>    Optional: Polling interval in seconds (default: 5)
  --max-polls <count>          Optional: Maximum polling count (default: 60)
  --output, -o <path>          Optional: Output result file path (JSON format)
  --help, -h                   Show help information

Examples:
  z-ai video --prompt "A cat is playing with a ball" --poll
  z-ai video -p "Beautiful landscape" -q quality --size "1920x1080" --fps 60 --poll
  z-ai video --image-url "https://example.com/image.png" --prompt "Make the scene move" --poll
`);
}
// Show async result query help
function showAsyncResultHelp() {
    console.log(`
Z-AI SDK CLI - Query Async Result

Usage:
  z-ai async-result [options]

Options:
  --id, -i <task-id>          Required: Task ID
  --poll                       Optional: Auto-poll until task completes
  --poll-interval <seconds>    Optional: Polling interval in seconds (default: 5)
  --max-polls <count>          Optional: Maximum polling count (default: 60)
  --output, -o <path>          Optional: Output result file path (JSON format)
  --help, -h                   Show help information

Examples:
  z-ai async-result --id "16591731777601843-8059626559669415615"
  z-ai async-result -i "task-id-123" --poll
  z-ai async-result --id "task-id-123" --poll --poll-interval 10 --max-polls 30
`);
}
// Show function invocation help
function showFunctionHelp() {
    console.log(`
Z-AI SDK CLI - Function Invocation

Usage:
  z-ai function [options]

Options:
  --name, -n <name>        Required: Function name (e.g.: web_search)
  --args, -a <JSON>        Required: Function arguments (JSON format)
  --output, -o <path>       Optional: Output file path (JSON format)
  --help, -h                Show help information

Examples:
  z-ai function --name "web_search" --args '{"query": "AI", "num": 5}'
  z-ai function -n web_search -a '{"query": "TypeScript", "num": 3}' -o result.json
`);
}
// Utility functions
function base64ToBuffer(base64Data) {
    return Buffer.from(base64Data, 'base64');
}
async function saveFile(content, outputPath) {
    try {
        const outputDir = path.dirname(outputPath);
        await fs.mkdir(outputDir, { recursive: true });
        if (Buffer.isBuffer(content)) {
            await fs.writeFile(outputPath, content);
        }
        else {
            await fs.writeFile(outputPath, content, 'utf-8');
        }
        console.log(`✅ File saved to: ${outputPath}`);
    }
    catch (error) {
        throw new Error(`Failed to save file: ${error}`);
    }
}
async function readFileAsBase64(filePath) {
    try {
        const buffer = await fs.readFile(filePath);
        return buffer.toString('base64');
    }
    catch (error) {
        throw new Error(`Failed to read file: ${error}`);
    }
}
// Handle streaming response (SSE format)
async function handleStreamResponse(stream, outputPath) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    const outputLines = [];
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '' || data === '[DONE]')
                        continue;
                    try {
                        const json = JSON.parse(data);
                        // Process SSE data
                        if (json.choices && json.choices[0]) {
                            const choice = json.choices[0];
                            if (choice.delta && choice.delta.content) {
                                const content = choice.delta.content;
                                process.stdout.write(content);
                                fullContent += content;
                                outputLines.push(JSON.stringify(json, null, 2));
                            }
                        }
                        else {
                            // Output JSON directly
                            outputLines.push(JSON.stringify(json, null, 2));
                            console.log(JSON.stringify(json, null, 2));
                        }
                    }
                    catch (e) {
                        // Ignore JSON parsing errors
                    }
                }
            }
        }
        // Output newline
        console.log('');
        // If output file is specified, save full content
        if (outputPath) {
            if (fullContent) {
                await saveFile(fullContent, outputPath);
            }
            else if (outputLines.length > 0) {
                await saveFile(outputLines.join('\n'), outputPath);
            }
        }
    }
    catch (error) {
        console.error('❌ Failed to process streaming response:', error);
        throw error;
    }
    finally {
        reader.releaseLock();
    }
}
// Handle chat completion command
async function handleChat(args, client) {
    const params = parseKeyValueArgs(args);
    if (params.help || params.h) {
        showChatHelp();
        return;
    }
    const prompt = params.prompt || params.p;
    if (!prompt) {
        console.error('❌ Error: Missing required parameter --prompt');
        showChatHelp();
        process.exit(1);
    }
    const messages = [];
    if (params.system || params.s) {
        messages.push({
            role: 'system',
            content: params.system || params.s,
        });
    }
    messages.push({
        role: 'user',
        content: prompt,
    });
    const body = {
        messages,
    };
    // Handle thinking parameter (boolean flag, enabled if provided, default disabled)
    if (params.thinking || params.t) {
        body.thinking = { type: 'enabled' };
    }
    else {
        body.thinking = { type: 'disabled' };
    }
    if (params.stream) {
        body.stream = true;
    }
    console.log('🚀 Sending chat request...');
    const response = await client.chat.completions.create(body);
    // Handle streaming response
    if (body.stream && response && typeof response.getReader === 'function') {
        await handleStreamResponse(response, params.output || params.o);
        return;
    }
    const output = params.output || params.o;
    if (output) {
        await saveFile(JSON.stringify(response, null, 2), output);
    }
    else {
        console.log(JSON.stringify(response, null, 2));
    }
}
// Handle vision chat command
async function handleVision(args, client) {
    const params = parseKeyValueArgs(args);
    if (params.help || params.h) {
        showVisionHelp();
        return;
    }
    const prompt = params.prompt || params.p;
    if (!prompt) {
        console.error('❌ Error: Missing required parameter --prompt');
        showVisionHelp();
        process.exit(1);
    }
    const content = [{ type: 'text', text: prompt }];
    // Handle image parameters (possibly multiple) - extract from original args
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--image' || arg === '-i') {
            const imageArg = args[i + 1];
            if (imageArg && !imageArg.startsWith('-')) {
                let imageUrl = imageArg;
                // If it's a local file path, need to convert to base64
                if (!imageArg.startsWith('http://') && !imageArg.startsWith('https://') && !imageArg.startsWith('data:')) {
                    // Local file, read as base64
                    try {
                        const base64 = await readFileAsBase64(imageArg);
                        // Determine MIME type based on file extension
                        const ext = path.extname(imageArg).toLowerCase();
                        const mimeTypes = {
                            '.jpg': 'image/jpeg',
                            '.jpeg': 'image/jpeg',
                            '.png': 'image/png',
                            '.gif': 'image/gif',
                            '.webp': 'image/webp',
                        };
                        const mimeType = mimeTypes[ext] || 'image/jpeg';
                        imageUrl = `data:${mimeType};base64,${base64}`;
                    }
                    catch (error) {
                        console.error(`❌ Unable to read image file: ${imageArg}`);
                        process.exit(1);
                    }
                }
                content.push({
                    type: 'image_url',
                    image_url: { url: imageUrl },
                });
                i++; // Skip processed image parameter value
            }
        }
    }
    const body = {
        messages: [
            {
                role: 'user',
                content,
            },
        ],
    };
    // Handle thinking parameter (boolean flag, enabled if provided, default disabled)
    if (params.thinking || params.t) {
        body.thinking = { type: 'enabled' };
    }
    else {
        body.thinking = { type: 'disabled' };
    }
    if (params.stream) {
        body.stream = true;
    }
    console.log('🚀 Sending vision chat request...');
    const response = await client.chat.completions.createVision(body);
    // Handle streaming response
    if (body.stream && response && typeof response.getReader === 'function') {
        await handleStreamResponse(response, params.output || params.o);
        return;
    }
    const output = params.output || params.o;
    if (output) {
        await saveFile(JSON.stringify(response, null, 2), output);
    }
    else {
        console.log(JSON.stringify(response, null, 2));
    }
}
// Handle TTS command
async function handleTTS(args, client) {
    const params = parseKeyValueArgs(args);
    if (params.help || params.h) {
        showTTSHelp();
        return;
    }
    const input = params.input || params.i;
    if (!input) {
        console.error('❌ Error: Missing required parameter --input');
        showTTSHelp();
        process.exit(1);
    }
    const output = params.output || params.o;
    if (!output) {
        console.error('❌ Error: Missing required parameter --output');
        showTTSHelp();
        process.exit(1);
    }
    const body = {
        input,
    };
    if (params.voice || params.v) {
        body.voice = params.voice || params.v;
    }
    else {
        body.voice = 'tongtong';
    }
    if (params.speed || params.s) {
        body.speed = parseFloat(params.speed || params.s);
    }
    const format = params.format || params.f || 'wav';
    body.response_format = format;
    if (params.stream) {
        body.stream = true;
    }
    console.log('🚀 Generating speech...');
    const response = await client.audio.tts.create(body);
    // Handle audio response
    const contentType = response.headers.get('content-type') || '';
    // Check if it's a streaming response
    if (body.stream && (contentType.includes('text/event-stream') || contentType.includes('text/plain'))) {
        console.error('❌ Streaming response requires special handling, please use streaming processing code');
        process.exit(1);
    }
    // Non-streaming response, get audio data
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));
    await saveFile(buffer, output);
    console.log('🎉 Speech generation completed!');
}
// Handle ASR command
async function handleASR(args, client) {
    const params = parseKeyValueArgs(args);
    if (params.help || params.h) {
        showASRHelp();
        return;
    }
    const file = params.file || params.f;
    const base64 = params.base64 || params.b;
    if (!file && !base64) {
        console.error('❌ Error: Missing required parameter --file or --base64');
        showASRHelp();
        process.exit(1);
    }
    const body = {};
    if (file) {
        // Read file and convert to base64
        try {
            const fileBase64 = await readFileAsBase64(file);
            body.file_base64 = fileBase64;
        }
        catch (error) {
            console.error(`❌ Unable to read audio file: ${file}`);
            process.exit(1);
        }
    }
    else {
        body.file_base64 = base64;
    }
    if (params.stream) {
        body.stream = true;
    }
    console.log('🚀 Recognizing speech...');
    const response = await client.audio.asr.create(body);
    const output = params.output || params.o;
    if (output) {
        await saveFile(JSON.stringify(response, null, 2), output);
    }
    else {
        console.log(JSON.stringify(response, null, 2));
    }
    console.log('🎉 Speech recognition completed!');
}
// Handle image generation command
async function handleImage(args, client) {
    const params = parseKeyValueArgs(args);
    if (params.help || params.h) {
        showImageHelp();
        return;
    }
    const prompt = params.prompt || params.p;
    if (!prompt) {
        console.error('❌ Error: Missing required parameter --prompt');
        showImageHelp();
        process.exit(1);
    }
    const output = params.output || params.o;
    if (!output) {
        console.error('❌ Error: Missing required parameter --output');
        showImageHelp();
        process.exit(1);
    }
    const body = {
        prompt,
        size: params.size || params.s || '1024x1024',
    };
    const validSizes = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440'];
    if (!validSizes.includes(body.size)) {
        throw new Error(`--size must be one of: ${validSizes.join(', ')}`);
    }
    console.log(`🎨 Generating image: "${prompt}"`);
    console.log(`📐 Size: ${body.size}`);
    const response = await client.images.generations.create(body);
    if (!response.data || response.data.length === 0) {
        throw new Error('API did not return image data');
    }
    const imageBase64 = response.data[0].base64;
    await saveFile(base64ToBuffer(imageBase64), output);
    console.log('🎉 Image generation completed!');
}
// Handle image edit command
async function handleImageEdit(args, client) {
    const params = parseKeyValueArgs(args);
    if (params.help || params.h) {
        showImageEditHelp();
        return;
    }
    const prompt = params.prompt || params.p;
    if (!prompt) {
        console.error('❌ Error: Missing required parameter --prompt');
        showImageEditHelp();
        process.exit(1);
    }
    const image = params.image || params.i;
    if (!image) {
        console.error('❌ Error: Missing required parameter --image');
        showImageEditHelp();
        process.exit(1);
    }
    const output = params.output || params.o;
    if (!output) {
        console.error('❌ Error: Missing required parameter --output');
        showImageEditHelp();
        process.exit(1);
    }
    // Process image: convert local file to base64 data URL
    let imageUrl = image;
    if (!image.startsWith('http://') && !image.startsWith('https://') && !image.startsWith('data:')) {
        try {
            const base64 = await readFileAsBase64(image);
            const ext = path.extname(image).toLowerCase();
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
            };
            const mimeType = mimeTypes[ext] || 'image/png';
            imageUrl = `data:${mimeType};base64,${base64}`;
        }
        catch (error) {
            console.error(`❌ Unable to read image file: ${image}`);
            process.exit(1);
        }
    }
    const body = {
        prompt,
        image: imageUrl,
        size: params.size || params.s || '1024x1024',
    };
    const validSizes = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440'];
    if (!validSizes.includes(body.size)) {
        throw new Error(`--size must be one of: ${validSizes.join(', ')}`);
    }
    console.log(`🎨 Editing image: "${prompt}"`);
    console.log(`📐 Size: ${body.size}`);
    const response = await client.images.generations.edit(body);
    if (!response.data || response.data.length === 0) {
        throw new Error('API did not return image data');
    }
    const imageBase64 = response.data[0].base64;
    await saveFile(base64ToBuffer(imageBase64), output);
    console.log('🎉 Image editing completed!');
}
// Handle image search command
async function handleImageSearch(args, client) {
    const params = parseKeyValueArgs(args);
    if (params.help || params.h) {
        showImageSearchHelp();
        return;
    }
    const query = params.query || params.q;
    if (!query) {
        console.error('❌ Error: Missing required parameter --query');
        showImageSearchHelp();
        process.exit(1);
    }
    const body = { query };
    const countRaw = params.count || params.c;
    if (countRaw !== undefined) {
        const n = parseInt(countRaw, 10);
        if (Number.isNaN(n) || n <= 0) {
            console.error('❌ Error: --count must be a positive integer');
            process.exit(1);
        }
        body.count = n;
    }
    if (params.gl) {
        body.gl = params.gl;
    }
    // Captioning is on by default; --no-rank disables it.
    if (params['no-rank']) {
        body.rank = false;
    }
    else if (params.rank) {
        body.rank = true;
    }
    console.log(`🔎 Searching images: "${query}"`);
    const response = await client.images.search.create(body);
    if (response && response.success === false) {
        console.error(`❌ Image search failed: ${response.error || 'unknown error'}`);
    }
    else {
        const n = response?.results?.length ?? 0;
        console.log(`✅ Got ${n} image${n === 1 ? '' : 's'}`);
    }
    const output = params.output || params.o;
    if (output) {
        await saveFile(JSON.stringify(response, null, 2), output);
    }
    else {
        console.log(JSON.stringify(response, null, 2));
    }
}
// Handle video generation command
async function handleVideo(args, client) {
    const params = parseKeyValueArgs(args);
    if (params.help || params.h) {
        showVideoHelp();
        return;
    }
    const body = {};
    if (params.prompt || params.p) {
        body.prompt = params.prompt || params.p;
    }
    if (params['image-url'] || params.i) {
        const imageUrl = params['image-url'] || params.i;
        // Support array format (comma-separated)
        if (imageUrl.includes(',')) {
            body.image_url = imageUrl.split(',').map((url) => url.trim());
        }
        else {
            body.image_url = imageUrl;
        }
    }
    if (params.quality || params.q) {
        body.quality = params.quality || params.q;
    }
    if (params['with-audio']) {
        body.with_audio = params['with-audio'] === 'true' || params['with-audio'] === '1';
    }
    if (params.size || params.s) {
        body.size = params.size || params.s;
    }
    if (params.fps) {
        const fps = parseInt(params.fps);
        if (!isNaN(fps)) {
            body.fps = fps;
        }
    }
    if (params.duration || params.d) {
        const duration = parseInt(params.duration || params.d);
        if (!isNaN(duration)) {
            body.duration = duration;
        }
    }
    if (params.model || params.m) {
        body.model = params.model || params.m;
    }
    console.log('🎬 Creating video generation task...');
    const task = await client.video.generations.create(body);
    console.log(`✅ Task created!`);
    console.log(`📋 Task ID: ${task.id}`);
    console.log(`📊 Task Status: ${task.task_status}`);
    if (task.model) {
        console.log(`🤖 Model: ${task.model}`);
    }
    const output = params.output || params.o;
    if (output) {
        await saveFile(JSON.stringify(task, null, 2), output);
    }
    // If polling is needed, automatically query results
    if (params.poll) {
        const pollInterval = parseInt(params['poll-interval'] || '5') * 1000;
        const maxPolls = parseInt(params['max-polls'] || '60');
        console.log(`\n🔄 Starting to poll results (interval ${pollInterval / 1000}s, max ${maxPolls} times)...`);
        let result = await client.async.result.query(task.id);
        let pollCount = 0;
        while (result.task_status === 'PROCESSING' && pollCount < maxPolls) {
            pollCount++;
            console.log(`⏳ Poll ${pollCount}/${maxPolls}: Status ${result.task_status}, waiting...`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            result = await client.async.result.query(task.id);
        }
        await displayAsyncResult(result, output);
    }
    else {
        console.log(`\n💡 Tip: Use --poll parameter to automatically poll until task completes`);
        console.log(`   Or use: z-ai async-result --id "${task.id}" --poll`);
    }
}
// Handle async result query command
async function handleAsyncResult(args, client) {
    const params = parseKeyValueArgs(args);
    if (params.help || params.h) {
        showAsyncResultHelp();
        return;
    }
    const taskId = params.id || params.i;
    if (!taskId) {
        console.error('❌ Error: Missing required parameter --id');
        showAsyncResultHelp();
        process.exit(1);
    }
    const pollInterval = parseInt(params['poll-interval'] || '5') * 1000;
    const maxPolls = parseInt(params['max-polls'] || '60');
    console.log(`🔍 Querying task result: ${taskId}`);
    let result = await client.async.result.query(taskId);
    // If polling is needed and status is processing
    if (params.poll && result.task_status === 'PROCESSING') {
        console.log(`\n🔄 Starting to poll results (interval ${pollInterval / 1000}s, max ${maxPolls} times)...`);
        let pollCount = 0;
        while (result.task_status === 'PROCESSING' && pollCount < maxPolls) {
            pollCount++;
            console.log(`⏳ Poll ${pollCount}/${maxPolls}: Status ${result.task_status}, waiting...`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            result = await client.async.result.query(taskId);
        }
    }
    const output = params.output || params.o;
    await displayAsyncResult(result, output);
}
// Display async result
async function displayAsyncResult(result, output) {
    console.log(`\n=== Query Result ===`);
    console.log(`📊 Task Status: ${result.task_status}`);
    if (result.model) {
        console.log(`🤖 Model: ${result.model}`);
    }
    if (result.request_id) {
        console.log(`🆔 Request ID: ${result.request_id}`);
    }
    if (result.task_status === 'SUCCESS') {
        // Try to get video URL from multiple possible fields
        const videoUrl = result.video_result?.[0]?.url ||
            result.video_url ||
            result.url ||
            result.video;
        if (videoUrl) {
            console.log(`\n✅ Video generated successfully!`);
            console.log(`🎬 Video URL: ${videoUrl}`);
            console.log(`\n💡 Tip: You can open this URL in your browser to view or download the video`);
        }
        else {
            console.log(`\n⚠️  Task completed but video URL not found`);
            console.log(`Full response:`, JSON.stringify(result, null, 2));
        }
    }
    else if (result.task_status === 'PROCESSING') {
        console.log(`\n⏳ Task is still processing, please query again later`);
        if (result.id) {
            console.log(`Task ID: ${result.id}`);
        }
    }
    else if (result.task_status === 'FAIL') {
        console.log(`\n❌ Task processing failed`);
        console.log(`Full response:`, JSON.stringify(result, null, 2));
    }
    if (output) {
        await saveFile(JSON.stringify(result, null, 2), output);
    }
    else {
        console.log(`\nFull response:`, JSON.stringify(result, null, 2));
    }
}
// Handle function invocation command
async function handleFunction(args, client) {
    const params = parseKeyValueArgs(args);
    if (params.help || params.h) {
        showFunctionHelp();
        return;
    }
    const name = params.name || params.n;
    if (!name) {
        console.error('❌ Error: Missing required parameter --name');
        showFunctionHelp();
        process.exit(1);
    }
    const argsJson = params.args || params.a;
    if (!argsJson) {
        console.error('❌ Error: Missing required parameter --args');
        showFunctionHelp();
        process.exit(1);
    }
    let functionArgs;
    try {
        functionArgs = JSON.parse(argsJson);
    }
    catch (error) {
        console.error('❌ Error: --args must be valid JSON format');
        process.exit(1);
    }
    console.log(`🚀 Invoking function: ${name}...`);
    const response = await client.functions.invoke(name, functionArgs);
    const output = params.output || params.o;
    if (output) {
        await saveFile(JSON.stringify(response, null, 2), output);
    }
    else {
        console.log(JSON.stringify(response, null, 2));
    }
    console.log('🎉 Function invocation completed!');
}
// Check if it's legacy image generation format (backward compatible)
function isLegacyImageFormat(args) {
    return args.some(arg => arg === '--prompt' || arg === '-p') &&
        args.some(arg => arg === '--output' || arg === '-o') &&
        !['chat', 'vision', 'tts', 'asr', 'image', 'image-edit', 'image-search', 'video', 'async-result', 'function'].includes(args[0]);
}
async function main() {
    try {
        const args = process.argv.slice(2);
        // If no arguments or first argument is --help, show main help
        if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
            showMainHelp();
            return;
        }
        const command = args[0];
        const commandArgs = args.slice(1);
        // Backward compatible: if it's legacy image generation format, handle directly
        if (isLegacyImageFormat(args)) {
            console.log('🚀 Initializing Z-AI SDK...');
            const ZAI = await getZAI();
            const client = await ZAI.create();
            await handleImage(args, client);
            return;
        }
        // Check if it's a valid command
        const validCommands = ['chat', 'vision', 'tts', 'asr', 'image', 'image-edit', 'image-search', 'video', 'async-result', 'function'];
        if (!validCommands.includes(command)) {
            console.error(`❌ Error: Unknown command "${command}"`);
            showMainHelp();
            process.exit(1);
        }
        console.log('🚀 Initializing Z-AI SDK...');
        const ZAI = await getZAI();
        const client = await ZAI.create();
        // Execute corresponding handler function based on command
        switch (command) {
            case 'chat':
                await handleChat(commandArgs, client);
                break;
            case 'vision':
                await handleVision(commandArgs, client);
                break;
            case 'tts':
                await handleTTS(commandArgs, client);
                break;
            case 'asr':
                await handleASR(commandArgs, client);
                break;
            case 'image':
                await handleImage(commandArgs, client);
                break;
            case 'image-edit':
                await handleImageEdit(commandArgs, client);
                break;
            case 'image-search':
                await handleImageSearch(commandArgs, client);
                break;
            case 'video':
                await handleVideo(commandArgs, client);
                break;
            case 'async-result':
                await handleAsyncResult(commandArgs, client);
                break;
            case 'function':
                await handleFunction(commandArgs, client);
                break;
            default:
                console.error(`❌ Error: Unknown command "${command}"`);
                showMainHelp();
                process.exit(1);
        }
    }
    catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
// Run main function directly
main();
