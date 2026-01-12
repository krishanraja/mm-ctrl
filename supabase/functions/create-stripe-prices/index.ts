/**
 * Edge Function to create Stripe prices (one-time use)
 * 
 * Call this function once to create the prices, then update the constants
 * in create-diagnostic-payment/index.ts with the returned price IDs
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    });

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
      deepContextProduct = await stripe.products.create({
        name: "Deep Context Upgrade",
        description: "Connect your company context for personalized insights and enhanced meeting prep materials",
      });
    }

    // Create Bundle product if it doesn't exist
    if (!bundleProduct) {
      bundleProduct = await stripe.products.create({
        name: "Full Diagnostic + Deep Context Bundle",
        description: "Get the complete diagnostic plus deep context integration (Save $10)",
      });
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
      deepContextPrice = await stripe.prices.create({
        product: deepContextProduct.id,
        unit_amount: 2900, // $29.00 in cents
        currency: "usd",
        metadata: {
          upgrade_type: "deep_context",
        },
      });
    }

    // Create Bundle price ($69)
    if (!bundlePrice) {
      bundlePrice = await stripe.prices.create({
        product: bundleProduct.id,
        unit_amount: 6900, // $69.00 in cents
        currency: "usd",
        metadata: {
          upgrade_type: "bundle",
        },
      });
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        deepContextPriceId: deepContextPrice.id,
        bundlePriceId: bundlePrice.id,
        message: "Update these in create-diagnostic-payment/index.ts",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
