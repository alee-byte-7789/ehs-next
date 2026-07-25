import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./api-client";
import type { ComplaintCreateRequest, ComplaintDetailOut, ComplaintOut } from "./types";

export function useMyComplaints() {
  return useQuery<ComplaintOut[]>({
    queryKey: ["complaints", "mine"],
    queryFn: async () => (await apiClient.get<ComplaintOut[]>("/complaints/mine")).data,
  });
}

export function useMyComplaintDetail(complaintId: number) {
  return useQuery<ComplaintDetailOut>({
    queryKey: ["complaints", "mine", complaintId],
    queryFn: async () => (await apiClient.get<ComplaintDetailOut>(`/complaints/mine/${complaintId}`)).data,
    enabled: Number.isFinite(complaintId),
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation<ComplaintOut, unknown, ComplaintCreateRequest>({
    mutationFn: async (payload) => (await apiClient.post<ComplaintOut>("/complaints", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints", "mine"] });
    },
  });
}

export function useCloseComplaint() {
  const queryClient = useQueryClient();
  return useMutation<ComplaintOut, unknown, number>({
    mutationFn: async (complaintId) => (await apiClient.post<ComplaintOut>(`/complaints/${complaintId}/close`)).data,
    onSuccess: (_data, complaintId) => {
      queryClient.invalidateQueries({ queryKey: ["complaints", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["complaints", "mine", complaintId] });
    },
  });
}

export function useReopenComplaint() {
  const queryClient = useQueryClient();
  return useMutation<ComplaintOut, unknown, number>({
    mutationFn: async (complaintId) => (await apiClient.post<ComplaintOut>(`/complaints/${complaintId}/reopen`)).data,
    onSuccess: (_data, complaintId) => {
      queryClient.invalidateQueries({ queryKey: ["complaints", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["complaints", "mine", complaintId] });
    },
  });
}
