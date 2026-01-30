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
  Language,
  ModelOption,
  ModelProgress,
  ModelProgressState,
  ModelSpeed,
  ModelCategory,
} from '@/shared/types';
import { Logger, ResponseValidator, ModelCapabilityRegistry } from '@/core/services';
import { DEFAULT_MODEL_ID, SUPPORTED_MODELS } from '@/core/constants';
import { isWebGPUAvailable } from '@/shared/utils/helpers';

const MAX_INIT_ATTEMPTS = 2;
const INITIAL_PROGRESS = 0;
const COMPLETED_PROGRESS = 1;
const DEFAULT_TEMPERATURE = 0.0;
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
  private rejectInit: ((reason: unknown) => void) | null = null;
  private cancelled = false;

  static onProgressUpdate: ((progress: ModelProgress) => void) | null = null;
  private static currentInstance: WebLLMProvider | null = null;

  constructor(modelId: string = DEFAULT_MODEL_ID) {
    super();
    this.modelId = modelId;
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
      // Try exact match first
      const config = {
        model_list: prebuiltAppConfig.model_list,
        useIndexedDBCache: true,
      };

      let result = await hasModelInCache(modelId, config);

      if (!result) {
        // If not found, try to find the canonical ID from the prebuilt config
        const modelRecord = prebuiltAppConfig.model_list.find(
          (m) => m.model_id.toLowerCase() === modelId.toLowerCase(),
        );

        if (modelRecord && modelRecord.model_id !== modelId) {
          result = await hasModelInCache(modelRecord.model_id, config);
        }

        if (!result) {
          // Final attempt: TitleCase
          const titleCaseId = modelId.charAt(0).toUpperCase() + modelId.slice(1);
          if (titleCaseId !== modelId && titleCaseId !== (modelRecord?.model_id || '')) {
            result = await hasModelInCache(titleCaseId, config);
          }
        }
      }

      return result;
    } catch (error) {
      // Only log if it's not a expected missing record
      if (!(error instanceof Error && error.message.includes('Cannot find model record'))) {
        Logger.error('WebLLMProvider', 'Cache check failed', error);
      }
      return false;
    }
  }

  private async initialize(): Promise<void> {
    if (this.engine) return;
    if (this.initPromise) return this.initPromise;

    // Validate ID before starting
    const modelRecord = prebuiltAppConfig.model_list.find(
      (m) => m.model_id.toLowerCase() === this.modelId.toLowerCase(),
    );

    if (!modelRecord) {
      throw new Error(
        i18n.t('messages.model_not_supported', {
          defaultValue: `Model ${this.modelId} is not supported by the current engine version.`,
        }),
      );
    }

    // Use the exact ID from the config to avoid casing issues
    const exactModelId = modelRecord.model_id;

    this.initPromise = new Promise<void>((resolve, reject) => {
      this.rejectInit = reject;
      (async () => {
        let attempt = 0;
        while (attempt < MAX_INIT_ATTEMPTS) {
          try {
            WebLLMProvider.currentInstance = this;
            this.cancelled = false;

            const cached = await hasModelInCache(exactModelId, {
              model_list: prebuiltAppConfig.model_list,
              useIndexedDBCache: true,
            });

            const progressState = cached ? ModelProgressState.LOADING : ModelProgressState.DOWNLOADING;

            this.emitProgress({
              text: i18n.t('status.preparing'),
              progress: INITIAL_PROGRESS,
              state: progressState,
              modelId: exactModelId,
            });

            if (this.cancelled) {
              throw new Error('aborted');
            }

            const engine = new MLCEngine({
              appConfig: {
                ...prebuiltAppConfig,
                useIndexedDBCache: true,
              },
              initProgressCallback: (p) => {
                if (this.cancelled) return;
                this.emitProgress({
                  text: p.text,
                  progress: p.progress || INITIAL_PROGRESS,
                  state: progressState,
                  modelId: exactModelId,
                });
              },
            });

            // Assign engine IMMEDIATELY so stopDownload can call unload() if needed during reload
            this.engine = engine;

            // Start model loading with optimized config for lower VRAM usage
            await this.engine.reload(exactModelId, {
              context_window_size: 2048,
            });

            if (this.cancelled) {
              await this.engine.unload();
              this.engine = null;
              throw new Error('aborted');
            }

            this.emitProgress({
              text: i18n.t('status.ready'),
              progress: COMPLETED_PROGRESS,
              state: ModelProgressState.LOADING,
              modelId: exactModelId,
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

  async stopDownload(shouldCleanup: boolean = false): Promise<void> {
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

    // ONLY clean up from cache if explicitly requested (e.g. via Cancel button)
    if (shouldCleanup) {
      try {
        await WebLLMProvider.deleteModel(modelToClean);
      } catch (e) {
        Logger.error('WebLLMProvider', 'Failed to clean up partial model', e);
      }

      // Only emit cancelled progress for explicit user cancellation
      this.emitProgress({
        text: i18n.t('messages.download_cancelled'),
        progress: INITIAL_PROGRESS,
        state: ModelProgressState.DOWNLOADING,
        modelId: this.modelId,
      });
    }
  }

  /**
   * Unload the model to free up resources
   */
  async unload(): Promise<void> {
    Logger.debug('WebLLMProvider', `Unloading model ${this.modelId}`);
    try {
      await this.stopDownload(false);
    } catch (e) {
      Logger.error('WebLLMProvider', 'Error unloading model', e);
    }
  }

  static async stopCurrentDownload(): Promise<boolean> {
    if (WebLLMProvider.currentInstance) {
      // User-initiated stop should cleanup partial files
      await WebLLMProvider.currentInstance.stopDownload(true);
      return true;
    }
    return false;
  }

  async isAvailable(): Promise<boolean> {
    const hasWebGPU = await isWebGPUAvailable();
    if (!hasWebGPU) return false;

    await this.initialize();
    return !!this.engine;
  }

  async ensureReady(): Promise<void> {
    await this.initialize();
  }

  async correct(
    text: string,
    style: CorrectionStyle = CorrectionStyle.FORMAL,
    language: Language = Language.EN,
    onPartialText?: (text: string) => void,
  ): Promise<CorrectionResult> {
    await this.ensureReady();
    if (!this.engine) {
      throw new Error('Model not ready');
    }

    const prompt = this.buildPrompt(text, style, language);
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: this.getSystemPrompt(language) },
      { role: 'user', content: prompt },
    ];

    const completion = await this.engine.chat.completions.create({
      messages,
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: MAX_TOKENS,
      stream: true,
    });

    let fullContent = '';
    let lastCorrectedText = '';

    for await (const chunk of completion) {
      const delta = chunk.choices[0]?.delta?.content || '';
      fullContent += delta;

      // Validate streaming response incrementally for early error detection
      this.validateStreamingChunk(fullContent);

      if (onPartialText) {
        // Simple heuristic to extract text from "corrected": "..." in partial JSON
        // We look for the start of the "corrected" field and take everything until the next quote or end
        const correctedPrefix = '"corrected":';
        const index = fullContent.indexOf(correctedPrefix);
        if (index !== -1) {
          const startSearch = index + correctedPrefix.length;
          const firstQuote = fullContent.indexOf('"', startSearch);
          if (firstQuote !== -1) {
            const nextQuote = fullContent.indexOf('"', firstQuote + 1);
            const partial =
              nextQuote !== -1
                ? fullContent.substring(firstQuote + 1, nextQuote)
                : fullContent.substring(firstQuote + 1);

            if (partial !== lastCorrectedText) {
              lastCorrectedText = partial;
              onPartialText(lastCorrectedText);
            }
          }
        }
      }
    }

    return this.parseResponse(fullContent, text, style);
  }

  /**
   * Validates streaming response chunks for basic JSON structure integrity
   */
  private validateStreamingChunk(chunk: string): void {
    // Track bracket balance to detect malformed JSON early
    let braceDepth = 0;
    let bracketDepth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\' && inString) {
        escaped = true;
        continue;
      }

      if (char === '"' && !escaped) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
        if (char === '[') bracketDepth++;
        if (char === ']') bracketDepth--;
      }
    }

    // Log warning if brackets are severely mismatched (likely malformed)
    if (braceDepth < -2 || bracketDepth < -2) {
      Logger.warn('WebLLMProvider', 'Streaming response shows bracket imbalance', {
        braceDepth,
        bracketDepth,
        chunkLength: chunk.length,
      });
    }
  }

  private parseResponse(raw: string, original: string, style: CorrectionStyle): CorrectionResult {
    // Use enhanced validator with recovery strategies
    const validation = ResponseValidator.validate(raw, original);

    if (validation.isValid && validation.parsed) {
      ModelCapabilityRegistry.recordParseSuccess(this.modelId, style);
      return this.formatResult(validation.parsed, original, raw);
    }

    // Record failure and categorize error
    ModelCapabilityRegistry.recordParseFailure(this.modelId, style);

    if (validation.errorCategory) {
      ResponseValidator.logParseError(validation.errorCategory, this.modelId, style, validation.recoveryAttempt);
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
    // Preserve arrays so the UI can present them line-by-line
    let explanation: string | string[] = '';
    const explanationValue = parsed['explanation'];
    if (typeof explanationValue === 'string') {
      explanation = explanationValue;
    } else if (Array.isArray(explanationValue)) {
      explanation = explanationValue.map((v) => (v === null || v === undefined ? '' : String(v)));
    } else if (explanationValue) {
      explanation = String(explanationValue);
    }

    const sameText = corrected.trim() === original.trim();

    if (sameText) {
      const note = `(${i18n.t('messages.no_changes')})`;

      const appendNote = (exp: string | string[], n: string): string | string[] => {
        if (Array.isArray(exp)) {
          if (exp.length === 0) return [n];
          const lastIndex = exp.length - 1;
          const last = exp.at?.(-1) || exp[lastIndex] || '';
          if (last.includes(n)) return exp;
          const copy = exp.slice();
          copy[lastIndex] = `${copy[lastIndex]} ${n}`.trim();
          return copy;
        }

        const s = (exp as string) || '';
        if (s.includes(n)) return s;
        return `${s} ${n}`.trim();
      };

      explanation = appendNote(explanation, note);
    }

    return {
      original,
      corrected,
      explanation,
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
