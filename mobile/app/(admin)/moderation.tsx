import React from "react";
import {
  View, Text, FlatList, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useModerationLogs } from "../../hooks/useAdmin";
import { useTheme } from "../context/ThemeContext";

// =============================================================================
// Admin Moderation — Logs de Moderacao
// =============================================================================
// Mostra o historico de acoes do admin (ban, unban, timeout, delete).
// Usa o hook useModerationLogs() para buscar logs do backend.
// Cada log mostra: acao, admin, alvo, motivo e data.
// =============================================================================

export default function AdminModeration() {
  const { darkMode, language } = useTheme();
  const { data, isLoading } = useModerationLogs();
  const logs = data?.logs || [];

  // Traducoes
  const t = {
    pt: {
      titulo: "Logs de Moderacao",
      nenhuma: "Nenhuma acao de moderacao.",
      duracao: "Duracao",
      expira: "Expira",
      hora: "h",
    },
    en: {
      titulo: "Moderation Logs",
      nenhuma: "No moderation actions.",
      duracao: "Duration",
      expira: "Expires",
      hora: "h",
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
    success: "#2E7D32",
    warning: "#FFB74D",
  };

  // Retorna icone para cada tipo de acao
  const getActionIcon = (action: string) => {
    switch (action) {
      case "ban": return <Ionicons name="ban" size={16} color={theme.danger} />;
      case "unban": return <Ionicons name="checkmark-circle" size={16} color={theme.success} />;
      case "timeout": return <Ionicons name="time" size={16} color={theme.warning} />;
      case "delete_post": return <Ionicons name="trash" size={16} color={theme.danger} />;
      case "delete_comment": return <Ionicons name="chatbubble-ellipses" size={16} color={theme.danger} />;
      default: return <Ionicons name="alert" size={16} color={theme.textMuted} />;
    }
  };

  // Retorna cores para cada acao
  const getActionStyle = (action: string) => {
    switch (action) {
      case "ban": return { bg: darkMode ? "#3a1a1a" : "#FFEBEE", text: theme.danger };
      case "unban": return { bg: darkMode ? "#1a3a1a" : "#E8F5E9", text: theme.success };
      case "timeout": return { bg: darkMode ? "#4a3b1a" : "#FFF3E0", text: theme.warning };
      case "delete_post": return { bg: darkMode ? "#3a1a1a" : "#FFEBEE", text: theme.danger };
      case "delete_comment": return { bg: darkMode ? "#3a1a1a" : "#FFEBEE", text: theme.danger };
      default: return { bg: darkMode ? "#2d4a1e" : "#F1F8E9", text: theme.textMuted };
    }
  };

  // Renderiza cada log
  const renderLog = ({ item }: { item: any }) => {
    const style = getActionStyle(item.action);
    return (
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
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <View style={{ marginRight: 8 }}>{getActionIcon(item.action)}</View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 10,
              backgroundColor: style.bg,
            }}
          >
            <Text style={{ color: style.text, fontSize: 11, fontWeight: "bold", textTransform: "capitalize" }}>
              {item.action.replace("_", " ")}
            </Text>
          </View>
          <Text style={{ color: theme.textMuted, fontSize: 11, marginLeft: "auto" }}>
            {new Date(item.createdAt).toLocaleString("pt-PT")}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <Text style={{ color: theme.textMain, fontSize: 14, fontWeight: "600" }}>
            {item.adminId?.name || "Admin"}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginHorizontal: 6 }}>-&gt;</Text>
          <Text style={{ color: theme.textBody, fontSize: 14 }}>
            {item.targetUserId?.name || "Sistema"}
          </Text>
        </View>

        <View style={{ backgroundColor: darkMode ? "#1a2f0a" : "#F1F8E9", borderRadius: 8, padding: 10, marginTop: 4 }}>
          <Text style={{ color: theme.textMuted, fontSize: 12, fontStyle: "italic" }}>
            &quot;{item.reason}&quot;
          </Text>
        </View>

        {item.duration && (
          <Text style={{ color: theme.warning, fontSize: 12, marginTop: 6 }}>
            {lang.duracao}: {item.duration}{lang.hora} | {lang.expira}: {new Date(item.expiresAt).toLocaleString("pt-PT")}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ backgroundColor: theme.headerBg, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 }}>
        <Text style={{ color: theme.textWhite, fontSize: 24, fontWeight: "bold" }}>
          {lang.titulo}
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLog}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 48 }}>
              <Ionicons name="shield-checkmark" size={48} color={theme.textMuted} />
              <Text style={{ color: theme.textMuted, marginTop: 12 }}>{lang.nenhuma}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}