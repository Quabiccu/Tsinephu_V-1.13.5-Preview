import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParniks } from "@/context/ParnikContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  X,
  BarChart3,
  Plus,
  Minus,
  Map as MapIcon,
  Upload,
  MapPin,
  Edit2,
  Code2,
} from "lucide-react";
import { CodeEditor } from "./CodeEditor";
import type { CodeData } from "@/types";
import { MapContainer, TileLayer, Polygon, Marker } from "react-leaflet";
import { Icon } from "leaflet";
import { MapParnikDrawer } from "./MapParnikDrawer";
import type { Poll, MapData } from "@/types";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_CHARS = 500;
const MAX_POLL_OPTIONS = 4;
const MIN_POLL_OPTIONS = 2;

const markerIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0RDMTQzQyI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==",
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});
const MAX_IMAGES = 4;

export function ComposeModal({ isOpen, onClose }: ComposeModalProps) {
  const { user } = useAuth();
  const { createParnik, createCodeParnik } = useParniks();
  const { t } = useLanguage();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState(1);
  const [showMap, setShowMap] = useState(false);
  const [mapData, setMapData] = useState<MapData | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeData, setCodeData] = useState<CodeData | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit =
    (content.trim().length > 0 ||
      showPoll ||
      mapData ||
      media.length > 0 ||
      !!codeData) &&
    !isOverLimit &&
    (!showPoll || pollOptions.every((opt) => opt.trim().length > 0));

  const handleSubmit = () => {
    if (!canSubmit) return;

    // If code data is present, create a code parnik
    if (codeData) {
      createCodeParnik(codeData);
      resetForm();
      onClose();
      return;
    }

    let poll: Poll | undefined;
    if (showPoll && pollOptions.every((opt) => opt.trim())) {
      poll = {
        id: `poll_${Date.now()}`,
        options: pollOptions.map((text, i) => ({
          id: `option_${i}`,
          text: text.trim(),
          votes: [],
        })),
        expiresAt: new Date(Date.now() + pollDuration * 24 * 60 * 60 * 1000),
        totalVotes: 0,
      };
    }

    createParnik(content, media.length > 0 ? media : undefined, poll, mapData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setContent("");
    setMedia([]);
    setShowPoll(false);
    setShowMap(false);
    setMapData(undefined);
    setPollOptions(["", ""]);
    setPollDuration(1);
    setShowCodeEditor(false);
    setCodeData(undefined);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: string[] = [];
    let processed = 0;
    const totalFiles = files.length;

    const checkComplete = () => {
      if (processed >= totalFiles) {
        setMedia((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
        setIsUploading(false);
      }
    };

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        processed++;
        checkComplete();
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
        }
        processed++;
        checkComplete();
      };
      reader.onerror = () => {
        processed++;
        checkComplete();
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageUploadClick = () => {
    if (media.length >= MAX_IMAGES) return;
    fileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const addPollOption = () => {
    if (pollOptions.length < MAX_POLL_OPTIONS) {
      setPollOptions((prev) => [...prev, ""]);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > MIN_POLL_OPTIONS) {
      setPollOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    setPollOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const handleMapSave = (data: MapData) => {
    setMapData(data);
    setShowMap(false);
  };

  const removeMap = () => {
    setMapData(undefined);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#DC143C] flex items-center justify-center">
              <span className="text-yellow-400 text-lg">⚡</span>
            </div>
            {t("newParnik")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <div className="flex gap-3">
            <img
              src={user.avatar}
              alt={user.displayName}
              className="h-10 w-10 rounded-full bg-muted flex-shrink-0 object-cover"
            />
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder={t("whatsOnMind")}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none border-0 focus-visible:ring-0 text-lg p-0"
              />

              {/* Media Preview */}
              {media.length > 0 && (
                <div
                  className={`grid gap-2 mt-3 ${
                    media.length === 1 ? "grid-cols-1" : "grid-cols-2"
                  }`}
                >
                  {media.map((img, index) => (
                    <div
                      key={index}
                      className="relative rounded-xl overflow-hidden"
                    >
                      <img
                        src={img}
                        alt={`Upload ${index + 1}`}
                        className={`w-full object-cover ${
                          media.length === 1 ? "h-48" : "h-32"
                        }`}
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Map Preview */}
              {mapData && !showMap && (
                <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapIcon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{t("mapParnik")}</span>
                      <span className="text-sm text-muted-foreground">
                        ({mapData.zones.length} {t("zones")})
                      </span>
                    </div>
                    <button
                      onClick={removeMap}
                      className="p-1.5 hover:bg-destructive/10 text-destructive rounded-full transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Mini map preview */}
                  <div
                    className="relative h-32 bg-[#e8f4f8] rounded-lg overflow-hidden"
                    style={{ height: "150px" }}
                  >
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=-180%2C-60%2C180%2C75&layer=mapnik`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Map Preview"
                    />
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      {mapData.zones.slice(0, 5).map((zone) => (
                        <span
                          key={zone.id}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: zone.color }}
                        />
                      ))}
                      {mapData.zones.length > 5 && (
                        <span className="text-xs text-muted-foreground">
                          +{mapData.zones.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Poll */}
              {showPoll && (
                <div className="mt-4 p-4 bg-muted/50 rounded-xl space-y-3">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`${t("pollOption")} ${index + 1}`}
                        value={option}
                        onChange={(e) =>
                          updatePollOption(index, e.target.value)
                        }
                        className="flex-1"
                      />
                      {pollOptions.length > MIN_POLL_OPTIONS && (
                        <button
                          onClick={() => removePollOption(index)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {pollOptions.length < MAX_POLL_OPTIONS && (
                    <button
                      onClick={addPollOption}
                      className="flex items-center gap-2 text-primary hover:underline text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      {t("addPoll")}
                    </button>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      {t("pollDays")}:
                    </span>
                    <div className="flex gap-1">
                      {[1, 3, 7].map((days) => (
                        <button
                          key={days}
                          onClick={() => setPollDuration(days)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            pollDuration === days
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          {days}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Map Preview */}
              {mapData && !showMap && (
                <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapIcon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{t("mapParnik")}</span>
                      <span className="text-sm text-muted-foreground">
                        ({mapData.zones.length} {t("zones")})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowMap(true)}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        {t("editMap")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMapData(undefined)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="h-40 rounded-lg overflow-hidden border border-border">
                    <MapContainer
                      center={[mapData.center.lat, mapData.center.lng]}
                      zoom={mapData.zoom}
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom={false}
                      dragging={false}
                      doubleClickZoom={false}
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {mapData.zones.map((zone) => (
                        <Polygon
                          key={zone.id}
                          positions={zone.paths.map((p) => [p.lat, p.lng])}
                          pathOptions={{
                            fillColor: zone.color,
                            fillOpacity: 0.3,
                            color: zone.color,
                            weight: 2,
                          }}
                        />
                      ))}
                      {mapData.markers?.map((marker) => (
                        <Marker
                          key={marker.id}
                          position={[marker.lat, marker.lng]}
                          icon={markerIcon}
                        />
                      ))}
                    </MapContainer>
                  </div>
                </div>
              )}

              {/* Code Preview */}
              {codeData && !showCodeEditor && (
                <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-primary" />
                      <span className="font-medium">{codeData.title}</span>
                      <span className="text-xs px-2 py-0.5 bg-primary/10 rounded-full text-primary">
                        {codeData.totalLines} lines
                      </span>
                    </div>
                    <button
                      onClick={() => setCodeData(undefined)}
                      className="p-1.5 hover:bg-destructive/10 text-destructive rounded-full transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Map Editor - Full Screen Dialog */}
              <Dialog open={showMap} onOpenChange={setShowMap}>
                <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
                  <DialogHeader className="p-4 pb-0 flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                      <MapIcon className="h-5 w-5" />
                      {t("mapParnik")}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-auto p-4">
                    <MapParnikDrawer
                      onSave={handleMapSave}
                      onCancel={() => setShowMap(false)}
                      initialData={mapData || undefined}
                    />
                  </div>
                </DialogContent>
              </Dialog>

              {/* Code Editor Dialog */}
              {showCodeEditor && (
                <CodeEditor
                  onSave={(data) => {
                    setCodeData(data);
                    setShowCodeEditor(false);
                  }}
                  onCancel={() => setShowCodeEditor(false)}
                />
              )}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
            multiple
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Divider */}
          <div className="border-t border-border my-4" />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={handleImageUploadClick}
                disabled={media.length >= MAX_IMAGES || isUploading}
                className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={`${t("addImageTitle")} (${media.length}/${MAX_IMAGES})`}
              >
                {isUploading ? (
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={() => setShowPoll(!showPoll)}
                className={`p-2 rounded-full transition-colors ${
                  showPoll
                    ? "text-primary bg-primary/10"
                    : "text-primary hover:bg-primary/10"
                }`}
                title={t("addPollTitle")}
              >
                <BarChart3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowMap(!showMap)}
                disabled={!!mapData || !!codeData}
                className={`p-2 rounded-full transition-colors ${
                  showMap || mapData
                    ? "text-primary bg-primary/10"
                    : "text-primary hover:bg-primary/10"
                } ${mapData ? "opacity-50 cursor-not-allowed" : ""}`}
                title={t("addMapTitle")}
              >
                <MapPin className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowCodeEditor(true)}
                disabled={!!mapData || !!codeData}
                className={`p-2 rounded-full transition-colors ${
                  showCodeEditor || codeData
                    ? "text-primary bg-primary/10"
                    : "text-primary hover:bg-primary/10"
                } ${codeData ? "opacity-50 cursor-not-allowed" : ""}`}
                title="Add Code"
              >
                <Code2 className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`text-sm ${
                  isOverLimit ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {charCount}/{MAX_CHARS} {t("characters")}
              </span>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="rounded-full px-6 bg-[#DC143C] hover:bg-[#B01030]"
              >
                {t("post")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
