import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./api-client";
import type {
  AuditLogOut,
  BulkActionResult,
  ComplaintDetailOut,
  ComplaintOut,
  ComplaintPriority,
  ComplaintStatus,
  DashboardCounts,
  FeedbackOut,
  InternalNoteOut,
} from "./types";

export interface ComplaintFilters {
  status_filter?: ComplaintStatus | "all";
  priority_filter?: ComplaintPriority | "all";
  assigned_admin_id?: number;
  search?: string;
}

export function useComplaints(filters: ComplaintFilters) {
  return useQuery<ComplaintOut[]>({
    queryKey: ["complaints", "list", filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {};
      if (filters.status_filter && filters.status_filter !== "all") params.status_filter = filters.status_filter;
      if (filters.priority_filter && filters.priority_filter !== "all") params.priority_filter = filters.priority_filter;
      if (filters.assigned_admin_id) params.assigned_admin_id = filters.assigned_admin_id;
      if (filters.search) params.search = filters.search;
      return (await apiClient.get<ComplaintOut[]>("/complaints", { params })).data;
    },
  });
}

export function useComplaintDetail(complaintId: number) {
  return useQuery<ComplaintDetailOut>({
    queryKey: ["complaints", "detail", complaintId],
    queryFn: async () => (await apiClient.get<ComplaintDetailOut>(`/complaints/${complaintId}`)).data,
    enabled: Number.isFinite(complaintId),
  });
}

export function useDashboardCounts() {
  return useQuery<DashboardCounts>({
    queryKey: ["complaints", "dashboard"],
    queryFn: async () => (await apiClient.get<DashboardCounts>("/complaints/dashboard")).data,
  });
}

function useComplaintAction(action: string) {
  const queryClient = useQueryClient();
  return useMutation<ComplaintOut, unknown, { complaintId: number; body?: Record<string, unknown> }>({
    mutationFn: async ({ complaintId, body }) =>
      (await apiClient.post<ComplaintOut>(`/complaints/${complaintId}/${action}`, body ?? {})).data,
    onSuccess: (_data, { complaintId }) => {
      queryClient.invalidateQueries({ queryKey: ["complaints", "list"] });
      queryClient.invalidateQueries({ queryKey: ["complaints", "detail", complaintId] });
      queryClient.invalidateQueries({ queryKey: ["complaints", "dashboard"] });
    },
  });
}

export const useAcceptComplaint = () => useComplaintAction("accept");
export const useAssignComplaint = () => useComplaintAction("assign");
export const useStartProgress = () => useComplaintAction("start-progress");
export const useResolveComplaint = () => useComplaintAction("resolve");
export const useAdminCloseComplaint = () => useComplaintAction("admin-close");
export const useReassignComplaint = () => useComplaintAction("reassign");
export const useAssignDepartment = () => useComplaintAction("assign-department");
export const useEscalateComplaint = () => useComplaintAction("escalate");
export const useRequestInfo = () => useComplaintAction("request-info");

export function useSetPriority() {
  const queryClient = useQueryClient();
  return useMutation<ComplaintOut, unknown, { complaintId: number; priority: ComplaintPriority }>({
    mutationFn: async ({ complaintId, priority }) =>
      (await apiClient.put<ComplaintOut>(`/complaints/${complaintId}/priority`, { priority })).data,
    onSuccess: (_data, { complaintId }) => {
      queryClient.invalidateQueries({ queryKey: ["complaints", "list"] });
      queryClient.invalidateQueries({ queryKey: ["complaints", "detail", complaintId] });
      queryClient.invalidateQueries({ queryKey: ["complaints", "dashboard"] });
    },
  });
}

// --- Internal notes ---

export function useInternalNotes(complaintId: number) {
  return useQuery<InternalNoteOut[]>({
    queryKey: ["complaints", "notes", complaintId],
    queryFn: async () => (await apiClient.get<InternalNoteOut[]>(`/complaints/${complaintId}/notes`)).data,
    enabled: Number.isFinite(complaintId),
  });
}

export function useAddInternalNote() {
  const queryClient = useQueryClient();
  return useMutation<InternalNoteOut, unknown, { complaintId: number; note: string }>({
    mutationFn: async ({ complaintId, note }) =>
      (await apiClient.post<InternalNoteOut>(`/complaints/${complaintId}/notes`, { note })).data,
    onSuccess: (_data, { complaintId }) => {
      queryClient.invalidateQueries({ queryKey: ["complaints", "notes", complaintId] });
    },
  });
}

// --- Feedback (admin view) ---

export function useComplaintFeedback(complaintId: number) {
  return useQuery<FeedbackOut | null>({
    queryKey: ["complaints", "feedback", complaintId],
    queryFn: async () => {
      try {
        return (await apiClient.get<FeedbackOut>(`/complaints/${complaintId}/feedback`)).data;
      } catch {
        return null;
      }
    },
    enabled: Number.isFinite(complaintId),
  });
}

// --- Bulk actions ---

export function useBulkAssignStaff() {
  const queryClient = useQueryClient();
  return useMutation<BulkActionResult, unknown, { complaint_ids: number[]; staff_id: number }>({
    mutationFn: async (payload) => (await apiClient.post<BulkActionResult>("/complaints/bulk/assign-staff", payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["complaints", "list"] }),
  });
}

export function useBulkSetPriority() {
  const queryClient = useQueryClient();
  return useMutation<BulkActionResult, unknown, { complaint_ids: number[]; priority: ComplaintPriority }>({
    mutationFn: async (payload) => (await apiClient.post<BulkActionResult>("/complaints/bulk/priority", payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["complaints", "list"] }),
  });
}

export function useBulkSetStatus() {
  const queryClient = useQueryClient();
  return useMutation<BulkActionResult, unknown, { complaint_ids: number[]; status: ComplaintStatus }>({
    mutationFn: async (payload) => (await apiClient.post<BulkActionResult>("/complaints/bulk/status", payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["complaints", "list"] }),
  });
}

// --- Audit log ---

export function useAuditLogs() {
  return useQuery<AuditLogOut[]>({
    queryKey: ["audit-logs"],
    queryFn: async () => (await apiClient.get<AuditLogOut[]>("/audit-logs")).data,
  });
}
