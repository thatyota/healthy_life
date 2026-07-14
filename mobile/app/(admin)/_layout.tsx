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
// Se nao for admin, redireciona para o feed normal.
// Se for admin, renderiza o Stack com os ecras do painel.
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

    // verifica se o user tem role admin no backend
    const checkAdmin = async () => {
      try {
        // busca o user atual no backend para obter o role
        const response = await apiClient.get("/users/me");
        // extrai o role do documento do MongoDB
        const role = response?.data?.user?.role;

        // se o role nao for admin, redireciona para o feed normal
        if (role !== "admin") {
          router.replace("/(tabs)");
        }
        // se for admin, fica no painel (nao faz nada)
      } catch (error) {
        // se der erro ao buscar o user, loga e manda para o feed
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