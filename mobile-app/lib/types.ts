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
  full_name: string;
  phone: string;
  email: string | null;
  resident_type: ResidentType;
  is_employee: boolean;
  employee_number: string | null;
  verification_status: VerificationStatus;
  created_at: string;
}

export interface RegisterRequest {
  full_name: string;
  house_number: string;
  mobile_number: string;
  email?: string;
  password: string;
  is_awc_employee: boolean;
  employee_number?: string;
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

// --- Complaints ---

export type ComplaintCategory = "general" | "infrastructure" | "internal";
export type ComplaintStatus =
  | "pending"
  | "accepted"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "reopened";
export type ChangedByType = "resident" | "admin" | "staff" | "system";

export interface ComplaintCreateRequest {
  category: ComplaintCategory;
  subcategory: string;
  description: string;
  photo_urls?: string[];
}

export interface ComplaintOut {
  id: number;
  complaint_code: string;
  resident_id: number;
  house_id: number;
  category: ComplaintCategory;
  subcategory: string;
  description: string;
  photo_urls: string[] | null;
  status: ComplaintStatus;
  assigned_staff_id: number | null;
  close_count: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface ComplaintHistoryOut {
  id: number;
  from_status: ComplaintStatus | null;
  to_status: ComplaintStatus;
  changed_by_type: ChangedByType;
  changed_by_id: number | null;
  note: string | null;
  timestamp: string;
}

export interface ComplaintDetailOut extends ComplaintOut {
  history: ComplaintHistoryOut[];
}
