const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../lib/ingestion/cityBoundary.ts");
const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const mod = new Module(filename, module);
mod.filename = filename;
mod.paths = Module._nodeModulePaths(path.dirname(filename));
mod._compile(source, filename);
const { parseCityBoundary, classifyCityPoint } = mod.exports;

const square = (west, south, east, north) => [
  [west, south], [east, south], [east, north], [west, north], [west, south],
];

test("classifies inside, outside, hole, boundary, and invalid points", () => {
  const boundary = parseCityBoundary({ type: "Polygon", coordinates: [
    square(-123, 47, -121, 49), square(-122.5, 47.5, -122, 48),
  ] });
  assert.equal(classifyCityPoint(boundary, -122.8, 48), "inside");
  assert.equal(classifyCityPoint(boundary, -120, 48), "outside");
  assert.equal(classifyCityPoint(boundary, -122.2, 47.7), "outside");
  assert.equal(classifyCityPoint(boundary, -123, 48), "boundary");
  assert.equal(classifyCityPoint(boundary, -122.5, 47.7), "boundary");
  assert.equal(classifyCityPoint(boundary, NaN, 48), "invalid");
});

test("supports disjoint multipolygons and rejects invalid topology", () => {
  const boundary = parseCityBoundary({ type: "MultiPolygon", coordinates: [
    [square(0, 0, 1, 1)], [square(2, 2, 3, 3)],
  ] });
  assert.equal(classifyCityPoint(boundary, 2.5, 2.5), "inside");
  assert.throws(() => parseCityBoundary({ type: "Polygon", coordinates: [square(0, 0, 1, 1), square(2, 2, 3, 3)] }));
  assert.throws(() => parseCityBoundary({ type: "Polygon", coordinates: [[[0, 0], [1, 1], [1, 0], [0, 1], [0, 0]]] }));
  assert.throws(() => parseCityBoundary({ type: "Polygon", coordinates: [square(0, 0, 1, 1).slice(0, 4)] }));
  assert.throws(() => parseCityBoundary({ type: "Polygon", coordinates: [square(170, 0, -170, 1)] }));
});
