/**
 * Complete setup script for Deep Context & Meeting Prep feature
 * 
 * This script:
 * 1. Creates Stripe prices via Stripe API
 * 2. Creates Supabase storage bucket via Supabase client
 * 3. Updates price IDs in code
 * 
 * Usage:
 * node scripts/setup-complete.js
 * 
 * Requires environment variables:
 * - STRIPE_SECRET_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_PROJECT_ID = "bkyuxvschuwngtcdhsyg";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

if (!STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY environment variable is required");
  console.error("   Get it from: https://dashboard.stripe.com/apikeys");
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required");
  console.error("   Get it from: https://supabase.com/dashboard/project/bkyuxvschuwngtcdhsyg/settings/api");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
  } catch (error) {
    console.error("❌ Error creating Stripe prices:", error.message);
    throw error;
  }
}

async function createStorageBucket() {
  console.log("\n🔍 Step 2: Creating Supabase Storage Bucket...\n");

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
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
    const { data, error } = await supabase.storage.createBucket("documents", {
      public: false,
      fileSizeLimit: 52428800, // 50 MB
      allowedMimeTypes: ["application/pdf"],
    });

    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }

    console.log("✅ Created storage bucket 'documents'");
  } catch (error) {
    console.error("❌ Error creating storage bucket:", error.message);
    throw error;
  }
}

async function updatePriceIds(deepContextPriceId, bundlePriceId) {
  console.log("\n🔍 Step 3: Updating Price IDs in code...\n");
  
  const paymentFile = path.join(__dirname, "..", "supabase", "functions", "create-diagnostic-payment", "index.ts");
  
  try {
    const fileContent = await fs.readFile(paymentFile, "utf-8");
    
    const updatedContent = fileContent
      .replace(
        /const DEEP_CONTEXT_PRICE_ID = ".*";/,
        `const DEEP_CONTEXT_PRICE_ID = "${deepContextPriceId}";`
      )
      .replace(
        /const BUNDLE_PRICE_ID = ".*";/,
        `const BUNDLE_PRICE_ID = "${bundlePriceId}";`
      );

    await fs.writeFile(paymentFile, updatedContent, "utf-8");
    console.log("✅ Updated price IDs in create-diagnostic-payment/index.ts");
    console.log(`   DEEP_CONTEXT_PRICE_ID = "${deepContextPriceId}"`);
    console.log(`   BUNDLE_PRICE_ID = "${bundlePriceId}"`);
  } catch (error) {
    console.error("❌ Error updating price IDs:", error.message);
    console.log("\n⚠️  Please manually update supabase/functions/create-diagnostic-payment/index.ts:");
    console.log(`   DEEP_CONTEXT_PRICE_ID = "${deepContextPriceId}";`);
    console.log(`   BUNDLE_PRICE_ID = "${bundlePriceId}";`);
  }
}

// Main execution
async function main() {
  try {
    const prices = await createStripePrices();
    await createStorageBucket();
    await updatePriceIds(prices.deepContextPriceId, prices.bundlePriceId);

    console.log("\n✅ Setup complete!");
    console.log("\n📋 Next Steps:");
    console.log("1. Run the storage policies SQL from SETUP_INSTRUCTIONS.md (section 2, Step 2)");
    console.log("2. Verify the price IDs were updated correctly in the code");
    console.log("3. Test the payment flow\n");
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  }
}

main();
