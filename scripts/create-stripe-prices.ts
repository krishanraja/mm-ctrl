/**
 * One-time script to create Stripe prices for Deep Context & Bundle upgrades
 * 
 * Usage:
 * 1. Set STRIPE_SECRET_KEY environment variable
 * 2. Run: deno run --allow-env --allow-net scripts/create-stripe-prices.ts
 * 
 * Or run via Supabase Edge Function:
 * deno run --allow-env --allow-net supabase/functions/create-stripe-prices/index.ts
 */

// @deno-types="https://esm.sh/stripe@18.5.0/types/index.d.ts"
import Stripe from "https://esm.sh/stripe@18.5.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

if (!STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY environment variable is required");
  Deno.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

async function createStripePrices() {
  try {
    console.log("🔍 Checking for existing products...");

    // Check if products already exist
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

    console.log("\n📋 Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Deep Context Price ID:", deepContextPrice.id);
    console.log("Bundle Price ID:", bundlePrice.id);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  IMPORTANT: Update these in supabase/functions/create-diagnostic-payment/index.ts:");
    console.log(`   DEEP_CONTEXT_PRICE_ID = "${deepContextPrice.id}"`);
    console.log(`   BUNDLE_PRICE_ID = "${bundlePrice.id}"`);
    console.log("\n");

    return {
      deepContextPriceId: deepContextPrice.id,
      bundlePriceId: bundlePrice.id,
    };
  } catch (error: any) {
    console.error("❌ Error creating Stripe prices:", error.message);
    throw error;
  }
}

// Run if executed directly
if (import.meta.main) {
  createStripePrices()
    .then(() => {
      console.log("✅ Stripe prices created successfully!");
      Deno.exit(0);
    })
    .catch((error) => {
      console.error("❌ Failed to create Stripe prices:", error);
      Deno.exit(1);
    });
}

export { createStripePrices };
