import { useMutation } from "@tanstack/react-query";

import { apiClient } from "./api-client";

interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export function useChangePassword() {
  return useMutation<{ message: string }, unknown, ChangePasswordPayload>({
    mutationFn: async (payload) =>
      (await apiClient.post<{ message: string }>("/auth/change-password", payload)).data,
  });
}
