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
export type ChangedByType = "resident" | "admin" | "staff" | "system";

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
