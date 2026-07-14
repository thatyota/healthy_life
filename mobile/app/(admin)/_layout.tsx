import { Stack } from "expo-router";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useApiClient } from "../../utils/api";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

// =============================================================================
// Admin Layout — Stack Navigator
// =============================================================================
// Verifica se o user esta logado e se tem role "admin".
// Usa /admin/check (mais leve) em vez de /users/me para evitar rate limit.
// Se nao for admin, redireciona para o feed normal.
// =============================================================================

export default function AdminLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const apiClient = useApiClient();
  const { darkMode } = useTheme();

  // Cores do tema
  const headerBg = darkMode ? "#2d4a1e" : "#3A6604";
  const loadingBg = darkMode ? "#1a2f0a" : "#F1F8E9";
  const loadingColor = darkMode ? "#8bc34a" : "#3A6604";

  useEffect(() => {
    // aguarda o Clerk carregar antes de verificar
    if (!isLoaded) return;

    // se nao estiver logado, manda para o login
    if (!isSignedIn) {
      router.replace("/(auth)");
      return;
    }

    // verifica se o user e admin usando /admin/check (mais leve que /users/me)
    const checkAdmin = async () => {
      try {
        const response = await apiClient.get("/admin/check");
        const isAdmin = response?.data?.isAdmin === true;

        if (!isAdmin) {
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("Erro ao verificar admin:", error);
        router.replace("/(tabs)");
      }
    };

    checkAdmin();
  }, [isLoaded, isSignedIn]);

  // mostra loading enquanto o Clerk nao carrega
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: loadingBg }}>
        <ActivityIndicator size="large" color={loadingColor} />
      </View>
    );
  }

  // renderiza o stack do painel admin
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Painel Admin",
          headerStyle: { backgroundColor: headerBg },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: "Utilizadores",
          headerStyle: { backgroundColor: headerBg },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <Stack.Screen
        name="posts"
        options={{
          title: "Publicacoes",
          headerStyle: { backgroundColor: headerBg },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <Stack.Screen
        name="comments"
        options={{
          title: "Comentarios",
          headerStyle: { backgroundColor: headerBg },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <Stack.Screen
        name="moderation"
        options={{
          title: "Moderacao",
          headerStyle: { backgroundColor: headerBg },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
    </Stack>
  );
}