import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./api-client";
import type { StaffCreateRequest, StaffOut } from "./types";

export function useStaffList() {
  return useQuery<StaffOut[]>({
    queryKey: ["staff", "list"],
    queryFn: async () => (await apiClient.get<StaffOut[]>("/staff")).data,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation<StaffOut, unknown, StaffCreateRequest>({
    mutationFn: async (payload) => (await apiClient.post<StaffOut>("/staff", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", "list"] });
    },
  });
}
