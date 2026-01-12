/**
 * Simple setup script using fetch (no dependencies)
 * Creates Stripe prices and Supabase storage bucket
 */

const SUPABASE_PROJECT_ID = "bkyuxvschuwngtcdhsyg";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

async function createStripePrices(stripeSecretKey) {
  console.log("\n🔍 Step 1: Creating Stripe Prices...\n");

  const headers = {
    "Authorization": `Bearer ${stripeSecretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  try {
    // List existing products
    const productsRes = await fetch("https://api.stripe.com/v1/products?limit=100", {
      method: "GET",
      headers: { "Authorization": `Bearer ${stripeSecretKey}` },
    });
    const productsData = await productsRes.json();
    const existingProducts = productsData.data || [];

    // Find or create Deep Context product
    let deepContextProduct = existingProducts.find(p => p.name === "Deep Context Upgrade");
    if (!deepContextProduct) {
      console.log("➕ Creating Deep Context product...");
      const formData = new URLSearchParams();
      formData.append("name", "Deep Context Upgrade");
      formData.append("description", "Connect your company context for personalized insights and enhanced meeting prep materials");
      
      const createRes = await fetch("https://api.stripe.com/v1/products", {
        method: "POST",
        headers,
        body: formData,
      });
      deepContextProduct = await createRes.json();
      console.log("✅ Created Deep Context product:", deepContextProduct.id);
    } else {
      console.log("✅ Deep Context product already exists:", deepContextProduct.id);
    }

    // Find or create Bundle product
    let bundleProduct = existingProducts.find(p => p.name === "Full Diagnostic + Deep Context Bundle");
    if (!bundleProduct) {
      console.log("➕ Creating Bundle product...");
      const formData = new URLSearchParams();
      formData.append("name", "Full Diagnostic + Deep Context Bundle");
      formData.append("description", "Get the complete diagnostic plus deep context integration (Save $10)");
      
      const createRes = await fetch("https://api.stripe.com/v1/products", {
        method: "POST",
        headers,
        body: formData,
      });
      bundleProduct = await createRes.json();
      console.log("✅ Created Bundle product:", bundleProduct.id);
    } else {
      console.log("✅ Bundle product already exists:", bundleProduct.id);
    }

    // List existing prices
    const pricesRes = await fetch("https://api.stripe.com/v1/prices?limit=100", {
      method: "GET",
      headers: { "Authorization": `Bearer ${stripeSecretKey}` },
    });
    const pricesData = await pricesRes.json();
    const existingPrices = pricesData.data || [];

    // Find or create Deep Context price
    let deepContextPrice = existingPrices.find(p => p.product === deepContextProduct.id && p.active);
    if (!deepContextPrice) {
      console.log("➕ Creating Deep Context price ($29)...");
      const formData = new URLSearchParams();
      formData.append("product", deepContextProduct.id);
      formData.append("unit_amount", "2900");
      formData.append("currency", "usd");
      formData.append("metadata[upgrade_type]", "deep_context");
      
      const createRes = await fetch("https://api.stripe.com/v1/prices", {
        method: "POST",
        headers,
        body: formData,
      });
      deepContextPrice = await createRes.json();
      console.log("✅ Created Deep Context price:", deepContextPrice.id);
    } else {
      console.log("✅ Deep Context price already exists:", deepContextPrice.id);
    }

    // Find or create Bundle price
    let bundlePrice = existingPrices.find(p => p.product === bundleProduct.id && p.active);
    if (!bundlePrice) {
      console.log("➕ Creating Bundle price ($69)...");
      const formData = new URLSearchParams();
      formData.append("product", bundleProduct.id);
      formData.append("unit_amount", "6900");
      formData.append("currency", "usd");
      formData.append("metadata[upgrade_type]", "bundle");
      
      const createRes = await fetch("https://api.stripe.com/v1/prices", {
        method: "POST",
        headers,
        body: formData,
      });
      bundlePrice = await createRes.json();
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

async function createStorageBucket(serviceRoleKey) {
  console.log("\n🔍 Step 2: Creating Supabase Storage Bucket...\n");

  try {
    const headers = {
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    // Check if bucket exists
    const listRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: "GET",
      headers,
    });

    if (listRes.ok) {
      const buckets = await listRes.json();
      const bucketExists = buckets.some(b => b.name === "documents");
      
      if (bucketExists) {
        console.log("✅ Storage bucket 'documents' already exists");
        return;
      }
    }

    // Create the bucket
    console.log("➕ Creating storage bucket 'documents'...");
    const createRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: "documents",
        name: "documents",
        public: false,
        file_size_limit: 52428800, // 50 MB
        allowed_mime_types: ["application/pdf"],
      }),
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`Failed to create bucket: ${errorText}`);
    }

    console.log("✅ Created storage bucket 'documents'");
  } catch (error) {
    console.error("❌ Error creating storage bucket:", error.message);
    throw error;
  }
}

async function updatePriceIds(deepContextPriceId, bundlePriceId) {
  console.log("\n🔍 Step 3: Updating Price IDs in code...\n");
  
  const fs = await import("fs/promises");
  const path = await import("path");
  const { fileURLToPath } = await import("url");
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const paymentFile = path.join(__dirname, "..", "supabase", "functions", "create-diagnostic-payment", "index.ts");
  
  try {
    let fileContent = await fs.readFile(paymentFile, "utf-8");
    
    fileContent = fileContent
      .replace(
        /const DEEP_CONTEXT_PRICE_ID = ".*";/,
        `const DEEP_CONTEXT_PRICE_ID = "${deepContextPriceId}";`
      )
      .replace(
        /const BUNDLE_PRICE_ID = ".*";/,
        `const BUNDLE_PRICE_ID = "${bundlePriceId}";`
      );

    await fs.writeFile(paymentFile, fileContent, "utf-8");
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
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey) {
    console.error("❌ STRIPE_SECRET_KEY environment variable is required");
    console.error("   Get it from: https://dashboard.stripe.com/apikeys");
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required");
    console.error("   Get it from: https://supabase.com/dashboard/project/bkyuxvschuwngtcdhsyg/settings/api");
    process.exit(1);
  }

  try {
    const prices = await createStripePrices(stripeSecretKey);
    await createStorageBucket(serviceRoleKey);
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
