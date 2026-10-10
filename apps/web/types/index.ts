// ─── Shared API types ──────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

// ─── Domain types ─────────────────────────────────────────────────────────────

export type UserRole = "USER" | "ORGANIZER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  role: UserRole;
  createdAt: string;
}

export type EventStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export type ParticipantRole =
  | "KHATEEB" | "ZAKIR" | "SPEAKER" | "NAAT_KHAWAN" | "QARI"
  | "RECITER" | "HOST" | "GUEST" | "SCHOLAR" | "ORGANIZER" | "MUAZZIN" | "OTHER";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
}

export interface City {
  id: string;
  name: string;
  slug: string;
}

export interface Person {
  id: string;
  name: string;
  slug: string;
  profileImage: string | null;
  description: string | null;
}

export interface EventParticipant {
  id: string;
  role: ParticipantRole;
  displayOrder: number;
  person: Person;
}

export interface OrganizerSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface Organizer extends OrganizerSummary {
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  isVerified: boolean;
  address: string | null;
}

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  latitude: number | null;
  longitude: number | null;
  posterUrl: string | null;
  status: EventStatus;
  isFeatured: boolean;
  viewCount: number;
  category: Pick<Category, "id" | "name" | "slug">;
  city: Pick<City, "id" | "name" | "slug"> | null;
  area: { id: string; name: string } | null;
  organizer: OrganizerSummary | null;
  createdAt: string;
}

export interface EventRsvpState {
  interested: number;
  attending: number;
  myRsvp: "INTERESTED" | "ATTENDING" | null;
}

export interface MyRsvpInfo {
  type: "INTERESTED" | "ATTENDING";
  checkedInAt: string | null;
  createdAt: string;
  qrToken: string;
}

export interface CheckinResult {
  attendee: { id: string; name: string; email: string };
  checkedInAt: string;
  alreadyCheckedIn: boolean;
}

export interface Dastarkhwan {
  id: string;
  sourceId: string;
  name: string;
  city: string;
  area: string | null;
  address: string;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  type: string;
  schedule: string | null;
  sourceUrl: string | null;
  sourceYear: string | null;
  verified: boolean;
  notes: string | null;
  isActive: boolean;
}

export interface Event extends EventSummary {
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  publishedAt: string | null;
  country: { id: string; name: string; code: string } | null;
  state: { id: string; name: string } | null;
  participants: EventParticipant[];
  createdBy: { id: string; name: string };
  rsvps?: EventRsvpState;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}
