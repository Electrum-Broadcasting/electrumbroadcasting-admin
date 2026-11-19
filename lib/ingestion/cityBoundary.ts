import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import booleanValid from "@turf/boolean-valid";
import kinks from "@turf/kinks";
import lineIntersect from "@turf/line-intersect";
import type { LineString, MultiPolygon, Polygon, Position } from "geojson";

type Boundary = Polygon | MultiPolygon;
type Ring = Position[];

function isPosition(value: unknown): value is Position {
  return Array.isArray(value) && value.length === 2
    && typeof value[0] === "number" && Number.isFinite(value[0])
    && typeof value[1] === "number" && Number.isFinite(value[1])
    && value[0] >= -180 && value[0] <= 180 && value[1] >= -90 && value[1] <= 90;
}

function isRing(value: unknown): value is Ring {
  if (!Array.isArray(value) || value.length < 4 || !value.every(isPosition)) return false;
  const first = value[0];
  const last = value[value.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) return false;
  let twiceArea = 0;
  for (let i = 0; i < value.length - 1; i++) {
    const [x, y] = value[i];
    const [nextX, nextY] = value[i + 1];
    if ((x === nextX && y === nextY) || Math.abs(nextX - x) >= 180) return false;
    twiceArea += x * nextY - nextX * y;
  }
  return Math.abs(twiceArea) > 1e-12;
}

function isPolygonCoordinates(value: unknown): value is Ring[] {
  return Array.isArray(value) && value.length > 0 && value.every(isRing);
}

function pointOnRing(point: Position, ring: Ring): boolean {
  const [x, y] = point;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
    if (Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)) <= 1e-9) return true;
  }
  return false;
}

function ringsIntersect(left: Ring, right: Ring): boolean {
  const leftLine: LineString = { type: "LineString", coordinates: left };
  const rightLine: LineString = { type: "LineString", coordinates: right };
  return lineIntersect(leftLine, rightLine).features.length > 0
    || left.some((point) => pointOnRing(point, right))
    || right.some((point) => pointOnRing(point, left));
}

export function parseCityBoundary(input: unknown): Boundary {
  if (!input || typeof input !== "object" || !("type" in input) || !("coordinates" in input)) {
    throw new Error("Boundary must be a GeoJSON Polygon or MultiPolygon");
  }
  let boundary: Boundary;
  if (input.type === "Polygon" && isPolygonCoordinates(input.coordinates)) {
    boundary = { type: "Polygon", coordinates: input.coordinates };
  } else if (input.type === "MultiPolygon" && Array.isArray(input.coordinates)
      && input.coordinates.length > 0 && input.coordinates.every(isPolygonCoordinates)) {
    boundary = { type: "MultiPolygon", coordinates: input.coordinates };
  } else {
    throw new Error("Boundary contains invalid coordinates or geometry");
  }

  const polygons = boundary.type === "Polygon" ? [boundary.coordinates] : boundary.coordinates;
  const rings = polygons.flat();
  if (rings.reduce((count, ring) => count + ring.length, 0) > 5000) {
    throw new Error("Boundary exceeds the 5000-coordinate validation limit");
  }
  if (!booleanValid(boundary) || kinks(boundary).features.length > 0) {
    throw new Error("Boundary geometry is invalid or self-intersecting");
  }
  for (const polygon of polygons) {
    const outer: Polygon = { type: "Polygon", coordinates: [polygon[0]] };
    for (let i = 1; i < polygon.length; i++) {
      if (ringsIntersect(polygon[i], polygon[0])
          || !booleanPointInPolygon(polygon[i][0], outer, { ignoreBoundary: true })) {
        throw new Error("Boundary hole is outside its polygon");
      }
      for (let j = 1; j < i; j++) {
        const previous: Polygon = { type: "Polygon", coordinates: [polygon[j]] };
        const current: Polygon = { type: "Polygon", coordinates: [polygon[i]] };
        if (ringsIntersect(polygon[i], polygon[j])
            || booleanPointInPolygon(polygon[i][0], previous)
            || booleanPointInPolygon(polygon[j][0], current)) {
          throw new Error("Boundary holes overlap");
        }
      }
    }
  }
  for (let i = 0; i < polygons.length; i++) {
    for (let j = 0; j < i; j++) {
      const current: Polygon = { type: "Polygon", coordinates: polygons[i] };
      const previous: Polygon = { type: "Polygon", coordinates: polygons[j] };
      if (polygons[i].some((left) => polygons[j].some((right) => ringsIntersect(left, right)))
          || booleanPointInPolygon(polygons[i][0][0], previous)
          || booleanPointInPolygon(polygons[j][0][0], current)) {
        throw new Error("Boundary polygons overlap");
      }
    }
  }
  return boundary;
}

export function classifyCityPoint(boundary: Boundary, longitude: number, latitude: number):
  "inside" | "outside" | "boundary" | "invalid" {
  const point = [longitude, latitude];
  if (!isPosition(point)) return "invalid";
  const polygons = boundary.type === "Polygon" ? [boundary.coordinates] : boundary.coordinates;
  if (polygons.some((polygon) => polygon.some((ring) => pointOnRing(point, ring)))) return "boundary";
  return booleanPointInPolygon(point, boundary) ? "inside" : "outside";
}

export function cityBoundaryExtent(boundary: Boundary) {
  const polygons = boundary.type === "Polygon" ? [boundary.coordinates] : boundary.coordinates;
  const box = { south: 90, west: 180, north: -90, east: -180 };
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const [longitude, latitude] of ring) {
        box.south = Math.min(box.south, latitude);
        box.north = Math.max(box.north, latitude);
        box.west = Math.min(box.west, longitude);
        box.east = Math.max(box.east, longitude);
      }
    }
  }
  return box;
}
