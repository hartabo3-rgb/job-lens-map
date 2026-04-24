import { SAUDI_BOUNDARY_GEOJSON } from "./saudiBoundary";

// Ray-casting point-in-polygon for [lng, lat] rings
function pointInRing(point: [number, number], ring: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-15) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  if (polygon.length === 0) return false;
  if (!pointInRing(point, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(point, polygon[i])) return false;
  }
  return true;
}

/**
 * Check whether a [lat, lng] coordinate falls inside Saudi Arabia.
 */
export function isInsideSaudiArabia(lat: number, lng: number): boolean {
  const point: [number, number] = [lng, lat];
  for (const feature of (SAUDI_BOUNDARY_GEOJSON as any).features as any[]) {
    const geom = feature.geometry;
    if (geom.type === "Polygon") {
      if (pointInPolygon(point, geom.coordinates)) return true;
    } else if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates) {
        if (pointInPolygon(point, poly)) return true;
      }
    }
  }
  return false;
}
