/**
 * Database Validation Utility for Edge Functions
 * 
 * Ensures all edge functions are using the correct Supabase database:
 * - Project ID: bkyuxvschuwngtcdhsyg
 * - Database: Mindmaker AI
 */

const EXPECTED_PROJECT_ID = 'bkyuxvschuwngtcdhsyg';
const EXPECTED_DATABASE_NAME = 'Mindmaker AI';

/**
 * Validates that the Supabase URL points to the correct database
 * @param supabaseUrl - The Supabase URL from environment variables
 * @returns Object with isValid flag and error message if invalid
 */
export function validateDatabaseUrl(supabaseUrl: string | undefined | null): {
  isValid: boolean;
  error?: string;
  projectId?: string;
} {
  if (!supabaseUrl) {
    return {
      isValid: false,
      error: 'SUPABASE_URL environment variable is not set'
    };
  }

  if (!supabaseUrl.includes(EXPECTED_PROJECT_ID)) {
    return {
      isValid: false,
      error: `Database URL does not match expected project ID (${EXPECTED_PROJECT_ID}). Current URL: ${supabaseUrl}`,
      projectId: extractProjectId(supabaseUrl)
    };
  }

  return {
    isValid: true,
    projectId: EXPECTED_PROJECT_ID
  };
}

/**
 * Extracts project ID from Supabase URL
 */
function extractProjectId(url: string): string | undefined {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : undefined;
}

/**
 * Validates and logs database configuration
 * Should be called at the start of each edge function
 */
export function validateAndLogDatabase(supabaseUrl: string | undefined | null): void {
  const validation = validateDatabaseUrl(supabaseUrl);
  
  if (!validation.isValid) {
    console.error(`❌ DATABASE VALIDATION FAILED: ${validation.error}`);
    console.error(`Expected Project ID: ${EXPECTED_PROJECT_ID}`);
    console.error(`Expected Database: ${EXPECTED_DATABASE_NAME}`);
    if (validation.projectId) {
      console.error(`Detected Project ID: ${validation.projectId}`);
    }
    throw new Error(`Database configuration error: ${validation.error}`);
  }

  console.log(`✅ Database validated: Using ${EXPECTED_DATABASE_NAME} (${EXPECTED_PROJECT_ID})`);
}

