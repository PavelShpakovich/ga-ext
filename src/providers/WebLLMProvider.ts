import {
  CreateMLCEngine,
  MLCEngine,
  ChatCompletionMessageParam,
  prebuiltAppConfig,
  hasModelInCache,
} from '@mlc-ai/web-llm';
import { AIProvider } from './AIProvider';
import { CorrectionStyle, CorrectionResult } from '../types';
import { Logger } from '../services/Logger';

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

/**
 * WebLLM Provider - Runs AI models directly in the browser using WebGPU
 * No external servers, completely private and offline
 */
export class WebLLMProvider extends AIProvider {
  private engine: MLCEngine | null = null;
  private modelId: string;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private abortController: AbortController | null = null;

  // Static callback for progress updates (set by UI component)
  static onProgressUpdate:
    | ((progress: { text: string; progress: number; state: 'downloading' | 'loading' }) => void)
    | null = null;

  // Track the currently initializing instance
  private static currentInstance: WebLLMProvider | null = null;

  constructor(modelId?: string) {
    super();
    // Use provided model or first available model
    this.modelId = modelId || WebLLMProvider.getAvailableModels()[0]?.id || 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
    Logger.debug('WebLLMProvider', `Initialized with model: ${this.modelId}`);
  }

  /**
   * Check if WebGPU is supported in the current browser
   */
  static async isWebGPUAvailable(): Promise<boolean> {
    if (!navigator.gpu) {
      Logger.warn('WebLLMProvider', 'WebGPU not found in navigator');
      return false;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      const available = adapter !== null;
      Logger.debug('WebLLMProvider', `WebGPU adapter check: ${available}`);
      return available;
    } catch (e) {
      Logger.error('WebLLMProvider', 'Error checking WebGPU availability', e);
      return false;
    }
  }

  /**
   * Initialize the WebLLM engine and load the model
   * This downloads the model to IndexedDB on first run
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized && this.engine) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        Logger.info('WebLLMProvider', `Loading model ${this.modelId}...`);

        // Set this as the current instance being initialized
        WebLLMProvider.currentInstance = this;

        // Create abort controller for this initialization
        this.abortController = new AbortController();

        // Check if model is already in cache
        const isCached = await hasModelInCache(this.modelId, {
          model_list: prebuiltAppConfig.model_list,
        });

        Logger.debug('WebLLMProvider', `Model ${this.modelId} cached: ${isCached}`);

        // Create abort promise that rejects when aborted
        const abortPromise = new Promise<never>((_, reject) => {
          this.abortController?.signal.addEventListener('abort', () => {
            reject(new Error('Model download aborted by user'));
          });
        });

        // Race between engine creation and abort
        const enginePromise = CreateMLCEngine(this.modelId, {
          appConfig: {
            model_list: prebuiltAppConfig.model_list,
            useIndexedDBCache: true,
          },
          initProgressCallback: (progress) => {
            // Check if abort was requested
            if (this.abortController?.signal.aborted) {
              Logger.debug('WebLLMProvider', 'Abort detected in progress callback');
              return;
            }

            // Robust State Logic:
            // 1. If the model was fully cached at start -> state is 'loading' (Warming Up)
            // 2. If the model was missing/partial -> state is 'downloading'
            // We maintain this state consistently throughout the initialization to prevent UI flashing.
            // We consciously avoid parsing progress.text to prevent brittleness.
            const state = isCached ? 'loading' : 'downloading';

            Logger.debug('WebLLMProvider', `Progress: ${progress.text} (${Math.round(progress.progress * 100)}%)`);

            // Call the progress callback if set
            if (WebLLMProvider.onProgressUpdate) {
              WebLLMProvider.onProgressUpdate({
                text: progress.text,
                progress: progress.progress || 0,
                state,
              });
            }
          },
        });

        // Wait for either engine creation or abort
        this.engine = await Promise.race([enginePromise, abortPromise]);

        this.isInitialized = true;
        this.abortController = null;
        WebLLMProvider.currentInstance = null;
        Logger.info('WebLLMProvider', 'Model loaded successfully', { modelId: this.modelId });
      } catch (error) {
        this.initPromise = null;
        this.abortController = null;
        WebLLMProvider.currentInstance = null;
        this.engine = null;
        this.isInitialized = false;

        // Check if it was aborted
        if (error instanceof Error && (error.message.includes('abort') || error.message.includes('cancelled'))) {
          Logger.info('WebLLMProvider', 'Initialization aborted by user');

          // Notify UI that download was cancelled
          if (WebLLMProvider.onProgressUpdate) {
            WebLLMProvider.onProgressUpdate({
              text: 'Download cancelled',
              progress: 0,
              state: 'downloading',
            });
          }

          throw new Error('Model download cancelled');
        }

        throw new Error(`Failed to initialize WebLLM: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    })();

    return this.initPromise;
  }

  async isAvailable(): Promise<boolean> {
    const hasWebGPU = await WebLLMProvider.isWebGPUAvailable();
    if (!hasWebGPU) {
      return false;
    }

    try {
      await this.initialize();
      return true;
    } catch (error) {
      Logger.error('WebLLMProvider', 'Failed to initialize model in isAvailable', error);
      return false;
    }
  }

  async correct(text: string, style: CorrectionStyle = CorrectionStyle.FORMAL): Promise<CorrectionResult> {
    await this.initialize();

    if (!this.engine) {
      throw new Error('AI model not ready');
    }

    const prompt = this.buildPrompt(text, style);

    try {
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: prompt },
      ];

      const response = await this.engine.chat.completions.create({
        messages,
        temperature: 0.1,
        max_tokens: 4000,
        stop: ['\n}\n', '\n}', '}\n\n'], // Stop after JSON closes
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseResponse(content, text, style);
    } catch (error) {
      throw new Error(`Correction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate that critical elements (emails, URLs, names, etc.) are preserved
   * Returns array of issues found
   */
  private validatePreservation(original: string, corrected: string): string[] {
    const issues: string[] = [];

    // Extract emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const originalEmails = (original.match(emailRegex) || []) as string[];
    const correctedEmails = (corrected.match(emailRegex) || []) as string[];

    // Check if any emails were removed or changed
    for (const email of originalEmails) {
      if (!correctedEmails.includes(email)) {
        issues.push(`Email changed/removed: ${email}`);
      }
    }

    // Extract @mentions
    const mentionRegex = /@[a-zA-Z0-9_.-]+/g;
    const originalMentions = (original.match(mentionRegex) || []) as string[];
    const correctedMentions = (corrected.match(mentionRegex) || []) as string[];

    for (const mention of originalMentions) {
      if (!correctedMentions.includes(mention)) {
        issues.push(`Mention changed/removed: ${mention}`);
      }
    }

    // Extract URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const originalUrls = (original.match(urlRegex) || []) as string[];
    const correctedUrls = (corrected.match(urlRegex) || []) as string[];

    for (const url of originalUrls) {
      if (!correctedUrls.includes(url)) {
        issues.push(`URL changed/removed: ${url}`);
      }
    }

    // Extract numbers (version numbers, dates, amounts)
    const numberRegex = /\b\d+(?:\.\d+)*\b/g;
    const originalNumbers = (original.match(numberRegex) || []) as string[];
    const correctedNumbers = (corrected.match(numberRegex) || []) as string[];

    // Only flag if numbers are removed (changing order is sometimes OK for grammar)
    if (originalNumbers.length > correctedNumbers.length) {
      issues.push(`Numbers removed: had ${originalNumbers.length}, now ${correctedNumbers.length}`);
    }

    return issues;
  }

  /**
   * Parse the model's response into a structured CorrectionResult
   */
  private parseResponse(response: string, originalText: string, style: CorrectionStyle): CorrectionResult {
    Logger.info('WebLLMProvider', 'Raw model response', { length: response.length });
    Logger.debug('WebLLMProvider', 'Response content', { response: response.substring(0, 500) });

    try {
      let jsonStr = response;

      // 1. Aggressive removal of all thinking/reasoning patterns
      // Remove <think>...</think> tags (may be nested or repeated)
      while (jsonStr.includes('<think>')) {
        jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/gi, '');
      }

      // Remove common reasoning prefixes/suffixes
      jsonStr = jsonStr.replace(/^.*?(?=\{)/s, ''); // Remove everything before first {
      jsonStr = jsonStr.replace(/\}[^}]*$/s, '}'); // Remove everything after last }

      // 2. Helper to try parsing a string
      const tryParse = (s: string) => {
        try {
          const trimmed = s.trim();
          if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
          return JSON.parse(trimmed);
        } catch (e) {
          return null;
        }
      };

      let parsed = tryParse(jsonStr);

      // 3. If direct parse fails, try extracting from Markdown code blocks
      if (!parsed) {
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          parsed = tryParse(codeBlockMatch[1]);
        }
      }

      // 4. Try to find the LAST complete JSON object (reasoning models often try multiple times)
      if (!parsed) {
        const jsonMatches: string[] = [];
        let braceCount = 0;
        let startIdx = -1;

        for (let i = 0; i < jsonStr.length; i++) {
          if (jsonStr[i] === '{') {
            if (braceCount === 0) startIdx = i;
            braceCount++;
          } else if (jsonStr[i] === '}') {
            braceCount--;
            if (braceCount === 0 && startIdx !== -1) {
              jsonMatches.push(jsonStr.substring(startIdx, i + 1));
              startIdx = -1;
            }
          }
        }

        // Try parsing from the last match backwards (most recent attempt is usually best)
        for (let i = jsonMatches.length - 1; i >= 0; i--) {
          parsed = tryParse(jsonMatches[i]);
          if (parsed && parsed.corrected) break;
        }
      }

      // 5. Fallback: Try to extract partial JSON (handle incomplete responses)
      if (!parsed || !parsed.corrected) {
        Logger.warn('WebLLMProvider', 'Attempting partial JSON extraction');

        // Try to at least extract the "corrected" field using regex
        const correctedMatch = jsonStr.match(/"corrected"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
        if (correctedMatch && correctedMatch[1]) {
          Logger.info('WebLLMProvider', 'Extracted corrected text from incomplete JSON');
          parsed = {
            corrected: correctedMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
            explanation: 'Text corrected (incomplete model response)',
          };
        }
      }

      if (!parsed || !parsed.corrected) {
        Logger.warn('WebLLMProvider', 'No valid JSON found in response', { jsonStr: jsonStr.substring(0, 200) });
        throw new Error('No valid JSON found in response');
      }

      Logger.debug('WebLLMProvider', 'Successfully parsed response', {
        corrected: parsed.corrected,
        hasExplanation: !!parsed.explanation,
      });

      // Validate that critical elements are preserved
      const preservationIssues = this.validatePreservation(originalText, parsed.corrected);
      if (preservationIssues.length > 0) {
        Logger.warn('WebLLMProvider', 'Preservation validation failed', { issues: preservationIssues });
        // Revert to original if critical elements were changed
        parsed.corrected = originalText;
        parsed.explanation = 'Reverted: Model attempted to change protected elements (emails, names, etc.)';
      }

      // Normalize the result
      const result: CorrectionResult = {
        original: originalText,
        corrected: parsed.corrected || originalText,
        style,
        explanation: parsed.explanation,
      };

      return result;
    } catch (error) {
      Logger.error('WebLLMProvider', 'Failed to parse response', error);

      // Fallback: return original text with error message
      return {
        original: originalText,
        corrected: originalText,
        style,
        explanation: 'Error: Failed to parse model response',
      };
    }
  }

  /**
   * Get all available WebLLM models organized by family
   * Filters out reasoning models (DeepSeek-R1) that include thinking steps in output
   */
  static getAvailableModels(): Array<{
    id: string;
    name: string;
    family: string;
    size: string;
    description: string;
    speed: 'fast' | 'medium' | 'slow';
  }> {
    return prebuiltAppConfig.model_list
      .filter((m) => {
        // Filter out models that are not suitable for grammar correction
        const id = m.model_id.toLowerCase();
        return !id.includes('snowflake'); // Embedding models, not for text generation
      })
      .map((m) => {
        const id = m.model_id;
        const lowerID = id.toLowerCase();

        // Determine model family
        let family = 'Other';
        if (lowerID.includes('tinyllama'))
          family = 'TinyLlama'; // Check before 'llama'
        else if (lowerID.includes('smollm')) family = 'SmolLM';
        else if (lowerID.includes('llama')) family = 'Llama';
        else if (lowerID.includes('phi')) family = 'Phi';
        else if (lowerID.includes('gemma')) family = 'Gemma';
        else if (lowerID.includes('qwen')) family = 'Qwen';
        else if (lowerID.includes('mistral')) family = 'Mistral';
        else if (lowerID.includes('hermes')) family = 'Hermes';
        else if (lowerID.includes('stablelm')) family = 'StableLM';
        else if (lowerID.includes('redpajama')) family = 'RedPajama';
        else if (lowerID.includes('wizardmath')) family = 'WizardMath';

        // Use actual VRAM requirements from WebLLM model data
        const vramMB = m.vram_required_MB || 1000;
        let size: string;
        let speed: 'fast' | 'medium' | 'slow';
        let description = 'General purpose';

        // Calculate size and speed based on actual VRAM requirements
        if (vramMB < 600) {
          size = `${Math.round(vramMB)}MB`;
          speed = 'fast';
          description = 'Ultra-fast, basic corrections';
        } else if (vramMB < 1500) {
          size = `${(vramMB / 1024).toFixed(1)}GB`;
          speed = 'fast';
          description = 'Fast & efficient';
        } else if (vramMB < 2500) {
          size = `${(vramMB / 1024).toFixed(1)}GB`;
          speed = 'medium';
          description = 'Balanced performance';
        } else if (vramMB < 4000) {
          size = `${(vramMB / 1024).toFixed(1)}GB`;
          speed = 'medium';
          description = 'Better quality';
        } else {
          size = `${(vramMB / 1024).toFixed(1)}GB`;
          speed = 'slow';
          description = 'High quality, slower';
        }

        // Special recommendations based on use case (grammar correction)
        if (id === 'Llama-3.2-1B-Instruct-q4f16_1-MLC') {
          description = 'Recommended - Fast & efficient';
        } else if (id === 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC') {
          description = 'Ultra-fast - Great for quick fixes';
        } else if (id === 'Phi-3-mini-4k-instruct-q4f16_1-MLC') {
          description = 'High quality from Microsoft';
        } else if (id === 'gemma-2-2b-it-q4f16_1-MLC') {
          description = 'Google Gemma - Balanced quality';
        } else if (lowerID.includes('coder')) {
          description = 'Specialized for code';
        } else if (lowerID.includes('math')) {
          description = 'Specialized for math';
        }

        // Create readable name
        let name = id;
        const parts = id.split('-');
        if (parts.length >= 2) {
          // Extract base name (e.g., "Llama 3.2 1B")
          name = parts
            .slice(0, 3)
            .join(' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2');
        }

        return { id, name, family, size, description, speed };
      });
  }

  /**
   * Get models grouped by family for better UI organization
   */
  static getGroupedModels() {
    const models = this.getAvailableModels();
    const grouped: Record<string, typeof models> = {};

    models.forEach((model) => {
      if (!grouped[model.family]) {
        grouped[model.family] = [];
      }
      grouped[model.family].push(model);
    });

    // Sort each group by size (smallest first)
    Object.keys(grouped).forEach((family) => {
      grouped[family].sort((a, b) => {
        const sizeOrder = { fast: 0, medium: 1, slow: 2 };
        return sizeOrder[a.speed] - sizeOrder[b.speed];
      });
    });

    return grouped;
  }

  /**
   * Stop the current model download
   */
  stopDownload(): void {
    if (this.abortController) {
      Logger.info('WebLLMProvider', 'Aborting download');
      this.abortController.abort();

      // Clean up state immediately
      this.abortController = null;
      this.initPromise = null;
      this.isInitialized = false;

      // Try to clean up engine if it exists
      if (this.engine) {
        try {
          // Engine might not be fully initialized yet
          this.engine = null;
        } catch (e) {
          Logger.debug('WebLLMProvider', 'Error cleaning up engine during abort', e);
        }
      }

      // Notify UI that download was cancelled
      if (WebLLMProvider.onProgressUpdate) {
        WebLLMProvider.onProgressUpdate({
          text: 'Download cancelled',
          progress: 0,
          state: 'downloading',
        });
      }
    } else {
      Logger.warn('WebLLMProvider', 'No active download to stop');
    }
  }

  /**
   * Static method to stop the currently initializing instance
   */
  static stopCurrentDownload(): boolean {
    if (WebLLMProvider.currentInstance) {
      WebLLMProvider.currentInstance.stopDownload();
      return true;
    }
    Logger.warn('WebLLMProvider', 'No active download to stop');
    return false;
  }

  /**
   * Clear all cached models from IndexedDB
   */
  static async clearCache(): Promise<void> {
    try {
      Logger.info('WebLLMProvider', 'Clearing IndexedDB cache');

      // Get all databases and filter for WebLLM-related ones
      const allDatabases = await indexedDB.databases();
      const webllmDatabases = allDatabases
        .filter((db) => db.name && (db.name.includes('webllm') || db.name.includes('mlc')))
        .map((db) => db.name as string);

      if (webllmDatabases.length === 0) {
        Logger.info('WebLLMProvider', 'No WebLLM databases found');
        return;
      }

      Logger.debug('WebLLMProvider', 'Found databases to delete', {
        count: webllmDatabases.length,
        databases: webllmDatabases,
      });

      // Delete each database
      for (const dbName of webllmDatabases) {
        await new Promise<void>((resolve) => {
          const request = indexedDB.deleteDatabase(dbName);
          request.onsuccess = () => {
            Logger.debug('WebLLMProvider', 'Database deleted', { database: dbName });
            resolve();
          };
          request.onerror = () => {
            Logger.warn('WebLLMProvider', 'Failed to delete database', { database: dbName, error: request.error });
            resolve(); // Continue even if one fails
          };
          request.onblocked = () => {
            Logger.warn('WebLLMProvider', 'Database deletion blocked', {
              database: dbName,
              hint: 'Close all tabs using this extension',
            });
            resolve();
          };
        });
      }

      Logger.info('WebLLMProvider', 'Cache cleared successfully');
    } catch (error) {
      Logger.error('WebLLMProvider', 'Error clearing cache', error);
      throw error;
    }
  }

  /**
   * Delete a specific model from cache
   */
  static async deleteModel(modelId: string): Promise<void> {
    try {
      Logger.info('WebLLMProvider', 'Deleting model', { modelId });

      // WebLLM stores all models in a single "webllm/model" database
      // We need to delete all keys (URLs) that belong to this model
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('webllm/model');

        request.onerror = () => {
          Logger.error('WebLLMProvider', 'Failed to open webllm/model database');
          reject(new Error('Could not open model database'));
        };

        request.onsuccess = async (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          try {
            const storeNames = Array.from(db.objectStoreNames);
            Logger.debug('WebLLMProvider', 'Scanning stores for model data', {
              modelId,
              stores: storeNames,
            });

            let keysDeleted = 0;

            // Process all stores
            for (const storeName of storeNames) {
              const transaction = db.transaction(storeName, 'readwrite');
              const store = transaction.objectStore(storeName);
              const keysRequest = store.getAllKeys();

              await new Promise<void>((resolveStore) => {
                keysRequest.onsuccess = async () => {
                  const keys = keysRequest.result as string[];

                  // Find keys that belong to this model
                  const modelKeys = keys.filter((key) => {
                    if (typeof key === 'string' && key.includes('huggingface.co')) {
                      // Check if URL contains this model ID
                      // e.g., "mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC/"
                      const cleanModelId = modelId.replace(/-1k$/, '');
                      return key.includes(`mlc-ai/${modelId}/`) || key.includes(`mlc-ai/${cleanModelId}/`);
                    }
                    return false;
                  });

                  Logger.debug('WebLLMProvider', `Found ${modelKeys.length} keys for model in ${storeName}`);

                  // Delete each key
                  for (const key of modelKeys) {
                    try {
                      await new Promise<void>((resolveDelete) => {
                        const deleteRequest = store.delete(key);
                        deleteRequest.onsuccess = () => resolveDelete();
                        deleteRequest.onerror = () => {
                          Logger.warn('WebLLMProvider', 'Failed to delete key', { key });
                          resolveDelete();
                        };
                      });
                      keysDeleted++;
                    } catch (err) {
                      Logger.error('WebLLMProvider', 'Error deleting key', { key, error: err });
                    }
                  }

                  resolveStore();
                };

                keysRequest.onerror = () => {
                  Logger.error('WebLLMProvider', `Failed to get keys from ${storeName}`);
                  resolveStore();
                };
              });
            }

            db.close();

            if (keysDeleted > 0) {
              Logger.info('WebLLMProvider', 'Model deleted successfully', {
                modelId,
                keysDeleted,
              });
            } else {
              Logger.warn('WebLLMProvider', 'No model data found to delete', { modelId });
            }

            resolve();
          } catch (err) {
            Logger.error('WebLLMProvider', 'Error during model deletion', { modelId, error: err });
            db.close();
            reject(err);
          }
        };
      });
    } catch (error) {
      Logger.error('WebLLMProvider', 'Error deleting model', { modelId, error });
      throw error;
    }
  }

  /**
   * Get list of cached model IDs
   */
  static async getCachedModels(): Promise<string[]> {
    try {
      const cachedModels = new Set<string>();
      const availableModels = this.getAvailableModels();

      Logger.debug('WebLLMProvider', 'Checking for cached models in IndexedDB');

      // WebLLM stores model data in a single "webllm/model" database
      // with keys like: "https://huggingface.co/.../params_shard_0.bin"
      return new Promise((resolve) => {
        const request = indexedDB.open('webllm/model');

        request.onerror = () => {
          Logger.debug('WebLLMProvider', 'No webllm/model database found');
          resolve([]);
        };

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          try {
            // Get all object store names
            const storeNames = Array.from(db.objectStoreNames);
            Logger.debug('WebLLMProvider', 'Found object stores', { stores: storeNames });

            if (storeNames.length === 0) {
              db.close();
              resolve([]);
              return;
            }

            // Check each store for model data
            const transaction = db.transaction(storeNames, 'readonly');
            let storesChecked = 0;

            for (const storeName of storeNames) {
              try {
                const store = transaction.objectStore(storeName);
                const keysRequest = store.getAllKeys();

                keysRequest.onsuccess = () => {
                  const keys = keysRequest.result as string[];
                  Logger.debug('WebLLMProvider', `Store ${storeName} has ${keys.length} keys`);

                  // Extract model IDs from URLs
                  for (const key of keys) {
                    if (typeof key === 'string' && key.includes('huggingface.co')) {
                      // Extract model name from URL like:
                      // "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC/resolve/main/params_shard_0.bin"
                      const match = key.match(/mlc-ai\/([^\/]+)\//);
                      if (match && match[1]) {
                        const modelId = match[1];
                        // Remove "-1k" suffix if present
                        const cleanId = modelId.replace(/-1k$/, '');
                        cachedModels.add(cleanId);

                        Logger.debug('WebLLMProvider', 'Found model from URL', {
                          url: key.substring(0, 100),
                          extractedId: cleanId,
                        });
                      }
                    }
                  }

                  storesChecked++;
                  if (storesChecked === storeNames.length) {
                    db.close();
                    const result = Array.from(cachedModels);
                    Logger.info('WebLLMProvider', 'Cached models found', { count: result.length, models: result });
                    resolve(result);
                  }
                };

                keysRequest.onerror = () => {
                  storesChecked++;
                  if (storesChecked === storeNames.length) {
                    db.close();
                    const result = Array.from(cachedModels);
                    resolve(result);
                  }
                };
              } catch (err) {
                Logger.error('WebLLMProvider', `Error reading store ${storeName}`, err);
                storesChecked++;
                if (storesChecked === storeNames.length) {
                  db.close();
                  resolve(Array.from(cachedModels));
                }
              }
            }
          } catch (err) {
            Logger.error('WebLLMProvider', 'Error accessing IndexedDB stores', err);
            db.close();
            resolve([]);
          }
        };
      });
    } catch (error) {
      Logger.error('WebLLMProvider', 'Error getting cached models', error);
      return [];
    }
  }

  /**
   * Get the size of cached models in IndexedDB
   */
  static async getCacheSize(): Promise<{ size: number; databases: string[] }> {
    try {
      const databases: string[] = [];
      let totalSize = 0;

      // Try to estimate storage usage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        totalSize = estimate.usage || 0;
      }

      // List WebLLM databases
      const dbList = await indexedDB.databases();
      for (const db of dbList) {
        if (db.name && (db.name.includes('webllm') || db.name.includes('mlc'))) {
          databases.push(db.name);
        }
      }

      return { size: totalSize, databases };
    } catch (error) {
      Logger.error('WebLLMProvider', 'Error getting cache size', error);
      return { size: 0, databases: [] };
    }
  }

  /**
   * Unload the model to free up memory
   */
  async unload(): Promise<void> {
    if (this.engine) {
      this.engine = null;
      this.isInitialized = false;
      this.initPromise = null;
      this.abortController = null;
    }
  }
}
