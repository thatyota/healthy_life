import { Stack } from "expo-router";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useApiClient } from "../../utils/api";  // ✅ CORRIGIDO: path do teu hook
import { ActivityIndicator, View } from "react-native";

export default function AdminLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const apiClient = useApiClient();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/(auth)");
      return;
    }

    // Verifica se é admin
    const checkAdmin = async () => {
      try {
        const response = await apiClient.get("/auth/me");
        const role = response?.data?.user?.role;  // ✅ CORRIGIDO: .data

        if (role !== "admin") {
          // Não é admin, redireciona para tabs
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("Erro ao verificar admin:", error);
        router.replace("/(tabs)");
      }
    };

    checkAdmin();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F1F8E9" }}>
        <ActivityIndicator size="large" color="#3A6604" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Painel Admin",
          headerStyle: { backgroundColor: "#3A6604" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
    </Stack>
  );
}