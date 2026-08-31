import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParniks } from "@/context/ParnikContext";
import { useUsers } from "@/context/UsersContext";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeInput } from "@/context/AuthContext";
import type { Parnik, User, CodeData } from "@/types";
import { CodePreview } from "./CodePreview";
import { CodeEditor } from "./CodeEditor";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  MoreHorizontal,
  Trash2,
  BarChart3,
  Map as MapIcon,
  Edit2,
  Globe,
  Flag,
  Ban,
  Check,
  X,
  GitFork,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Circle,
  Marker,
  Popup,
} from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "@/lib/utils";
import { MapParnikDrawer } from "./MapParnikDrawer";

interface ParnikCardProps {
  parnik: Parnik;
  author?: User;
  onReply?: () => void;
  onViewProfile?: (userId: string) => void;
}

export function ParnikCard({
  parnik,
  author,
  onReply,
  onViewProfile,
}: ParnikCardProps) {
  const { user } = useAuth();
  const {
    parniks,
    likeParnik,
    unlikeParnik,
    reParnik,
    undoReParnik,
    deleteParnik,
    votePoll,
    editParnik,
    translateParnik,
    forkCodeParnik,
    isUserAdmin,
    reportParnik,
    banUser,
  } = useParniks();
  const { getUserById } = useUsers();
  const { t, language } = useLanguage();
  const [isLiked, setIsLiked] = useState(
    user ? parnik.likes.includes(user.id) : false,
  );
  const [isReParniked, setIsReParniked] = useState(
    user ? parnik.reparniks.includes(user.id) : false,
  );
  const [likeCount, setLikeCount] = useState(parnik.likes.length);
  const [reParnikCount, setReParnikCount] = useState(parnik.reparniks.length);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(parnik.content);
  const [editMedia, setEditMedia] = useState(parnik.media || []);
  const [editMapData, setEditMapData] = useState(parnik.mapData);
  const [showMapEditor, setShowMapEditor] = useState(false);

  // Code edit mode
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  // Translation
  const [translatedContent, setTranslatedContent] = useState<string | null>(
    null,
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  // Report/Ban
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState("");

  // Fork
  const [forkCount, setForkCount] = useState(parnik.codeData?.forkCount || 0);
  const originalParnik = parnik.codeData?.forkedFrom
    ? parniks.find((p) => p.id === parnik.codeData?.forkedFrom)
    : undefined;
  const originalAuthor = originalParnik
    ? getUserById(originalParnik.authorId)
    : undefined;

  const isOwnParnik = user?.id === parnik.authorId;
  const isAdmin = user && isUserAdmin(user.username);
  const isAuthorAdmin = author && isUserAdmin(author.username);
  const hasVoted = parnik.poll?.options.some(
    (opt) => user && opt.votes.includes(user.id),
  );
  const userVoteOption = parnik.poll?.options.find(
    (opt) => user && opt.votes.includes(user.id),
  );

  const handleLike = () => {
    if (!user) return;

    if (isLiked) {
      unlikeParnik(parnik.id, user.id);
      setLikeCount((prev) => prev - 1);
    } else {
      likeParnik(parnik.id, user.id);
      setLikeCount((prev) => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleReParnik = () => {
    if (!user) return;

    if (isReParniked) {
      undoReParnik(parnik.id, user.id);
      setReParnikCount((prev) => prev - 1);
    } else {
      reParnik(parnik.id, user.id, user);
      setReParnikCount((prev) => prev + 1);
    }
    setIsReParniked(!isReParniked);
  };

  const handleDelete = () => {
    if (confirm(t("deleteConfirm"))) {
      deleteParnik(parnik.id);
    }
  };

  const handleEdit = () => {
    if (parnik.codeData) {
      setShowCodeEditor(true);
      return;
    }
    setIsEditing(true);
    setEditContent(parnik.content);
    setEditMedia(parnik.media || []);
    setEditMapData(parnik.mapData);
  };

  const handleSaveEdit = () => {
    editParnik(parnik.id, editContent, editMedia, editMapData);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(parnik.content);
    setEditMedia(parnik.media || []);
    setEditMapData(parnik.mapData);
  };

  const handleSaveCodeEdit = (updatedCodeData: CodeData) => {
    editParnik(
      parnik.id,
      `Code: ${updatedCodeData.title}`,
      undefined,
      undefined,
      updatedCodeData,
    );
    setShowCodeEditor(false);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/parnik/${parnik.id}`,
      );
    } catch (err) {
      console.error("Failed to copy link");
    }
  };

  const handleVote = (optionId: string) => {
    if (!user || !parnik.poll) return;
    votePoll(parnik.id, optionId, user.id);
  };

  const handleTranslate = async () => {
    if (showTranslation && translatedContent) {
      setShowTranslation(false);
      return;
    }

    if (translatedContent) {
      setShowTranslation(true);
      return;
    }

    setIsTranslating(true);
    try {
      const translated = await translateParnik(parnik.id, language);
      setTranslatedContent(translated);
      setShowTranslation(true);
    } catch (err) {
      console.error("Translation failed", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFork = () => {
    if (!user || !parnik.codeData) return;
    forkCodeParnik(parnik.id, user.id);
    setForkCount((prev) => prev + 1);
  };

  const handleReport = () => {
    if (!user || !reportReason.trim()) return;
    reportParnik(user.id, parnik.authorId, parnik.id, reportReason);
    setShowReportDialog(false);
    setReportReason("");
    alert("Report submitted. Thank you for helping keep our community safe.");
  };

  const handleBan = () => {
    if (!user || !banReason.trim() || !isAdmin) return;
    banUser(parnik.authorId, user.id, banReason, true);
    setShowBanDialog(false);
    setBanReason("");
    alert(`User @${author?.username} has been banned.`);
  };

  if (!author) return null;

  const isPollExpired =
    parnik.poll && new Date() > new Date(parnik.poll.expiresAt);
  const rawContent =
    showTranslation && translatedContent ? translatedContent : parnik.content;
  // Defense-in-depth: sanitize content before rendering even though React escapes JSX by default
  const displayContent = useMemo(
    () => sanitizeInput(rawContent) || rawContent,
    [rawContent],
  );

  return (
    <article className="border-b border-border p-4 hover:bg-muted/30 transition-colors card-hover">
      {/* Reparnik indicator */}
      {parnik.isReParnik && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2 ml-12">
          <Repeat2 className="h-4 w-4" />
          <span>
            {sanitizeInput(author.displayName) || author.displayName}{" "}
            {t("reparniked")}
          </span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <button
          onClick={() => onViewProfile?.(author.id)}
          className="flex-shrink-0"
        >
          <img
            src={author.avatar}
            alt={author.displayName}
            className="h-10 w-10 rounded-full bg-muted cursor-pointer hover:opacity-80 transition-opacity"
          />
        </button>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => onViewProfile?.(author.id)}
                className="font-semibold truncate hover:underline flex items-center gap-1"
              >
                {sanitizeInput(author.displayName) || author.displayName}
                {isAuthorAdmin && <span title="Admin">☄️</span>}
              </button>
              <button
                onClick={() => onViewProfile?.(author.id)}
                className="text-muted-foreground truncate hover:underline"
              >
                @{sanitizeInput(author.username) || author.username}
              </button>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-sm hover:underline cursor-pointer">
                {formatDistanceToNow(parnik.createdAt)}
              </span>
              {parnik.editedAt && (
                <span className="text-muted-foreground text-xs">
                  ({t("edited")})
                </span>
              )}
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-muted rounded-full transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwnParnik && !isEditing && !parnik.codeData && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    {t("edit") || "Edit"}
                  </DropdownMenuItem>
                )}
                {isOwnParnik && parnik.codeData && (
                  <DropdownMenuItem onClick={() => setShowCodeEditor(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Code
                  </DropdownMenuItem>
                )}
                {!isOwnParnik && (
                  <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                    <Flag className="h-4 w-4 mr-2" />
                    {t("report")}
                  </DropdownMenuItem>
                )}
                {isAdmin && !isOwnParnik && (
                  <DropdownMenuItem
                    onClick={() => setShowBanDialog(true)}
                    className="text-destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {t("banUser")}
                  </DropdownMenuItem>
                )}
                {isOwnParnik && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("delete")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Edit Mode */}
          {isEditing ? (
            <div className="mt-2 space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px]"
                placeholder={t("whatsOnMind")}
              />

              {/* Map Editor */}
              {showMapEditor ? (
                <div className="border rounded-lg p-3">
                  <MapParnikDrawer
                    initialData={editMapData}
                    onSave={(data) => {
                      setEditMapData(data);
                      setShowMapEditor(false);
                    }}
                    onCancel={() => setShowMapEditor(false)}
                  />
                </div>
              ) : (
                editMapData && (
                  <div className="border rounded-lg p-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <MapIcon className="h-4 w-4" />
                        {t("mapParnik")} ({editMapData.zones.length}{" "}
                        {t("zones")})
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowMapEditor(true)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          {t("editMap")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditMapData(undefined)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              )}

              {!showMapEditor && !editMapData && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowMapEditor(true)}
                  className="gap-2"
                >
                  <MapIcon className="h-4 w-4" />
                  {t("addMap")}
                </Button>
              )}

              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-1" />
                  {t("cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  className="bg-[#DC143C] hover:bg-[#B01030]"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {t("save")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Content */}
              <p className="mt-1 text-base whitespace-pre-wrap leading-relaxed">
                {displayContent}
              </p>

              {/* Translation indicator */}
              {showTranslation && translatedContent && (
                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {t("translatedTo").replace(
                    "{language}",
                    language.toUpperCase(),
                  )}
                  <button
                    onClick={() => setShowTranslation(false)}
                    className="text-primary hover:underline ml-2"
                  >
                    {t("showOriginal")}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Poll */}
          {!isEditing && parnik.poll && (
            <div className="mt-3 space-y-2">
              {parnik.poll.options.map((option) => {
                const percentage =
                  parnik.poll!.totalVotes > 0
                    ? Math.round(
                        (option.votes.length / parnik.poll!.totalVotes) * 100,
                      )
                    : 0;
                const isSelected = userVoteOption?.id === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() =>
                      !hasVoted && !isPollExpired && handleVote(option.id)
                    }
                    disabled={hasVoted || isPollExpired}
                    className={`w-full relative overflow-hidden rounded-lg border transition-all ${
                      hasVoted || isPollExpired
                        ? "cursor-default"
                        : "cursor-pointer hover:border-primary"
                    } ${isSelected ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    {/* Progress bar */}
                    {(hasVoted || isPollExpired) && (
                      <div
                        className="absolute left-0 top-0 h-full bg-primary/10 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    )}

                    <div className="relative flex items-center justify-between p-3">
                      <span className="font-medium">{option.text}</span>
                      {(hasVoted || isPollExpired) && (
                        <span className="text-sm font-semibold">
                          {percentage}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>
                  {parnik.poll.totalVotes} {t("votes")}
                </span>
                {!isPollExpired && (
                  <span>
                    · {formatDistanceToNow(parnik.poll.expiresAt)} {t("left")}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Code Parnik */}
          {!isEditing && parnik.codeData && (
            <div className="mt-3 space-y-2">
              {/* Forked from indicator */}
              {parnik.codeData.forkedFrom && originalAuthor && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <GitFork className="h-3 w-3" />
                  <span>Forked from @{originalAuthor.username}</span>
                </div>
              )}
              <CodePreview codeData={parnik.codeData} />
            </div>
          )}

          {/* Media */}
          {!isEditing && parnik.media && parnik.media.length > 0 && (
            <div
              className={`grid gap-2 mt-3 ${parnik.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {parnik.media.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Media ${index + 1}`}
                  className="rounded-xl w-full object-cover max-h-80 hover:opacity-95 transition-opacity cursor-pointer"
                />
              ))}
            </div>
          )}

          {/* Map */}
          {!isEditing && parnik.mapData && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
                <MapIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t("mapParnik")}</span>
                <span className="text-xs text-muted-foreground">
                  ({parnik.mapData.zones.length} {t("zones")}
                  {parnik.mapData.markers
                    ? `, ${parnik.mapData.markers.length} ${t("markers")}`
                    : ""}
                  )
                </span>
              </div>
              <div className="relative" style={{ height: "300px" }}>
                <MapContainer
                  center={[
                    parnik.mapData.center.lat,
                    parnik.mapData.center.lng,
                  ]}
                  zoom={parnik.mapData.zoom}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={false}
                  dragging={false}
                  zoomControl={false}
                  doubleClickZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {parnik.mapData.zones.map((zone) => {
                    if (zone.type === "circle" && zone.radius) {
                      return (
                        <Circle
                          key={zone.id}
                          center={[zone.paths[0].lat, zone.paths[0].lng]}
                          radius={zone.radius}
                          pathOptions={{
                            fillColor: zone.color,
                            fillOpacity: 0.4,
                            color: zone.color,
                            weight: 2,
                          }}
                        />
                      );
                    }
                    return (
                      <Polygon
                        key={zone.id}
                        positions={zone.paths.map((p) => [p.lat, p.lng])}
                        pathOptions={{
                          fillColor: zone.color,
                          fillOpacity: 0.4,
                          color: zone.color,
                          weight: 2,
                        }}
                      />
                    );
                  })}
                  {parnik.mapData.markers?.map((marker) => (
                    <Marker
                      key={marker.id}
                      position={[marker.lat, marker.lng]}
                      icon={
                        new Icon({
                          iconUrl:
                            "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0RDMTQzQyI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==",
                          iconSize: [24, 32],
                          iconAnchor: [12, 32],
                        })
                      }
                    >
                      <Popup>
                        <span className="text-sm font-medium">
                          {marker.label}
                        </span>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              {/* Zone legend */}
              <div className="px-3 py-2 bg-muted/30 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {parnik.mapData.zones.map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="text-muted-foreground">{zone.name}</span>
                      {zone.type === "circle" && (
                        <span className="text-xs text-muted-foreground/60">
                          ({t("circle")})
                        </span>
                      )}
                    </div>
                  ))}
                  {parnik.mapData.markers?.map((marker) => (
                    <div
                      key={marker.id}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <MapIcon className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">
                        {marker.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center justify-between mt-4 max-w-md">
              {/* Reply */}
              <button
                onClick={onReply}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group btn-press"
              >
                <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors btn-press">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <span className="text-sm">{parnik.replies.length}</span>
              </button>

              {/* ReParnik */}
              <button
                onClick={handleReParnik}
                className={`flex items-center gap-2 transition-colors group btn-press ${
                  isReParniked
                    ? "text-green-500"
                    : "text-muted-foreground hover:text-green-500"
                }`}
              >
                <div
                  className={`p-2 rounded-full transition-colors btn-press ${isReParniked ? "bg-green-500/10" : "group-hover:bg-green-500/10"}`}
                >
                  <Repeat2 className="h-4 w-4" />
                </div>
                <span className="text-sm">{reParnikCount}</span>
              </button>

              {/* Like */}
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-colors group btn-press ${
                  isLiked
                    ? "text-red-500"
                    : "text-muted-foreground hover:text-red-500"
                }`}
              >
                <div
                  className={`p-2 rounded-full transition-colors btn-press ${isLiked ? "bg-red-500/10" : "group-hover:bg-red-500/10"}`}
                >
                  <Heart
                    className={`h-4 w-4 ${isLiked ? "fill-current like-animation" : ""}`}
                  />
                </div>
                <span className="text-sm">{likeCount}</span>
              </button>

              {/* Translate */}
              {!isOwnParnik && (
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className={`flex items-center gap-2 transition-colors group btn-press ${
                    showTranslation
                      ? "text-blue-500"
                      : "text-muted-foreground hover:text-blue-500"
                  }`}
                >
                  <div
                    className={`p-2 rounded-full transition-colors btn-press ${showTranslation ? "bg-blue-500/10" : "group-hover:bg-blue-500/10"}`}
                  >
                    <Globe className="h-4 w-4" />
                  </div>
                </button>
              )}

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group btn-press"
              >
                <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors btn-press">
                  <Share className="h-4 w-4" />
                </div>
              </button>

              {/* Fork - only for code parniks */}
              {parnik.codeData && (
                <button
                  onClick={handleFork}
                  className="flex items-center gap-2 text-muted-foreground hover:text-purple-500 transition-colors group btn-press"
                >
                  <div className="p-2 rounded-full group-hover:bg-purple-500/10 transition-colors btn-press">
                    <GitFork className="h-4 w-4" />
                  </div>
                  <span className="text-sm">{forkCount}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Code Editor Dialog for Editing */}
      {showCodeEditor && parnik.codeData && (
        <CodeEditor
          initialHtml={parnik.codeData.html}
          initialCss={parnik.codeData.css}
          initialJs={parnik.codeData.js}
          initialTitle={parnik.codeData.title}
          onSave={handleSaveCodeEdit}
          onCancel={() => setShowCodeEditor(false)}
        />
      )}

      {/* Report Dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{t("reportParnik")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("provideReportReason")}
            </p>
            <Textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={t("enterYourReason")}
              className="mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowReportDialog(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleReport}
                disabled={!reportReason.trim()}
                className="bg-[#DC143C] hover:bg-[#B01030]"
              >
                {t("submitReport")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Dialog */}
      {showBanDialog && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-destructive">
              {t("banUserTitle")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("banUserMessage").replace(
                "{username}",
                author?.username || "",
              )}
            </p>
            <Textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder={t("enterBanReason")}
              className="mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowBanDialog(false)}>
                {t("cancel")}
              </Button>
              <Button
                onClick={handleBan}
                disabled={!banReason.trim()}
                variant="destructive"
              >
                <Ban className="h-4 w-4 mr-2" />
                {t("banUser")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
