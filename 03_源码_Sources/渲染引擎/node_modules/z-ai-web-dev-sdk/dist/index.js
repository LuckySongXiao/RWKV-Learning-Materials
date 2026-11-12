import fs from 'fs/promises';
import path from 'path';
import os from 'os';
// Function to load configuration with specified priority
const loadConfig = async () => {
    const homeDir = os.homedir();
    const configPaths = [
        path.join(process.cwd(), '.z-ai-config'),
        path.join(homeDir, '.z-ai-config'),
        '/etc/.z-ai-config'
    ];
    for (const filePath of configPaths) {
        try {
            const configStr = await fs.readFile(filePath, 'utf-8');
            const config = JSON.parse(configStr);
            if (config.baseUrl && config.apiKey) {
                return config;
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Error reading or parsing config file at ${filePath}:`, error);
            }
            // Continue to the next file if it doesn't exist or is invalid
        }
    }
    throw new Error('Configuration file not found or invalid. Please create .z-ai-config in your project, home directory, or /etc.');
};
class ZAI {
    constructor(config) {
        this.config = config;
        this.chat = {
            completions: {
                create: this.createChatCompletion.bind(this),
                createVision: this.createChatCompletionVision.bind(this),
            },
        };
        this.audio = {
            tts: {
                create: this.createAudioTTS.bind(this),
            },
            asr: {
                create: this.createAudioASR.bind(this),
            },
        };
        this.images = {
            generations: {
                create: this.createImageGeneration.bind(this),
                edit: this.createImageEdit.bind(this),
            },
            search: {
                create: this.createImageSearch.bind(this),
            },
        };
        this.video = {
            generations: {
                create: this.createVideoGeneration.bind(this),
            },
        };
        this.async = {
            result: {
                query: this.queryAsyncResult.bind(this),
            },
        };
        this.functions = {
            invoke: this.invokeFunction.bind(this),
        };
    }
    static async create() {
        const config = await loadConfig();
        return new ZAI(config);
    }
    async createChatCompletion(body) {
        const { baseUrl, chatId, userId, apiKey, token } = this.config;
        const url = `${baseUrl}/chat/completions`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Z-AI-From': 'Z',
        };
        if (chatId) {
            headers['X-Chat-Id'] = chatId;
        }
        if (userId) {
            headers['X-User-Id'] = userId;
        }
        if (token) {
            headers['X-Token'] = token;
        }
        // 设置 thinking 默认值为 disabled
        const requestBody = {
            ...body,
            thinking: body.thinking || { type: 'disabled' },
        };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }
            // 处理流式响应
            const contentType = response.headers.get('content-type') || '';
            if (requestBody.stream && (contentType.includes('text/event-stream') || contentType.includes('text/plain'))) {
                // 返回 ReadableStream 供调用者处理
                return response.body;
            }
            return await response.json();
        }
        catch (error) {
            console.error('Failed to make API request:', error);
            throw error;
        }
    }
    async createChatCompletionVision(body) {
        const { baseUrl, chatId, userId, apiKey, token } = this.config;
        const url = `${baseUrl}/chat/completions/vision`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Z-AI-From': 'Z',
        };
        if (chatId) {
            headers['X-Chat-Id'] = chatId;
        }
        if (userId) {
            headers['X-User-Id'] = userId;
        }
        if (token) {
            headers['X-Token'] = token;
        }
        // 设置 thinking 默认值为 disabled
        const requestBody = {
            ...body,
            thinking: body.thinking || { type: 'disabled' },
        };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }
            // 处理流式响应
            const contentType = response.headers.get('content-type') || '';
            if (requestBody.stream && (contentType.includes('text/event-stream') || contentType.includes('text/plain'))) {
                // 返回 ReadableStream 供调用者处理
                return response.body;
            }
            return await response.json();
        }
        catch (error) {
            console.error('Failed to make vision API request:', error);
            throw error;
        }
    }
    async createAudioTTS(body) {
        const { baseUrl, chatId, userId, apiKey, token } = this.config;
        const url = `${baseUrl}/audio/tts`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Z-AI-From': 'Z',
        };
        if (chatId) {
            headers['X-Chat-Id'] = chatId;
        }
        if (userId) {
            headers['X-User-Id'] = userId;
        }
        if (token) {
            headers['X-Token'] = token;
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }
            // 直接返回 Response 对象，让调用者自己处理
            // 调用者可以：
            // - 获取 headers（包括 content-type）: response.headers.get('content-type')
            // - 处理 body: response.arrayBuffer(), response.blob(), response.text() 等
            return response;
        }
        catch (error) {
            console.error('Failed to make TTS API request:', error);
            throw error;
        }
    }
    async createAudioASR(body) {
        const { baseUrl, chatId, userId, apiKey, token } = this.config;
        const url = `${baseUrl}/audio/asr`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Z-AI-From': 'Z',
        };
        if (chatId) {
            headers['X-Chat-Id'] = chatId;
        }
        if (userId) {
            headers['X-User-Id'] = userId;
        }
        if (token) {
            headers['X-Token'] = token;
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Failed to make ASR API request:', error);
            throw error;
        }
    }
    async createImageGeneration(body) {
        const { baseUrl, apiKey, chatId, userId, token } = this.config;
        const url = `${baseUrl}/images/generations`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Z-AI-From': 'Z',
        };
        if (chatId) {
            headers['X-Chat-Id'] = chatId;
        }
        if (userId) {
            headers['X-User-Id'] = userId;
        }
        if (token) {
            headers['X-Token'] = token;
        }
        // Add user_id to body if available in config
        const requestBody = { ...body };
        // if (this.config.userId && !requestBody.user_id) {
        //   requestBody.user_id = this.config.userId;
        // }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }
            const result = await response.json();
            // Convert image URLs to base64
            const processedData = await Promise.all(result.data.map(async (item) => {
                if (item.url) {
                    const base64 = await this.downloadImageAsBase64(item.url);
                    return { base64, format: "png" };
                }
                return item;
            }));
            return {
                ...result,
                data: processedData,
            };
        }
        catch (error) {
            console.error('Failed to make image generation request:', error);
            throw error;
        }
    }
    async createImageEdit(body) {
        const { baseUrl, apiKey, chatId, userId, token } = this.config;
        const url = `${baseUrl}/images/generations/edit`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Z-AI-From': 'Z',
        };
        if (chatId) {
            headers['X-Chat-Id'] = chatId;
        }
        if (userId) {
            headers['X-User-Id'] = userId;
        }
        if (token) {
            headers['X-Token'] = token;
        }
        const requestBody = { ...body };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }
            const result = await response.json();
            // Convert image URLs to base64
            const processedData = await Promise.all(result.data.map(async (item) => {
                if (item.url) {
                    const base64 = await this.downloadImageAsBase64(item.url);
                    return { base64, format: "png" };
                }
                return item;
            }));
            return {
                ...result,
                data: processedData,
            };
        }
        catch (error) {
            console.error('Failed to make image edit request:', error);
            throw error;
        }
    }
    async createImageSearch(body) {
        const { baseUrl, apiKey, chatId, userId, token } = this.config;
        const url = `${baseUrl}/images/search`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Z-AI-From': 'Z',
        };
        if (chatId) {
            headers['X-Chat-Id'] = chatId;
        }
        if (userId) {
            headers['X-User-Id'] = userId;
        }
        if (token) {
            headers['X-Token'] = token;
        }
        if (!body.query || !body.query.trim()) {
            throw new Error('image search requires a non-empty `query`');
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Failed to make image search request:', error);
            throw error;
        }
    }
    async downloadImageAsBase64(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            return `${base64}`;
        }
        catch (error) {
            console.error('Failed to download and convert image to base64:', error);
            throw error;
        }
    }
    async createVideoGeneration(body) {
        const { baseUrl, apiKey, chatId, userId, token } = this.config;
        const url = `${baseUrl}/video/generation`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Z-AI-From': 'Z',
        };
        if (chatId) {
            headers['X-Chat-Id'] = chatId;
        }
        if (userId) {
            headers['X-User-Id'] = userId;
        }
        if (token) {
            headers['X-Token'] = token;
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Failed to make video generation request:', error);
            throw error;
        }
    }
    async queryAsyncResult(taskId) {
        const { baseUrl, apiKey, chatId, userId, token } = this.config;
        const url = `${baseUrl}/async-result?id=${encodeURIComponent(taskId)}`;
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'X-Z-AI-From': 'Z',
        };
        if (chatId) {
            headers['X-Chat-Id'] = chatId;
        }
        if (userId) {
            headers['X-User-Id'] = userId;
        }
        if (token) {
            headers['X-Token'] = token;
        }
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Failed to query async result:', error);
            throw error;
        }
    }
    // 通用函数调用实现
    async invokeFunction(function_name, args) {
        const { baseUrl, apiKey, chatId, userId, token } = this.config;
        const url = `${baseUrl}/functions/invoke`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Z-AI-From': 'Z',
        };
        if (chatId) {
            headers['X-Chat-Id'] = chatId;
        }
        if (userId) {
            headers['X-User-Id'] = userId;
        }
        if (token) {
            headers['X-Token'] = token;
        }
        const body = {
            function_name,
            arguments: args,
        };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Function invoke failed with status ${response.status}: ${errorBody}`);
            }
            const result = await response.json();
            // 假设后端返回格式为 { result: ... }
            return result.result;
        }
        catch (error) {
            console.error('Failed to invoke remote function:', error);
            throw error;
        }
    }
}
export default ZAI;
