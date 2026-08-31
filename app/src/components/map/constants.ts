/**
 * MapParnikDrawer - Constants (de-minified)
 */

export const MAX_HISTORY = 50;
export const DEFAULT_FILL_OPACITY = 0.3;
export const DEFAULT_STROKE_WIDTH = 2;

export const COLORS = [
  { color: "#DC143C", name: "Red" },
  { color: "#FFD700", name: "Yellow" },
  { color: "#4169E1", name: "Blue" },
  { color: "#32CD32", name: "Green" },
  { color: "#FF8C00", name: "Orange" },
  { color: "#9370DB", name: "Purple" },
  { color: "#00CED1", name: "Cyan" },
  { color: "#FF1493", name: "Pink" },
  { color: "#8B4513", name: "Brown" },
  { color: "#2F4F4F", name: "Slate" },
] as const;

export type MapStyle = "standard" | "satellite" | "terrain" | "dark";

export const mapStyles: Record<MapStyle, { url: string; name: string }> = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    name: "Standard",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    name: "Satellite",
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    name: "Terrain",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    name: "Dark",
  },
};
