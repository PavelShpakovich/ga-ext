import {
  CreateMLCEngine,
  MLCEngine,
  ChatCompletionMessageParam,
  prebuiltAppConfig,
  hasModelInCache,
  deleteModelAllInfoInCache,
} from '@mlc-ai/web-llm';
import { AIProvider } from './AIProvider';
import { CorrectionResult, CorrectionStyle, ModelOption, ModelProgress } from '../types';
import { Logger } from '../services/Logger';
import { DEFAULT_MODEL_ID, SUPPORTED_MODELS } from '../constants';

// WebGPU type declarations
declare global {
  interface Navigator {
    gpu?: GPU;
  }
  interface GPU {
    requestAdapter(): Promise<GPUAdapter | null>;
  }
  interface GPUAdapter {}
}

// Minimal WebLLM provider focused on model loading, progress, and correction
export class WebLLMProvider extends AIProvider {
  private engine: MLCEngine | null = null;
  private modelId: string;
  private initPromise: Promise<void> | null = null;
  private abortController: AbortController | null = null;
  private cancelled = false;

  static onProgressUpdate: ((progress: ModelProgress) => void) | null = null;
  private static currentInstance: WebLLMProvider | null = null;

  constructor(modelId: string = DEFAULT_MODEL_ID) {
    super();
    this.modelId = modelId;
  }

  static async isWebGPUAvailable(): Promise<boolean> {
    if (!navigator.gpu) return false;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return adapter !== null;
    } catch (error) {
      Logger.error('WebLLMProvider', 'WebGPU check failed', error);
      return false;
    }
  }

  static getAvailableModels(): ModelOption[] {
    return SUPPORTED_MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      family: m.family,
      size: m.size,
      speed: m.speed as 'fast' | 'medium' | 'slow',
      description: m.description,
    }));
  }

  private emitProgress(progress: ModelProgress): void {
    if (WebLLMProvider.onProgressUpdate) {
      WebLLMProvider.onProgressUpdate(progress);
    }
  }

  static async isModelCached(modelId: string): Promise<boolean> {
    try {
      // Ensure we use the same config as during creation
      return await hasModelInCache(modelId, {
        model_list: prebuiltAppConfig.model_list,
        useIndexedDBCache: true,
      });
    } catch (error) {
      Logger.error('WebLLMProvider', 'Cache check failed', error);
      return false;
    }
  }

  private async initialize(): Promise<void> {
    if (this.engine) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      let attempt = 0;
      while (attempt < 2) {
        try {
          WebLLMProvider.currentInstance = this;
          this.cancelled = false;

          const cached = await hasModelInCache(this.modelId, {
            model_list: prebuiltAppConfig.model_list,
            useIndexedDBCache: true,
          });

          const progressState = cached ? 'loading' : 'downloading';

          this.emitProgress({ text: 'Preparing model…', progress: 0, state: progressState, modelId: this.modelId });

          if (this.cancelled) {
            throw new Error('aborted');
          }

          const engine = new MLCEngine({
            appConfig: { model_list: prebuiltAppConfig.model_list, useIndexedDBCache: true },
            initProgressCallback: (p) => {
              if (this.cancelled) return;
              this.emitProgress({
                text: p.text,
                progress: p.progress || 0,
                state: progressState,
                modelId: this.modelId,
              });
            },
          });

          this.engine = engine;

          // Start model loading
          await this.engine.reload(this.modelId);

          if (this.cancelled) {
            await this.engine.unload();
            this.engine = null;
            throw new Error('aborted');
          }

          this.emitProgress({ text: 'Model ready', progress: 1, state: 'loading', modelId: this.modelId });
          return;
        } catch (error: any) {
          const isAborted = error?.message === 'aborted';

          if (this.engine) {
            await this.engine.unload();
            this.engine = null;
          }

          WebLLMProvider.currentInstance = null;

          if (isAborted) {
            this.initPromise = null;
            this.emitProgress({ text: 'Download cancelled', progress: 0, state: 'downloading', modelId: this.modelId });
            throw error;
          }

          const isStoreMissing = WebLLMProvider.isIdbStoreMissing(error);
          if (isStoreMissing && attempt === 0) {
            await WebLLMProvider.clearCache();
            attempt += 1;
            continue;
          }

          this.initPromise = null;
          const message = (error as Error)?.message || 'Model failed to load';
          this.emitProgress({ text: message, progress: 0, state: 'downloading', modelId: this.modelId });
          throw error;
        } finally {
          WebLLMProvider.currentInstance = null;
          this.cancelled = false;
        }
      }
    })();

    return this.initPromise;
  }

  private static isIdbStoreMissing(error: unknown): boolean {
    if (!error) return false;
    const message = (error as Error)?.message || '';
    return message.includes('object store') || message.includes('IDBDatabase');
  }

  async stopDownload(): Promise<void> {
    this.cancelled = true;
    if (this.engine) {
      await this.engine.unload();
      this.engine = null;
    }
    this.initPromise = null;
    this.emitProgress({ text: 'Download cancelled', progress: 0, state: 'downloading', modelId: this.modelId });
  }

  static async stopCurrentDownload(): Promise<boolean> {
    if (WebLLMProvider.currentInstance) {
      await WebLLMProvider.currentInstance.stopDownload();
      return true;
    }
    return false;
  }

  async isAvailable(): Promise<boolean> {
    const hasWebGPU = await WebLLMProvider.isWebGPUAvailable();
    if (!hasWebGPU) return false;

    await this.initialize();
    return !!this.engine;
  }

  async ensureReady(): Promise<void> {
    await this.initialize();
  }

  async correct(text: string, style: CorrectionStyle = CorrectionStyle.FORMAL): Promise<CorrectionResult> {
    await this.ensureReady();
    if (!this.engine) {
      throw new Error('Model not ready');
    }

    const prompt = this.buildPrompt(text, style);
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt },
    ];

    const response = await this.engine.chat.completions.create({
      messages,
      temperature: 0.1,
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content || '';
    return this.parseResponse(content, text);
  }

  private parseResponse(raw: string, original: string): CorrectionResult {
    const tryParse = (value: string) => {
      try {
        const parsed = JSON.parse(value.trim());
        return parsed && typeof parsed === 'object' && 'corrected' in parsed ? parsed : null;
      } catch {
        return null;
      }
    };

    // 1. Try treating the whole response as JSON
    const directParsed = tryParse(raw);
    if (directParsed) return this.formatResult(directParsed, original, raw);

    // 2. Try extracting from markdown code blocks
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      const parsed = tryParse(codeBlockMatch[1]);
      if (parsed) return this.formatResult(parsed, original, raw);
    }

    // 3. Last ditch: find first '{' and last '}'
    const lastDitchMatch = raw.match(/{[\s\S]*}/);
    if (lastDitchMatch) {
      const parsed = tryParse(lastDitchMatch[0]);
      if (parsed) return this.formatResult(parsed, original, raw);
    }

    return {
      original,
      corrected: original,
      explanation: 'Could not clarify the model output format.',
      parseError: 'Invalid JSON response',
      raw,
    };
  }

  private formatResult(parsed: any, original: string, raw: string): CorrectionResult {
    // 1. Defensively extract corrected text
    let corrected = original;
    if (typeof parsed.corrected === 'string' && parsed.corrected.trim().length > 0) {
      corrected = parsed.corrected;
    } else if (Array.isArray(parsed.corrected)) {
      corrected = parsed.corrected.join(' ');
    } else if (parsed.corrected && typeof parsed.corrected !== 'boolean') {
      corrected = String(parsed.corrected);
    }

    // 2. Defensively extract explanation
    let explanation = 'Improved grammar and style.';
    if (typeof parsed.explanation === 'string') {
      explanation = parsed.explanation;
    } else if (Array.isArray(parsed.explanation)) {
      explanation = parsed.explanation.join(' ');
    } else if (parsed.explanation) {
      explanation = String(parsed.explanation);
    }

    const sameText = corrected.trim() === original.trim();
    const resolvedExplanation = sameText ? `${explanation} (No changes needed)` : explanation;

    return {
      original,
      corrected,
      explanation: resolvedExplanation,
      raw,
    };
  }

  static async deleteModel(modelId: string): Promise<void> {
    try {
      Logger.info('WebLLMProvider', `Deleting model ${modelId} from cache`);
      await deleteModelAllInfoInCache(modelId, {
        ...prebuiltAppConfig,
        useIndexedDBCache: true,
      });
      Logger.info('WebLLMProvider', `Successfully deleted model ${modelId}`);
    } catch (error) {
      Logger.error('WebLLMProvider', `Failed to delete model ${modelId}`, error);
      throw error;
    }
  }

  static async clearCache(): Promise<void> {
    // Attempt to delete known WebLLM/MLC IndexedDB databases.
    const databaseNames: string[] = [];

    if (typeof indexedDB.databases === 'function') {
      const dbs = await indexedDB.databases();
      dbs.forEach((db) => {
        if (db.name && (db.name.includes('webllm') || db.name.includes('mlc'))) {
          databaseNames.push(db.name);
        }
      });
    }

    if (databaseNames.length === 0) {
      databaseNames.push('webllm/model', 'webllm/config', 'webllm/wasm', 'webllm', 'mlc');
    }

    await Promise.all(
      databaseNames.map(
        (dbName) =>
          new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(dbName);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
          }),
      ),
    );
  }
}
