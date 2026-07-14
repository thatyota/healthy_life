import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, Alert, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAdminPosts, useDeletePostAdmin } from "../../hooks/useAdmin";
import { useTheme } from "../context/ThemeContext";

// =============================================================================
// Admin Posts — Gestao de Publicacoes
// =============================================================================
// Lista todas as publicacoes da app com opcoes de apagar.
// Usa hooks do useAdmin.ts para buscar e manipular dados.
// O admin pode filtrar por status e apagar posts inapropriados.
// =============================================================================

export default function AdminPosts() {
  const { darkMode, language } = useTheme();

  // Step 1: Busca posts via hook
  const { data, isLoading, refetch } = useAdminPosts();
  const posts = data?.posts || [];

  // Step 2: Hook de delete — espera string (postId)
  const deletePost = useDeletePostAdmin();

  // Step 3: Filtro
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const filteredPosts =
    filter === "all" ? posts : posts.filter((p: any) => p.status === filter);

  // Traducoes
  const t = {
    pt: {
      titulo: "Publicacoes",
      total: "total",
      todas: "Todas",
      pendente: "Pendente",
      aprovada: "Aprovada",
      rejeitada: "Rejeitada",
      apagar: "Apagar",
      confirmarApagar: "Queres apagar esta publicacao?",
      nenhuma: "Nenhuma publicacao encontrada.",
      por: "por",
      desconhecido: "Desconhecido",
    },
    en: {
      titulo: "Posts",
      total: "total",
      todas: "All",
      pendente: "Pending",
      aprovada: "Approved",
      rejeitada: "Rejected",
      apagar: "Delete",
      confirmarApagar: "Do you want to delete this post?",
      nenhuma: "No posts found.",
      por: "by",
      desconhecido: "Unknown",
    },
  };

  const lang = t[language];

  // Cores do tema
  const theme = {
    bg: darkMode ? "#1a2f0a" : "#F1F8E9",
    cardBg: darkMode ? "#2d4a1e" : "#FFFFFF",
    headerBg: darkMode ? "#2d4a1e" : "#3A6604",
    textMain: darkMode ? "#a8e063" : "#3A6604",
    textBody: darkMode ? "#dcedc8" : "#1B1B1B",
    textMuted: darkMode ? "#7cb342" : "#666666",
    textWhite: "#FFFFFF",
    border: darkMode ? "#3e5f23" : "#C8E6C9",
    accent: "#8bc34a",
    danger: "#C62828",
  };

  // Filtros traduzidos
  const filters: { key: typeof filter; label: string }[] = [
    { key: "all", label: lang.todas },
    { key: "pending", label: lang.pendente },
    { key: "approved", label: lang.aprovada },
    { key: "rejected", label: lang.rejeitada },
  ];

  // Cores por status
  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: darkMode ? "#4a3b1a" : "#FFF3E0", text: "#FFB74D" },
    approved: { bg: darkMode ? "#1a3a1a" : "#E8F5E9", text: "#81C784" },
    rejected: { bg: darkMode ? "#3a1a1a" : "#FFEBEE", text: "#E57373" },
  };

  // Step 4: Apaga post — deletePost espera string (postId)
  const handleDelete = (postId: string) => {
    Alert.alert("Confirmar", lang.confirmarApagar, [
      { text: "Cancelar", style: "cancel" },
      {
        text: lang.apagar,
        style: "destructive",
        onPress: () => deletePost.mutate(postId),
      },
    ]);
  };

  // Step 5: Render item
  const renderPost = ({ item }: { item: any }) => (
    <View
      style={{
        backgroundColor: theme.cardBg,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 24,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ color: theme.textBody, fontSize: 15, fontWeight: "bold" }} numberOfLines={2}>
            {item.title || item.content?.substring(0, 50)}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
            {lang.por} {item.author?.name || item.user?.Username || lang.desconhecido}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: statusColors[item.status]?.bg || theme.border,
          }}
        >
          <Text style={{ color: statusColors[item.status]?.text || theme.textMuted, fontSize: 11, fontWeight: "600", textTransform: "capitalize" }}>
            {item.status || "pending"}
          </Text>
        </View>
      </View>

      {/* Acoes */}
      <View style={{ flexDirection: "row", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
        <TouchableOpacity
          onPress={() => handleDelete(item._id || item.id)}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Ionicons name="trash-outline" size={18} color={theme.danger} />
          <Text style={{ color: theme.danger, fontSize: 14, marginLeft: 4, fontWeight: "600" }}>
            {lang.apagar}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: theme.headerBg, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <Text style={{ color: theme.textWhite, fontSize: 24, fontWeight: "bold" }}>
          {lang.titulo}
        </Text>
        <Text style={{ color: theme.textWhite, fontSize: 14, marginTop: 4, opacity: 0.8 }}>
          {posts.length} {lang.total}
        </Text>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 8,
              backgroundColor: filter === f.key ? theme.accent : theme.cardBg,
              borderWidth: 1,
              borderColor: filter === f.key ? theme.accent : theme.border,
            }}
          >
            <Text style={{ color: filter === f.key ? "#1a2f0a" : theme.textMain, fontSize: 13, fontWeight: "600" }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista */}
      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.accent} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 48 }}>
            <Ionicons name="newspaper-outline" size={48} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, marginTop: 12 }}>{lang.nenhuma}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}