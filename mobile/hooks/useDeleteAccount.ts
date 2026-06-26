import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/utils/api";
import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";

export const useDeleteAccount = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete("/users/me");
      return response.data;
    },
    onSuccess: async () => {
      queryClient.clear();
      await signOut();
      router.replace("/(auth)");
    },
  });
};