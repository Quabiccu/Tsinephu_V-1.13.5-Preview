/**
 * MapParnikDrawer - Types (de-minified)
 */

import type { MapZone, MapMarker } from "@/types";

export type DrawingTool =
  | "polygon"
  | "circle"
  | "rectangle"
  | "marker"
  | "text"
  | "polyline"
  | "distance";

export type MapStyle = "standard" | "satellite" | "terrain" | "dark";

export interface Layer {
  id: string;
  name: string;
  zones: MapZone[];
  markers: MapMarker[];
  visible: boolean;
  locked: boolean;
  color: string;
}

export interface HistoryEntry {
  layers: Layer[];
  activeLayerId: string;
}

export interface ImportPreview {
  type: "geojson" | "kml" | "json";
  featureCount: number;
  sampleNames: string[];
  valid: boolean;
  errors: string[];
}

export interface MapParnikDrawerProps {
  onSave: (mapData: import("@/types").MapData) => void;
  onCancel: () => void;
  initialData?: import("@/types").MapData;
}
