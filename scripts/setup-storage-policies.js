/**
 * Script to set up storage policies for the documents bucket
 * Uses Supabase REST API to execute SQL
 */

const SUPABASE_PROJECT_ID = "bkyuxvschuwngtcdhsyg";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

const storagePoliciesSQL = `
-- Allow authenticated users to upload to their own folder
CREATE POLICY IF NOT EXISTS "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own documents
CREATE POLICY IF NOT EXISTS "Users can read their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own documents
CREATE POLICY IF NOT EXISTS "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
`;

async function setupStoragePolicies(serviceRoleKey) {
  console.log("\n🔍 Setting up Storage Policies...\n");

  try {
    const headers = {
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    // Execute SQL via Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        sql: storagePoliciesSQL,
      }),
    });

    if (!response.ok) {
      // Try alternative: direct SQL execution endpoint
      const altResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: "POST",
        headers: {
          ...headers,
          "Prefer": "return=representation",
        },
        body: storagePoliciesSQL,
      });

      if (!altResponse.ok) {
        const errorText = await altResponse.text();
        throw new Error(`Failed to execute SQL: ${errorText}`);
      }
    }

    console.log("✅ Storage policies created successfully");
  } catch (error) {
    console.error("❌ Error setting up storage policies:", error.message);
    console.log("\n⚠️  Please run the SQL manually in Supabase SQL Editor:");
    console.log(storagePoliciesSQL);
    throw error;
  }
}

// Main execution
async function main() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required");
    process.exit(1);
  }

  try {
    await setupStoragePolicies(serviceRoleKey);
    console.log("\n✅ Storage policies setup complete!\n");
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  }
}

main();
