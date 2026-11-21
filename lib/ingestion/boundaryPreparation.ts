import proj4 from "proj4";
import type { MultiPolygon, Polygon, Position } from "geojson";
import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import GeoJSONWriter from "jsts/org/locationtech/jts/io/GeoJSONWriter.js";
import GeometryFactory from "jsts/org/locationtech/jts/geom/GeometryFactory.js";
import IsValidOp from "jsts/org/locationtech/jts/operation/valid/IsValidOp.js";
import DouglasPeuckerSimplifier from "jsts/org/locationtech/jts/simplify/DouglasPeuckerSimplifier.js";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

export type BoundaryGeometry = Polygon | MultiPolygon;
export const boundaryTolerancesMeters = [0.1, 0.5, 1, 2, 5, 10] as const;
export const maxPreparationCoordinates = 50_000;
export const maxPreparationBytes = 5 * 1024 * 1024;
export const maxPreparedGeometryBytes = 900_000;

type Bounds = { west: number; south: number; east: number; north: number };
type Projection = { forward: (position: Position) => Position; inverse: (position: Position) => Position; definition: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function coordinateCount(geometry: BoundaryGeometry): number {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flat().reduce((count, ring) => count + ring.length, 0);
}

function polygonCoordinates(geometry: BoundaryGeometry): Position[][][] {
  return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}

function normalizeGeometry(input: unknown): BoundaryGeometry {
  if (!isRecord(input) || !("type" in input) || !("coordinates" in input)) {
    throw new Error("Upload a GeoJSON Polygon or MultiPolygon geometry");
  }
  if (input.type !== "Polygon" && input.type !== "MultiPolygon") {
    throw new Error("Upload a GeoJSON Polygon or MultiPolygon geometry, not a FeatureCollection or other geometry type");
  }
  if (input.type === "Polygon" && !Array.isArray(input.coordinates)) {
    throw new Error("Polygon coordinates must be an array of rings");
  }
  if (input.type === "MultiPolygon" && (!Array.isArray(input.coordinates)
      || !input.coordinates.every(Array.isArray))) {
    throw new Error("MultiPolygon coordinates must be an array of polygons");
  }
  const geometry = input as unknown as BoundaryGeometry;
  const polygons = polygonCoordinates(geometry);
  if (!polygons.length || polygons.some((polygon) => !polygon.length)) {
    throw new Error("Boundary must contain at least one polygon ring");
  }
  let count = 0;
  const bounds: Bounds = { west: 180, south: 90, east: -180, north: -90 };
  for (const polygon of polygons) {
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 4) throw new Error("Boundary rings need at least four coordinates");
      for (let index = 0; index < ring.length; index += 1) {
        const position = ring[index];
        if (!Array.isArray(position) || position.length !== 2
            || !position.every((value) => typeof value === "number" && Number.isFinite(value))
            || position[0] < -180 || position[0] > 180 || position[1] < -90 || position[1] > 90) {
          throw new Error("Boundary coordinates must be finite longitude, latitude pairs");
        }
        count += 1;
        bounds.west = Math.min(bounds.west, position[0]);
        bounds.east = Math.max(bounds.east, position[0]);
        bounds.south = Math.min(bounds.south, position[1]);
        bounds.north = Math.max(bounds.north, position[1]);
        if (index > 0 && (position[0] === ring[index - 1][0] && position[1] === ring[index - 1][1]
            || Math.abs(position[0] - ring[index - 1][0]) >= 180)) {
          throw new Error("Boundary contains duplicate adjacent coordinates or crosses the antimeridian");
        }
      }
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) throw new Error("Boundary rings must be closed");
    }
  }
  if (count > maxPreparationCoordinates) {
    throw new Error(`Boundary exceeds the preparation limit of ${maxPreparationCoordinates.toLocaleString()} coordinates`);
  }
  return geometry.type === "Polygon"
    ? { type: "Polygon", coordinates: geometry.coordinates }
    : { type: "MultiPolygon", coordinates: geometry.coordinates };
}

function localProjection(bounds: Bounds): Projection {
  const longitude = (bounds.west + bounds.east) / 2;
  const latitude = (bounds.south + bounds.north) / 2;
  const definition = `+proj=aeqd +lat_0=${latitude} +lon_0=${longitude} +datum=WGS84 +units=m +no_defs`;
  return {
    definition,
    forward: ([lon, lat]) => proj4("EPSG:4326", definition, [lon, lat]) as Position,
    inverse: ([x, y]) => proj4(definition, "EPSG:4326", [x, y]) as Position,
  };
}

function transformGeometry(geometry: BoundaryGeometry, transform: (position: Position) => Position): BoundaryGeometry {
  const polygons = polygonCoordinates(geometry).map((polygon) => polygon.map((ring) => ring.map(transform)));
  return geometry.type === "Polygon"
    ? { type: "Polygon", coordinates: polygons[0] }
    : { type: "MultiPolygon", coordinates: polygons };
}

function pointSets(geometry: BoundaryGeometry, bounds: Bounds, projection: Projection) {
  const width = Math.max(0, bounds.east - bounds.west);
  const height = Math.max(0, bounds.north - bounds.south);
  const gridStep = Math.max(0.0025, Math.sqrt((width * height) / 4000));
  const grid: Position[] = [];
  for (let latitude = bounds.south + gridStep / 2; latitude < bounds.north; latitude += gridStep) {
    for (let longitude = bounds.west + gridStep / 2; longitude < bounds.east; longitude += gridStep) {
      grid.push([longitude, latitude]);
    }
  }
  const rings = polygonCoordinates(geometry).flat();
  const segmentCount = rings.reduce((count, ring) => count + ring.length - 1, 0);
  const stride = Math.max(1, Math.ceil(segmentCount / 300));
  const distances = [0.5, 1, 2, 5, 10];
  const edge: Array<{ position: Position; distance: number }> = [];
  for (const ring of rings) {
    for (let index = 0; index < ring.length - 1; index += stride) {
      const start = projection.forward(ring[index]);
      const end = projection.forward(ring[index + 1]);
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length = Math.hypot(dx, dy);
      if (!length) continue;
      const midpoint: Position = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
      for (const distance of distances) {
        for (const sign of [-1, 1]) {
          edge.push({
            position: projection.inverse([
              midpoint[0] + sign * -dy / length * distance,
              midpoint[1] + sign * dx / length * distance,
            ]),
            distance,
          });
        }
      }
    }
  }
  return { grid, edge };
}

export function analyzeBoundarySource(input: unknown) {
  const geometry = normalizeGeometry(input);
  const serialized = JSON.stringify(geometry);
  const sizeBytes = Buffer.byteLength(serialized);
  if (sizeBytes > maxPreparationBytes) throw new Error("Source geometry exceeds the 5 MB preparation upload limit");
  const bounds = polygonCoordinates(geometry).flat(2).reduce<Bounds>((result, [longitude, latitude]) => ({
    west: Math.min(result.west, longitude), south: Math.min(result.south, latitude),
    east: Math.max(result.east, longitude), north: Math.max(result.north, latitude),
  }), { west: 180, south: 90, east: -180, north: -90 });
  const projection = localProjection(bounds);
  const projected = transformGeometry(geometry, projection.forward);
  const topology = new IsValidOp(new GeoJSONReader(new GeometryFactory()).read(projected));
  const validationError = topology.getValidationError();
  if (validationError) throw new Error(`Source boundary is invalid: ${validationError.toString()}`);
  return {
    geometry, coordinateCount: coordinateCount(geometry), sizeBytes,
    ringCount: polygonCoordinates(geometry).flat().length,
    bounds, projection, projected,
  };
}

export function prepareBoundaryCandidate(input: unknown, toleranceMeters: number) {
  if (!(boundaryTolerancesMeters as readonly number[]).includes(toleranceMeters)) {
    throw new Error("Choose one of the supported simplification tolerances");
  }
  const source = analyzeBoundarySource(input);
  const reader = new GeoJSONReader(new GeometryFactory());
  const writer = new GeoJSONWriter();
  const original = reader.read(source.projected);
  const simplified = DouglasPeuckerSimplifier.simplify(original, toleranceMeters);
  if (!new IsValidOp(simplified).isValid()) throw new Error("Simplified boundary failed topology validation");
  const projectedCandidate = writer.write(simplified) as BoundaryGeometry;
  const parsed = transformGeometry(projectedCandidate, source.projection.inverse);
  const candidateCount = coordinateCount(parsed);
  if (candidateCount >= source.coordinateCount) throw new Error("This tolerance did not reduce the coordinate count; choose a larger tolerance");
  const preparedSizeBytes = Buffer.byteLength(JSON.stringify(parsed));
  if (preparedSizeBytes > maxPreparationBytes) {
    throw new Error("Prepared candidate exceeds the 5 MB preparation storage limit");
  }
  const registrationEligible = candidateCount <= 5000 && preparedSizeBytes <= maxPreparedGeometryBytes;
  const projectedRings = polygonCoordinates(parsed).map((polygon) => polygon.map((ring) => ring.map(source.projection.forward)));
  const candidateProjected = parsed.type === "Polygon"
    ? { type: "Polygon", coordinates: projectedRings[0] }
    : { type: "MultiPolygon", coordinates: projectedRings };
  const candidateJsts = reader.read(candidateProjected);
  const areaDeltaPercent = original.getArea() === 0 ? 0 : (candidateJsts.getArea() - original.getArea()) / original.getArea() * 100;
  const samples = pointSets(source.geometry, source.bounds, source.projection);
  const compare = (point: Position) => booleanPointInPolygon(point, source.geometry)
    !== booleanPointInPolygon(point, parsed);
  const grid = samples.grid.reduce((counts, point) => {
    const inside = booleanPointInPolygon(point, source.geometry);
    if (inside) {
      counts.interiorPoints += 1;
      counts.interiorDifferences += Number(compare(point));
    } else {
      counts.exteriorPoints += 1;
      counts.exteriorDifferences += Number(compare(point));
    }
    return counts;
  }, { interiorPoints: 0, interiorDifferences: 0, exteriorPoints: 0, exteriorDifferences: 0 });
  const gridDifferences = grid.interiorDifferences + grid.exteriorDifferences;
  const edgeDifferencesByDistance = Object.fromEntries([0.5, 1, 2, 5, 10].map((distance) => [
    String(distance), samples.edge.filter((sample) => sample.distance === distance && compare(sample.position)).length,
  ]));
  const edgeProbeCount = samples.edge.length;
  const edgeDifferences = Object.values(edgeDifferencesByDistance).reduce((sum, value) => sum + Number(value), 0);
  const validationPassed = gridDifferences === 0 && edgeDifferences === 0;
  return {
    geometry: parsed,
    metadata: {
      algorithm: "Douglas-Peucker",
      algorithm_version: "JSTS 2.12.1",
      projection: source.projection.definition,
      tolerance_meters: toleranceMeters,
      source_coordinates: source.coordinateCount,
      prepared_coordinates: candidateCount,
      reduction_percent: (source.coordinateCount - candidateCount) / source.coordinateCount * 100,
      source_size_bytes: source.sizeBytes,
      prepared_size_bytes: preparedSizeBytes,
      registration_eligible: registrationEligible,
      area_delta_percent: areaDeltaPercent,
      containment: {
        grid_points: samples.grid.length,
        grid_differences: gridDifferences,
        interior_points: grid.interiorPoints,
        interior_differences: grid.interiorDifferences,
        exterior_points: grid.exteriorPoints,
        exterior_differences: grid.exteriorDifferences,
        boundary_probe_points: edgeProbeCount,
        boundary_differences: edgeDifferences,
        boundary_differences_by_offset_meters: edgeDifferencesByDistance,
      },
      validation_passed: validationPassed,
    },
  };
}