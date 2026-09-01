// Real-model verification of the browser detection path.
// Mirrors exactly what browser-engine.ts does: same pipeline options
// (q4, ignore_labels ["O"], aggregation_strategy "simple"), same model.
import { pipeline } from "@huggingface/transformers";

const TEXT =
  "My name is Alice Smith, my email is alice@example.com, and my project key is sk-1234567890abcdef.";

const device = process.env.DEVICE ?? "wasm";
const dtype = process.env.DTYPE ?? "q4";

console.log(`[probe] loading pipeline: openai/privacy-filter device=${device} dtype=${dtype}`);
const ner = await pipeline("token-classification", "openai/privacy-filter", {
  device,
  dtype,
  progress_callback: (item) => {
    if (item?.status === "progress" && item.file?.endsWith(".onnx_data")) {
      const pct = ((item.loaded / item.total) * 100).toFixed(1);
      process.stdout.write(`\r[probe] weights: ${pct}%   `);
    } else if (item?.status) {
      console.log(`[probe] ${item.status}: ${item.file ?? ""}`);
    }
  }
});
console.log("\n[probe] pipeline ready");

// Path 1: aggregated entities (what detectSpansViaAggregation consumes)
const aggregated = await ner(TEXT, {
  ignore_labels: ["O"],
  aggregation_strategy: "simple"
});
console.log("\n[path1] aggregation_strategy=simple output:");
console.log(JSON.stringify(aggregated, null, 2));

// Path 2: raw per-token output (no aggregation)
const raw = await ner(TEXT, { ignore_labels: ["O"] });
console.log("\n[path2] raw per-token output (first 12):");
console.log(JSON.stringify(raw?.slice?.(0, 12), null, 2));

// Path 3: batch/array call form (what detectSpansInChunk tries first)
const batched = await ner([TEXT], { ignore_labels: ["O"] });
console.log("\n[path3] batch [text] call: isArray =", Array.isArray(batched));
console.log(JSON.stringify(batched, null, 2)?.slice(0, 2000));
