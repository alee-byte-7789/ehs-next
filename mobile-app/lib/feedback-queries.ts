import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./api-client";
import type { FeedbackCreateRequest, FeedbackOut } from "./types";

export function useGiveFeedback(complaintId: number) {
  const queryClient = useQueryClient();
  return useMutation<FeedbackOut, unknown, FeedbackCreateRequest>({
    mutationFn: async (payload) =>
      (await apiClient.post<FeedbackOut>(`/complaints/${complaintId}/feedback`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints", "mine", complaintId] });
    },
  });
}
