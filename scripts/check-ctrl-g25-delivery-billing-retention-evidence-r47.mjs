import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const walk = (directory) => readdirSync(resolve(root, directory), { withFileTypes: true })
  .flatMap((entry) => {
    const absolute = join(resolve(root, directory), entry.name);
    return entry.isDirectory() ? walk(relative(root, absolute)) : [relative(root, absolute).replaceAll("\\", "/")];
  });
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-delivery-billing-retention-evidence-r47] ${message}`);
};

const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-delivery-billing-retention-evidence-r47.json"));
const functionFiles = walk("supabase/functions").filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"));
const functionSources = new Map(functionFiles.map((file) => [file, read(file)]));
const resendDirect = [...functionSources.entries()]
  .filter(([, source]) => source.includes("https://api.resend.com/emails"))
  .map(([file]) => file)
  .sort();
const emailAnalyticsWriters = [...functionSources.entries()]
  .filter(([, source]) => /\.from\(["']email_analytics["']\)/.test(source))
  .map(([file]) => file);
const sharedEmail = read("supabase/functions/_shared/email-utils.ts");
const deletion = read("supabase/functions/delete-account/index.ts");

assert(contract.retrieved_at === "2026-09-17", "official evidence retrieval date changed");
assert(resendDirect.length === 4, `direct Resend sender count changed: ${resendDirect.length}`);
assert(sharedEmail.includes("id: result.id"), "shared Resend message ID handling disappeared");
assert(emailAnalyticsWriters.length === 0, `email analytics writer unexpectedly appeared: ${emailAnalyticsWriters.join(",")}`);
assert(deletion.includes("stripe.subscriptions.cancel"), "Stripe cancellation disappeared");
assert(!/stripe\.customers\.(del|delete)/.test(deletion), "Stripe customer deletion unexpectedly appeared");
assert(!deletion.toLowerCase().includes("resend"), "Resend deletion unexpectedly appeared");
assert(contract.receipt_rules.includes("subscription cancellation and customer deletion are separate Stripe operations"),
  "Stripe operation distinction disappeared");
assert(contract.providers.stripe.boundary.includes("not whole-Brain erasure"), "Stripe residual boundary weakened");

console.log(JSON.stringify({
  status: contract.status,
  resend: {
    direct_sender_files: resendDirect,
    shared_helper_returns_message_id: true,
    durable_email_analytics_writer: false,
    deletion_or_expiry_orchestration: false,
  },
  stripe: {
    subscription_cancel: true,
    customer_delete: false,
    provider_result_receipt: false,
    residual_regulatory_retention_is_separate: true,
  },
}, null, 2));
