import { createHash } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const directory = new URL("public/models/face-landmarker/", root);
const expectedVersion = "0.10.32";
const expectedHash =
  "64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff";
const modelUrl =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const pkg = JSON.parse(
  await readFile(
    new URL("node_modules/@mediapipe/tasks-vision/package.json", root),
    "utf8",
  ),
);
if (pkg.version !== expectedVersion)
  throw new Error(`Expected MediaPipe ${expectedVersion}, got ${pkg.version}`);
await mkdir(directory, { recursive: true });
await cp(
  new URL("node_modules/@mediapipe/tasks-vision/wasm/", root),
  new URL("wasm/", directory),
  { recursive: true },
);
const response = await fetch(modelUrl);
if (!response.ok) throw new Error(`Model download failed: ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
if (createHash("sha256").update(bytes).digest("hex") !== expectedHash)
  throw new Error("Model checksum mismatch; asset was not written.");
await writeFile(new URL("face_landmarker.task", directory), bytes);
console.log(`Prepared pinned camera assets in ${fileURLToPath(directory)}`);
