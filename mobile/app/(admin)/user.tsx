import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAdminUsers, useBanUser, useUnbanUser, useTimeoutUser } from "../../hooks/useAdmin";
import { useTheme } from "../context/ThemeContext";

// =============================================================================
// Admin Users — Gestao de Utilizadores
// =============================================================================
// Lista todos os utilizadores da app com opcoes de gestao.
// Usa hooks do useAdmin.ts para buscar e manipular dados.
// O admin pode: banir, desbanir, ou dar timeout num user.
// =============================================================================

export default function AdminUsers() {
  const { darkMode, language } = useTheme();

  // Step 1: Busca users via hook
  const { data, isLoading, refetch } = useAdminUsers();
  const users = data?.users || [];

  // Step 2: Hooks de mutacao
  // useBanUser espera: { userId: string; reason?: string }
  const banUser = useBanUser();
  // useUnbanUser espera: string (userId)
  const unbanUser = useUnbanUser();
  // useTimeoutUser espera: { userId: string; duration: number; reason?: string }
  const timeoutUser = useTimeoutUser();

  // Traducoes
  const t = {
    pt: {
      titulo: "Utilizadores",
      registados: "registados",
      banir: "Banir",
      desbanir: "Desbanir",
      timeout: "Timeout",
      confirmarBan: "Queres banir este utilizador?",
      confirmarUnban: "Queres desbanir este utilizador?",
      confirmarTimeout: "Queres dar timeout (7 dias) neste utilizador?",
      nenhum: "Nenhum utilizador encontrado.",
      admin: "admin",
      user: "user",
      banido: "banido",
      ativo: "ativo",
    },
    en: {
      titulo: "Users",
      registados: "registered",
      banir: "Ban",
      desbanir: "Unban",
      timeout: "Timeout",
      confirmarBan: "Do you want to ban this user?",
      confirmarUnban: "Do you want to unban this user?",
      confirmarTimeout: "Do you want to timeout (7 days) this user?",
      nenhum: "No users found.",
      admin: "admin",
      user: "user",
      banido: "banned",
      ativo: "active",
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

  // Step 3: Toggle ban/unban
  // useBanUser espera objeto: { userId: string; reason?: string }
  // useUnbanUser espera string: userId
  const handleToggleBan = (userId: string, isBanned: boolean) => {
    Alert.alert(
      "Confirmar",
      isBanned ? lang.confirmarUnban : lang.confirmarBan,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            if (isBanned) {
              // unbanUser aceita string diretamente
              unbanUser.mutate(userId);
            } else {
              // banUser aceita objeto com userId
              banUser.mutate({ userId });
            }
          },
        },
      ]
    );
  };

  // Timeout — useTimeoutUser espera objeto: { userId, duration, reason? }
  const handleTimeout = (userId: string) => {
    Alert.alert(
      "Confirmar",
      lang.confirmarTimeout,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            timeoutUser.mutate({ userId, duration: 7 });
          },
        },
      ]
    );
  };

  // Step 4: Render item
  const renderUser = ({ item }: { item: any }) => (
    <View
      style={{
        backgroundColor: theme.cardBg,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 24,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.border,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.accent + "20", justifyContent: "center", alignItems: "center", marginRight: 14 }}>
        <Text style={{ color: theme.textMain, fontWeight: "bold", fontSize: 18 }}>
          {(item.name || item.Username || "?").charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.textBody, fontSize: 15, fontWeight: "bold" }}>
          {item.name || `${item.FirstName} ${item.LastName}` || item.Username}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>{item.email}</Text>
        <View style={{ flexDirection: "row", marginTop: 6 }}>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
              backgroundColor: item.role === "admin" ? theme.accent : theme.accent + "20",
              marginRight: 6,
            }}
          >
            <Text style={{ color: item.role === "admin" ? "#1a2f0a" : theme.accent, fontSize: 11, fontWeight: "600" }}>
              {item.role === "admin" ? lang.admin : lang.user}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
              backgroundColor: item.isBanned ? theme.danger + "20" : theme.success + "20",
            }}
          >
            <Text style={{ color: item.isBanned ? theme.danger : theme.success, fontSize: 11, fontWeight: "600" }}>
              {item.isBanned ? lang.banido : lang.ativo}
            </Text>
          </View>
        </View>
      </View>

      {/* Botoes de acao */}
      <View style={{ flexDirection: "row" }}>
        {/* Timeout (so se nao estiver banido) */}
        {!item.isBanned && (
          <TouchableOpacity
            onPress={() => handleTimeout(item._id || item.id)}
            style={{ marginRight: 8, padding: 6 }}
          >
            <Ionicons name="time-outline" size={22} color={theme.warning} />
          </TouchableOpacity>
        )}

        {/* Ban/Unban */}
        <TouchableOpacity
          onPress={() => handleToggleBan(item._id || item.id, item.isBanned)}
          style={{ padding: 6 }}
        >
          <Ionicons
            name={item.isBanned ? "checkmark-circle-outline" : "ban-outline"}
            size={26}
            color={item.isBanned ? theme.success : theme.danger}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Stats topo */}
      <View style={{ backgroundColor: theme.headerBg, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <Text style={{ color: theme.textWhite, fontSize: 24, fontWeight: "bold" }}>
          {lang.titulo}
        </Text>
        <Text style={{ color: theme.textWhite, fontSize: 14, marginTop: 4, opacity: 0.8 }}>
          {users.length} {lang.registados}
        </Text>
      </View>

      {/* Lista */}
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.accent} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 48 }}>
            <Ionicons name="people-outline" size={48} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, marginTop: 12 }}>{lang.nenhum}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}