import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, Alert, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAdminComments, useDeleteCommentAdmin } from "../../hooks/useAdmin";
import { useTheme } from "../context/ThemeContext";

// =============================================================================
// Admin Comments — Gestao de Comentarios
// =============================================================================
// Lista todos os comentarios da app com pesquisa.
// Usa hooks do useAdmin.ts para buscar e manipular dados.
// O admin pode pesquisar por texto e apagar comentarios ofensivos.
// =============================================================================

export default function AdminComments() {
  const { darkMode, language } = useTheme();

  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useAdminComments({ search });
  const comments = data?.comments || [];

  const deleteComment = useDeleteCommentAdmin();

  // Traducoes
  const t = {
    pt: {
      titulo: "Comentarios",
      total: "total",
      pesquisar: "Pesquisar comentarios...",
      remover: "Remover",
      confirmarRemover: "Queres remover este comentario?",
      nenhum: "Nenhum comentario encontrado.",
      em: "Em:",
    },
    en: {
      titulo: "Comments",
      total: "total",
      pesquisar: "Search comments...",
      remover: "Remove",
      confirmarRemover: "Do you want to remove this comment?",
      nenhum: "No comments found.",
      em: "On:",
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
    inputBg: darkMode ? "#2d4a1e" : "#FFFFFF",
    inputText: darkMode ? "#dcedc8" : "#1B1B1B",
    placeholder: darkMode ? "#7cb342" : "#999999",
  };

  const handleDelete = (commentId: string, content: string) => {
    Alert.alert(
      lang.remover,
      content.substring(0, 60) + (content.length > 60 ? "..." : ""),
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: lang.remover,
          style: "destructive",
          onPress: () => deleteComment.mutate(commentId),
        },
      ]
    );
  };

  const renderComment = ({ item }: { item: any }) => (
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
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.accent + "20", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
          <Text style={{ color: theme.textMain, fontWeight: "bold", fontSize: 16 }}>
            {(item.user?.FirstName || item.user?.Username || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.textBody, fontSize: 14, fontWeight: "600" }}>
            {item.user?.FirstName} {item.user?.LastName}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>@{item.user?.Username}</Text>
          <Text style={{ color: theme.textBody, fontSize: 14, marginTop: 8, lineHeight: 20 }}>
            {item.content}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 6 }}>
            {lang.em} {item.post?.content?.substring(0, 40)}...
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>
            {new Date(item.createdAt).toLocaleString("pt-PT")}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border, justifyContent: "flex-end" }}>
        <TouchableOpacity
          onPress={() => handleDelete(item._id, item.content)}
          style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.danger + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color={theme.danger} />
          <Text style={{ color: theme.danger, fontSize: 13, marginLeft: 4, fontWeight: "600" }}>
            {lang.remover}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ backgroundColor: theme.headerBg, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <Text style={{ color: theme.textWhite, fontSize: 24, fontWeight: "bold" }}>
          {lang.titulo}
        </Text>
        <Text style={{ color: theme.textWhite, fontSize: 14, marginTop: 4, opacity: 0.8 }}>
          {data?.total || 0} {lang.total}
        </Text>
      </View>

      {/* Search */}
      <View style={{ marginHorizontal: 24, marginTop: 16, marginBottom: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.inputBg,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <Ionicons name="search" size={18} color={theme.textMain} />
          <TextInput
            placeholder={lang.pesquisar}
            placeholderTextColor={theme.placeholder}
            style={{ flex: 1, marginLeft: 8, color: theme.inputText, fontSize: 14 }}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.accent} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 48 }}>
            <Ionicons name="chatbubble-outline" size={48} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, marginTop: 12 }}>{lang.nenhum}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}