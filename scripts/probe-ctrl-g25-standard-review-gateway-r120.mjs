import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(scriptDir, '..')
const sourcePath = join(scriptDir, 'probe-ctrl-g25-standard-change-owner-r116.mjs')
const scratchRoot = process.env.CTRL_SCRATCH_ROOT ?? join(homedir(), '.scratch')
mkdirSync(scratchRoot, { recursive: true })
const temporaryDirectory = mkdtempSync(join(scratchRoot, 'mm-ctrl-r120-'))
const executablePath = join(temporaryDirectory, 'product-gateway-r120-probe.ts')

const routeCall = 'invoke("review-standard-change"'
const routeCallV2 = 'invoke("review-standard-change-v2"'
const source = readFileSync(sourcePath, 'utf8')
const routeCallCount = source.split(routeCall).length - 1
if (routeCallCount !== 17) throw new Error(`unexpected_r116_route_call_count:${routeCallCount}`)

const viteFile = (path) => `/@fs/${path.replaceAll('\\', '/')}`
const imports = `import { createClient } from "@supabase/supabase-js";
import { StandardReviewGateway, StandardReviewGatewayError } from ${JSON.stringify(viteFile(join(root, 'src/features/standard-review/gateway.ts')))};
import { createSupabaseStandardReviewInvoker } from ${JSON.stringify(viteFile(join(root, 'src/features/standard-review/supabaseInvoker.ts')))};
`

let executable = source.replace('import crypto from "node:crypto";\n', `import crypto from "node:crypto";\n${imports}`)
executable = executable.replaceAll(routeCall, routeCallV2)

const signInAnchor = '  const [tokenA, tokenB] = await Promise.all([signIn(emailA), signIn(emailB)]);'
const productClientSetup = `${signInAnchor}
  const productClient = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const productSignIn = await productClient.auth.signInWithPassword({ email: emailA, password });
  if (productSignIn.error || !productSignIn.data.session?.access_token) {
    throw new Error(\`product_client_sign_in_failed:\${productSignIn.error?.message ?? "missing_session"}\`);
  }
  const productGateway = new StandardReviewGateway(createSupabaseStandardReviewInvoker(productClient));`
if (!executable.includes(signInAnchor)) throw new Error('r120_sign_in_anchor_missing')
executable = executable.replace(signInAnchor, productClientSetup)

const candidatesAnchor = `  const candidates = [];
  for (const ordinal of [1, 2, 3]) candidates.push(await makeCandidate(tokenA, ordinal));`
const productPrepare = `${candidatesAnchor}
  const productPrepared = [];
  for (const candidate of candidates) {
    productPrepared.push(await productGateway.prepare(candidate.checkId, candidate.resultHash));
  }
  const productPresentationBound = productPrepared.every((item) =>
    item.schema === "ctrl.standard-change.owner-review.presentation.v1" &&
    item.question === "Should this be your proposal rule?" &&
    item.current_rule === "Name the proof before confidence." &&
    item.proposed_rule === "Treat this check as advisory for proposal work." &&
    item.consequence === "fewer false positive blocks" &&
    item.risk_if_wrong === "Weak proposals may pass." &&
    item.validation === "fresh independent check" &&
    item.alternative_explanations.length === 1 &&
    item.evidence.length === 2);
  if (!productPresentationBound) throw new Error("product_presentation_binding_failed");

  const refreshedSession = await productClient.auth.refreshSession();
  if (refreshedSession.error || !refreshedSession.data.session?.access_token) {
    throw new Error(\`product_client_refresh_failed:\${refreshedSession.error?.message ?? "missing_session"}\`);
  }
  const refreshedReview = await productGateway.prepare(candidates[1].checkId, candidates[1].resultHash);
  const productRefreshPreserved =
    refreshedReview.reviewPacketId === productPrepared[1].reviewPacketId &&
    refreshedReview.reviewPacketSha256 === productPrepared[1].reviewPacketSha256;
  if (!productRefreshPreserved) throw new Error("product_refresh_changed_review");`
if (!executable.includes(candidatesAnchor)) throw new Error('r120_candidates_anchor_missing')
executable = executable.replace(candidatesAnchor, productPrepare)

const rawReject = `  const rejected = await ${routeCallV2}, tokenA, ownerAction("decide", {
    review_packet_id: prepared[0].review_packet_id,
    expected_packet_sha256: prepared[0].review_packet_sha256,
    expected_standard_sha256: prepared[0].planned_standard_sha256,
    request_id: \`r116_reject_\${suffix}\`,
    decision: "rejected",
    note: "The owner does not accept this candidate.",
  }));`
const productReject = `  const productRejected = await productGateway.decide(
    productPrepared[0],
    "rejected",
    \`r116_reject_\${suffix}\`,
    "The owner does not accept this candidate.",
  );
  const rejected = { status: productRejected.decision === "rejected" ? 200 : 500 };`
if (!executable.includes(rawReject)) throw new Error('r120_rejection_anchor_missing')
executable = executable.replace(rawReject, productReject)

const approvalReceiptAnchor = '  if (!applicationId || !applicationHash || !activeSha) throw new Error("approval_receipt_missing");'
const productApprovalRetry = `${approvalReceiptAnchor}
  const productApprovalRetry = await productGateway.decide(
    productPrepared[1],
    "approved",
    winningRequestId,
    "I approve this exact bounded change.",
  );
  const productApprovalParsed =
    productApprovalRetry.decision === "approved" &&
    productApprovalRetry.applicationId === applicationId &&
    productApprovalRetry.applicationHash === applicationHash &&
    productApprovalRetry.activeStandardSha256 === activeSha &&
    productApprovalRetry.reversibleWhileCurrent === true;
  if (!productApprovalParsed) throw new Error("product_approval_receipt_invalid");`
if (!executable.includes(approvalReceiptAnchor)) throw new Error('r120_approval_anchor_missing')
executable = executable.replace(approvalReceiptAnchor, productApprovalRetry)

const staleStart = '  console.error("r116_probe:stale_approval:start");'
const staleEnd = '  console.error(`r116_probe:stale_approval:${staleApproval.status}`);'
const staleStartIndex = executable.indexOf(staleStart)
const staleEndIndex = executable.indexOf(staleEnd, staleStartIndex)
if (staleStartIndex < 0 || staleEndIndex < 0) throw new Error('r120_stale_anchor_missing')
const productStale = `  let productStaleCode = null;
  try {
    await productGateway.decide(
      productPrepared[2],
      "approved",
      \`r116_stale_\${suffix}\`,
      "This packet is now stale.",
    );
  } catch (error) {
    productStaleCode = error instanceof StandardReviewGatewayError ? error.code : null;
  }
  const staleApproval = { status: productStaleCode === "state_conflict" ? 409 : 500 };`
executable = executable.slice(0, staleStartIndex) + productStale + executable.slice(staleEndIndex + staleEnd.length)

const rawBlockedReversal = `  const blockedReversal = await ${routeCallV2}, tokenA, ownerAction("reverse", {
    application_id: applicationId,
    expected_application_hash: applicationHash,
    expected_active_standard_sha256: activeSha,
    request_id: \`r116_reverse_blocked_\${suffix}\`,
    reason: "Prove that reversal refuses a later head.",
  }));`
const productBlockedReversal = `  let productBlockedReversalCode = null;
  try {
    await productGateway.reverse(
      applicationId,
      applicationHash,
      activeSha,
      \`r116_reverse_blocked_\${suffix}\`,
      "Prove that reversal refuses a later head.",
    );
  } catch (error) {
    productBlockedReversalCode = error instanceof StandardReviewGatewayError ? error.code : null;
  }
  const blockedReversal = { status: productBlockedReversalCode === "state_conflict" ? 409 : 500 };`
if (!executable.includes(rawBlockedReversal)) throw new Error('r120_blocked_reversal_anchor_missing')
executable = executable.replace(rawBlockedReversal, productBlockedReversal)

const rawReverse = `  const reversed = await ${routeCallV2}, tokenA, ownerAction("reverse", reverseBase));`
const productReverse = `  await productGateway.reverse(
    applicationId,
    applicationHash,
    activeSha,
    reverseRequestId,
    "Restore the exact prior owner-approved standard.",
  );
  const reversed = { status: 200 };`
if (!executable.includes(rawReverse)) throw new Error('r120_reverse_anchor_missing')
executable = executable.replace(rawReverse, productReverse)

const outputAnchor = '    prepared_count: prepared.length,'
const productOutput = `    prepared_count: prepared.length,
    product_gateway: {
      prepared_count: productPrepared.length,
      presentation_bound: productPresentationBound,
      refresh_succeeded: Boolean(refreshedSession.data.session?.access_token),
      refresh_preserved_packet: productRefreshPreserved,
      rejection_parsed: productRejected.decision === "rejected",
      approval_receipt_parsed: productApprovalParsed,
      stale_conflict_mapped: productStaleCode === "state_conflict",
      non_head_reversal_conflict_mapped: productBlockedReversalCode === "state_conflict",
      reversal_receipt_parsed: reversed.status === 200,
    },`
if (!executable.includes(outputAnchor)) throw new Error('r120_output_anchor_missing')
executable = executable.replace(outputAnchor, productOutput)

const requiredAnchor = '    prepared.length === 3,'
const productRequired = `    prepared.length === 3,
    productPrepared.length === 3,
    productPresentationBound,
    Boolean(refreshedSession.data.session?.access_token),
    productRefreshPreserved,
    productRejected.decision === "rejected",
    productApprovalParsed,
    productStaleCode === "state_conflict",
    productBlockedReversalCode === "state_conflict",`
if (!executable.includes(requiredAnchor)) throw new Error('r120_required_anchor_missing')
executable = executable.replace(requiredAnchor, productRequired)

const successAnchor = '  probePassed = true;'
const productSignOut = `  const productSignOut = await productClient.auth.signOut({ scope: "local" });
  if (productSignOut.error) throw new Error(\`product_client_sign_out_failed:\${productSignOut.error.message}\`);
  probePassed = true;`
if (!executable.includes(successAnchor)) throw new Error('r120_success_anchor_missing')
executable = executable.replace(successAnchor, productSignOut)

try {
  writeFileSync(executablePath, executable, 'utf8')
  const viteNode = join(root, 'node_modules/vite-node/vite-node.mjs')
  const run = spawnSync(process.execPath, [viteNode, executablePath], {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })
  if (run.stderr) process.stderr.write(run.stderr)
  if (run.status !== 0) {
    if (run.stdout) process.stderr.write(run.stdout)
    throw new Error(`r120_hosted_probe_failed:${run.status ?? 'unknown'}`)
  }
  const finalLine = run.stdout.trim().split(/\r?\n/).at(-1)
  const result = JSON.parse(finalLine)
  const productProof = result.product_gateway ?? {}
  if (
    productProof.prepared_count !== 3 ||
    Object.entries(productProof).some(([key, value]) => key !== 'prepared_count' && value !== true) ||
    Object.values(result.cleanup).some((value) => Number(value) !== 0)
  ) {
    throw new Error('r120_hosted_probe_result_invalid')
  }
  console.log(JSON.stringify(result))
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
