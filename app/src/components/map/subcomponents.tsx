/**
 * MapParnikDrawer - Sub-components (de-minified)
 * Each small component extracted for readability
 */

import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { LatLngBounds, latLng } from "leaflet";
import type { DrawingTool } from "./types";

/**
 * Programmatic map controller - sets view when center/zoom changes
 */
export function MapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

/**
 * Track mouse coordinates and zoom level
 */
export function MapInfoTracker({
  onCoordsChange,
  onZoomChange,
}: {
  onCoordsChange: (coords: [number, number] | null) => void;
  onZoomChange: (zoom: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    mousemove(e) {
      onCoordsChange([e.latlng.lat, e.latlng.lng]);
    },
    mouseout() {
      onCoordsChange(null);
    },
    zoom() {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

/**
 * Drawing interaction handler - handles clicks for drawing tools
 */
export function DrawingHandler({
  tool,
  isDrawing,
  currentPath,
  setCurrentPath,
  onFinishDrawing,
  onAddMarker,
  circleCenter,
  setCircleCenter,
  setCircleRadius,
  rectangleStart,
  setRectangleStart,
  onAddDistancePoint,
  snapToGrid,
  gridSize,
}: {
  tool: DrawingTool;
  isDrawing: boolean;
  currentPath: [number, number][];
  setCurrentPath: (path: [number, number][]) => void;
  onFinishDrawing: () => void;
  onAddMarker: (lat: number, lng: number) => void;
  circleCenter: [number, number] | null;
  setCircleCenter: (c: [number, number] | null) => void;
  setCircleRadius: (r: number) => void;
  rectangleStart: [number, number] | null;
  setRectangleStart: (s: [number, number] | null) => void;
  onAddDistancePoint?: (lat: number, lng: number) => void;
  snapToGrid: boolean;
  gridSize: number;
}) {
  const snap = (value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  useMapEvents({
    click(e) {
      let { lat, lng } = e.latlng;
      lat = snap(lat);
      lng = snap(lng);

      if (!isDrawing) return;

      if (tool === "polygon" || tool === "polyline" || tool === "distance") {
        setCurrentPath([...currentPath, [lat, lng]]);
        if (tool === "distance") {
          onAddDistancePoint?.(lat, lng);
        }
      } else if (tool === "circle") {
        if (!circleCenter) {
          setCircleCenter([lat, lng]);
        } else {
          // Second click sets radius
          const r = latLng(circleCenter[0], circleCenter[1]).distanceTo(
            latLng(lat, lng),
          );
          setCircleRadius(r);
          onFinishDrawing();
        }
      } else if (tool === "rectangle") {
        if (!rectangleStart) {
          setRectangleStart([lat, lng]);
        } else {
          onFinishDrawing();
        }
      } else if (tool === "marker") {
        onAddMarker(lat, lng);
      }
    },

    mousemove(e) {
      if (tool === "circle" && circleCenter && isDrawing) {
        const r = latLng(circleCenter[0], circleCenter[1]).distanceTo(e.latlng);
        setCircleRadius(r);
      }
    },

    dblclick() {
      if (
        (tool === "polygon" || tool === "polyline" || tool === "distance") &&
        isDrawing &&
        currentPath.length >= 2
      ) {
        onFinishDrawing();
      }
    },
  });

  return null;
}

/**
 * Map click handler for edit-mode point insertion
 */
export function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Fly-to helper - animates map to bounds
 */
export function FlyToBounds({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [bounds, map]);

  return null;
}
