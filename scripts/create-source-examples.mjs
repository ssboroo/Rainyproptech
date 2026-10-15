import { create } from "openskp";
import { mkdir, writeFile } from "node:fs/promises";
export function facadeDxf() {
  const pairs = [
    "0",
    "SECTION",
    "2",
    "HEADER",
    "0",
    "ENDSEC",
    "0",
    "SECTION",
    "2",
    "ENTITIES",
  ];
  const line = (x, y, x2, y2) =>
    pairs.push(
      "0",
      "LINE",
      "8",
      "FACADE",
      "10",
      String(x),
      "20",
      String(y),
      "30",
      "0",
      "11",
      String(x2),
      "21",
      String(y2),
      "31",
      "0",
    );
  const rect = (x, y, w, h) => {
    line(x, y, x + w, y);
    line(x + w, y, x + w, y + h);
    line(x + w, y + h, x, y + h);
    line(x, y + h, x, y);
  };
  rect(0, 0, 240, 150);
  rect(85, 0, 70, 16);
  for (let floor = 0; floor < 5; floor++) {
    line(0, floor * 30, 240, floor * 30);
    for (let col = 0; col < 8; col++)
      rect(8 + col * 29, 7 + floor * 30, 18, 17);
  }
  line(-12, 0, 252, 0);
  pairs.push("0", "ENDSEC", "0", "EOF");
  return pairs.join("\n") + "\n";
}
export function buildingSkp() {
  const b = create();
  const wall = b.addMaterial("Warm concrete", [218, 218, 207]);
  const glass = b.addMaterial("Blue grey glazing", [105, 151, 157]);
  function box(x, y, z, w, d, h, material) {
    const a = [x, y, z],
      c = [x + w, y, z],
      e = [x + w, y + d, z],
      f = [x, y + d, z],
      A = [x, y, z + h],
      C = [x + w, y, z + h],
      E = [x + w, y + d, z + h],
      F = [x, y + d, z + h];
    for (const v of [
      [a, c, C, A],
      [c, e, E, C],
      [e, f, F, E],
      [f, a, A, F],
      [A, C, E, F],
      [a, f, e, c],
    ])
      b.addFace(v, { material, backMaterial: material });
  }
  box(0, 0, 0, 360, 220, 540, wall);
  box(390, 0, 0, 240, 220, 270, wall);
  for (let floor = 0; floor < 9; floor++)
    for (let col = 0; col < 5; col++)
      box(16 + col * 68, -2, 12 + floor * 59, 48, 2, 34, glass);
  for (let floor = 0; floor < 4; floor++)
    for (let col = 0; col < 3; col++)
      box(408 + col * 72, -2, 18 + floor * 60, 48, 2, 34, glass);
  return b.toBytes();
}
export async function writeExamples() {
  await mkdir("public/samples", { recursive: true });
  await writeFile("public/samples/facade.dxf", facadeDxf());
  await writeFile("public/samples/building.skp", buildingSkp());
}
