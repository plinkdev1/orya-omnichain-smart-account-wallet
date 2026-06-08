/**
 * Biconomy MEE (Modular Execution Environment) Executor
 * Handles custom execution modules, hooks, and policies
 */

import type { Address } from '@orya/shared-types';
import { BiconomySmartAccountError } from './BiconomyErrors';
import type { MEEExecutionConfig } from './BiconomyTypes';

export interface ExecutionModule {
  address: Address;
  name: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface ExecutionHook {
  type: 'pre' | 'post' | 'fallback';
  module: Address;
  data: string;
}

export interface PolicyRule {
  id: string;
  type: 'whitelist' | 'blacklist' | 'rate_limit' | 'value_limit' | 'time_lock';
  target?: Address;
  params?: Record<string, any>;
  enabled: boolean;
}

export interface ExecutionContext {
  sender: Address;
  target: Address;
  value: string;
  data: string;
  chainId: number;
}

export class MEEExecutor {
  private modules: Map<string, ExecutionModule> = new Map();
  private hooks: ExecutionHook[] = [];
  private policies: PolicyRule[] = [];

  /**
   * Register an execution module
   */
  registerModule(module: ExecutionModule): void {
    this.modules.set(module.address, module);
  }

  /**
   * Enable/disable a module
   */
  setModuleEnabled(moduleAddress: Address, enabled: boolean): void {
    const module = this.modules.get(moduleAddress);
    if (module) {
      module.enabled = enabled;
    }
  }

  /**
   * Add pre-execution hook
   */
  addPreExecutionHook(hook: ExecutionHook): void {
    if (hook.type === 'pre') {
      this.hooks.push(hook);
    }
  }

  /**
   * Add post-execution hook
   */
  addPostExecutionHook(hook: ExecutionHook): void {
    if (hook.type === 'post') {
      this.hooks.push(hook);
    }
  }

  /**
   * Add policy rule
   */
  addPolicy(policy: PolicyRule): void {
    this.policies.push(policy);
  }

  /**
   * Validate execution against policies
   */
  async validateExecution(context: ExecutionContext): Promise<boolean> {
    try {
      for (const policy of this.policies) {
        if (!policy.enabled) continue;

        switch (policy.type) {
          case 'whitelist':
            if (
              policy.target &&
              context.target.toLowerCase() !== policy.target.toLowerCase()
            ) {
              return false;
            }
            break;

          case 'blacklist':
            if (
              policy.target &&
              context.target.toLowerCase() === policy.target.toLowerCase()
            ) {
              return false;
            }
            break;

          case 'value_limit':
            if (policy.params?.maxValue) {
              const limit = BigInt(policy.params.maxValue);
              const value = BigInt(context.value);
              if (value > limit) {
                return false;
              }
            }
            break;

          case 'rate_limit':
            if (policy.params?.maxPerMinute) {
              // Implement rate limiting logic
            }
            break;

          case 'time_lock':
            if (policy.params?.lockDuration) {
              const now = Math.floor(Date.now() / 1000);
              if (now < policy.params.lockDuration) {
                return false;
              }
            }
            break;
        }
      }

      return true;
    } catch (error) {
      throw new BiconomySmartAccountError(
        `Execution validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Execute pre-execution hooks
   */
  async executePreHooks(context: ExecutionContext): Promise<void> {
    const preHooks = this.hooks.filter((h) => h.type === 'pre');

    for (const hook of preHooks) {
      const module = this.modules.get(hook.module);
      if (module && module.enabled) {
        try {
          await this.executeHook(hook, context);
        } catch (error) {
          throw new BiconomySmartAccountError(
            `Pre-execution hook failed: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }
  }

  /**
   * Execute post-execution hooks
   */
  async executePostHooks(context: ExecutionContext): Promise<void> {
    const postHooks = this.hooks.filter((h) => h.type === 'post');

    for (const hook of postHooks) {
      const module = this.modules.get(hook.module);
      if (module && module.enabled) {
        try {
          await this.executeHook(hook, context);
        } catch (error) {
          console.error('Post-execution hook error:', error);
        }
      }
    }
  }

  /**
   * Build execution call data with modules
   */
  buildExecutionData(
    baseData: string,
    moduleConfigs: MEEExecutionConfig[]
  ): string {
    try {
      let executionData = baseData;

      for (const config of moduleConfigs) {
        const module = this.modules.get(config.moduleAddress);
        if (module && module.enabled) {
          executionData = this.combineExecutionData(executionData, config.data);
        }
      }

      return executionData;
    } catch (error) {
      throw new BiconomySmartAccountError(
        `Failed to build execution data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get enabled modules
   */
  getEnabledModules(): ExecutionModule[] {
    return Array.from(this.modules.values()).filter((m) => m.enabled);
  }

  /**
   * Get all policies
   */
  getPolicies(): PolicyRule[] {
    return this.policies;
  }

  private async executeHook(hook: ExecutionHook, context: ExecutionContext): Promise<void> {
    // Placeholder for actual hook execution logic
    // In production, this would decode and execute the hook data
    console.log(`Executing ${hook.type} hook for module:`, hook.module);
  }

  private combineExecutionData(existing: string, additional: string): string {
    // Combine multiple execution data (simplified)
    if (!existing || existing === '0x') {
      return additional;
    }
    return existing;
  }
}

export default MEEExecutor;
