/**
 * MapParnikDrawer - Geographic helper functions (de-minified)
 * Extracted for readability and testability
 */

import { latLng, LatLngBounds } from "leaflet";
import type { MapZone, MapMarker } from "@/types";

/**
 * Calculate distance between two lat/lng points in kilometers
 */
export function calculateDistance(
  p1: [number, number],
  p2: [number, number],
): number {
  return latLng(p1[0], p1[1]).distanceTo(latLng(p2[0], p2[1])) / 1000;
}

/**
 * Calculate total distance of a path
 */
export function calculateTotalDistance(path: [number, number][]): number {
  if (path.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += calculateDistance(path[i], path[i + 1]);
  }
  return total;
}

/**
 * Calculate polygon area in km² (approximate)
 */
export function calculatePolygonArea(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += coords[i][1] * coords[j][0];
    area -= coords[j][1] * coords[i][0];
  }
  return (Math.abs(area) * 111.32 * 111.32) / 2;
}

/**
 * Get bounds for a zone (handles circles and polygons)
 */
export function getZoneBounds(zone: MapZone): LatLngBounds | null {
  if (zone.paths.length === 0) return null;

  if (zone.type === "circle" && zone.radius && zone.paths[0]) {
    const c = zone.paths[0];
    const dLat = zone.radius / 111320;
    const dLng = zone.radius / (111320 * Math.cos((c.lat * Math.PI) / 180));
    return new LatLngBounds(
      [c.lat - dLat, c.lng - dLng],
      [c.lat + dLat, c.lng + dLng],
    );
  }

  return new LatLngBounds(
    zone.paths.map((p) => [p.lat, p.lng] as [number, number]),
  );
}

/**
 * Get bounds for a set of markers
 */
export function getMarkerBounds(markers: MapMarker[]): LatLngBounds | null {
  if (markers.length === 0) return null;
  return new LatLngBounds(
    markers.map((m) => [m.lat, m.lng] as [number, number]),
  );
}
