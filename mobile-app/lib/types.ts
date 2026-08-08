/**
 * Types mirroring backend/app/schemas/*.py and backend/app/models/enums.py.
 * Keep these in lockstep with the backend contracts — this is the single
 * source of truth for what the mobile app expects the API to send/accept.
 */

export type ResidentType = "owner" | "tenant";
export type VerificationStatus = "pending" | "approved" | "rejected";

export interface ResidentOut {
  id: number;
  resident_code: string | null;
  house_id: number;
  house_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  resident_type: ResidentType;
  cnic: string | null;
  verification_status: VerificationStatus;
  created_at: string;
}

export interface RegisterRequest {
  full_name: string;
  house_number: string;
  mobile_number: string;
  email?: string;
  password: string;
  cnic: string;
  fcm_token?: string;
  expo_push_token?: string;
  is_tenant?: boolean;
  owner_house_number?: string;
  owner_name?: string;
  owner_cnic?: string;
  owner_mobile_number?: string;
}

export interface RegisterResponse {
  message: string;
  resident_id: number;
  verification_status: VerificationStatus;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApiErrorBody {
  detail?: string | { msg: string }[];
}

// --- Complaints (mirrors backend/app/schemas/complaint.py + models/enums.py) ---

export type ComplaintCategory = "general" | "infrastructure" | "internal";
export type ComplaintPriority = "low" | "normal" | "high" | "critical";
export type ComplaintStatus =
  | "pending"
  | "accepted"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "reopened";

export interface ComplaintCreateRequest {
  category: ComplaintCategory;
  subcategory: string;
  description: string;
  photo_urls?: string[] | null;
}

export interface ComplaintOut {
  id: number;
  complaint_code: string;
  resident_id: number;
  house_id: number;
  house_code: string;
  resident_name: string;
  resident_phone: string;
  category: ComplaintCategory;
  subcategory: string;
  description: string;
  photo_urls: string[] | null;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assigned_staff_id: number | null;
  assigned_admin_id: number | null;
  close_count: number;
  closed_by_resident_early: boolean;
  early_close_reason: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface ComplaintHistoryOut {
  id: number;
  from_status: ComplaintStatus | null;
  to_status: ComplaintStatus;
  changed_by_type: "resident" | "admin" | "system";
  changed_by_id: number | null;
  note: string | null;
  timestamp: string;
}

export interface ComplaintDetailOut extends ComplaintOut {
  history: ComplaintHistoryOut[];
}

export interface EarlyCloseRequest {
  reason: string;
}

// --- Society Info ---

export interface SocietyInfoOut {
  about_text: string;
  chairman_name: string | null;
  chairman_message: string | null;
  deputy_chairman_name: string | null;
  deputy_chairman_message: string | null;
  secretary_name: string | null;
  secretary_designation: string | null;
  secretary_message: string | null;
  updated_at: string;
}

// --- Prayer Timings ---

export type MosqueName = "bilal_mosque" | "markazi_jamia_mosque";

export interface PrayerTimingOut {
  mosque_name: MosqueName;
  fajr: string;
  zuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah: string | null;
  updated_at: string;
  /** True when maghrib was derived from today's sunset rather than a
   *  fixed time entered by an admin. */
  maghrib_is_auto: boolean;
  /** Today's computed sunset at the society, always present. */
  sunset_today: string | null;
}

export interface PrayerTimingUpdateRequest {
  fajr: string;
  zuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah?: string | null;
}

// --- Notifications (real backend, GET /notifications/mine) ---

export interface NotificationOut {
  id: number;
  recipient_type: "resident" | "admin";
  recipient_id: number;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}
