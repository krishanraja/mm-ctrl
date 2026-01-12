/**
 * Setup script that calls the edge function and creates storage bucket
 * Uses Supabase anon key to call edge function (which has STRIPE_SECRET_KEY in secrets)
 * Uses Supabase service role to create storage bucket
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_PROJECT_ID = "bkyuxvschuwngtcdhsyg";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJreXV4dnNjaHV3bmd0Y2Roc3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDE2NzgsImV4cCI6MjA2NzU3NzY3OH0.XmOP_W7gUdBuP23p4lH-iryMXPXMI69ZshU8Dwm6ujo";

// Get service role key from environment or prompt
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required");
  console.error("   Get it from: https://supabase.com/dashboard/project/bkyuxvschuwngtcdhsyg/settings/api");
  console.error("   Then run: SUPABASE_SERVICE_ROLE_KEY=your_key deno run --allow-env --allow-net scripts/run-setup.ts");
  Deno.exit(1);
}

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createStripePricesViaEdgeFunction() {
  console.log("\n🔍 Step 1: Creating Stripe Prices via Edge Function...\n");

  try {
    // First, we need to deploy the edge function or call it if already deployed
    // For now, let's try calling it
    const { data, error } = await supabaseAnon.functions.invoke("create-stripe-prices", {
      body: {},
    });

    if (error) {
      console.warn("⚠️  Edge function not deployed or not accessible. Creating prices directly...");
      throw error;
    }

    if (data?.success) {
      console.log("✅ Stripe prices created via edge function");
      console.log("   Deep Context Price ID:", data.deepContextPriceId);
      console.log("   Bundle Price ID:", data.bundlePriceId);
      return {
        deepContextPriceId: data.deepContextPriceId,
        bundlePriceId: data.bundlePriceId,
      };
    } else {
      throw new Error(data?.error || "Unknown error");
    }
  } catch (error: any) {
    console.error("❌ Error calling edge function:", error.message);
    console.log("\n💡 Alternative: Deploy the edge function first:");
    console.log("   supabase functions deploy create-stripe-prices");
    console.log("   Then call it again, or run the script with STRIPE_SECRET_KEY directly\n");
    throw error;
  }
}

async function createStorageBucket() {
  console.log("\n🔍 Step 2: Creating Supabase Storage Bucket...\n");

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabaseService.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(b => b.name === "documents");
    
    if (bucketExists) {
      console.log("✅ Storage bucket 'documents' already exists");
      return;
    }

    // Create the bucket
    console.log("➕ Creating storage bucket 'documents'...");
    const { data, error } = await supabaseService.storage.createBucket("documents", {
      public: false,
      fileSizeLimit: 52428800, // 50 MB
      allowedMimeTypes: ["application/pdf"],
    });

    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }

    console.log("✅ Created storage bucket 'documents'");
  } catch (error: any) {
    console.error("❌ Error creating storage bucket:", error.message);
    throw error;
  }
}

async function updatePriceIds(deepContextPriceId: string, bundlePriceId: string) {
  console.log("\n🔍 Step 3: Updating Price IDs in code...\n");
  
  const paymentFile = "supabase/functions/create-diagnostic-payment/index.ts";
  
  try {
    const fileContent = await Deno.readTextFile(paymentFile);
    
    const updatedContent = fileContent
      .replace(
        /const DEEP_CONTEXT_PRICE_ID = ".*";/,
        `const DEEP_CONTEXT_PRICE_ID = "${deepContextPriceId}";`
      )
      .replace(
        /const BUNDLE_PRICE_ID = ".*";/,
        `const BUNDLE_PRICE_ID = "${bundlePriceId}";`
      );

    await Deno.writeTextFile(paymentFile, updatedContent);
    console.log("✅ Updated price IDs in create-diagnostic-payment/index.ts");
    console.log(`   DEEP_CONTEXT_PRICE_ID = "${deepContextPriceId}"`);
    console.log(`   BUNDLE_PRICE_ID = "${bundlePriceId}"`);
  } catch (error: any) {
    console.error("❌ Error updating price IDs:", error.message);
    console.log("\n⚠️  Please manually update supabase/functions/create-diagnostic-payment/index.ts:");
    console.log(`   DEEP_CONTEXT_PRICE_ID = "${deepContextPriceId}";`);
    console.log(`   BUNDLE_PRICE_ID = "${bundlePriceId}";`);
  }
}

// Main execution
async function main() {
  try {
    // Try edge function first, fall back to direct Stripe API if needed
    let prices;
    try {
      prices = await createStripePricesViaEdgeFunction();
    } catch {
      console.log("\n💡 To create Stripe prices directly, use:");
      console.log("   STRIPE_SECRET_KEY=sk_... SUPABASE_SERVICE_ROLE_KEY=... deno run --allow-env --allow-net scripts/setup-complete.ts\n");
      console.log("   Or deploy the edge function and try again.\n");
      throw new Error("Could not create Stripe prices");
    }
    
    await createStorageBucket();
    await updatePriceIds(prices.deepContextPriceId, prices.bundlePriceId);

    console.log("\n✅ Setup complete!");
    console.log("\n📋 Next Steps:");
    console.log("1. Run the storage policies SQL from SETUP_INSTRUCTIONS.md (section 2, Step 2)");
    console.log("2. Verify the price IDs were updated correctly in the code");
    console.log("3. Test the payment flow\n");
  } catch (error: any) {
    console.error("\n❌ Setup failed:", error.message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
