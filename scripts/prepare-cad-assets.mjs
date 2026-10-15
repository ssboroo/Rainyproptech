import { cp, mkdir } from "node:fs/promises";
const root = "public/vendor/cad";
await mkdir(root, { recursive: true });
await cp("node_modules/@mlightcad/libredwg-web/dist", `${root}/dist`, {
  recursive: true,
});
await cp("node_modules/@mlightcad/libredwg-web/wasm", `${root}/wasm`, {
  recursive: true,
});
import { writeExamples } from "./create-source-examples.mjs";
await writeExamples();
