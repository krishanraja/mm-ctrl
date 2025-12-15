/**
 * Database Helper Utilities
 * 
 * Provides retry logic, validation, and transaction safety for database operations
 */

import { supabase } from '@/integrations/supabase/client';

// Retryable error codes (transient failures)
const RETRYABLE_ERROR_CODES = [
  'PGRST116', // Connection error
  'PGRST301', // Timeout
  '57014',    // Query canceled
  '08006',    // Connection failure
  '08003',    // Connection does not exist
  '08001',    // SQL client unable to establish connection
];

// Check if error is retryable
function isRetryableError(error: any): boolean {
  if (!error) return false;
  const code = error.code || error.message || '';
  return RETRYABLE_ERROR_CODES.some(retryableCode => 
    String(code).includes(retryableCode) || 
    String(error.message || '').toLowerCase().includes('timeout') ||
    String(error.message || '').toLowerCase().includes('connection')
  );
}

// Delay helper
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safe insert with retry mechanism
 */
export async function safeInsertWithRetry(
  table: any, // Using any to allow dynamic table names
  records: any[],
  options: {
    maxRetries?: number;
    retryDelay?: number;
    logPrefix?: string;
    onConflict?: string;
    ignoreDuplicates?: boolean;
  } = {}
): Promise<{ success: boolean; count: number; error?: string }> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    logPrefix = '',
    onConflict,
    ignoreDuplicates = false
  } = options;

  if (!records || records.length === 0) {
    console.log(`${logPrefix} ⚠️ No records to insert for ${table}`);
    return { success: true, count: 0 };
  }

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let query = supabase.from(table);

      if (onConflict && ignoreDuplicates) {
        // Use upsert for idempotency
        const { error } = await query.upsert(records, {
          onConflict,
          ignoreDuplicates
        });
        if (error) throw error;
      } else {
        const { error } = await query.insert(records);
        if (error) throw error;
      }

      console.log(`${logPrefix} ✅ ${table}: ${records.length} records inserted (attempt ${attempt})`);
      return { success: true, count: records.length };
    } catch (e: any) {
      lastError = e;
      const error = e.error || e;
      const errorMessage = error?.message || e?.message || 'Unknown error';

      // If not retryable or last attempt, return error
      if (!isRetryableError(error) || attempt === maxRetries) {
        console.error(`${logPrefix} ❌ Insert failed for ${table} (attempt ${attempt}/${maxRetries}):`, errorMessage);
        return { success: false, count: 0, error: errorMessage };
      }

      // Exponential backoff
      const delayMs = retryDelay * Math.pow(2, attempt - 1);
      console.warn(`${logPrefix} ⚠️ Retryable error on ${table} (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
      await delay(delayMs);
    }
  }

  return { success: false, count: 0, error: lastError?.message || 'Max retries exceeded' };
}

/**
 * Parallel insert multiple tables
 */
export async function parallelInsert(
  inserts: Array<{
    table: string;
    records: any[];
    options?: {
      onConflict?: string;
      ignoreDuplicates?: boolean;
      logPrefix?: string;
    };
  }>
): Promise<{
  success: boolean;
  results: Array<{ table: string; success: boolean; count: number; error?: string }>;
  errors: string[];
}> {
  const results = await Promise.all(
    inserts.map(async ({ table, records, options = {} }) => {
      const result = await safeInsertWithRetry(table, records, {
        logPrefix: options.logPrefix || `📊`,
        onConflict: options.onConflict,
        ignoreDuplicates: options.ignoreDuplicates,
      });
      return { table, ...result };
    })
  );

  const errors = results
    .filter(r => !r.success)
    .map(r => `${r.table}: ${r.error}`);

  return {
    success: errors.length === 0,
    results,
    errors,
  };
}

/**
 * Validate dimension score record
 */
export function validateDimensionScore(score: any): { valid: boolean; error?: string } {
  if (!score) return { valid: false, error: 'Score is null or undefined' };
  
  if (typeof score.score_numeric !== 'number') {
    return { valid: false, error: 'score_numeric must be a number' };
  }
  
  if (score.score_numeric < 0 || score.score_numeric > 100) {
    return { valid: false, error: 'score_numeric must be between 0 and 100' };
  }
  
  if (!score.dimension_key || typeof score.dimension_key !== 'string') {
    return { valid: false, error: 'dimension_key is required and must be a string' };
  }
  
  if (!score.assessment_id) {
    return { valid: false, error: 'assessment_id is required' };
  }
  
  return { valid: true };
}

/**
 * Validate and sanitize text input
 */
export function sanitizeText(text: string | null | undefined, maxLength: number = 10000): string {
  if (!text) return '';
  
  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = String(text)
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized.trim();
}

/**
 * Validate array of records
 */
export function validateRecords<T>(
  records: T[],
  validator: (record: T) => { valid: boolean; error?: string },
  tableName: string
): { valid: boolean; errors: string[]; validRecords: T[] } {
  const errors: string[] = [];
  const validRecords: T[] = [];

  records.forEach((record, index) => {
    const validation = validator(record);
    if (!validation.valid) {
      errors.push(`${tableName}[${index}]: ${validation.error}`);
    } else {
      validRecords.push(record);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    validRecords,
  };
}

