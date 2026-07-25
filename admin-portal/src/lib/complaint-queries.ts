import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./api-client";
import type { ComplaintDetailOut, ComplaintOut, ComplaintStatus } from "./types";

export function useComplaints(statusFilter: ComplaintStatus | "all") {
  return useQuery<ComplaintOut[]>({
    queryKey: ["complaints", "list", statusFilter],
    queryFn: async () => {
      const params = statusFilter === "all" ? {} : { status_filter: statusFilter };
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

function useComplaintAction(action: string) {
  const queryClient = useQueryClient();
  return useMutation<ComplaintOut, unknown, { complaintId: number; body?: Record<string, unknown> }>({
    mutationFn: async ({ complaintId, body }) =>
      (await apiClient.post<ComplaintOut>(`/complaints/${complaintId}/${action}`, body ?? {})).data,
    onSuccess: (_data, { complaintId }) => {
      queryClient.invalidateQueries({ queryKey: ["complaints", "list"] });
      queryClient.invalidateQueries({ queryKey: ["complaints", "detail", complaintId] });
    },
  });
}

export const useAcceptComplaint = () => useComplaintAction("accept");
export const useAssignComplaint = () => useComplaintAction("assign");
export const useStartProgress = () => useComplaintAction("start-progress");
export const useResolveComplaint = () => useComplaintAction("resolve");
export const useAdminCloseComplaint = () => useComplaintAction("admin-close");
