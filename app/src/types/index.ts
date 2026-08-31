export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  joinedAt: Date;
  following: string[];
  followers: string[];
  isOnline?: boolean;
  lastSeen?: Date;
  isAdmin?: boolean;
  isBanned?: boolean;
  banReason?: string;
  passwordHash?: string;
  adminHash?: string;
}

export interface Poll {
  id: string;
  options: PollOption[];
  expiresAt: Date;
  totalVotes: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface MapZone {
  id: string;
  name: string;
  paths: { lat: number; lng: number }[];
  color: string;
  type?: "polygon" | "circle" | "rectangle";
  radius?: number; // For circles, in meters
  fillOpacity?: number;
  strokeWidth?: number;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

export interface MapData {
  center: { lat: number; lng: number };
  zoom: number;
  zones: MapZone[];
  markers?: MapMarker[];
}

export interface Parnik {
  id: string;
  authorId: string;
  content: string;
  media?: string[];
  poll?: Poll;
  mapData?: MapData;
  createdAt: Date;
  editedAt?: Date;
  likes: string[];
  replies: Reply[];
  reparniks: string[];
  isReParnik?: boolean;
  originalParnikId?: string;
  originalAuthor?: User;
  // Translation support
  translations?: Record<string, string>; // language code -> translated content
  originalLanguage?: string;
  // Code sandbox
  codeData?: CodeData;
}

// Report/Ban system
export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  parnikId?: string;
  reason: string;
  createdAt: Date;
  status: "pending" | "reviewed" | "resolved";
  adminNotes?: string;
}

export interface Ban {
  id: string;
  userId: string;
  bannedBy: string;
  reason: string;
  bannedAt: Date;
  expiresAt?: Date;
  isPermanent: boolean;
}

export interface Reply {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  likes: string[];
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  media?: string[];
  createdAt: Date;
  editedAt?: Date;
  isRead: boolean;
  isDeleted?: boolean;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessageAt: Date;
  unreadCount: number;
}

export type Theme = "classic" | "light" | "sepia" | "lecture";

// Code Parniks - HTML/CSS/JS sandbox
export interface CodeData {
  html: string;
  css: string;
  js: string;
  text: string; // plain text / txt content
  title: string;
  lang: string; // 'html' | 'css' | 'js' | 'text' | mixed
  totalLines: number;
  forkedFrom?: string; // original parnik id if forked
  forkCount: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isObserver?: boolean;
}
