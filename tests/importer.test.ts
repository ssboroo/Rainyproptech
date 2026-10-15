import test from "node:test";
import assert from "node:assert/strict";
import { buildInstancedScene, toInstancedGLB } from "openskp";
import { Helper } from "dxf";
import { facadeDxf, buildingSkp } from "../scripts/create-source-examples.mjs";
import { sourceFormat, importError } from "../lib/importer/formats";
test("native SketchUp source is decoded to a placed 3D scene and valid GLB", () => {
  const bytes = buildingSkp();
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const scene = buildInstancedScene(buffer, { respectEdgeVisibility: true });
  assert.ok(scene.meshResources.length > 0);
  assert.ok(scene.bounds && scene.bounds.size[1] > 10);
  const glb = toInstancedGLB(scene, { textures: true });
  assert.equal(
    new DataView(glb.buffer as ArrayBuffer).getUint32(0, true),
    0x46546c67,
  );
});
test("CAD elevation DXF parses real lines and produces finite SVG geometry", () => {
  const helper = new Helper(facadeDxf());
  assert.ok(helper.parsed.entities.length > 150);
  const svg = helper.toSVG();
  assert.match(svg, /<svg/);
  assert.match(svg, /viewBox=/);
  assert.doesNotMatch(svg, /NaN|Infinity/);
});
test("import extension matching and failure guidance cover unsupported files", () => {
  assert.equal(sourceFormat("SITE.DWG"), "dwg");
  assert.equal(sourceFormat("building.skp"), "skp");
  assert.equal(sourceFormat("draw.exe"), null);
  assert.match(importError("BINARY_DXF", "en"), /ASCII DXF/);
  assert.match(importError("EMPTY_MODEL", "en"), /No visible geometry/);
  assert.match(importError("TIMEOUT", "en"), /timed out/);
});
