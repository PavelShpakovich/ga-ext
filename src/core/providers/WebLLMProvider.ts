import {
  MLCEngine,
  ChatCompletionMessageParam,
  prebuiltAppConfig,
  hasModelInCache,
  deleteModelAllInfoInCache,
} from '@mlc-ai/web-llm';
import { AIProvider } from '@/core/providers/AIProvider';
import i18n from 'i18next';
import {
  CorrectionResult,
  CorrectionStyle,
  ModelOption,
  ModelProgress,
  ModelProgressState,
  ModelSpeed,
  ModelCategory,
} from '@/shared/types';
import { Logger } from '@/core/services/Logger';
import { DEFAULT_MODEL_ID, SUPPORTED_MODELS } from '@/core/constants';

const MAX_INIT_ATTEMPTS = 2;
const INITIAL_PROGRESS = 0;
const COMPLETED_PROGRESS = 1;
const DEFAULT_TEMPERATURE = 0.1;
const MAX_TOKENS = 1024;

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
  private rejectInit: ((reason: any) => void) | null = null;
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
      speed: m.speed as ModelSpeed,
      category: m.category as ModelCategory,
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
      // Ensure we use a config that includes all models
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

    this.initPromise = new Promise<void>((resolve, reject) => {
      this.rejectInit = reject;
      (async () => {
        let attempt = 0;
        while (attempt < MAX_INIT_ATTEMPTS) {
          try {
            WebLLMProvider.currentInstance = this;
            this.cancelled = false;

            const cached = await hasModelInCache(this.modelId, {
              model_list: prebuiltAppConfig.model_list,
              useIndexedDBCache: true,
            });

            const progressState = cached ? ModelProgressState.LOADING : ModelProgressState.DOWNLOADING;

            this.emitProgress({
              text: i18n.t('status.preparing'),
              progress: INITIAL_PROGRESS,
              state: progressState,
              modelId: this.modelId,
            });

            if (this.cancelled) {
              throw new Error('aborted');
            }

            const engine = new MLCEngine({
              appConfig: { model_list: prebuiltAppConfig.model_list, useIndexedDBCache: true },
              initProgressCallback: (p) => {
                if (this.cancelled) return;
                this.emitProgress({
                  text: p.text,
                  progress: p.progress || INITIAL_PROGRESS,
                  state: progressState,
                  modelId: this.modelId,
                });
              },
            });

            // Assign engine IMMEDIATELY so stopDownload can call unload() if needed during reload
            this.engine = engine;

            // Start model loading
            await this.engine.reload(this.modelId);

            if (this.cancelled) {
              await this.engine.unload();
              this.engine = null;
              throw new Error('aborted');
            }

            this.emitProgress({
              text: i18n.t('status.ready'),
              progress: COMPLETED_PROGRESS,
              state: ModelProgressState.LOADING,
              modelId: this.modelId,
            });
            resolve();
            return;
          } catch (error: unknown) {
            const err = error as Error;
            const isAborted =
              err?.message === 'aborted' ||
              this.cancelled ||
              (err?.message && err.message.toLowerCase().includes('unload'));

            if (this.engine) {
              try {
                await this.engine.unload();
              } catch (e) {
                // Ignore unload errors during catch
              }
              this.engine = null;
            }

            WebLLMProvider.currentInstance = null;

            if (isAborted) {
              this.initPromise = null;
              this.emitProgress({
                text: i18n.t('messages.download_cancelled'),
                progress: INITIAL_PROGRESS,
                state: ModelProgressState.DOWNLOADING,
                modelId: this.modelId,
              });
              reject(new Error('aborted'));
              return;
            }

            const isStoreMissing = WebLLMProvider.isIdbStoreMissing(error);
            if (isStoreMissing && attempt === 0) {
              await WebLLMProvider.clearCache();
              attempt += 1;
              continue;
            }

            this.initPromise = null;
            const message = (error as Error)?.message || 'Model failed to load';
            this.emitProgress({
              text: message,
              progress: INITIAL_PROGRESS,
              state: ModelProgressState.DOWNLOADING,
              modelId: this.modelId,
            });
            reject(error);
            return;
          } finally {
            WebLLMProvider.currentInstance = null;
            this.cancelled = false;
            this.rejectInit = null;
          }
        }
      })();
    });

    return this.initPromise;
  }

  private static isIdbStoreMissing(error: unknown): boolean {
    if (!error) return false;
    const message = (error as Error)?.message || '';
    return message.includes('object store') || message.includes('IDBDatabase');
  }

  async stopDownload(): Promise<void> {
    this.cancelled = true;
    const modelToClean = this.modelId;

    if (this.rejectInit) {
      this.rejectInit(new Error('aborted'));
      this.rejectInit = null;
    }

    if (this.engine) {
      try {
        await this.engine.unload();
      } catch (e) {
        // Ignore unload errors
      }
      this.engine = null;
    }
    this.initPromise = null;

    // Clean up partial download from cache
    try {
      await WebLLMProvider.deleteModel(modelToClean);
    } catch (e) {
      Logger.error('WebLLMProvider', 'Failed to clean up partial model', e);
    }

    this.emitProgress({
      text: i18n.t('messages.download_cancelled'),
      progress: INITIAL_PROGRESS,
      state: ModelProgressState.DOWNLOADING,
      modelId: this.modelId,
    });
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
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: MAX_TOKENS,
    });

    const content = response.choices[0]?.message?.content || '';
    return this.parseResponse(content, text);
  }

  private parseResponse(raw: string, original: string): CorrectionResult {
    const tryParse = (value: string) => {
      const textToParse = value.trim();
      if (!textToParse) return null;

      try {
        const parsed = JSON.parse(textToParse);
        const hasCorrected = 'corrected' in parsed || 'corrected_text' in parsed || 'correctedText' in parsed;
        return parsed && typeof parsed === 'object' && hasCorrected ? parsed : null;
      } catch {
        // If standard parse fails, try to fix common LLM JSON errors
        try {
          const fixed = textToParse
            // 1. Replace literal newlines within quotes with \n
            .replace(/"([^"]*)"/g, (match) => match.replace(/\n/g, '\\n'))
            // 2. Fix potential trailing commas
            .replace(/,\s*([}\]])/g, '$1')
            // 3. Fix unescaped backslashes (but not valid escapes)
            .replace(/\\(?!["\\/bfnrtu])/g, '\\\\');

          const parsed = JSON.parse(fixed);
          const hasCorrected = 'corrected' in parsed || 'corrected_text' in parsed || 'correctedText' in parsed;
          return parsed && typeof parsed === 'object' && hasCorrected ? parsed : null;
        } catch {
          return null;
        }
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
    // Use a non-greedy search for the first { and greedy for the last }
    const lastDitchMatch = raw.match(/{[\s\S]*}/);
    if (lastDitchMatch) {
      const parsed = tryParse(lastDitchMatch[0]);
      if (parsed) return this.formatResult(parsed, original, raw);
    }

    return {
      original,
      corrected: original,
      explanation: i18n.t('error.could_not_parse'),
      parseError: i18n.t('error.invalid_json'),
      raw,
    };
  }

  private formatResult(parsed: Record<string, unknown>, original: string, raw: string): CorrectionResult {
    // 1. Defensively extract corrected text
    let corrected = original;
    const correctedValue = parsed['corrected'] || parsed['corrected_text'] || parsed['correctedText'];

    if (typeof correctedValue === 'string' && correctedValue.trim().length > 0) {
      corrected = correctedValue;
    } else if (Array.isArray(correctedValue)) {
      corrected = correctedValue.join(' ');
    } else if (correctedValue && typeof correctedValue !== 'boolean') {
      corrected = String(correctedValue);
    }

    // 2. Defensively extract explanation
    let explanation = '';
    const explanationValue = parsed['explanation'];
    if (typeof explanationValue === 'string') {
      explanation = explanationValue;
    } else if (Array.isArray(explanationValue)) {
      explanation = explanationValue.join(' ');
    } else if (explanationValue) {
      explanation = String(explanationValue);
    }

    const sameText = corrected.trim() === original.trim();
    const resolvedExplanation = sameText ? `${explanation} (${i18n.t('messages.no_changes')})`.trim() : explanation;

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
