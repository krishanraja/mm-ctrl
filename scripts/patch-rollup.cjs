const fs = require("fs");
const path = require("path");

const nativeJsPath = path.join(__dirname, "..", "node_modules", "rollup", "dist", "native.js");
const wasmPath = path.join(__dirname, "..", "node_modules", "@rollup", "wasm-node");

if (!fs.existsSync(nativeJsPath)) {
  console.log("[patch-rollup] Rollup not found, skipping.");
  process.exit(0);
}

const content = fs.readFileSync(nativeJsPath, "utf8");
if (content.includes("WASM_FALLBACK_PATCH")) {
  console.log("[patch-rollup] Already patched.");
  process.exit(0);
}

if (!fs.existsSync(wasmPath)) {
  console.log("[patch-rollup] @rollup/wasm-node not found, skipping.");
  process.exit(0);
}

const originalPath = nativeJsPath.replace("native.js", "native-original.js");
if (!fs.existsSync(originalPath)) {
  fs.writeFileSync(originalPath, content);
  console.log("[patch-rollup] Backed up native.js");
}

const patched = `// WASM_FALLBACK_PATCH
let parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16;

try {
  const native = require("./native-original.js");
  parse = native.parse;
  parseAsync = native.parseAsync;
  xxhashBase64Url = native.xxhashBase64Url;
  xxhashBase36 = native.xxhashBase36;
  xxhashBase16 = native.xxhashBase16;
} catch (e) {
  console.warn("[Rollup] Native bindings unavailable, using WASM...");
  try {
    const wasm = require("@rollup/wasm-node/dist/wasm-node/bindings_wasm.js");
    parse = wasm.parse;
    parseAsync = (code, opts) => Promise.resolve(wasm.parse(code, opts));
    xxhashBase64Url = wasm.xxhashBase64Url;
    xxhashBase36 = wasm.xxhashBase36;
    xxhashBase16 = wasm.xxhashBase16;
  } catch (e2) {
    throw e;
  }
}

module.exports.parse = parse;
module.exports.parseAsync = parseAsync;
module.exports.xxhashBase64Url = xxhashBase64Url;
module.exports.xxhashBase36 = xxhashBase36;
module.exports.xxhashBase16 = xxhashBase16;
`;

fs.writeFileSync(nativeJsPath, patched);
console.log("[patch-rollup] Patched successfully.");
