import test from "node:test";
import assert from "node:assert/strict";
import { analyzeBoundarySource, prepareBoundaryCandidate } from "../lib/ingestion/boundaryPreparation.ts";
import { parseCityBoundary } from "../lib/ingestion/cityBoundary.ts";

function circleBoundary(vertexCount = 7000) {
  const ring = Array.from({ length: vertexCount }, (_, index) => {
    const angle = 2 * Math.PI * index / vertexCount;
    return [-122.2 + 0.1 * Math.cos(angle), 37.8 + 0.1 * Math.sin(angle)];
  });
  ring.push(ring[0].slice());
  return { type: "Polygon", coordinates: [ring] };
}

test("prepares an over-limit municipal polygon without changing the source and passes registration validation", () => {
  const source = circleBoundary();
  const originalCount = source.coordinates[0].length;
  const analysis = analyzeBoundarySource(source);
  assert.ok(analysis.coordinateCount > 5000);

  const prepared = prepareBoundaryCandidate(analysis.geometry, 0.1);
  const registered = parseCityBoundary(prepared.geometry);

  assert.equal(source.coordinates[0].length, originalCount);
  assert.ok(prepared.metadata.prepared_coordinates < 5000);
  assert.ok(prepared.metadata.prepared_coordinates < analysis.coordinateCount);
  assert.equal(prepared.metadata.registration_eligible, true);
  assert.equal(registered.type, "Polygon");
  assert.equal(prepared.metadata.containment.grid_differences, 0);
  assert.equal(prepared.metadata.area_delta_percent < 0.001, true);
});

test("retains a valid reduced candidate that is not yet below registration limits", () => {
  const top = Array.from({ length: 7000 }, (_, index) => [
    -122.2 + index * 0.000003,
    37.8 + (index % 2 ? 0.000001 : 0),
  ]);
  const end = top.at(-1)[0];
  const start = top[0][0];
  const geometry = { type: "Polygon", coordinates: [[...top, [end, 37.799], [start, 37.799], top[0]]] };
  const candidate = prepareBoundaryCandidate(geometry, 0.1);
  assert.ok(candidate.metadata.prepared_coordinates > 5000);
  assert.equal(candidate.metadata.registration_eligible, false);
  assert.ok(candidate.metadata.prepared_coordinates < candidate.metadata.source_coordinates);
});

test("source preparation rejects FeatureCollection and unsupported geometries", () => {
  assert.throws(() => analyzeBoundarySource({ type: "FeatureCollection", features: [] }), /Polygon or MultiPolygon/);
  assert.throws(() => analyzeBoundarySource({ type: "Point", coordinates: [0, 0] }), /Polygon or MultiPolygon/);
  assert.throws(() => analyzeBoundarySource({ type: "Polygon", coordinates: [null] }), /at least four coordinates/);
  assert.throws(() => analyzeBoundarySource({ type: "MultiPolygon", coordinates: [null] }), /array of polygons/);
});

test("candidate generation accepts only the operator tolerance choices", () => {
  assert.throws(() => prepareBoundaryCandidate(circleBoundary(100), 0.3), /supported simplification tolerances/);
});
