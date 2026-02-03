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
const FREQUENCY_PENALTY = 0.5; // Prevent repetitive looping in explanations
const PRESENCE_PENALTY = 0.3; // Encourage talking about different improvements

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
  private progressCallbackId: number | null = null;

  static onProgressUpdate: ((progress: ModelProgress) => void) | null = null;
  private static currentInstance: WebLLMProvider | null = null;
  private static progressCallbackRegistry = new Map<number, (progress: ModelProgress) => void>();
  private static callbackIdCounter = 0;

  constructor(modelId: string = DEFAULT_MODEL_ID) {
    super();
    this.modelId = modelId;
  }

  /**
   * Register a progress callback and get an ID for cleanup
   */
  static registerProgressCallback(callback: (progress: ModelProgress) => void): number {
    const id = ++this.callbackIdCounter;
    this.progressCallbackRegistry.set(id, callback);
    Logger.debug('WebLLMProvider', 'Progress callback registered', { id });
    return id;
  }

  /**
   * Unregister a progress callback by ID
   */
  static unregisterProgressCallback(id: number): void {
    if (this.progressCallbackRegistry.delete(id)) {
      Logger.debug('WebLLMProvider', 'Progress callback unregistered', { id });
    }
  }

  /**
   * Clear all progress callbacks (for complete cleanup)
   */
  static clearProgressCallbacks(): void {
    const count = this.progressCallbackRegistry.size;
    this.progressCallbackRegistry.clear();
    Logger.debug('WebLLMProvider', 'All progress callbacks cleared', { count });
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
    // Emit to all registered callbacks
    for (const callback of WebLLMProvider.progressCallbackRegistry.values()) {
      try {
        callback(progress);
      } catch (error) {
        Logger.error('WebLLMProvider', 'Error in progress callback', error);
      }
    }

    // Also emit to legacy single callback for backwards compatibility
    if (WebLLMProvider.onProgressUpdate) {
      try {
        WebLLMProvider.onProgressUpdate(progress);
      } catch (error) {
        Logger.error('WebLLMProvider', 'Error in legacy progress callback', error);
      }
    }
  }

  static async isModelCached(modelId: string): Promise<boolean> {
    try {
      // EXACT match only - prevent cross-model matches
      const exactRecord = prebuiltAppConfig.model_list.find((m) => m.model_id.toLowerCase() === modelId.toLowerCase());

      const config = {
        model_list: prebuiltAppConfig.model_list,
        useIndexedDBCache: true,
      };

      // Try with exact match first
      if (exactRecord) {
        const result = await hasModelInCache(exactRecord.model_id, config);
        return result;
      }

      // Fallback: try the provided ID directly
      try {
        const result = await hasModelInCache(modelId, config);
        return result;
      } catch (innerError) {
        // If the direct ID fails with "Cannot find model record",
        // it means the model isn't in our prebuilt list at all
        if (innerError instanceof Error && innerError.message.includes('Cannot find model record')) {
          Logger.debug('WebLLMProvider', `Model ${modelId} not in prebuilt list, assuming not cached`);
          return false;
        }
        throw innerError;
      }
    } catch (error) {
      Logger.error('WebLLMProvider', 'Cache check failed for model', { modelId, error });
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
              const engineToUnload = this.engine;
              this.engine = null;
              await engineToUnload.unload();
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
              const engineToUnload = this.engine;
              this.engine = null;
              try {
                await engineToUnload.unload();
              } catch (e) {
                // Ignore unload errors during catch
              }
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
      const engineToUnload = this.engine;
      this.engine = null;
      try {
        await engineToUnload.unload();
      } catch (e) {
        // Ignore unload errors
      }
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
    Logger.info('WebLLMProvider', 'Unloading model and cleaning up resources', { modelId: this.modelId });
    try {
      await this.stopDownload(false);

      // Clean up instance-specific callback registration
      if (this.progressCallbackId !== null) {
        WebLLMProvider.unregisterProgressCallback(this.progressCallbackId);
        this.progressCallbackId = null;
      }

      // Clear instance reference if this is the current instance
      if (WebLLMProvider.currentInstance === this) {
        WebLLMProvider.currentInstance = null;
      }

      Logger.debug('WebLLMProvider', 'Model unload completed', { modelId: this.modelId });
    } catch (e) {
      Logger.error('WebLLMProvider', 'Error during model unload', { error: e, modelId: this.modelId });
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
    // Import dynamically to avoid circular dependency
    const { ProviderFactory } = await import('@/core/providers');

    // Mark operation start to prevent model unloading during use
    ProviderFactory.startOperation();

    try {
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
        frequency_penalty: FREQUENCY_PENALTY,
        presence_penalty: PRESENCE_PENALTY,
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
    } finally {
      // Always mark operation end, even if error occurs
      ProviderFactory.endOperation();
    }
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

    // PARTIAL SUCCESS: Try to extract at least the corrected text
    // Even if full JSON parsing failed, the user should see corrected text if available
    const partialResult = ResponseValidator.extractCorrectedTextOnly(raw);

    if (partialResult && partialResult.trim().length > 0 && partialResult !== original) {
      Logger.info('WebLLMProvider', 'Partial success: extracted corrected text despite JSON parse failure');
      return {
        original,
        corrected: partialResult,
        explanation: i18n.t('messages.explanation_unavailable', {
          defaultValue: 'Explanation unavailable due to parsing error',
        }),
        raw,
        partialSuccess: true,
      };
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
    // Empty string explicitly means "no changes needed" - optimization from model
    let corrected = original;
    const correctedValue = parsed['corrected'] || parsed['corrected_text'] || parsed['correctedText'];

    if (typeof correctedValue === 'string') {
      // Empty string means no corrections needed - use original
      if (correctedValue.trim().length > 0) {
        corrected = correctedValue;
      }
      // else: keep corrected = original (empty string indicates no changes)
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
      // When text is unchanged, clear any spurious explanations from the model
      // and show only the "no changes" message
      const note = i18n.t('messages.no_changes');
      explanation = Array.isArray(explanation) ? [note] : note;
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
      // EXACT match only - prevent accidental deletion of wrong models
      const exactRecord = prebuiltAppConfig.model_list.find((m) => m.model_id.toLowerCase() === modelId.toLowerCase());
      const targetId = exactRecord ? exactRecord.model_id : modelId;

      Logger.info('WebLLMProvider', `Deleting model ${targetId} from cache`);
      await deleteModelAllInfoInCache(targetId, {
        ...prebuiltAppConfig,
        useIndexedDBCache: true,
      });

      // Critical: Force a cache check immediately to ensure deletion completed
      // WebLLM may cache metadata, so we verify it's actually gone
      let verifyDeleted = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const stillCached = await hasModelInCache(targetId, {
            model_list: prebuiltAppConfig.model_list,
            useIndexedDBCache: true,
          });
          if (!stillCached) {
            verifyDeleted = true;
            break;
          }
        } catch (e) {
          // If hasModelInCache throws, the model is definitely gone
          verifyDeleted = true;
          break;
        }

        // Exponential backoff: 50ms, 100ms, 200ms
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 50 * Math.pow(2, attempt)));
        }
      }

      if (!verifyDeleted) {
        Logger.warn('WebLLMProvider', `Model ${targetId} deletion verification failed, may still be cached`);
      } else {
        Logger.info('WebLLMProvider', `Successfully verified model ${targetId} deleted from cache`);
      }
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
