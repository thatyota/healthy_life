import React from "react";
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdminUsers, useBanUser, useUnbanUser, useTimeoutUser } from "../../hooks/useAdmin";

// =============================================================================
// Admin - Gestao de Utilizadores
// =============================================================================
// Lista todos os utilizadores da app com opcoes de gestao
// Usa hooks do useAdmin.ts para buscar e manipular dados
// =============================================================================

export default function AdminUsers() {
  // Step 1: Busca users via hook
  const { data, isLoading, refetch } = useAdminUsers();
  const users = data?.users || [];

  // Step 2: Hooks de mutacao
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const timeoutUser = useTimeoutUser();

  // Step 3: Toggle ban/unban
  const handleToggleBan = (userId: string, isBanned: boolean) => {
    Alert.alert(
      "Confirmar",
      isBanned ? "Queres desbanir este utilizador?" : "Queres banir este utilizador?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            if (isBanned) {
              unbanUser.mutate(userId);
            } else {
              banUser.mutate(userId);
            }
          },
        },
      ]
    );
  };

  // Step 4: Render item
  const renderUser = ({ item }: { item: any }) => (
    <View className="bg-white rounded-2xl p-4 mb-3 mx-6 shadow-sm border border-[#3A6604]/10 flex-row items-center">
      <View className="w-12 h-12 rounded-full bg-[#E8F5E9] justify-center items-center mr-4">
        <Text className="text-[#3A6604] font-bold text-lg">
          {(item.name || item.Username || "?").charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-[#1B1B1B]">
          {item.name || `${item.FirstName} ${item.LastName}` || item.Username}
        </Text>
        <Text className="text-sm text-[#666]">{item.email || item.email}</Text>
        <View className="flex-row mt-1">
          <View
            className="px-2 py-0.5 rounded-full mr-2"
            style={{
              backgroundColor: item.role === "admin" ? "#3A6604" : "#E8F5E9",
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: item.role === "admin" ? "#fff" : "#3A6604" }}
            >
              {item.role || "user"}
            </Text>
          </View>
          <View
            className="px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: item.isBanned ? "#FFEBEE" : "#E8F5E9",
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: item.isBanned ? "#C62828" : "#2E7D32" }}
            >
              {item.isBanned ? "banido" : "ativo"}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={() => handleToggleBan(item._id || item.id, item.isBanned)}>
        <Ionicons
          name={item.isBanned ? "checkmark-circle-outline" : "ban-outline"}
          size={24}
          color={item.isBanned ? "#2E7D32" : "#C62828"}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F1F8E9]">
      {/* Stats topo */}
      <View className="bg-[#3A6604] px-6 pt-6 pb-8 rounded-b-[32px]">
        <Text className="text-white text-2xl font-bold">Utilizadores</Text>
        <Text className="text-white/80 text-base mt-1">
          {users.length} registados
        </Text>
      </View>

      {/* Lista */}
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3A6604" />
        }
        ListEmptyComponent={
          <View className="items-center mt-12">
            <Ionicons name="people-outline" size={48} color="#3A6604" />
            <Text className="text-[#666] mt-4">Nenhum utilizador encontrado.</Text>
          </View>
        }
      />
    </View>
  );
}