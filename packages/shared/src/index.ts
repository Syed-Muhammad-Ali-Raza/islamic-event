// ─── Roles ───────────────────────────────────────────────────────────────────
export type UserRole = "USER" | "ORGANIZER" | "ADMIN";

// ─── Event Status ─────────────────────────────────────────────────────────────
export type EventStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

// ─── Participant Roles ────────────────────────────────────────────────────────
export type ParticipantRole =
  | "KHATEEB"
  | "ZAKIR"
  | "SPEAKER"
  | "NAAT_KHAWAN"
  | "QARI"
  | "RECITER"
  | "HOST"
  | "GUEST"
  | "SCHOLAR"
  | "ORGANIZER"
  | "MUAZZIN"
  | "OTHER";

// ─── Report Reasons ──────────────────────────────────────────────────────────
export type ReportReason =
  | "FAKE_INFORMATION"
  | "WRONG_LOCATION"
  | "WRONG_DATE"
  | "DUPLICATE"
  | "SPAM"
  | "OFFENSIVE_CONTENT"
  | "EVENT_CANCELLED"
  | "OTHER";

// ─── Report Status ────────────────────────────────────────────────────────────
export type ReportStatus =
  | "PENDING"
  | "REVIEWED"
  | "DISMISSED"
  | "ACTION_TAKEN";

// ─── API Response Shapes ──────────────────────────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Pagination ───────────────────────────────────────────────────────────────
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

// ─── Label maps (useful both FE and BE) ──────────────────────────────────────
export const PARTICIPANT_ROLE_LABELS: Record<ParticipantRole, string> = {
  KHATEEB: "Khateeb",
  ZAKIR: "Zakir",
  SPEAKER: "Speaker",
  NAAT_KHAWAN: "Naat Khuwan",
  QARI: "Qari",
  RECITER: "Reciter",
  HOST: "Host",
  GUEST: "Guest",
  SCHOLAR: "Scholar",
  ORGANIZER: "Organizer",
  MUAZZIN: "Muazzin",
  OTHER: "Other",
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};
