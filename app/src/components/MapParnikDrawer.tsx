/**
 * MapParnikDrawer - De-minified and Refactored for Readability
 *
 * Original: 1,560 lines, single file containing all logic
 * Refactored:
 *  - ./map/constants.ts      - COLORS, mapStyles, MAX_HISTORY
 *  - ./map/types.ts          - Layer, HistoryEntry, DrawingTool, etc.
 *  - ./map/geoHelpers.ts     - calculateDistance, calculatePolygonArea, bounds
 *  - ./map/icons.ts          - Leaflet icons (edit, marker, distance, selected)
 *  - ./map/kmlParser.ts      - KML -> GeoJSON conversion
 *  - ./map/subcomponents.tsx - MapController, MapInfoTracker, DrawingHandler, etc.
 *  - ./map/MapParnikDrawer.original.tsx - Original backup
 *  - This file: Main component, now with clear sections and JSDoc
 *
 * Features:
 *  - Polygon, Circle, Rectangle, Polyline, Distance, Marker tools
 *  - Layer management (visibility, lock, reorder, duplicate, zoom)
 *  - Undo/Redo with history (50 steps)
 *  - Import/Export JSON + GeoJSON + KML
 *  - Snap-to-grid, fill opacity, stroke width
 *  - Search via Nominatim
 *  - Fullscreen mode
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  Circle,
  Rectangle,
  Polyline,
  Tooltip,
} from "react-leaflet";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  X,
  Map as MapIcon,
  Undo,
  Redo,
  Trash2,
  Edit2,
  Palette,
  Check,
  Search,
  Download,
  Upload,
  Plus,
  Minus,
  Crosshair,
  Square,
  Circle as CircleIcon,
  Hexagon,
  Type,
  Ruler,
  Layers,
  FileJson,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  Navigation,
  LocateFixed,
  Magnet,
  AlertTriangle,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Target,
} from "lucide-react";
import type { MapData, MapZone, MapMarker } from "@/types";
import "leaflet/dist/leaflet.css";
import { Icon, LatLngBounds } from "leaflet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// --- Refactored imports (de-minified modules) ---
import {
  COLORS,
  mapStyles,
  MAX_HISTORY,
  DEFAULT_FILL_OPACITY,
  DEFAULT_STROKE_WIDTH,
} from "./map/constants";
import type {
  DrawingTool,
  MapStyle,
  Layer,
  HistoryEntry,
  ImportPreview,
} from "./map/types";
import {
  calculateDistance,
  calculateTotalDistance,
  calculatePolygonArea,
  getZoneBounds,
  getMarkerBounds,
} from "./map/geoHelpers";
import {
  editIcon,
  markerIcon,
  distanceIcon,
  selectedPointIcon,
} from "./map/icons";
import { parseKMLToGeoJSON } from "./map/kmlParser";
import {
  MapController,
  MapInfoTracker,
  DrawingHandler,
  MapClickHandler,
  FlyToBounds,
} from "./map/subcomponents";

// ------------------------------------------------------------------
// Props
// ------------------------------------------------------------------

interface MapParnikDrawerProps {
  onSave: (mapData: MapData) => void;
  onCancel: () => void;
  initialData?: MapData;
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------

export function MapParnikDrawer({
  onSave,
  onCancel,
  initialData,
}: MapParnikDrawerProps) {
  const { t } = useLanguage();

  // ----- Layer state -----
  const [layers, setLayers] = useState<Layer[]>(() => {
    if (initialData) {
      return [
        {
          id: "layer_1",
          name: "Layer 1",
          zones: initialData.zones || [],
          markers: initialData.markers || [],
          visible: true,
          locked: false,
          color: "#DC143C",
        },
      ];
    }
    return [
      {
        id: "layer_1",
        name: "Layer 1",
        zones: [],
        markers: [],
        visible: true,
        locked: false,
        color: "#DC143C",
      },
    ];
  });

  const [activeLayerId, setActiveLayerId] = useState("layer_1");
  const activeLayer = useMemo(
    () => layers.find((l) => l.id === activeLayerId) || layers[0],
    [layers, activeLayerId],
  );

  // ----- Derived memoized state -----
  const zones = useMemo(() => activeLayer?.zones || [], [activeLayer]);
  const markers = useMemo(() => activeLayer?.markers || [], [activeLayer]);
  const allVisibleZones = useMemo(
    () => layers.filter((l) => l.visible).flatMap((l) => l.zones),
    [layers],
  );
  const allVisibleMarkers = useMemo(
    () => layers.filter((l) => l.visible).flatMap((l) => l.markers),
    [layers],
  );

  // ----- Drawing state -----
  const [currentPath, setCurrentPath] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<DrawingTool>("polygon");
  const [zoneName, setZoneName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#DC143C");

  // ----- Map state -----
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialData ? [initialData.center.lat, initialData.center.lng] : [20, 0],
  );
  const [mapZoom, setMapZoom] = useState(initialData?.zoom || 2);
  const [mapStyle, setMapStyle] = useState<MapStyle>("standard");
  const [cursorCoords, setCursorCoords] = useState<[number, number] | null>(
    null,
  );
  const [flyBounds, setFlyBounds] = useState<LatLngBounds | null>(null);

  // ----- Tool-specific state -----
  const [circleCenter, setCircleCenter] = useState<[number, number] | null>(
    null,
  );
  const [circleRadius, setCircleRadius] = useState(0);
  const [rectangleStart, setRectangleStart] = useState<[number, number] | null>(
    null,
  );

  // ----- Edit state -----
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [showZoneEditor, setShowZoneEditor] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null,
  );
  const editingZone = useMemo(
    () => (editingZoneId ? zones.find((z) => z.id === editingZoneId) : null),
    [editingZoneId, zones],
  );

  // ----- UI state -----
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayerSidebar, setShowLayerSidebar] = useState(false);

  // ----- Import / Export state -----
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(
    null,
  );
  const [showGeoJSONDialog, setShowGeoJSONDialog] = useState(false);
  const [geoJSONData, setGeoJSONData] = useState("");
  const [geoJSONFile, setGeoJSONFile] = useState<File | null>(null);
  const [geoJSONPreview, setGeoJSONPreview] = useState<ImportPreview | null>(
    null,
  );

  // ----- Layer dialog -----
  const [showLayerDialog, setShowLayerDialog] = useState(false);
  const [newLayerName, setNewLayerName] = useState("");

  // ----- Measurement -----
  const [distancePoints, setDistancePoints] = useState<[number, number][]>([]);
  const [measuredDistance, setMeasuredDistance] = useState(0);

  // ----- Style options -----
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(0.01);
  const [fillOpacity, setFillOpacity] = useState(DEFAULT_FILL_OPACITY);
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);

  // ----- History (undo/redo) -----
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const [historyIndexUI, setHistoryIndexUI] = useState(-1);

  const pushHistory = useCallback(
    (currentLayers?: Layer[], currentActiveId?: string) => {
      const ls = currentLayers || layers;
      const al = currentActiveId || activeLayerId;
      const entry: HistoryEntry = {
        layers: JSON.parse(JSON.stringify(ls)),
        activeLayerId: al,
      };
      const hi = historyIndexRef.current;
      const newHistory = historyRef.current.slice(0, hi + 1);
      newHistory.push(entry);
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
      setHistoryIndexUI(historyIndexRef.current);
    },
    [layers, activeLayerId],
  );

  const canUndo = historyIndexUI > 0;
  const canRedo =
    historyIndexUI < historyRef.current.length - 1 &&
    historyRef.current.length > 0;

  const undo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx > 0) {
      const newIndex = idx - 1;
      const entry = historyRef.current[newIndex];
      setLayers(JSON.parse(JSON.stringify(entry.layers)));
      setActiveLayerId(entry.activeLayerId);
      historyIndexRef.current = newIndex;
      setHistoryIndexUI(newIndex);
    }
  }, []);

  const redo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx < historyRef.current.length - 1) {
      const newIndex = idx + 1;
      const entry = historyRef.current[newIndex];
      setLayers(JSON.parse(JSON.stringify(entry.layers)));
      setActiveLayerId(entry.activeLayerId);
      historyIndexRef.current = newIndex;
      setHistoryIndexUI(newIndex);
    }
  }, []);

  useEffect(() => {
    if (historyRef.current.length === 0) {
      pushHistory(layers, activeLayerId);
    }
  }, []); // eslint-disable-line

  // ------------------------------------------------------------------
  // Drawing lifecycle
  // ------------------------------------------------------------------

  const startDrawing = useCallback((selectedTool: DrawingTool) => {
    setTool(selectedTool);
    setIsDrawing(true);
    setCurrentPath([]);
    setCircleCenter(null);
    setCircleRadius(0);
    setRectangleStart(null);
    setEditingZoneId(null);
    setShowZoneEditor(false);
    setDistancePoints([]);
    setMeasuredDistance(0);
    setSelectedPointIndex(null);
  }, []);

  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setCurrentPath([]);
    setCircleCenter(null);
    setCircleRadius(0);
    setRectangleStart(null);
    setDistancePoints([]);
    setMeasuredDistance(0);
  }, []);

  const finishDrawing = useCallback(() => {
    pushHistory();
    const ts = Date.now();

    if (tool === "polygon" && currentPath.length >= 3) {
      const newZone: MapZone = {
        id: `zone_${ts}`,
        name: zoneName.trim() || `Zone ${zones.length + 1}`,
        paths: currentPath.map(([lat, lng]) => ({ lat, lng })),
        color: selectedColor,
        type: "polygon",
        fillOpacity,
        strokeWidth,
      };
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId ? { ...l, zones: [...l.zones, newZone] } : l,
        ),
      );
      setCurrentPath([]);
      setZoneName("");
    } else if (tool === "polyline" && currentPath.length >= 2) {
      const newZone: MapZone = {
        id: `zone_${ts}`,
        name: zoneName.trim() || `Line ${zones.length + 1}`,
        paths: currentPath.map(([lat, lng]) => ({ lat, lng })),
        color: selectedColor,
        type: "polygon",
        fillOpacity: 0,
        strokeWidth,
      };
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId ? { ...l, zones: [...l.zones, newZone] } : l,
        ),
      );
      setCurrentPath([]);
      setZoneName("");
    } else if (tool === "distance" && currentPath.length >= 2) {
      setMeasuredDistance(calculateTotalDistance(currentPath));
    } else if (tool === "circle" && circleCenter && circleRadius > 0) {
      const newZone: MapZone = {
        id: `zone_${ts}`,
        name: zoneName.trim() || `Circle ${zones.length + 1}`,
        paths: [{ lat: circleCenter[0], lng: circleCenter[1] }],
        color: selectedColor,
        type: "circle",
        radius: circleRadius,
        fillOpacity,
        strokeWidth,
      };
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId ? { ...l, zones: [...l.zones, newZone] } : l,
        ),
      );
      setCircleCenter(null);
      setCircleRadius(0);
      setZoneName("");
    } else if (
      tool === "rectangle" &&
      rectangleStart &&
      currentPath.length >= 1
    ) {
      const endPoint = currentPath[currentPath.length - 1];
      const newZone: MapZone = {
        id: `zone_${ts}`,
        name: zoneName.trim() || `Rectangle ${zones.length + 1}`,
        paths: [
          { lat: rectangleStart[0], lng: rectangleStart[1] },
          { lat: endPoint[0], lng: rectangleStart[1] },
          { lat: endPoint[0], lng: endPoint[1] },
          { lat: rectangleStart[0], lng: endPoint[1] },
        ],
        color: selectedColor,
        type: "rectangle",
        fillOpacity,
        strokeWidth,
      };
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId ? { ...l, zones: [...l.zones, newZone] } : l,
        ),
      );
      setRectangleStart(null);
      setCurrentPath([]);
      setZoneName("");
    }

    setIsDrawing(false);
  }, [
    tool,
    currentPath,
    circleCenter,
    circleRadius,
    rectangleStart,
    zoneName,
    zones.length,
    selectedColor,
    fillOpacity,
    strokeWidth,
    pushHistory,
    activeLayerId,
  ]);

  // ------------------------------------------------------------------
  // Marker management
  // ------------------------------------------------------------------

  const addMarker = useCallback(
    (lat: number, lng: number) => {
      pushHistory();
      const newMarker: MapMarker = {
        id: `marker_${Date.now()}`,
        lat,
        lng,
        label: zoneName.trim() || `Marker ${markers.length + 1}`,
      };
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? { ...l, markers: [...l.markers, newMarker] }
            : l,
        ),
      );
      setZoneName("");
      setIsDrawing(false);
    },
    [pushHistory, markers.length, zoneName, activeLayerId],
  );

  const addDistancePoint = useCallback((lat: number, lng: number) => {
    setDistancePoints((prev) => {
      const newPoints = [...prev, [lat, lng] as [number, number]];
      if (newPoints.length >= 2)
        setMeasuredDistance(calculateTotalDistance(newPoints));
      return newPoints;
    });
  }, []);

  const removeZone = useCallback(
    (zoneId: string) => {
      pushHistory();
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? { ...l, zones: l.zones.filter((z) => z.id !== zoneId) }
            : l,
        ),
      );
      if (editingZoneId === zoneId) {
        setEditingZoneId(null);
        setShowZoneEditor(false);
        setSelectedPointIndex(null);
      }
    },
    [pushHistory, activeLayerId, editingZoneId],
  );

  const removeMarker = useCallback(
    (markerId: string) => {
      pushHistory();
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? { ...l, markers: l.markers.filter((m) => m.id !== markerId) }
            : l,
        ),
      );
    },
    [pushHistory, activeLayerId],
  );

  const removeLastPoint = useCallback(() => {
    if (tool === "polygon" || tool === "polyline" || tool === "distance") {
      setCurrentPath((prev) => {
        const newPath = prev.slice(0, -1);
        if (tool === "distance") {
          setDistancePoints(newPath);
          setMeasuredDistance(
            newPath.length >= 2 ? calculateTotalDistance(newPath) : 0,
          );
        }
        return newPath;
      });
    }
  }, [tool]);

  const deleteSelectedPoint = useCallback(() => {
    if (
      editingZone &&
      selectedPointIndex !== null &&
      editingZone.paths.length > 3
    ) {
      pushHistory();
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? {
                ...l,
                zones: l.zones.map((z) =>
                  z.id === editingZone.id
                    ? {
                        ...z,
                        paths: z.paths.filter(
                          (_, i) => i !== selectedPointIndex,
                        ),
                      }
                    : z,
                ),
              }
            : l,
        ),
      );
      setSelectedPointIndex(null);
    }
  }, [editingZone, selectedPointIndex, pushHistory, activeLayerId]);

  const insertPointAfter = useCallback(
    (lat: number, lng: number) => {
      if (editingZone && selectedPointIndex !== null) {
        pushHistory();
        const newPaths = [...editingZone.paths];
        newPaths.splice(selectedPointIndex + 1, 0, { lat, lng });
        setLayers((prev) =>
          prev.map((l) =>
            l.id === activeLayerId
              ? {
                  ...l,
                  zones: l.zones.map((z) =>
                    z.id === editingZone.id ? { ...z, paths: newPaths } : z,
                  ),
                }
              : l,
          ),
        );
      }
    },
    [editingZone, selectedPointIndex, pushHistory, activeLayerId],
  );

  const clearAll = useCallback(() => {
    pushHistory();
    setLayers((prev) =>
      prev.map((l) =>
        l.id === activeLayerId ? { ...l, zones: [], markers: [] } : l,
      ),
    );
    setCurrentPath([]);
    setIsDrawing(false);
    setEditingZoneId(null);
    setShowZoneEditor(false);
    setDistancePoints([]);
    setMeasuredDistance(0);
    setSelectedPointIndex(null);
  }, [pushHistory, activeLayerId]);

  // ------------------------------------------------------------------
  // Edit zone helpers
  // ------------------------------------------------------------------

  const startEditingZone = useCallback((zoneId: string) => {
    setEditingZoneId(zoneId);
    setShowZoneEditor(true);
    setIsDrawing(false);
    setCurrentPath([]);
    setSelectedPointIndex(null);
  }, []);

  const updateZoneName = useCallback(
    (zoneId: string, newName: string) => {
      pushHistory();
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? {
                ...l,
                zones: l.zones.map((z) =>
                  z.id === zoneId ? { ...z, name: newName } : z,
                ),
              }
            : l,
        ),
      );
    },
    [pushHistory, activeLayerId],
  );

  const updateZoneColor = useCallback(
    (zoneId: string, newColor: string) => {
      pushHistory();
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? {
                ...l,
                zones: l.zones.map((z) =>
                  z.id === zoneId ? { ...z, color: newColor } : z,
                ),
              }
            : l,
        ),
      );
    },
    [pushHistory, activeLayerId],
  );

  const updateZoneOpacity = useCallback(
    (zoneId: string, newOpacity: number) => {
      pushHistory();
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? {
                ...l,
                zones: l.zones.map((z) =>
                  z.id === zoneId ? { ...z, fillOpacity: newOpacity } : z,
                ),
              }
            : l,
        ),
      );
    },
    [pushHistory, activeLayerId],
  );

  const updateZoneStrokeWidth = useCallback(
    (zoneId: string, newWidth: number) => {
      pushHistory();
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? {
                ...l,
                zones: l.zones.map((z) =>
                  z.id === zoneId ? { ...z, strokeWidth: newWidth } : z,
                ),
              }
            : l,
        ),
      );
    },
    [pushHistory, activeLayerId],
  );

  const movePoint = useCallback(
    (zoneId: string, pointIndex: number, newLat: number, newLng: number) => {
      pushHistory();
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? {
                ...l,
                zones: l.zones.map((z) =>
                  z.id === zoneId
                    ? {
                        ...z,
                        paths: z.paths.map((p, i) =>
                          i === pointIndex ? { lat: newLat, lng: newLng } : p,
                        ),
                      }
                    : z,
                ),
              }
            : l,
        ),
      );
    },
    [pushHistory, activeLayerId],
  );

  const cloneZone = useCallback(
    (zoneId: string) => {
      pushHistory();
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return;
      const newZone: MapZone = {
        ...zone,
        id: `zone_${Date.now()}`,
        name: `${zone.name} (Copy)`,
        paths: zone.paths.map((p) => ({
          ...p,
          lat: p.lat + 0.01,
          lng: p.lng + 0.01,
        })),
      };
      setLayers((prev) =>
        prev.map((l) =>
          l.id === activeLayerId ? { ...l, zones: [...l.zones, newZone] } : l,
        ),
      );
    },
    [pushHistory, zones, activeLayerId],
  );

  // ------------------------------------------------------------------
  // Search, Layer management, GeoJSON, Import/Export, Save, etc.
  // ------------------------------------------------------------------

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await response.json();
      if (data && data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setMapZoom(12);
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  }, [searchQuery]);

  const addLayer = useCallback(() => {
    pushHistory();
    const newLayer: Layer = {
      id: `layer_${Date.now()}`,
      name: newLayerName.trim() || `Layer ${layers.length + 1}`,
      zones: [],
      markers: [],
      visible: true,
      locked: false,
      color: COLORS[layers.length % COLORS.length].color,
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
    setNewLayerName("");
  }, [pushHistory, layers.length, newLayerName]);

  const deleteLayer = useCallback(
    (layerId: string) => {
      if (layers.length <= 1) return;
      pushHistory();
      const newLayers = layers.filter((l) => l.id !== layerId);
      setLayers(newLayers);
      if (activeLayerId === layerId) setActiveLayerId(newLayers[0].id);
    },
    [pushHistory, layers, activeLayerId],
  );

  const toggleLayerVisibility = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)),
    );
  }, []);

  const toggleLayerLock = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l)),
    );
  }, []);

  const duplicateLayer = useCallback(
    (layerId: string) => {
      const layer = layers.find((l) => l.id === layerId);
      if (!layer) return;
      pushHistory();
      const newLayer: Layer = {
        ...layer,
        id: `layer_${Date.now()}`,
        name: `${layer.name} (Copy)`,
        zones: layer.zones.map((z) => ({
          ...z,
          id: `zone_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        })),
        markers: layer.markers.map((m) => ({
          ...m,
          id: `marker_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        })),
      };
      setLayers((prev) => [...prev, newLayer]);
    },
    [pushHistory, layers],
  );

  const moveLayer = useCallback(
    (layerId: string, direction: "up" | "down") => {
      const idx = layers.findIndex((l) => l.id === layerId);
      if (idx < 0) return;
      if (direction === "up" && idx === 0) return;
      if (direction === "down" && idx === layers.length - 1) return;
      pushHistory();
      const newLayers = [...layers];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [newLayers[idx], newLayers[swapIdx]] = [
        newLayers[swapIdx],
        newLayers[idx],
      ];
      setLayers(newLayers);
    },
    [pushHistory, layers],
  );

  const zoomToLayer = useCallback((layer: Layer) => {
    const allBounds: LatLngBounds[] = [];
    layer.zones.forEach((z) => {
      const b = getZoneBounds(z);
      if (b) allBounds.push(b);
    });
    const mb = getMarkerBounds(layer.markers);
    if (mb) allBounds.push(mb);
    if (allBounds.length > 0) {
      const combined = allBounds[0];
      allBounds.slice(1).forEach((b) => combined.extend(b));
      setFlyBounds(combined);
    }
  }, []);

  const validateGeoJSON = useCallback((text: string): ImportPreview => {
    const errors: string[] = [];
    try {
      const parsed = JSON.parse(text);
      if (parsed.type !== "FeatureCollection")
        errors.push('Root type must be "FeatureCollection"');
      if (!Array.isArray(parsed.features))
        errors.push('"features" array is required');
      const features = parsed.features || [];
      const validFeatures = features.filter((f: any) => {
        if (!f.geometry) return false;
        return ["Polygon", "LineString", "Point", "MultiPolygon"].includes(
          f.geometry.type,
        );
      });
      const sampleNames = validFeatures
        .slice(0, 3)
        .map((f: any) => f.properties?.name || "Unnamed");
      return {
        type: "geojson",
        featureCount: validFeatures.length,
        sampleNames,
        valid: errors.length === 0 && validFeatures.length > 0,
        errors,
      };
    } catch {
      return {
        type: "geojson",
        featureCount: 0,
        sampleNames: [],
        valid: false,
        errors: ["Invalid JSON"],
      };
    }
  }, []);

  const handleExportGeoJSON = useCallback(() => {
    const features = allVisibleZones.map((zone) => {
      if (zone.type === "circle" && zone.radius) {
        const pts = 32;
        const coords: number[][] = [];
        for (let i = 0; i < pts; i++) {
          const angle = (i / pts) * 2 * Math.PI;
          const lt =
            zone.paths[0].lat + (zone.radius / 111320) * Math.cos(angle);
          const ln =
            zone.paths[0].lng +
            (zone.radius /
              (111320 * Math.cos((zone.paths[0].lat * Math.PI) / 180))) *
              Math.sin(angle);
          coords.push([ln, lt]);
        }
        coords.push(coords[0]);
        return {
          type: "Feature",
          properties: {
            name: zone.name,
            color: zone.color,
            type: "circle",
            fillOpacity: zone.fillOpacity,
            strokeWidth: zone.strokeWidth,
          },
          geometry: { type: "Polygon", coordinates: [coords] },
        };
      }
      return {
        type: "Feature",
        properties: {
          name: zone.name,
          color: zone.color,
          type: zone.type || "polygon",
          fillOpacity: zone.fillOpacity,
          strokeWidth: zone.strokeWidth,
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            zone.paths
              .map((p) => [p.lng, p.lat])
              .concat([[zone.paths[0].lng, zone.paths[0].lat]]),
          ],
        },
      };
    });

    const geoJSON = { type: "FeatureCollection", features };
    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tsinephu-map-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  }, [allVisibleZones]);

  const handleImportGeoJSON = useCallback(
    (text: string) => {
      try {
        const geoJSON = JSON.parse(text);
        if (geoJSON.type === "FeatureCollection" && geoJSON.features) {
          pushHistory();
          const importedZones: MapZone[] = geoJSON.features
            .filter(
              (f: any) =>
                f.geometry &&
                ["Polygon", "LineString", "Point", "MultiPolygon"].includes(
                  f.geometry.type,
                ),
            )
            .map((f: any, index: number) => {
              let paths: { lat: number; lng: number }[] = [];
              if (f.geometry.type === "Polygon") {
                paths = (f.geometry.coordinates?.[0] || []).map(
                  (c: number[]) => ({ lat: c[1], lng: c[0] }),
                );
              } else if (f.geometry.type === "LineString") {
                paths = (f.geometry.coordinates || []).map((c: number[]) => ({
                  lat: c[1],
                  lng: c[0],
                }));
              } else if (f.geometry.type === "Point") {
                const c = f.geometry.coordinates;
                paths = [{ lat: c[1], lng: c[0] }];
              } else if (f.geometry.type === "MultiPolygon") {
                paths = (f.geometry.coordinates?.[0]?.[0] || []).map(
                  (c: number[]) => ({ lat: c[1], lng: c[0] }),
                );
              }
              return {
                id: `zone_import_${Date.now()}_${index}`,
                name: f.properties?.name || `Imported ${index + 1}`,
                color: f.properties?.color || selectedColor,
                type:
                  (f.geometry.type === "Point"
                    ? "circle"
                    : f.properties?.type) || "polygon",
                fillOpacity: f.properties?.fillOpacity ?? DEFAULT_FILL_OPACITY,
                strokeWidth: f.properties?.strokeWidth ?? DEFAULT_STROKE_WIDTH,
                radius:
                  f.properties?.radius ||
                  (f.geometry.type === "Point" ? 1000 : undefined),
                paths,
              };
            });
          setLayers((prev) =>
            prev.map((l) =>
              l.id === activeLayerId
                ? { ...l, zones: [...l.zones, ...importedZones] }
                : l,
            ),
          );
          return true;
        }
      } catch {
        /* ignore */
      }
      return false;
    },
    [pushHistory, selectedColor, activeLayerId],
  );

  const handleImportFileChange = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setImportData(text);
      try {
        const parsed = JSON.parse(text);
        const zc = parsed.zones?.length || 0;
        const mc = parsed.markers?.length || 0;
        setImportPreview({
          type: "json",
          featureCount: zc + mc,
          sampleNames: (parsed.zones?.slice(0, 3) || []).map(
            (z: any) => z.name,
          ),
          valid: zc > 0 || mc > 0,
          errors: [],
        });
      } catch {
        setImportPreview({
          type: "json",
          featureCount: 0,
          sampleNames: [],
          valid: false,
          errors: ["Invalid JSON"],
        });
      }
    };
    reader.readAsText(file);
  }, []);

  const handleImport = useCallback(() => {
    try {
      const data = JSON.parse(importData);
      pushHistory();
      if (data.zones || data.markers) {
        setLayers((prev) =>
          prev.map((l) =>
            l.id === activeLayerId
              ? {
                  ...l,
                  zones: data.zones || l.zones,
                  markers: data.markers || l.markers,
                }
              : l,
          ),
        );
      }
      if (data.center) setMapCenter([data.center.lat, data.center.lng]);
      if (data.zoom) setMapZoom(data.zoom);
      setShowImportDialog(false);
      setImportData("");
      setImportPreview(null);
    } catch {
      alert("Invalid JSON data");
    }
  }, [importData, pushHistory, activeLayerId]);

  const handleExport = useCallback(() => {
    const data = {
      zones: allVisibleZones,
      markers: allVisibleMarkers,
      center: { lat: mapCenter[0], lng: mapCenter[1] },
      zoom: mapZoom,
      layers: layers.map((l) => ({
        name: l.name,
        zoneCount: l.zones.length,
        markerCount: l.markers.length,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tsinephu-map-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [allVisibleZones, allVisibleMarkers, mapCenter, mapZoom, layers]);

  const handleSave = useCallback(() => {
    if (allVisibleZones.length === 0 && allVisibleMarkers.length === 0) return;
    onSave({
      center: { lat: mapCenter[0], lng: mapCenter[1] },
      zoom: mapZoom,
      zones: allVisibleZones,
      markers: allVisibleMarkers,
    });
  }, [allVisibleZones, allVisibleMarkers, mapCenter, mapZoom, onSave]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        setMapZoom(15);
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const handleResetView = useCallback(() => {
    setMapCenter(
      initialData ? [initialData.center.lat, initialData.center.lng] : [20, 0],
    );
    setMapZoom(initialData?.zoom || 2);
  }, [initialData]);

  const totalArea = useMemo(
    () =>
      zones.reduce((sum, zone) => {
        if (zone.type === "circle" && zone.radius)
          return sum + (Math.PI * zone.radius * zone.radius) / 1000000;
        return (
          sum +
          calculatePolygonArea(
            zone.paths.map((p) => [p.lat, p.lng]) as [number, number][],
          )
        );
      }, 0),
    [zones],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
      if (e.key === "Escape") {
        if (isDrawing) cancelDrawing();
        else if (editingZoneId) {
          setEditingZoneId(null);
          setShowZoneEditor(false);
          setSelectedPointIndex(null);
        }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedPointIndex !== null && editingZone) deleteSelectedPoint();
        else if (editingZoneId && !isDrawing) removeZone(editingZoneId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    isDrawing,
    editingZoneId,
    selectedPointIndex,
    editingZone,
    cancelDrawing,
    deleteSelectedPoint,
    removeZone,
  ]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold flex items-center gap-2">
          <MapIcon className="h-5 w-5" />
          {initialData ? t("editMap") : t("createMap")}
          {(allVisibleZones.length > 0 || allVisibleMarkers.length > 0) && (
            <span className="text-sm font-normal text-muted-foreground">
              ({allVisibleZones.length} {t("zones")}, {allVisibleMarkers.length}{" "}
              {t("markers")})
            </span>
          )}
        </h3>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={
              allVisibleZones.length === 0 && allVisibleMarkers.length === 0
            }
            className="bg-[#DC143C] hover:bg-[#B01030]"
          >
            {initialData ? t("saveChanges") : t("addMap")}
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      {(allVisibleZones.length > 0 || allVisibleMarkers.length > 0) && (
        <div className="flex flex-wrap gap-4 p-3 bg-muted/50 rounded-lg text-sm">
          <span className="flex items-center gap-1">
            <MapIcon className="h-4 w-4 text-primary" />
            {t("zoneCount").replace("{count}", String(allVisibleZones.length))}
          </span>
          <span className="flex items-center gap-1">
            <Crosshair className="h-4 w-4 text-primary" />
            {t("markerCount").replace(
              "{count}",
              String(allVisibleMarkers.length),
            )}
          </span>
          {showMeasurements && totalArea > 0 && (
            <span className="flex items-center gap-1">
              <Ruler className="h-4 w-4 text-primary" />~{totalArea.toFixed(2)}{" "}
              km²
            </span>
          )}
          {measuredDistance > 0 && tool === "distance" && (
            <span className="flex items-center gap-1 text-blue-500">
              <Navigation className="h-4 w-4" />
              {measuredDistance.toFixed(2)} km
            </span>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <div className="flex gap-1 flex-wrap">
          <Button
            size="sm"
            variant={tool === "polygon" && isDrawing ? "default" : "outline"}
            onClick={() => startDrawing("polygon")}
            className={tool === "polygon" && isDrawing ? "bg-[#DC143C]" : ""}
            title={t("drawPolygon")}
          >
            <Hexagon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === "circle" && isDrawing ? "default" : "outline"}
            onClick={() => startDrawing("circle")}
            className={tool === "circle" && isDrawing ? "bg-[#DC143C]" : ""}
            title={t("drawCircle")}
          >
            <CircleIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === "rectangle" && isDrawing ? "default" : "outline"}
            onClick={() => startDrawing("rectangle")}
            className={tool === "rectangle" && isDrawing ? "bg-[#DC143C]" : ""}
            title={t("drawRectangle")}
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === "polyline" && isDrawing ? "default" : "outline"}
            onClick={() => startDrawing("polyline")}
            className={tool === "polyline" && isDrawing ? "bg-[#DC143C]" : ""}
            title="Draw Polyline"
          >
            <Navigation className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === "distance" && isDrawing ? "default" : "outline"}
            onClick={() => startDrawing("distance")}
            className={tool === "distance" && isDrawing ? "bg-[#DC143C]" : ""}
            title={t("measureDistance")}
          >
            <Ruler className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === "marker" && isDrawing ? "default" : "outline"}
            onClick={() => startDrawing("marker")}
            className={tool === "marker" && isDrawing ? "bg-[#DC143C]" : ""}
            title={t("addMarker")}
          >
            <Crosshair className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-8 bg-border mx-2 hidden sm:block" />

        <Input
          placeholder={t("nameOptional")}
          value={zoneName}
          onChange={(e) => setZoneName(e.target.value)}
          className="w-32"
          disabled={
            isDrawing &&
            !["polygon", "circle", "rectangle", "polyline"].includes(tool)
          }
        />

        <div className="flex gap-1 flex-wrap max-w-[200px]">
          {COLORS.map(({ color }) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              disabled={isDrawing}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                selectedColor === color
                  ? "border-black scale-110"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="flex-1" />

        <select
          value={mapStyle}
          onChange={(e) => setMapStyle(e.target.value as MapStyle)}
          className="h-9 px-2 rounded-md border bg-background text-sm"
        >
          {Object.entries(mapStyles).map(([key, { name }]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>

        <Button
          size="sm"
          variant={showLabels ? "default" : "outline"}
          onClick={() => setShowLabels(!showLabels)}
          title={t("toggleLabels")}
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={showMeasurements ? "default" : "outline"}
          onClick={() => setShowMeasurements(!showMeasurements)}
          title={t("toggleMeasurements")}
        >
          <Ruler className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowLayerSidebar(!showLayerSidebar)}
          className={
            showLayerSidebar ? "bg-primary text-primary-foreground" : ""
          }
        >
          <Layers className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? t("exitFullscreen") : t("fullscreen")}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Advanced Options */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Fill</span>
          <Slider
            value={[fillOpacity * 100]}
            onValueChange={([v]) => setFillOpacity(v / 100)}
            min={0}
            max={100}
            step={5}
            className="w-24"
          />
          <span className="text-xs w-8">{(fillOpacity * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Stroke</span>
          <Slider
            value={[strokeWidth]}
            onValueChange={([v]) => setStrokeWidth(v)}
            min={1}
            max={10}
            step={1}
            className="w-24"
          />
          <span className="text-xs w-4">{strokeWidth}px</span>
        </div>
        <div className="flex items-center gap-2">
          <Magnet className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Snap</span>
          <Switch checked={snapToGrid} onCheckedChange={setSnapToGrid} />
          {snapToGrid && (
            <select
              value={gridSize}
              onChange={(e) => setGridSize(parseFloat(e.target.value))}
              className="h-7 px-1 rounded border bg-background text-xs"
            >
              <option value={0.001}>0.001 (~100m)</option>
              <option value={0.01}>0.01 (~1km)</option>
              <option value={0.1}>0.1 (~10km)</option>
            </select>
          )}
        </div>
      </div>

      {/* Drawing Controls */}
      {isDrawing && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <span className="text-sm font-medium flex items-center gap-2">
            <Edit2 className="h-4 w-4" />
            {tool === "polygon" && t("clickToAddPoints")}
            {tool === "distance" &&
              t("clickToMeasure").replace(
                "{distance}",
                measuredDistance.toFixed(2),
              )}
            {tool === "circle" &&
              (circleCenter ? t("clickToSetRadius") : t("clickToSetCenter"))}
            {tool === "rectangle" &&
              (rectangleStart
                ? t("clickToSetCorner")
                : t("clickToStartRectangle"))}
            {tool === "marker" && t("clickToPlaceMarker")}
          </span>
          <div className="flex-1" />
          {(tool === "polygon" ||
            tool === "polyline" ||
            tool === "distance") && (
            <Button
              size="sm"
              variant="outline"
              onClick={removeLastPoint}
              disabled={currentPath.length === 0}
            >
              <Undo className="h-4 w-4 mr-1" />
              Undo
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={cancelDrawing}>
            <X className="h-4 w-4 mr-1" />
            {t("cancel")}
          </Button>
          {tool !== "marker" && tool !== "distance" && (
            <Button
              size="sm"
              onClick={finishDrawing}
              disabled={
                (tool === "polygon" && currentPath.length < 3) ||
                (tool === "polyline" && currentPath.length < 2) ||
                (tool === "circle" && (!circleCenter || circleRadius === 0)) ||
                (tool === "rectangle" && !rectangleStart)
              }
              className="bg-[#DC143C] hover:bg-[#B01030]"
            >
              <Check className="h-4 w-4 mr-1" />
              {t("finish")}
            </Button>
          )}
        </div>
      )}

      {/* Zone Editor */}
      {showZoneEditor && editingZone && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              {t("editingName").replace("{name}", editingZone.name)}
            </h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => cloneZone(editingZone.id)}
              >
                <Copy className="h-3 w-3 mr-1" />
                Clone
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowZoneEditor(false);
                  setEditingZoneId(null);
                  setSelectedPointIndex(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">{t("nameLabel")}</span>
              <Input
                value={editingZone.name}
                onChange={(e) => updateZoneName(editingZone.id, e.target.value)}
                className="w-32 h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <div className="flex gap-1">
                {COLORS.map(({ color }) => (
                  <button
                    key={color}
                    onClick={() => updateZoneColor(editingZone.id, color)}
                    className={`w-5 h-5 rounded-full border-2 ${
                      editingZone.color === color
                        ? "border-black scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Opacity</span>
              <Slider
                value={[
                  (editingZone.fillOpacity || DEFAULT_FILL_OPACITY) * 100,
                ]}
                onValueChange={([v]) =>
                  updateZoneOpacity(editingZone.id, v / 100)
                }
                min={0}
                max={100}
                step={5}
                className="w-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Stroke</span>
              <Slider
                value={[editingZone.strokeWidth || DEFAULT_STROKE_WIDTH]}
                onValueChange={([v]) =>
                  updateZoneStrokeWidth(editingZone.id, v)
                }
                min={1}
                max={10}
                step={1}
                className="w-20"
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {editingZone.paths.length} points — Click to select, drag to move,
            Delete to remove
          </div>
        </div>
      )}

      {/* Search */}
      {showSearch && (
        <div className="flex gap-2">
          <Input
            placeholder={t("searchLocation")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setShowSearch(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* MAP */}
      <div
        className={`relative border rounded-xl overflow-hidden transition-all ${
          isFullscreen ? "fixed inset-0 z-[100] rounded-none" : ""
        }`}
        style={{ height: isFullscreen ? "100vh" : "500px" }}
      >
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          doubleClickZoom={!isDrawing}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <MapInfoTracker
            onCoordsChange={setCursorCoords}
            onZoomChange={setMapZoom}
          />
          {flyBounds && <FlyToBounds bounds={flyBounds} />}

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url={mapStyles[mapStyle].url}
          />

          <DrawingHandler
            tool={tool}
            isDrawing={isDrawing}
            currentPath={currentPath}
            setCurrentPath={setCurrentPath}
            onFinishDrawing={finishDrawing}
            onAddMarker={addMarker}
            circleCenter={circleCenter}
            setCircleCenter={setCircleCenter}
            setCircleRadius={setCircleRadius}
            rectangleStart={rectangleStart}
            setRectangleStart={setRectangleStart}
            onAddDistancePoint={addDistancePoint}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
          />

          {editingZone && selectedPointIndex !== null && (
            <MapClickHandler onClick={insertPointAfter} />
          )}

          {/* Zones */}
          {allVisibleZones.map((zone) => {
            const isEditing = editingZoneId === zone.id;
            const zFill = zone.fillOpacity ?? fillOpacity;
            const zStroke = zone.strokeWidth ?? strokeWidth;

            if (zone.type === "circle" && zone.radius) {
              return (
                <Circle
                  key={zone.id}
                  center={[zone.paths[0].lat, zone.paths[0].lng]}
                  radius={zone.radius}
                  pathOptions={{
                    fillColor: zone.color,
                    fillOpacity: isEditing ? zFill + 0.2 : zFill,
                    color: zone.color,
                    weight: isEditing ? zStroke + 1 : zStroke,
                  }}
                  eventHandlers={{
                    click: () => !isDrawing && startEditingZone(zone.id),
                  }}
                >
                  {showLabels && (
                    <Tooltip
                      permanent
                      direction="center"
                      className="bg-transparent border-0 shadow-none"
                    >
                      <span className="text-xs font-bold text-white bg-black/50 px-1 rounded">
                        {zone.name}
                      </span>
                    </Tooltip>
                  )}
                </Circle>
              );
            }

            if (zone.type === "rectangle") {
              return (
                <Polygon
                  key={zone.id}
                  positions={zone.paths.map((p) => [p.lat, p.lng])}
                  pathOptions={{
                    fillColor: zone.color,
                    fillOpacity: isEditing ? zFill + 0.2 : zFill,
                    color: zone.color,
                    weight: isEditing ? zStroke + 1 : zStroke,
                  }}
                  eventHandlers={{
                    click: () => !isDrawing && startEditingZone(zone.id),
                  }}
                >
                  {showLabels && (
                    <Tooltip
                      permanent
                      direction="center"
                      className="bg-transparent border-0 shadow-none"
                    >
                      <span className="text-xs font-bold text-white bg-black/50 px-1 rounded">
                        {zone.name}
                      </span>
                    </Tooltip>
                  )}
                </Polygon>
              );
            }

            if (zFill === 0) {
              return (
                <Polyline
                  key={zone.id}
                  positions={zone.paths.map((p) => [p.lat, p.lng])}
                  pathOptions={{ color: zone.color, weight: zStroke }}
                  eventHandlers={{
                    click: () => !isDrawing && startEditingZone(zone.id),
                  }}
                >
                  {showLabels && (
                    <Tooltip
                      permanent
                      direction="center"
                      className="bg-transparent border-0 shadow-none"
                    >
                      <span className="text-xs font-bold text-white bg-black/50 px-1 rounded">
                        {zone.name}
                      </span>
                    </Tooltip>
                  )}
                </Polyline>
              );
            }

            return (
              <Polygon
                key={zone.id}
                positions={zone.paths.map((p) => [p.lat, p.lng])}
                pathOptions={{
                  fillColor: zone.color,
                  fillOpacity: isEditing ? zFill + 0.2 : zFill,
                  color: zone.color,
                  weight: isEditing ? zStroke + 1 : zStroke,
                }}
                eventHandlers={{
                  click: () => !isDrawing && startEditingZone(zone.id),
                }}
              >
                {showLabels && (
                  <Tooltip
                    permanent
                    direction="center"
                    className="bg-transparent border-0 shadow-none"
                  >
                    <span className="text-xs font-bold text-white bg-black/50 px-1 rounded">
                      {zone.name}
                    </span>
                  </Tooltip>
                )}
              </Polygon>
            );
          })}

          {/* Markers */}
          {allVisibleMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={markerIcon}
            >
              <Popup>
                <div className="text-sm font-medium">{marker.label}</div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="mt-2"
                  onClick={() => removeMarker(marker.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {t("remove")}
                </Button>
              </Popup>
            </Marker>
          ))}

          {/* Editing points */}
          {editingZone?.paths.map((point, index) => (
            <Marker
              key={`${editingZone.id}-point-${index}`}
              position={[point.lat, point.lng]}
              icon={selectedPointIndex === index ? selectedPointIcon : editIcon}
              draggable
              eventHandlers={{
                click: () => setSelectedPointIndex(index),
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  movePoint(editingZone.id, index, lat, lng);
                },
              }}
            />
          ))}

          {/* Current path */}
          {currentPath.length > 0 &&
            (tool === "polygon" ||
              tool === "polyline" ||
              tool === "distance") && (
              <Polyline
                positions={currentPath}
                pathOptions={{
                  color: selectedColor,
                  weight: strokeWidth,
                  dashArray: "5, 10",
                }}
              />
            )}

          {/* Distance labels */}
          {tool === "distance" &&
            distancePoints.length >= 2 &&
            distancePoints.slice(0, -1).map((pt, i) => {
              const next = distancePoints[i + 1];
              const segDist = calculateDistance(pt, next);
              return (
                <Marker
                  key={`seg-label-${i}`}
                  position={[(pt[0] + next[0]) / 2, (pt[1] + next[1]) / 2]}
                  icon={
                    new Icon({
                      iconUrl:
                        "data:image/svg+xml;base64," +
                        btoa(
                          `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="20"><rect x="0" y="0" width="60" height="20" rx="4" fill="rgba(0,0,0,0.7)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="10">${segDist.toFixed(
                            2,
                          )} km</text></svg>`,
                        ),
                      iconSize: [60, 20],
                      iconAnchor: [30, 10],
                    })
                  }
                  interactive={false}
                />
              );
            })}

          {tool === "distance" &&
            distancePoints.map((point, index) => (
              <Marker
                key={`dist-point-${index}`}
                position={point}
                icon={distanceIcon}
              />
            ))}

          {tool === "circle" && circleCenter && (
            <Circle
              center={circleCenter}
              radius={circleRadius}
              pathOptions={{
                fillColor: selectedColor,
                fillOpacity: fillOpacity * 0.5,
                color: selectedColor,
                weight: strokeWidth,
                dashArray: "5, 10",
              }}
            />
          )}

          {tool === "rectangle" && rectangleStart && currentPath.length > 0 && (
            <Rectangle
              bounds={[rectangleStart, currentPath[currentPath.length - 1]]}
              pathOptions={{
                fillColor: selectedColor,
                fillOpacity: fillOpacity * 0.5,
                color: selectedColor,
                weight: strokeWidth,
                dashArray: "5, 10",
              }}
            />
          )}

          {isDrawing &&
            (tool === "polygon" ||
              tool === "polyline" ||
              tool === "distance") &&
            currentPath.map((point, index) => (
              <Marker
                key={`draw-point-${index}`}
                position={point}
                icon={editIcon}
              />
            ))}
        </MapContainer>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setMapZoom((z) => z + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setMapZoom((z) => z - 1)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleLocateMe}
            title="Locate me"
          >
            <LocateFixed className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleResetView}
            title="Reset view"
          >
            <Target className="h-4 w-4" />
          </Button>
          {isFullscreen && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsFullscreen(false)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="absolute bottom-4 left-4 bg-black/60 text-white px-2 py-1 rounded text-xs font-mono pointer-events-none">
          {cursorCoords
            ? `${cursorCoords[0].toFixed(4)}, ${cursorCoords[1].toFixed(4)}`
            : "--, --"}{" "}
          · Zoom {mapZoom}
        </div>

        {isDrawing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#DC143C] text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg pointer-events-none">
            <Edit2 className="h-4 w-4 inline mr-1" />
            {tool === "polygon" &&
              `${t("drawingPolygon")} - ${currentPath.length} pts`}
            {tool === "distance" &&
              `${t("measuring")} - ${measuredDistance.toFixed(2)} km`}
            {tool === "circle" &&
              (circleCenter ? t("setRadius") : t("setCenter"))}
            {tool === "rectangle" &&
              (rectangleStart ? t("setCorner") : t("startRectangle"))}
            {tool === "marker" && t("placeMarker")}
          </div>
        )}

        {editingZone && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg pointer-events-none">
            <Edit2 className="h-4 w-4 inline mr-1" />
            {t("editingName").replace("{name}", editingZone.name)}
            {selectedPointIndex !== null && (
              <span className="ml-2 text-xs opacity-80">
                (Pt {selectedPointIndex + 1})
              </span>
            )}
          </div>
        )}

        <div className="absolute bottom-4 right-4 flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-1" />
            {t("import")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowGeoJSONDialog(true)}
          >
            <FileJson className="h-4 w-4 mr-1" />
            GeoJSON
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExport}
            disabled={
              allVisibleZones.length === 0 && allVisibleMarkers.length === 0
            }
          >
            <Download className="h-4 w-4 mr-1" />
            {t("export")}
          </Button>
        </div>

        {/* Layer Sidebar */}
        {showLayerSidebar && (
          <div className="absolute top-16 left-4 bottom-16 w-64 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden flex flex-col z-[10]">
            <div className="p-3 border-b flex items-center justify-between bg-muted/50">
              <h4 className="font-medium flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Layers
              </h4>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setShowLayerSidebar(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {layers.map((layer, idx) => (
                <div
                  key={layer.id}
                  className={`group flex items-center gap-1 p-2 rounded-md border text-sm ${
                    layer.id === activeLayerId
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />
                  <button
                    onClick={() => toggleLayerVisibility(layer.id)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    {layer.visible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleLayerLock(layer.id)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    {layer.locked ? (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveLayerId(layer.id)}
                    className="flex-1 text-left truncate font-medium"
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-1 align-middle"
                      style={{ backgroundColor: layer.color }}
                    />
                    {layer.name}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {layer.zones.length + layer.markers.length}
                  </span>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => zoomToLayer(layer)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <Target className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => duplicateLayer(layer.id)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {idx > 0 && (
                      <button
                        onClick={() => moveLayer(layer.id, "up")}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                    )}
                    {idx < layers.length - 1 && (
                      <button
                        onClick={() => moveLayer(layer.id, "down")}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    )}
                    {layers.length > 1 && (
                      <button
                        onClick={() => deleteLayer(layer.id)}
                        className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setShowLayerDialog(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t("addLayer")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Zone & Marker Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <MapIcon className="h-4 w-4" />
              {t("zones")} ({zones.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${
                    editingZoneId === zone.id
                      ? "ring-2 ring-blue-500 ring-offset-2"
                      : ""
                  }`}
                  style={{
                    backgroundColor: `${zone.color}20`,
                    borderColor: zone.color,
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: zone.color }}
                  />
                  <span className="font-medium">{zone.name}</span>
                  <button
                    onClick={() => startEditingZone(zone.id)}
                    className="ml-1 hover:text-blue-500"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => cloneZone(zone.id)}
                    className="ml-1 hover:text-green-500"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeZone(zone.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {markers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Crosshair className="h-4 w-4" />
              {t("markers")} ({markers.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border bg-muted/50"
                >
                  <Crosshair className="h-3 w-3 text-primary" />
                  <span className="font-medium">{marker.label}</span>
                  <button
                    onClick={() => removeMarker(marker.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {(zones.length > 0 || markers.length > 0) && (
        <div className="flex justify-end">
          <Button size="sm" variant="destructive" onClick={clearAll}>
            <Trash2 className="h-4 w-4 mr-1" />
            {t("clearAll")}
          </Button>
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("importMapData")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Upload JSON file
              </Label>
              <Input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportFileChange(f);
                }}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or paste
                </span>
              </div>
            </div>
            <textarea
              value={importData}
              onChange={(e) => {
                setImportData(e.target.value);
                setImportPreview(null);
              }}
              placeholder={t("pasteJSONMapData")}
              className="w-full h-32 p-3 rounded-md border bg-background font-mono text-sm"
            />
            {importPreview && (
              <div
                className={`p-3 rounded-lg text-sm ${importPreview.valid ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"}`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {importPreview.valid
                    ? `${importPreview.featureCount} features found`
                    : "Validation failed"}
                </div>
                {importPreview.sampleNames.length > 0 && (
                  <div className="mt-1 text-xs opacity-80">
                    Samples: {importPreview.sampleNames.join(", ")}
                  </div>
                )}
                {importPreview.errors.map((err, i) => (
                  <div key={i} className="text-xs">
                    {err}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportData("");
                  setImportPreview(null);
                }}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleImport} disabled={!importData.trim()}>
                {t("import")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* GeoJSON Dialog */}
      <Dialog open={showGeoJSONDialog} onOpenChange={setShowGeoJSONDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              GeoJSON
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={handleExportGeoJSON}
                disabled={allVisibleZones.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                {t("exportGeoJSON")}
              </Button>
            </div>
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">
                {t("importGeoJSONTitle") || "Import GeoJSON or KML"}
              </p>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Upload GeoJSON or KML file
                </Label>
                <Input
                  type="file"
                  accept=".geojson,.json,.kml"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setGeoJSONFile(f);
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const text = ev.target?.result as string;
                      if (f.name.endsWith(".kml")) {
                        try {
                          const gj = parseKMLToGeoJSON(text);
                          const gjText = JSON.stringify(gj);
                          setGeoJSONData(gjText);
                          setGeoJSONPreview(validateGeoJSON(gjText));
                        } catch {
                          setGeoJSONPreview({
                            type: "kml",
                            featureCount: 0,
                            sampleNames: [],
                            valid: false,
                            errors: ["Failed to parse KML"],
                          });
                        }
                      } else {
                        setGeoJSONData(text);
                        setGeoJSONPreview(validateGeoJSON(text));
                      }
                    };
                    reader.readAsText(f);
                  }}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    or paste
                  </span>
                </div>
              </div>
              <textarea
                value={geoJSONData}
                onChange={(e) => {
                  setGeoJSONData(e.target.value);
                  setGeoJSONPreview(null);
                }}
                placeholder={
                  t("pasteGeoJSONData") || "Paste GeoJSON data here..."
                }
                className="w-full h-32 p-3 rounded-md border bg-background font-mono text-sm"
              />
              {geoJSONPreview && (
                <div
                  className={`p-3 rounded-lg text-sm ${geoJSONPreview.valid ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"}`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {geoJSONPreview.valid
                      ? `${geoJSONPreview.featureCount} valid features`
                      : "Validation failed"}
                  </div>
                  {geoJSONPreview.sampleNames.length > 0 && (
                    <div className="mt-1 text-xs opacity-80">
                      Samples: {geoJSONPreview.sampleNames.join(", ")}
                    </div>
                  )}
                  {geoJSONPreview.errors.map((err, i) => (
                    <div key={i} className="text-xs">
                      {err}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGeoJSONDialog(false);
                  setGeoJSONData("");
                  setGeoJSONFile(null);
                  setGeoJSONPreview(null);
                }}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={() => {
                  if (
                    geoJSONFile?.name.endsWith(".kml") &&
                    !geoJSONData.trim().startsWith("{")
                  ) {
                    try {
                      const gj = parseKMLToGeoJSON(geoJSONData);
                      if (handleImportGeoJSON(JSON.stringify(gj))) {
                        setShowGeoJSONDialog(false);
                        setGeoJSONData("");
                        setGeoJSONFile(null);
                        setGeoJSONPreview(null);
                      }
                    } catch {
                      alert("Invalid KML data");
                    }
                  } else {
                    if (handleImportGeoJSON(geoJSONData)) {
                      setShowGeoJSONDialog(false);
                      setGeoJSONData("");
                      setGeoJSONFile(null);
                      setGeoJSONPreview(null);
                    } else alert("Invalid GeoJSON data");
                  }
                }}
                disabled={!geoJSONData.trim()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {t("importGeoJSON")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Layer Management Dialog */}
      <Dialog open={showLayerDialog} onOpenChange={setShowLayerDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              {t("manageLayers")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {layers.map((layer, idx) => (
                <div
                  key={layer.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border ${layer.id === activeLayerId ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <button
                    onClick={() => toggleLayerVisibility(layer.id)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    {layer.visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleLayerLock(layer.id)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    {layer.locked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                  </button>
                  <span
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      setActiveLayerId(layer.id);
                      setShowLayerDialog(false);
                    }}
                  >
                    {layer.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {layer.zones.length} zones, {layer.markers.length} markers
                  </span>
                  <button
                    onClick={() => duplicateLayer(layer.id)}
                    className="p-1 hover:bg-muted rounded"
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {idx > 0 && (
                    <button
                      onClick={() => moveLayer(layer.id, "up")}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  )}
                  {idx < layers.length - 1 && (
                    <button
                      onClick={() => moveLayer(layer.id, "down")}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  )}
                  {layers.length > 1 && (
                    <button
                      onClick={() => deleteLayer(layer.id)}
                      className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">{t("addNewLayer")}</p>
              <div className="flex gap-2">
                <Input
                  placeholder={t("layerName")}
                  value={newLayerName}
                  onChange={(e) => setNewLayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLayer()}
                />
                <Button onClick={addLayer} disabled={!newLayerName.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t("add")}
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowLayerDialog(false)}
              >
                {t("close")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
