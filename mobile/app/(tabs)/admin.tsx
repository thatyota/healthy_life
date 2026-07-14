import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApiClient } from "../../utils/api";
import { useAuth } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

// =============================================================================
// Admin Dashboard — Painel principal do admin
// =============================================================================
// Mostra cards com estatisticas e navegacao para os ecras de gestao.
// Usa useApiClient para buscar dados do backend.
// So aparece o tab Admin se o user tiver role: "admin".
// =============================================================================

export default function AdminDashboard() {
  const router = useRouter();
  const api = useApiClient();
  const { isSignedIn, isLoaded } = useAuth();
  const { darkMode, language } = useTheme();

  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Traducoes PT/EN
  const t = {
    pt: {
      painelAdmin: "Painel Admin",
      bemVindo: "Bem-vindo ao painel de administracao",
      estatisticas: "Estatisticas",
      acoesRapidas: "Acoes Rapidas",
      gerirUsers: "Gerir Utilizadores",
      gerirPosts: "Gerir Publicacoes",
      gerirComments: "Gerir Comentarios",
      verLogs: "Logs de Moderacao",
      users: "Utilizadores",
      posts: "Publicacoes",
      comments: "Comentarios",
      reports: "Denuncias",
      acessoNegado: "Acesso negado",
      carregando: "A carregar...",
      resumo: "Aqui podes gerir utilizadores, publicacoes, comentarios e ver logs de moderacao.",
    },
    en: {
      painelAdmin: "Admin Panel",
      bemVindo: "Welcome to the admin dashboard",
      estatisticas: "Statistics",
      acoesRapidas: "Quick Actions",
      gerirUsers: "Manage Users",
      gerirPosts: "Manage Posts",
      gerirComments: "Manage Comments",
      verLogs: "Moderation Logs",
      users: "Users",
      posts: "Posts",
      comments: "Comments",
      reports: "Reports",
      acessoNegado: "Access denied",
      carregando: "Loading...",
      resumo: "Here you can manage users, posts, comments and view moderation logs.",
    },
  };

  const lang = t[language];

  // =============================================================================
  // TEMA — Paleta suave e agradavel (igual ao profile)
  // =============================================================================
  const theme = {
    bg: darkMode ? "#0f1f0f" : "#F1F8E9",
    cardBg: darkMode ? "#1a2e1a" : "#FFFFFF",
    headerBg: darkMode ? "#162616" : "#3A6604",
    textMain: darkMode ? "#a3d977" : "#3A6604",
    textBody: darkMode ? "#c8ddb8" : "#1B1B1B",
    textMuted: darkMode ? "#5a7a4a" : "#666666",
    textWhite: "#FFFFFF",
    border: darkMode ? "#2a4a2a" : "#C8E6C9",
    loading: darkMode ? "#7bc043" : "#65B307",
    accent: darkMode ? "#7bc043" : "#8bc34a",
    danger: "#e57373",
  };

  useEffect(() => {
    const loadAdminData = async () => {
      if (!isLoaded || !isSignedIn) return;

      try {
        const checkRes = await api.get("/admin/check");
        const adminStatus = checkRes.data?.isAdmin === true;

        if (!adminStatus) {
          setIsAdmin(false);
          router.replace("/(tabs)");
          return;
        }

        setIsAdmin(true);

        try {
          const statsRes = await api.get("/admin/stats");
          const stats = statsRes.data;
          setTotalUsers(stats.users || 0);
          setTotalPosts(stats.posts || 0);
          setTotalComments(stats.comments || 0);
          setTotalReports(stats.reports || 0);
        } catch (e) {
          try {
            const usersRes = await api.get("/admin/users");
            setTotalUsers(usersRes.data?.users?.length || 0);
          } catch (e2) { setTotalUsers(0); }
          try {
            const postsRes = await api.get("/admin/posts");
            setTotalPosts(postsRes.data?.posts?.length || 0);
          } catch (e2) { setTotalPosts(0); }
          try {
            const commentsRes = await api.get("/admin/comments");
            setTotalComments(commentsRes.data?.comments?.length || 0);
          } catch (e2) { setTotalComments(0); }
          setTotalReports(0);
        }
      } catch (error) {
        console.error("Erro ao carregar dados admin:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [isLoaded, isSignedIn, api, router]);

  if (loading || !isLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.loading} />
        <Text style={{ color: theme.textMain, marginTop: 16, fontWeight: "500" }}>
          {lang.carregando}
        </Text>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.bg }}>
        <Ionicons name="lock-closed" size={48} color={theme.textMuted} />
        <Text style={{ color: theme.textMuted, marginTop: 12, fontSize: 16 }}>
          {lang.acessoNegado}
        </Text>
      </SafeAreaView>
    );
  }

  const stats = [
    { icon: "people", label: lang.users, value: totalUsers, color: "#7bc043" },
    { icon: "newspaper", label: lang.posts, value: totalPosts, color: "#6ab04a" },
    { icon: "chatbubbles", label: lang.comments, value: totalComments, color: "#5a9e3a" },
    { icon: "flag", label: lang.reports, value: totalReports, color: "#e57373", alert: totalReports > 0 },
  ];

  const actions = [
    { icon: "people", label: lang.gerirUsers, route: "/(admin)/users" },
    { icon: "newspaper", label: lang.gerirPosts, route: "/(admin)/posts" },
    { icon: "chatbubbles", label: lang.gerirComments, route: "/(admin)/comments" },
    { icon: "shield-checkmark", label: lang.verLogs, route: "/(admin)/moderation" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ backgroundColor: theme.headerBg, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
          <Text style={{ color: theme.textWhite, fontSize: 24, fontWeight: "bold" }}>
            {lang.painelAdmin}
          </Text>
          <Text style={{ color: theme.textWhite, fontSize: 14, marginTop: 4, opacity: 0.8 }}>
            {lang.bemVindo}
          </Text>
        </View>

        {/* Estatisticas */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <Text style={{ color: theme.textBody, fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
            {lang.estatisticas}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {stats.map((stat, i) => (
              <View
                key={i}
                style={{
                  width: "48%",
                  backgroundColor: theme.cardBg,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: stat.alert ? theme.danger : theme.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                  {stat.alert && (
                    <View style={{ backgroundColor: theme.danger, borderRadius: 10, width: 20, height: 20, justifyContent: "center", alignItems: "center" }}>
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}>{stat.value}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: theme.textBody, fontSize: 22, fontWeight: "bold", marginTop: 8 }}>
                  {stat.value}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 2 }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Acoes rapidas */}
        <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
          <Text style={{ color: theme.textBody, fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
            {lang.acoesRapidas}
          </Text>
          {actions.map((action, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => router.push(action.route as any)}
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.border,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: theme.accent + "20", justifyContent: "center", alignItems: "center", marginRight: 14 }}>
                <Ionicons name={action.icon as any} size={22} color={theme.accent} />
              </View>
              <Text style={{ color: theme.textBody, fontSize: 16, fontWeight: "600", flex: 1 }}>
                {action.label}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Resumo */}
        <View style={{ paddingHorizontal: 24, marginTop: 8, marginBottom: 32 }}>
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.textBody, fontSize: 15, fontWeight: "bold", marginBottom: 8 }}>
              Resumo
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 20 }}>
              {lang.resumo}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}