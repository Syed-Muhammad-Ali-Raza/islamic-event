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

// ─── City directory ───────────────────────────────────────────────────────────

export interface CitySummary {
  id: string;
  name: string;
  slug: string;
  state: string;
  eventCount: number;
}

export interface CityDetail extends CitySummary {
  categoryCounts: {
    category: { id: string; name: string; slug: string };
    count: number;
  }[];
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

export interface Imambargah {
  id: string;
  sourceId: string;
  name: string;
  city: string;
  area: string | null;
  address: string;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  yearBuilt: string | null;
  founderOrCaretaker: string | null;
  contact: string | null;
  notes: string | null;
  sourceUrl: string | null;
  verified: boolean;
  confidence: string;
  isActive: boolean;
}

export interface Place {
  id: string;
  sourceId: string;
  name: string;
  category: string;
  type: string;
  city: string;
  province: string;
  address: string;
  mapLink: string | null;
  builtYear: string | null;
  builtBuilder: string | null;
  unescoStatus: string | null;
  timings: string | null;
  ticket: string | null;
  description: string | null;
  sourceLink: string | null;
  verified: boolean;
  isActive: boolean;
}

export interface Darbar {
  id: string;
  sourceId: string;
  name: string;
  saint: string;
  saintDeathYear: string | null;
  ursDate: string | null;
  city: string;
  province: string;
  address: string;
  mapLink: string | null;
  timings: string | null;
  description: string | null;
  sourceLink: string | null;
  verified: boolean;
  isActive: boolean;
}

export interface UrsDate {
  id: string;
  sourceId: string;
  name: string;
  saint: string;
  saintDeathYear: string | null;
  city: string;
  ursRule: string | null;
  calendarBasis: string | null;
  lastObserved: string | null;
  nextExpected: string | null;
  confidence: string;
  sources: string | null;
  notes: string | null;
  howToConfirm: string | null;
  researched: boolean;
  upcomingOrder: number | null;
  isActive: boolean;
}

export interface Mela {
  id: string;
  sourceId: string;
  name: string;
  type: string | null;
  city: string;
  province: string;
  venue: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  whenHeld: string | null;
  duration: string | null;
  history: string | null;
  whatHappens: string | null;
  statusNotes: string | null;
  source: string | null;
  verified: boolean;
  isActive: boolean;
}

export interface AuqafUrsDate {
  id: string;
  sourceId: string;
  name: string;
  type: string | null;
  zone: string;
  province: string;
  dateAsPublished: string;
  googleMapsUrl: string | null;
  source: string | null;
  verified: boolean;
  isActive: boolean;
}

export interface Procession {
  id: string;
  sourceId: string;
  city: string;
  month: string;
  day: string;
  kind: string;
  name: string;
  type: string | null;
  start: string | null;
  end: string | null;
  route: string | null;
  routeHighlights: string | null;
  time: string | null;
  googleMaps: string | null;
  description: string | null;
  notes: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Charity {
  id: string;
  sourceId: string;
  name: string;
  country: string;
  province: string;
  city: string;
  type: string | null;
  focus: string | null;
  policyNote: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsLink: string | null;
  contactNumbers: string | null;
  founded: string | null;
  founder: string | null;
  website: string | null;
  registration: string | null;
  isActive: boolean;
}

export interface CharityFacets {
  countries: string[];
  provinces: string[];
  cities: string[];
}

export interface ScholarSource {
  title: string;
  url: string;
}

export interface Scholar {
  id: string;
  sourceId: string;
  slug: string;
  name: string;
  nameUrdu: string | null;
  honorific: string | null;
  sect: string;
  category: string;
  status: string;
  birthDate: string | null;
  deathDate: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  education: string | null;
  works: string[];
  officialLinks: string | null;
  photoUrl: string | null;
  photoCredit: string | null;
  photoLicense: string | null;
  sources: ScholarSource[] | null;
  confidence: string;
  lastVerified: string | null;
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
