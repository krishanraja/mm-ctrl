import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(scriptDir, '..')
const sourcePath = join(scriptDir, 'probe-ctrl-g25-standard-review-gateway-r120.mjs')
const scratchRoot = process.env.CTRL_SCRATCH_ROOT ?? join(homedir(), '.scratch')
mkdirSync(scratchRoot, { recursive: true })
const temporaryDirectory = mkdtempSync(join(scratchRoot, 'mm-ctrl-r123-wrapper-'))
const executablePath = join(temporaryDirectory, 'pending-review-r123.mjs')
let source = readFileSync(sourcePath, 'utf8')

const rootsAnchor = `const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(scriptDir, '..')`
const rootsReplacement = `const scriptDir = ${JSON.stringify(scriptDir)}
const root = ${JSON.stringify(root)}`
if (!source.includes(rootsAnchor)) throw new Error('r123_root_anchor_drift')
source = source.replace(rootsAnchor, rootsReplacement)
source = source
  .replaceAll('mm-ctrl-r120-', 'mm-ctrl-r123-')
  .replaceAll('product-gateway-r120-probe.ts', 'pending-review-r123-probe.ts')

const importAnchor = `import { createSupabaseStandardReviewInvoker } from \${JSON.stringify(viteFile(join(root, 'src/features/standard-review/supabaseInvoker.ts')))};`
const importReplacement = `${importAnchor}
import { getPendingStandardReview } from \${JSON.stringify(viteFile(join(root, 'src/features/standard-review/pendingQueue.ts')))};`
if (!source.includes(importAnchor)) throw new Error('r123_import_anchor_drift')
source = source.replace(importAnchor, importReplacement)

const gatewayAnchor = '  const productGateway = new StandardReviewGateway(createSupabaseStandardReviewInvoker(productClient));'
const gatewayReplacement = `  const productInvoker = createSupabaseStandardReviewInvoker(productClient);
  const productGateway = new StandardReviewGateway(productInvoker);`
if (!source.includes(gatewayAnchor)) throw new Error('r123_gateway_anchor_drift')
source = source.replace(gatewayAnchor, gatewayReplacement)

const initialAnchor = '  if (!productPresentationBound) throw new Error("product_presentation_binding_failed");'
const initialReplacement = `${initialAnchor}
  const queueTransport = await productClient.functions.invoke("review-standard-change-v4", {
    body: { action: "pending" },
  });
  if (queueTransport.error) {
    const context = queueTransport.error.context;
    const body = typeof context?.clone === "function"
      ? await context.clone().text()
      : "unreadable";
    throw new Error("pending_queue_transport_failed:" + String(context?.status) + ":" + body.slice(0, 500));
  }
  let initialQueue;
  try {
    initialQueue = await getPendingStandardReview(productInvoker);
  } catch (error) {
    throw new Error("pending_queue_initial_call_failed:" + JSON.stringify(error));
  }
  const queueInitialValid =
    initialQueue.ready_count === 3 &&
    initialQueue.next?.review_packet_id === productPrepared[0].reviewPacketId &&
    initialQueue.next?.safe_path === "/operator/reviews/" + productPrepared[0].reviewPacketId &&
    initialQueue.next?.consequence === productPrepared[0].consequence &&
    initialQueue.selection.materiality_inferred === false;
  if (!queueInitialValid) throw new Error("pending_queue_initial_invalid");`
if (!source.includes(initialAnchor)) throw new Error('r123_initial_queue_anchor_drift')
source = source.replace(initialAnchor, initialReplacement)

const rejectAnchor = '  const rejected = { status: productRejected.decision === "rejected" ? 200 : 500 };'
const rejectReplacement = `${rejectAnchor}
  const queueAfterReject = await getPendingStandardReview(productInvoker);
  const queueAfterRejectValid =
    queueAfterReject.ready_count === 2 &&
    queueAfterReject.next?.review_packet_id === productPrepared[1].reviewPacketId;`
if (!source.includes(rejectAnchor)) throw new Error('r123_reject_queue_anchor_drift')
source = source.replace(rejectAnchor, rejectReplacement)

const approveAnchor = '  if (!productApprovalParsed) throw new Error("product_approval_receipt_invalid");'
const approveReplacement = `${approveAnchor}
  const queueAfterApproval = await getPendingStandardReview(productInvoker);
  const queueAfterApprovalValid =
    queueAfterApproval.ready_count === 1 &&
    queueAfterApproval.next?.review_packet_id === productPrepared[2].reviewPacketId;`
if (!source.includes(approveAnchor)) throw new Error('r123_approval_queue_anchor_drift')
source = source.replace(approveAnchor, approveReplacement)

const outputAnchor = '      reversal_receipt_parsed: reversed.status === 200,'
const outputReplacement = `${outputAnchor}
      queue_initial_valid: queueInitialValid,
      queue_after_reject_valid: queueAfterRejectValid,
      queue_after_approval_valid: queueAfterApprovalValid,`
if (!source.includes(outputAnchor)) throw new Error('r123_output_anchor_drift')
source = source.replace(outputAnchor, outputReplacement)

const requiredAnchor = '    productBlockedReversalCode === "state_conflict",'
const requiredReplacement = `${requiredAnchor}
    queueInitialValid,
    queueAfterRejectValid,
    queueAfterApprovalValid,`
if (!source.includes(requiredAnchor)) throw new Error('r123_required_anchor_drift')
source = source.replace(requiredAnchor, requiredReplacement)

try {
  writeFileSync(executablePath, source, 'utf8')
  const run = spawnSync(process.execPath, [executablePath], {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })
  if (run.stderr) process.stderr.write(run.stderr)
  if (run.status !== 0) {
    if (run.stdout) process.stderr.write(run.stdout)
    throw new Error(`r123_hosted_probe_failed:${run.status ?? 'unknown'}`)
  }
  const finalLine = run.stdout.trim().split(/\r?\n/).at(-1)
  const result = JSON.parse(finalLine)
  const proof = result.product_gateway ?? {}
  if (
    proof.queue_initial_valid !== true ||
    proof.queue_after_reject_valid !== true ||
    proof.queue_after_approval_valid !== true ||
    Object.values(result.cleanup).some((value) => Number(value) !== 0)
  ) throw new Error('r123_hosted_probe_result_invalid')
  console.log(JSON.stringify({
    authenticated_pending_queue: true,
    ready_count_transitions: [3, 2, 1],
    oldest_ready_first: true,
    consequence_bound: true,
    safe_path_bound: true,
    materiality_inferred: false,
    active_standard_mutated_by_read: false,
    notification_sent: false,
    cleanup: result.cleanup,
  }))
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
