/**
 * Setup script for Deep Context & Meeting Prep feature
 * 
 * This script:
 * 1. Creates Stripe prices via Stripe API
 * 2. Creates Supabase storage bucket via Supabase Management API
 * 3. Sets up storage policies
 * 
 * Usage:
 * Set environment variables:
 * - STRIPE_SECRET_KEY
 * - SUPABASE_ACCESS_TOKEN (from Supabase Dashboard → Account → Access Tokens)
 * 
 * Then run:
 * deno run --allow-env --allow-net scripts/setup-deep-context.ts
 */

import Stripe from "https://esm.sh/stripe@18.5.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_ACCESS_TOKEN = Deno.env.get("SUPABASE_ACCESS_TOKEN");
const SUPABASE_PROJECT_ID = "bkyuxvschuwngtcdhsyg";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

if (!STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY environment variable is required");
  Deno.exit(1);
}

if (!SUPABASE_ACCESS_TOKEN) {
  console.error("❌ SUPABASE_ACCESS_TOKEN environment variable is required");
  console.error("   Get it from: https://supabase.com/dashboard/account/tokens");
  Deno.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

async function createStripePrices() {
  console.log("\n🔍 Step 1: Creating Stripe Prices...\n");

  try {
    // Check for existing products
    const existingProducts = await stripe.products.list({ limit: 100 });
    
    let deepContextProduct = existingProducts.data.find(
      p => p.name === "Deep Context Upgrade"
    );
    let bundleProduct = existingProducts.data.find(
      p => p.name === "Full Diagnostic + Deep Context Bundle"
    );

    // Create Deep Context product if it doesn't exist
    if (!deepContextProduct) {
      console.log("➕ Creating Deep Context product...");
      deepContextProduct = await stripe.products.create({
        name: "Deep Context Upgrade",
        description: "Connect your company context for personalized insights and enhanced meeting prep materials",
      });
      console.log("✅ Created Deep Context product:", deepContextProduct.id);
    } else {
      console.log("✅ Deep Context product already exists:", deepContextProduct.id);
    }

    // Create Bundle product if it doesn't exist
    if (!bundleProduct) {
      console.log("➕ Creating Bundle product...");
      bundleProduct = await stripe.products.create({
        name: "Full Diagnostic + Deep Context Bundle",
        description: "Get the complete diagnostic plus deep context integration (Save $10)",
      });
      console.log("✅ Created Bundle product:", bundleProduct.id);
    } else {
      console.log("✅ Bundle product already exists:", bundleProduct.id);
    }

    // Check for existing prices
    const existingPrices = await stripe.prices.list({ limit: 100 });
    
    let deepContextPrice = existingPrices.data.find(
      p => p.product === deepContextProduct.id && p.active
    );
    let bundlePrice = existingPrices.data.find(
      p => p.product === bundleProduct.id && p.active
    );

    // Create Deep Context price ($29)
    if (!deepContextPrice) {
      console.log("➕ Creating Deep Context price ($29)...");
      deepContextPrice = await stripe.prices.create({
        product: deepContextProduct.id,
        unit_amount: 2900, // $29.00 in cents
        currency: "usd",
        metadata: {
          upgrade_type: "deep_context",
        },
      });
      console.log("✅ Created Deep Context price:", deepContextPrice.id);
    } else {
      console.log("✅ Deep Context price already exists:", deepContextPrice.id);
    }

    // Create Bundle price ($69)
    if (!bundlePrice) {
      console.log("➕ Creating Bundle price ($69)...");
      bundlePrice = await stripe.prices.create({
        product: bundleProduct.id,
        unit_amount: 6900, // $69.00 in cents
        currency: "usd",
        metadata: {
          upgrade_type: "bundle",
        },
      });
      console.log("✅ Created Bundle price:", bundlePrice.id);
    } else {
      console.log("✅ Bundle price already exists:", bundlePrice.id);
    }

    console.log("\n📋 Stripe Prices Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Deep Context Price ID:", deepContextPrice.id);
    console.log("Bundle Price ID:", bundlePrice.id);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return {
      deepContextPriceId: deepContextPrice.id,
      bundlePriceId: bundlePrice.id,
    };
  } catch (error: any) {
    console.error("❌ Error creating Stripe prices:", error.message);
    throw error;
  }
}

async function createStorageBucket() {
  console.log("\n🔍 Step 2: Creating Supabase Storage Bucket...\n");

  try {
    // Check if bucket exists
    const checkResponse = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/storage/buckets/documents`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (checkResponse.ok) {
      console.log("✅ Storage bucket 'documents' already exists");
      return;
    }

    // Create the bucket
    console.log("➕ Creating storage bucket 'documents'...");
    const createResponse = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/storage/buckets`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "documents",
          name: "documents",
          public: false,
          file_size_limit: 52428800, // 50 MB
          allowed_mime_types: ["application/pdf"],
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create bucket: ${errorText}`);
    }

    console.log("✅ Created storage bucket 'documents'");
  } catch (error: any) {
    console.error("❌ Error creating storage bucket:", error.message);
    throw error;
  }
}

async function setupStoragePolicies() {
  console.log("\n🔍 Step 3: Setting up Storage Policies...\n");

  // Note: Storage policies need to be set via SQL
  // We'll provide the SQL to run
  console.log("📝 Storage policies need to be set via SQL.");
  console.log("   Run the SQL from SETUP_INSTRUCTIONS.md section 2, Step 2\n");
}

async function updatePriceIds(deepContextPriceId: string, bundlePriceId: string) {
  console.log("\n🔍 Step 4: Updating Price IDs in code...\n");
  
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
  } catch (error: any) {
    console.error("❌ Error updating price IDs:", error.message);
    console.log("\n⚠️  Please manually update:");
    console.log(`   DEEP_CONTEXT_PRICE_ID = "${deepContextPriceId}"`);
    console.log(`   BUNDLE_PRICE_ID = "${bundlePriceId}"`);
  }
}

// Main execution
async function main() {
  try {
    const prices = await createStripePrices();
    await createStorageBucket();
    await setupStoragePolicies();
    await updatePriceIds(prices.deepContextPriceId, prices.bundlePriceId);

    console.log("\n✅ Setup complete!");
    console.log("\n📋 Next Steps:");
    console.log("1. Run the storage policies SQL from SETUP_INSTRUCTIONS.md");
    console.log("2. Verify the price IDs were updated correctly");
    console.log("3. Test the payment flow\n");
  } catch (error: any) {
    console.error("\n❌ Setup failed:", error.message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
