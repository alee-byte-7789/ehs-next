import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./api-client";
import type {
  ComplaintCreateRequest,
  ComplaintDetailOut,
  ComplaintOut,
  EarlyCloseRequest,
} from "./types";

const MINE_KEY = ["complaints", "mine"] as const;
const DETAIL_KEY = (id: number | string) => ["complaints", "mine", id] as const;

/** GET /complaints/mine — the resident's real complaints from Supabase, no mock data. */
export function useMyComplaints(enabled = true) {
  return useQuery<ComplaintOut[]>({
    queryKey: MINE_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<ComplaintOut[]>("/complaints/mine");
      return data;
    },
    enabled,
  });
}

/** GET /complaints/mine/{id} — full detail including status history timeline. */
export function useMyComplaint(id: number | string, enabled = true) {
  return useQuery<ComplaintDetailOut>({
    queryKey: DETAIL_KEY(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ComplaintDetailOut>(`/complaints/mine/${id}`);
      return data;
    },
    enabled: enabled && id !== undefined && id !== null && id !== "",
  });
}

/** POST /complaints — file a new complaint. */
export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: ComplaintCreateRequest) => {
      const { data } = await apiClient.post<ComplaintOut>("/complaints", req);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MINE_KEY });
    },
  });
}

/** POST /complaints/{id}/close — resident closes an already-resolved complaint (satisfied). */
export function useCloseComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<ComplaintOut>(`/complaints/${id}/close`);
      return data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: MINE_KEY });
      queryClient.invalidateQueries({ queryKey: DETAIL_KEY(id) });
    },
  });
}

/** POST /complaints/{id}/reopen — resident reopens a resolved/closed complaint. */
export function useReopenComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<ComplaintOut>(`/complaints/${id}/reopen`);
      return data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: MINE_KEY });
      queryClient.invalidateQueries({ queryKey: DETAIL_KEY(id) });
    },
  });
}

/** POST /complaints/{id}/close-early — resident closes a still-PENDING complaint before any admin acts. */
export function useCloseComplaintEarly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number } & EarlyCloseRequest) => {
      const { data } = await apiClient.post<ComplaintOut>(`/complaints/${id}/close-early`, { reason });
      return data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: MINE_KEY });
      queryClient.invalidateQueries({ queryKey: DETAIL_KEY(id) });
    },
  });
}
