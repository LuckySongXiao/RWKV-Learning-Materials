interface ZAIConfig {
    baseUrl: string;
    apiKey: string;
    chatId?: string;
    userId?: string;
    token?: string;
}
interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
interface CreateChatCompletionBody {
    model?: string;
    messages: ChatMessage[];
    stream?: boolean;
    thinking?: {
        type: 'enabled' | 'disabled';
    };
    [key: string]: any;
}
interface CreateImageGenerationBody {
    model?: string;
    prompt: string;
    size?: '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440';
}
interface CreateImageEditBody {
    model?: string;
    prompt: string;
    image?: string;
    size?: '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440';
}
interface CreateImageSearchBody {
    query: string;
    count?: number;
    gl?: string;
    rank?: boolean;
}
interface ImageSearchResultItem {
    original_url: string;
    caption?: string;
    source?: string;
    original_width?: string;
    original_height?: string;
}
interface ImageSearchResponse {
    success: boolean;
    query: string;
    count: number;
    ranked: boolean;
    results: ImageSearchResultItem[];
    error?: string;
}
interface VisionMultimodalContentItem {
    type: 'text' | 'image_url' | 'video_url' | 'file_url';
    text?: string;
    image_url?: {
        url: string;
    };
    video_url?: {
        url: string;
    };
    file_url?: {
        url: string;
    };
}
interface VisionMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | VisionMultimodalContentItem[];
}
interface CreateChatCompletionVisionBody {
    model: string;
    messages: VisionMessage[];
    stream?: boolean;
    thinking?: {
        type: 'enabled' | 'disabled';
    };
}
interface CreateAudioTTSBody {
    model?: string;
    input: string;
    voice?: string;
    stream?: boolean;
    response_format?: string;
    speed?: number;
}
interface CreateAudioASRBody {
    model?: string;
    file?: string;
    file_base64?: string;
    stream?: boolean;
}
interface CreateVideoGenerationBody {
    model?: string;
    prompt?: string;
    image_url?: string | string[];
    quality?: 'speed' | 'quality';
    with_audio?: boolean;
    watermark_enabled?: boolean;
    size?: string;
    fps?: number;
    duration?: number;
    request_id?: string;
    user_id?: string;
}
interface VideoGenerationResponse {
    model?: string;
    id: string;
    request_id?: string;
    task_status: 'PROCESSING' | 'SUCCESS' | 'FAIL';
}
interface AsyncResultResponse {
    model?: string;
    id?: string;
    request_id?: string;
    task_status: 'PROCESSING' | 'SUCCESS' | 'FAIL';
    video_result?: Array<{
        url: string;
    }>;
    video_url?: string;
    url?: string;
    video?: string;
    [key: string]: any;
}
interface ImageGenerationResponse {
    created: number;
    data: Array<{
        base64: string;
    }>;
    content_filter?: Array<{
        role: string;
        level: number;
    }>;
}
interface SearchFunctionArgs {
    query: string;
    num?: number;
    recency_days?: number;
}
interface SearchFunctionResultItem {
    url: string;
    name: string;
    snippet: string;
    host_name: string;
    rank: number;
    date: string;
    favicon: string;
}
interface PageReaderFunctionArgs {
    url: string;
}
interface PageReaderFunctionResult {
    code: number;
    data: {
        html: string;
        publishedTime?: string;
        title: string;
        url: string;
        usage: {
            tokens: number;
        };
    };
    meta: {
        usage: {
            tokens: number;
        };
    };
    status: number;
}
interface FunctionMap {
    web_search: {
        args: SearchFunctionArgs;
        result: SearchFunctionResultItem[];
    };
    page_reader: {
        args: PageReaderFunctionArgs;
        result: PageReaderFunctionResult;
    };
}
type FunctionName = keyof FunctionMap;
type FunctionArgs<T extends FunctionName> = FunctionMap[T]['args'];
type FunctionResult<T extends FunctionName> = FunctionMap[T]['result'];
declare class ZAI {
    private config;
    chat: {
        completions: {
            create: (body: CreateChatCompletionBody) => Promise<any>;
            createVision: (body: CreateChatCompletionVisionBody) => Promise<any>;
        };
    };
    audio: {
        tts: {
            create: (body: CreateAudioTTSBody) => Promise<any>;
        };
        asr: {
            create: (body: CreateAudioASRBody) => Promise<any>;
        };
    };
    images: {
        generations: {
            create: (body: CreateImageGenerationBody) => Promise<ImageGenerationResponse>;
            edit: (body: CreateImageEditBody) => Promise<ImageGenerationResponse>;
        };
        search: {
            create: (body: CreateImageSearchBody) => Promise<ImageSearchResponse>;
        };
    };
    video: {
        generations: {
            create: (body: CreateVideoGenerationBody) => Promise<VideoGenerationResponse>;
        };
    };
    async: {
        result: {
            query: (taskId: string) => Promise<AsyncResultResponse>;
        };
    };
    functions: {
        invoke: <T extends FunctionName>(function_name: T, args: FunctionArgs<T>) => Promise<FunctionResult<T>>;
    };
    private constructor();
    static create(): Promise<ZAI>;
    private createChatCompletion;
    private createChatCompletionVision;
    private createAudioTTS;
    private createAudioASR;
    private createImageGeneration;
    private createImageEdit;
    private createImageSearch;
    private downloadImageAsBase64;
    private createVideoGeneration;
    private queryAsyncResult;
    private invokeFunction;
}
export default ZAI;
export type { ZAIConfig, ChatMessage, CreateChatCompletionBody, CreateChatCompletionVisionBody, VisionMessage, VisionMultimodalContentItem, CreateAudioTTSBody, CreateAudioASRBody, CreateImageGenerationBody, CreateImageEditBody, ImageGenerationResponse, CreateImageSearchBody, ImageSearchResultItem, ImageSearchResponse, CreateVideoGenerationBody, VideoGenerationResponse, AsyncResultResponse, SearchFunctionArgs, SearchFunctionResultItem, FunctionMap, FunctionName, FunctionArgs, FunctionResult, };
