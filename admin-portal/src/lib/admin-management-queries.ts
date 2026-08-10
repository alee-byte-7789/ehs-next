import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./api-client";
import type { AdminOut, CreateAdminRequest } from "./types";

export function useAdminsList(enabled: boolean) {
  return useQuery<AdminOut[]>({
    queryKey: ["admins", "list"],
    queryFn: async () => (await apiClient.get<AdminOut[]>("/admins")).data,
    enabled,
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation<AdminOut, unknown, CreateAdminRequest>({
    mutationFn: async (payload: CreateAdminRequest) =>
      (await apiClient.post<AdminOut>("/admins", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins", "list"] });
    },
  });
}

/** Resets another admin's password. Super Admin only, enforced server-side. */
export function useResetAdminPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ adminId, newPassword }: { adminId: number; newPassword: string }) =>
      (await apiClient.post(`/admins/${adminId}/reset-password`, { new_password: newPassword })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
}
