/**
 * Create storage policies using Supabase client
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_ID = "bkyuxvschuwngtcdhsyg";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, serviceRoleKey);

// Storage policies need to be created via SQL
// Since we can't execute raw SQL via the client, we'll use the REST API
async function createStoragePolicies() {
  console.log("\n🔍 Creating Storage Policies...\n");

  const policies = [
    {
      name: "Users can upload their own documents",
      definition: `bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text`,
      operation: "INSERT"
    },
    {
      name: "Users can read their own documents",
      definition: `bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text`,
      operation: "SELECT"
    },
    {
      name: "Users can delete their own documents",
      definition: `bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text`,
      operation: "DELETE"
    }
  ];

  // Note: Supabase doesn't expose a direct API to create storage policies
  // They must be created via SQL in the SQL Editor
  // This script provides the SQL to run
  
  console.log("⚠️  Storage policies must be created via SQL.");
  console.log("   Please run the SQL from: supabase/migrations/20250128000002_create_documents_storage_policies.sql");
  console.log("   Or copy the SQL below:\n");
  
  policies.forEach(policy => {
    const sql = `CREATE POLICY IF NOT EXISTS "${policy.name}"
ON storage.objects FOR ${policy.operation}
TO authenticated
${policy.operation === 'INSERT' ? 'WITH CHECK' : 'USING'} (
  ${policy.definition}
);`;
    console.log(sql);
    console.log("");
  });
}

createStoragePolicies();
