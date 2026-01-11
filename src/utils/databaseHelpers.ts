/**
 * Database Helper Utilities
 * 
 * Provides retry logic, validation, transaction safety, and integrity checks for database operations
 * 
 * Enhanced Features:
 * - FK validation before inserts
 * - Enum sanitization
 * - Required field validation
 * - Transaction safety for multi-table operations
 */

import { supabase } from '@/integrations/supabase/client';
import { sanitizeDimensionKey, sanitizeTier, sanitizeRiskKey, sanitizeRiskLevel, sanitizeScenarioKey } from './pipelineGuards';

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

/**
 * Validates foreign key exists before insert
 */
export async function validateForeignKey(
  table: string,
  id: string | null | undefined,
  idColumn: string = 'id'
): Promise<{ valid: boolean; error?: string }> {
  if (!id) {
    return { valid: false, error: `${idColumn} is null or undefined` };
  }

  try {
    const { data, error } = await supabase
      .from(table)
      .select(idColumn)
      .eq(idColumn, id)
      .maybeSingle();

    if (error) {
      return { valid: false, error: `FK validation failed: ${error.message}` };
    }

    if (!data) {
      return { valid: false, error: `${table} with ${idColumn}=${id} does not exist` };
    }

    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: `FK validation error: ${error.message}` };
  }
}

/**
 * Validates multiple foreign keys
 */
export async function validateForeignKeys(
  validations: Array<{ table: string; id: string | null | undefined; idColumn?: string }>
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  const results = await Promise.all(
    validations.map(async (validation) => {
      const result = await validateForeignKey(
        validation.table,
        validation.id,
        validation.idColumn
      );
      if (!result.valid) {
        errors.push(result.error || 'Unknown FK validation error');
      }
      return result.valid;
    })
  );

  return {
    valid: results.every(r => r),
    errors
  };
}

/**
 * Sanitizes enum value to valid enum
 */
export function sanitizeEnumValue<T extends string>(
  value: unknown,
  validValues: readonly T[],
  fallback: T
): T {
  if (typeof value === 'string' && validValues.includes(value as T)) {
    return value as T;
  }
  return fallback;
}

/**
 * Validates required fields in record
 */
export function validateRequiredFields(
  record: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (record[field] === undefined || record[field] === null) {
      errors.push(`Required field '${field}' is missing or null`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes record for insert with enum validation and required field checks
 */
export function sanitizeRecordForInsert<T extends Record<string, any>>(
  record: T,
  schema: {
    requiredFields?: string[];
    enumFields?: Array<{
      field: string;
      validValues: readonly string[];
      fallback: string;
    }>;
    sanitizers?: Array<{
      field: string;
      sanitizer: (value: any) => any;
    }>;
  }
): { valid: boolean; sanitized: T; errors: string[] } {
  const errors: string[] = [];
  const sanitized = { ...record };

  // Validate required fields
  if (schema.requiredFields) {
    const requiredValidation = validateRequiredFields(sanitized, schema.requiredFields);
    if (!requiredValidation.valid) {
      errors.push(...requiredValidation.errors);
    }
  }

  // Sanitize enum fields
  if (schema.enumFields) {
    for (const enumField of schema.enumFields) {
      if (sanitized[enumField.field] !== undefined) {
        sanitized[enumField.field] = sanitizeEnumValue(
          sanitized[enumField.field],
          enumField.validValues,
          enumField.fallback as any
        );
      }
    }
  }

  // Apply custom sanitizers
  if (schema.sanitizers) {
    for (const sanitizer of schema.sanitizers) {
      if (sanitized[sanitizer.field] !== undefined) {
        sanitized[sanitizer.field] = sanitizer.sanitizer(sanitized[sanitizer.field]);
      }
    }
  }

  return {
    valid: errors.length === 0,
    sanitized,
    errors
  };
}

/**
 * Inserts with integrity checks (FK validation, enum sanitization, required fields)
 */
export async function safeInsertWithIntegrityChecks(
  table: string,
  records: any[],
  options: {
    maxRetries?: number;
    retryDelay?: number;
    logPrefix?: string;
    onConflict?: string;
    ignoreDuplicates?: boolean;
    fkValidations?: Array<{ field: string; table: string; idColumn?: string }>;
    enumFields?: Array<{ field: string; validValues: readonly string[]; fallback: string }>;
    requiredFields?: string[];
  } = {}
): Promise<{ success: boolean; count: number; error?: string; validationErrors?: string[] }> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    logPrefix = '',
    onConflict,
    ignoreDuplicates = false,
    fkValidations = [],
    enumFields = [],
    requiredFields = []
  } = options;

  if (!records || records.length === 0) {
    console.log(`${logPrefix} ⚠️ No records to insert for ${table}`);
    return { success: true, count: 0 };
  }

  // Step 1: Validate and sanitize records
  const validationErrors: string[] = [];
  const sanitizedRecords = records.map((record, index) => {
    // Validate required fields
    if (requiredFields.length > 0) {
      const requiredValidation = validateRequiredFields(record, requiredFields);
      if (!requiredValidation.valid) {
        validationErrors.push(`Record ${index}: ${requiredValidation.errors.join(', ')}`);
      }
    }

    // Sanitize enum fields
    const sanitized = { ...record };
    for (const enumField of enumFields) {
      if (sanitized[enumField.field] !== undefined) {
        sanitized[enumField.field] = sanitizeEnumValue(
          sanitized[enumField.field],
          enumField.validValues,
          enumField.fallback as any
        );
      }
    }

    return sanitized;
  });

  if (validationErrors.length > 0) {
    console.error(`${logPrefix} ❌ Validation errors for ${table}:`, validationErrors);
    return {
      success: false,
      count: 0,
      error: 'Validation failed',
      validationErrors
    };
  }

  // Step 2: Validate foreign keys
  if (fkValidations.length > 0) {
    const fkErrors: string[] = [];
    for (const record of sanitizedRecords) {
      const fkChecks = fkValidations
        .filter(fk => record[fk.field])
        .map(fk => ({
          table: fk.table,
          id: record[fk.field],
          idColumn: fk.idColumn
        }));

      if (fkChecks.length > 0) {
        const fkValidation = await validateForeignKeys(fkChecks);
        if (!fkValidation.valid) {
          fkErrors.push(...fkValidation.errors);
        }
      }
    }

    if (fkErrors.length > 0) {
      console.error(`${logPrefix} ❌ FK validation errors for ${table}:`, fkErrors);
      return {
        success: false,
        count: 0,
        error: 'FK validation failed',
        validationErrors: fkErrors
      };
    }
  }

  // Step 3: Insert with retry (using existing safeInsertWithRetry logic)
  return safeInsertWithRetry(table, sanitizedRecords, {
    maxRetries,
    retryDelay,
    logPrefix,
    onConflict,
    ignoreDuplicates
  });
}

/**
 * Executes multiple inserts in a transaction-like manner using atomic RPC
 * Falls back to sequential inserts if RPC not available
 */
export async function insertWithTransaction(
  inserts: Array<{
    table: string;
    records: any[];
    options?: {
      onConflict?: string;
      ignoreDuplicates?: boolean;
    };
  }>,
  rpcFunctionName?: string
): Promise<{
  success: boolean;
  results: Array<{ table: string; success: boolean; count: number; error?: string }>;
  errors: string[];
}> {
  // If RPC function provided, use it for atomic transaction
  if (rpcFunctionName) {
    try {
      // Prepare data for RPC (format depends on RPC function signature)
      const rpcData = {
        inserts: inserts.map(insert => ({
          table: insert.table,
          records: insert.records,
          options: insert.options
        }))
      };

      const { data, error } = await supabase.rpc(rpcFunctionName, rpcData);

      if (error) {
        console.warn('⚠️ RPC transaction failed, falling back to sequential:', error.message);
        // Fall through to sequential inserts
      } else if (data && data.success) {
        return {
          success: true,
          results: inserts.map(insert => ({
            table: insert.table,
            success: true,
            count: insert.records.length
          })),
          errors: []
        };
      }
    } catch (error: any) {
      console.warn('⚠️ RPC transaction error, falling back to sequential:', error.message);
      // Fall through to sequential inserts
    }
  }

  // Fallback: Sequential inserts (not truly transactional but better than nothing)
  const results: Array<{ table: string; success: boolean; count: number; error?: string }> = [];
  const errors: string[] = [];

  for (const insert of inserts) {
    const result = await safeInsertWithRetry(insert.table, insert.records, {
      onConflict: insert.options?.onConflict,
      ignoreDuplicates: insert.options?.ignoreDuplicates
    });

    results.push({
      table: insert.table,
      ...result
    });

    if (!result.success) {
      errors.push(`${insert.table}: ${result.error}`);
      // Continue with other inserts (best effort)
    }
  }  return {
    success: errors.length === 0,
    results,
    errors
  };
}