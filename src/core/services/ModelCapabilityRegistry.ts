import { Logger } from '@/core/services/Logger';
import { CorrectionStyle } from '@/shared/types';

export interface ModelCapability {
  modelId: string;
  supportsStrictJSON: boolean; // Can the model reliably produce valid JSON?
  supportsStreaming: boolean;
  streamsValidJSON: boolean; // Does streaming output contain valid intermediate JSON?
  failureRate: number; // Percentage of requests that fail (0-1)
  lastUpdated: number; // Timestamp
  issues: string[]; // Known issues with this model
}

/**
 * ModelCapabilityRegistry tracks model capabilities and failure patterns
 * to enable intelligent model selection and fallback strategies
 */
export class ModelCapabilityRegistry {
  private static capabilities: Map<string, ModelCapability> = new Map();
  private static readonly STORAGE_KEY = 'model_capabilities_registry';
  private static readonly MAX_SAMPLES = 100;
  private static recordedFailures: Map<string, number> = new Map();

  /**
   * Initialize registry from persistent storage
   */
  static async initialize(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.capabilities = new Map(Object.entries(parsed));
        Logger.debug('ModelCapabilityRegistry', 'Initialized from storage', {
          models: this.capabilities.size,
        });
      }
    } catch (err) {
      Logger.warn('ModelCapabilityRegistry', 'Failed to load capabilities from storage', err);
    }
  }

  /**
   * Register a model with known capabilities
   */
  static registerModel(modelId: string, capabilities: Partial<ModelCapability>): void {
    const existing = this.capabilities.get(modelId) || this.createDefaultCapability(modelId);

    const updated: ModelCapability = {
      ...existing,
      ...capabilities,
      modelId,
      lastUpdated: Date.now(),
    };

    this.capabilities.set(modelId, updated);
    this.persist();

    Logger.debug('ModelCapabilityRegistry', `Registered capabilities for ${modelId}`, updated);
  }

  /**
   * Record a parse failure for a model-style combination
   */
  static recordParseFailure(modelId: string, _style: CorrectionStyle): void {
    const key = `${modelId}`;
    const current = this.recordedFailures.get(key) || 0;
    this.recordedFailures.set(key, current + 1);

    // Update failure rate in registry
    const cap = this.capabilities.get(modelId) || this.createDefaultCapability(modelId);
    const sampleSize = Math.min(this.recordedFailures.size, this.MAX_SAMPLES);
    const failureCount = this.recordedFailures.get(key) || 0;
    cap.failureRate = failureCount / sampleSize;

    this.capabilities.set(modelId, cap);
    this.persist();
  }

  /**
   * Record a successful parse for a model-style combination
   */
  static recordParseSuccess(modelId: string, _style: CorrectionStyle): void {
    const cap = this.capabilities.get(modelId) || this.createDefaultCapability(modelId);

    // Slightly decrease failure rate on success
    if (cap.failureRate > 0) {
      cap.failureRate = Math.max(0, cap.failureRate - 0.01);
    }

    this.capabilities.set(modelId, cap);
    this.persist();
  }

  /**
   * Get capability info for a model
   */
  static getCapability(modelId: string): ModelCapability {
    return this.capabilities.get(modelId) || this.createDefaultCapability(modelId);
  }

  /**
   * Check if a model is considered reliable (low failure rate)
   */
  static isReliable(modelId: string): boolean {
    const cap = this.getCapability(modelId);
    return cap.failureRate < 0.1; // < 10% failure rate
  }

  /**
   * Get all registered models sorted by reliability
   */
  static getModelsByReliability(): ModelCapability[] {
    return Array.from(this.capabilities.values()).sort((a, b) => a.failureRate - b.failureRate);
  }

  /**
   * Check if model has a known issue with JSON output
   */
  static hasKnownJSONIssue(modelId: string): boolean {
    const cap = this.getCapability(modelId);
    return cap.issues.some((issue) => issue.toLowerCase().includes('json') || issue.toLowerCase().includes('format'));
  }

  /**
   * Add a known issue to a model's profile
   */
  static addKnownIssue(modelId: string, issue: string): void {
    const cap = this.getCapability(modelId);
    if (!cap.issues.includes(issue)) {
      cap.issues.push(issue);
      this.capabilities.set(modelId, cap);
      this.persist();
    }
  }

  /**
   * Clear all recorded data
   */
  static clear(): void {
    this.capabilities.clear();
    this.recordedFailures.clear();
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  private static createDefaultCapability(modelId: string): ModelCapability {
    return {
      modelId,
      supportsStrictJSON: true,
      supportsStreaming: true,
      streamsValidJSON: false,
      failureRate: 0,
      lastUpdated: Date.now(),
      issues: [],
    };
  }

  private static persist(): void {
    try {
      const data = Object.fromEntries(this.capabilities);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      Logger.warn('ModelCapabilityRegistry', 'Failed to persist capabilities', err);
    }
  }
}
