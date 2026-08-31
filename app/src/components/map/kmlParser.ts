/**
 * MapParnikDrawer - KML to GeoJSON parser (de-minified)
 * Lightweight inline conversion for KML Placemarks
 */

/**
 * Parse KML text to GeoJSON FeatureCollection
 * Supports Point, LineString, Polygon
 */
export function parseKMLToGeoJSON(kmlText: string): any {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kmlText, "text/xml");
  const features: any[] = [];

  const parseCoords = (coordText: string): number[][] => {
    return coordText
      .trim()
      .split(/\s+/)
      .map((coord) => {
        const [lng, lat] = coord.split(",").map(Number);
        return [lng, lat];
      });
  };

  // Parse all Placemarks
  const placemarks = doc.querySelectorAll("Placemark");

  placemarks.forEach((pm) => {
    const name = pm.querySelector("name")?.textContent || "Unnamed";
    const description = pm.querySelector("description")?.textContent || "";
    let geometry: any = null;

    const point = pm.querySelector("Point > coordinates");
    const lineString = pm.querySelector("LineString > coordinates");
    const polygon = pm.querySelector(
      "Polygon > outerBoundaryIs > LinearRing > coordinates",
    );

    if (point) {
      const coords = parseCoords(point.textContent || "");
      if (coords.length > 0) {
        geometry = { type: "Point", coordinates: coords[0] };
      }
    } else if (lineString) {
      const coords = parseCoords(lineString.textContent || "");
      if (coords.length > 0) {
        geometry = { type: "LineString", coordinates: coords };
      }
    } else if (polygon) {
      const coords = parseCoords(polygon.textContent || "");
      if (coords.length > 0) {
        // Close the polygon if not already closed
        geometry = {
          type: "Polygon",
          coordinates: [coords.concat([coords[0]])],
        };
      }
    }

    if (geometry) {
      features.push({
        type: "Feature",
        properties: { name, description },
        geometry,
      });
    }
  });

  return { type: "FeatureCollection", features };
}
