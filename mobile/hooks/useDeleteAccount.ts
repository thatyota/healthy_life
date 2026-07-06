import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/utils/api";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

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

      // mostra mensagem a dizer que pode recriar conta
      Alert.alert(
        "Conta Apagada",
        "A tua conta foi apagada com sucesso.\n\nPodes criar uma nova conta com o mesmo email se quiseres!",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(auth)");
            },
          }
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        "Erro",
        error.response?.data?.error || "Nao foi possivel apagar a conta"
      );
    },
  });
};