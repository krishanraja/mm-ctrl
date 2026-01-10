/**
 * Audit Logger - Centralized Audit Logging
 * 
 * Purpose: Logs all data operations and LLM calls for full audit trail
 * 
 * Features:
 * - Non-blocking (don't fail if audit write fails)
 * - Logs every DB read/write with context
 * - Logs every LLM call with tokens, cost, timing
 * - Tracks user actions and data changes
 */

import { supabase } from '@/integrations/supabase/client';

export interface DataAuditLog {
  userId?: string | null;
  profileId?: string | null;
  sessionId?: string | null;
  actionType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT';
  tableName: string;
  recordId?: string | null;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AIUsageAuditLog {
  userId?: string | null;
  profileId?: string | null;
  sessionId?: string | null;
  toolName: string;
  flowName?: string | null;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costEstimate?: number;
  responseTimeMs?: number;
  cached?: boolean;
  error?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Logs a data access operation (SELECT)
 */
export async function auditDataAccess(
  log: Omit<DataAuditLog, 'actionType'> & { actionType?: 'SELECT' }
): Promise<void> {
  try {
    await supabase
      .from('data_audit_log')
      .insert({
        user_id: log.userId || null,
        profile_id: log.profileId || null,
        session_id: log.sessionId || null,
        action_type: log.actionType || 'SELECT',
        table_name: log.tableName,
        record_id: log.recordId || null,
        old_values: log.oldValues || {},
        new_values: log.newValues || {},
        metadata: log.metadata || {},
        created_at: new Date().toISOString()
      });
  } catch (error) {
    // Non-blocking: don't fail if audit write fails
    console.warn('⚠️ Failed to write data access audit log (non-blocking):', error);
  }
}

/**
 * Logs a data write operation (INSERT, UPDATE, DELETE, UPSERT)
 */
export async function auditDataWrite(
  log: DataAuditLog
): Promise<void> {
  try {
    await supabase
      .from('data_audit_log')
      .insert({
        user_id: log.userId || null,
        profile_id: log.profileId || null,
        session_id: log.sessionId || null,
        action_type: log.actionType,
        table_name: log.tableName,
        record_id: log.recordId || null,
        old_values: log.oldValues || {},
        new_values: log.newValues || {},
        metadata: log.metadata || {},
        created_at: new Date().toISOString()
      });
  } catch (error) {
    // Non-blocking: don't fail if audit write fails
    console.warn('⚠️ Failed to write data write audit log (non-blocking):', error);
  }
}

/**
 * Logs an LLM/AI call
 */
export async function auditLLMCall(
  log: AIUsageAuditLog
): Promise<void> {
  try {
    await supabase
      .from('ai_usage_audit')
      .insert({
        user_id: log.userId || null,
        profile_id: log.profileId || null,
        session_id: log.sessionId || null,
        tool_name: log.toolName,
        flow_name: log.flowName || null,
        model: log.model,
        prompt_tokens: log.promptTokens || 0,
        completion_tokens: log.completionTokens || 0,
        total_tokens: log.totalTokens || (log.promptTokens || 0) + (log.completionTokens || 0),
        cost_estimate: log.costEstimate || null,
        response_time_ms: log.responseTimeMs || null,
        cached: log.cached || false,
        error: log.error || null,
        metadata: log.metadata || {},
        created_at: new Date().toISOString()
      });
  } catch (error) {
    // Non-blocking: don't fail if audit write fails
    console.warn('⚠️ Failed to write AI usage audit log (non-blocking):', error);
  }
}

/**
 * Estimates cost based on model and token usage
 */
export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Cost per 1M tokens (as of 2024, update as needed)
  const pricing: Record<string, { prompt: number; completion: number }> = {
    'gpt-4o': { prompt: 2.50, completion: 10.00 },
    'gpt-4o-mini': { prompt: 0.15, completion: 0.60 },
    'gpt-4-turbo': { prompt: 10.00, completion: 30.00 },
    'gpt-3.5-turbo': { prompt: 0.50, completion: 1.50 },
    'gemini-2.0-flash': { prompt: 0.075, completion: 0.30 },
    'gemini-pro': { prompt: 0.50, completion: 1.50 },
  };

  const modelPricing = pricing[model.toLowerCase()] || pricing['gpt-4o-mini'];
  const promptCost = (promptTokens / 1_000_000) * modelPricing.prompt;
  const completionCost = (completionTokens / 1_000_000) * modelPricing.completion;

  return promptCost + completionCost;
}
