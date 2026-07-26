/**
 * Types mirroring backend/app/schemas/*.py and backend/app/models/enums.py.
 * Same source of truth as mobile-app/lib/types.ts — keep all three in sync.
 */

export type ResidentType = "owner" | "tenant";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type AdminRole = "housing_office" | "it_admin" | "super_admin";

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

export interface AdminOut {
  id: number;
  full_name: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface CreateAdminRequest {
  full_name: string;
  email: string;
  password: string;
  role: AdminRole;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegistrationApprovedOut {
  message: string;
  resident: ResidentOut;
}

export interface RegistrationRejectedOut {
  message: string;
  resident_id: number;
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
export type ComplaintPriority = "low" | "normal" | "high" | "critical";
export type ChangedByType = "resident" | "admin" | "staff" | "system";

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
  changed_by_type: ChangedByType;
  changed_by_id: number | null;
  note: string | null;
  timestamp: string;
}

export interface ComplaintDetailOut extends ComplaintOut {
  history: ComplaintHistoryOut[];
}

// --- Enhancement spec: internal notes, audit log, feedback ---

export interface InternalNoteOut {
  id: number;
  complaint_id: number;
  admin_id: number;
  note: string;
  created_at: string;
}

export interface AuditLogOut {
  id: number;
  actor_admin_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string | null;
  created_at: string;
}

export interface FeedbackOut {
  id: number;
  complaint_id: number;
  resident_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface BulkActionResult {
  succeeded: number[];
  failed: { complaint_id: number; error: string }[];
}

export interface DashboardCounts {
  open: number;
  pending: number;
  resolved_today: number;
  high_priority: number;
  critical: number;
  assigned_to_me?: number;
}

// --- Staff ---

export type StaffCategory = "electrician" | "plumber" | "mason" | "security" | "sanitation" | "other";

export interface StaffOut {
  id: number;
  full_name: string;
  phone: string;
  category: StaffCategory;
  is_active: boolean;
  created_at: string;
}

export interface StaffCreateRequest {
  full_name: string;
  phone: string;
  category: StaffCategory;
}

// --- Notifications ---

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
