import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./api-client";
import type { ResidentDetailOut, ResidentListItemOut, ResidentOut, UserFilters } from "./types";

/** All residents, with the filters applied server-side. Each row includes
 * who approved that resident, if anyone has yet. */
export function useUsers(filters: UserFilters) {
  return useQuery<ResidentListItemOut[]>({
    // Filters are part of the key so each combination caches separately and
    // changing a filter refetches rather than showing the previous result.
    queryKey: ["users", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, String(v));
      });
      const { data } = await apiClient.get<ResidentListItemOut[]>(`/users?${params.toString()}`);
      return data;
    },
  });
}

/** One resident's full profile, including complaint and approval history. */
export function useUserDetail(residentId: number | null) {
  return useQuery<ResidentDetailOut>({
    queryKey: ["users", "detail", residentId],
    queryFn: async () => (await apiClient.get<ResidentDetailOut>(`/users/${residentId}`)).data,
    enabled: residentId !== null,
  });
}

// ---------------------------------------------------------------------------
// Privileged admin actions
//
// Each invalidates the user list (and detail where relevant) so the table
// reflects the change immediately rather than after the next navigation.
// ---------------------------------------------------------------------------

/** Sets a new password for a resident who forgot theirs. No old password needed. */
export function useResetResidentPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ residentId, newPassword }: { residentId: number; newPassword: string }) =>
      (await apiClient.post(`/users/${residentId}/reset-password`, { new_password: newPassword })).data,
    onSuccess: (_d, { residentId }) => {
      queryClient.invalidateQueries({ queryKey: ["users", "detail", residentId] });
    },
  });
}

/** Permanently deletes a registration. Refused server-side if the resident
 *  has complaints or feedback on record. */
export function useDeleteRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ residentId, reason, force }: { residentId: number; reason: string; force?: boolean }) =>
      // DELETE with a body needs the `data` key in axios, not a second argument.
      (await apiClient.delete(`/users/${residentId}`, { data: { reason, force: force ?? false } })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/** Creates a resident by hand. They are created already approved. */
export function useManualRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ManualRegisterPayload) =>
      (await apiClient.post<ResidentOut>("/users", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export interface ManualRegisterPayload {
  full_name: string;
  house_number: string;
  mobile_number: string;
  email?: string;
  password: string;
  cnic: string;
  is_tenant: boolean;
  owner_house_number?: string;
  owner_name?: string;
  owner_cnic?: string;
  owner_mobile_number?: string;
}
