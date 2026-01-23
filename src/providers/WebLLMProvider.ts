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

        // Track if we have detected cache loading at any point
        let hasDetectedCacheLoad = isCached;

        // Create engine with progress callback
        this.engine = await CreateMLCEngine(this.modelId, {
          appConfig: {
            model_list: prebuiltAppConfig.model_list,
            useIndexedDBCache: true,
          },
          initProgressCallback: (progress) => {
            // Determine state based on initial cache check OR text content
            const text = progress.text.toLowerCase();
            const isLoadingFromCache = text.includes('loading model from cache') || text.includes('restore from cache');

            // Latch: if we ever detect we are loading from cache, we stick to that mode
            if (isLoadingFromCache) {
              hasDetectedCacheLoad = true;
            }

            // If we ever detected cache load, we stay in 'loading' state
            // entirely preventing a fallback to 'downloading' at the end (e.g. "Finish")
            const state: 'downloading' | 'loading' = hasDetectedCacheLoad ? 'loading' : 'downloading';

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

        this.isInitialized = true;
        this.abortController = null;
        WebLLMProvider.currentInstance = null;
        console.log('[WebLLM] Model loaded successfully');
      } catch (error) {
        this.initPromise = null;
        this.abortController = null;
        WebLLMProvider.currentInstance = null;

        // Check if it was aborted
        if (error instanceof Error && error.message.includes('abort')) {
          console.log('[WebLLM] Initialization aborted by user');
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
      console.error('[WebLLM] Failed to initialize:', error);
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
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseResponse(content, text, style);
    } catch (error) {
      throw new Error(`Correction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse the model's response into a structured CorrectionResult
   */
  private parseResponse(response: string, originalText: string, style: CorrectionStyle): CorrectionResult {
    try {
      let jsonStr = response;

      // 1. Remove <think> tags (deepseek-r1 etc)
      // We replace with empty string
      jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/gi, '');

      // 2. Helper to try parsing a string
      const tryParse = (s: string) => {
        try {
          return JSON.parse(s);
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

      // 4. If still failed, try finding the JSON object by iterating opening braces
      // This helps when there is reasoning text containing braces BEFORE the actual JSON
      if (!parsed) {
        let openIndex = jsonStr.indexOf('{');
        const closeIndex = jsonStr.lastIndexOf('}');

        while (openIndex !== -1 && closeIndex > openIndex) {
          const candidate = jsonStr.substring(openIndex, closeIndex + 1);
          parsed = tryParse(candidate);
          if (parsed) break;
          // Move to next opening brace
          openIndex = jsonStr.indexOf('{', openIndex + 1);
        }
      }

      if (!parsed) {
        throw new Error('No valid JSON found in response');
      }

      return {
        original: originalText,
        corrected: parsed.corrected || originalText,
        style,
        changes: Array.isArray(parsed.changes) ? parsed.changes : [],
        confidence: parsed.confidence || 0.8,
      };
    } catch (error) {
      console.error('[WebLLM] Failed to parse response:', error);

      // Fallback: return original text with error message
      return {
        original: originalText,
        corrected: originalText,
        style,
        changes: [
          {
            type: 'error',
            explanation: 'Failed to parse model response. The model might not support JSON output.',
          },
        ],
        confidence: 0,
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
      console.log('[WebLLM] Aborting download...');
      this.abortController.abort();
      this.abortController = null;
      this.initPromise = null;
      this.isInitialized = false;
      this.engine = null;

      // Notify UI that download was cancelled
      if (WebLLMProvider.onProgressUpdate) {
        WebLLMProvider.onProgressUpdate({
          text: 'Download cancelled',
          progress: 0,
          state: 'downloading',
        });
      }
    } else {
      console.warn('[WebLLM] No active download to stop');
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
    console.warn('[WebLLM] No active download to stop');
    return false;
  }

  /**
   * Clear all cached models from IndexedDB
   */
  static async clearCache(): Promise<void> {
    try {
      console.log('[WebLLM] Clearing IndexedDB cache...');

      // Get all databases and filter for WebLLM-related ones
      const allDatabases = await indexedDB.databases();
      const webllmDatabases = allDatabases
        .filter((db) => db.name && (db.name.includes('webllm') || db.name.includes('mlc')))
        .map((db) => db.name as string);

      if (webllmDatabases.length === 0) {
        console.log('[WebLLM] No WebLLM databases found');
        return;
      }

      console.log(`[WebLLM] Found ${webllmDatabases.length} databases to delete:`, webllmDatabases);

      // Delete each database
      for (const dbName of webllmDatabases) {
        await new Promise<void>((resolve) => {
          const request = indexedDB.deleteDatabase(dbName);
          request.onsuccess = () => {
            console.log(`[WebLLM] ✓ Deleted ${dbName}`);
            resolve();
          };
          request.onerror = () => {
            console.warn(`[WebLLM] ✗ Failed to delete ${dbName}:`, request.error);
            resolve(); // Continue even if one fails
          };
          request.onblocked = () => {
            console.warn(`[WebLLM] ⚠ Delete blocked for ${dbName} - close all tabs using this extension`);
            resolve();
          };
        });
      }

      console.log('[WebLLM] Cache cleared successfully');
    } catch (error) {
      console.error('[WebLLM] Error clearing cache:', error);
      throw error;
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
      console.error('[WebLLM] Error getting cache size:', error);
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
