import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdminPosts, useDeletePostAdmin } from "../../hooks/useAdmin";

// =============================================================================
// Admin - Gestao de Publicacoes
// =============================================================================
// Lista todas as publicacoes com opcoes de aprovar/rejeitar/apagar
// Usa hooks do useAdmin.ts para buscar e manipular dados
// =============================================================================

export default function AdminPosts() {
  // Step 1: Busca posts via hook
  const { data, isLoading, refetch } = useAdminPosts();
  const posts = data?.posts || [];

  // Step 2: Hook de delete
  const deletePost = useDeletePostAdmin();

  // Step 3: Filtro
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const filteredPosts =
    filter === "all" ? posts : posts.filter((p: any) => p.status === filter);

  // Step 4: Apaga post
  const handleDelete = (postId: string) => {
    Alert.alert("Confirmar", "Queres apagar esta publicacao?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: () => deletePost.mutate(postId),
      },
    ]);
  };

  // Cores por status
  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#FFF3E0", text: "#E65100" },
    approved: { bg: "#E8F5E9", text: "#2E7D32" },
    rejected: { bg: "#FFEBEE", text: "#C62828" },
  };

  // Step 5: Render item
  const renderPost = ({ item }: { item: any }) => (
    <View className="bg-white rounded-2xl p-4 mb-3 mx-6 shadow-sm border border-[#3A6604]/10">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <Text className="text-base font-bold text-[#1B1B1B]" numberOfLines={2}>
            {item.title || item.content?.substring(0, 50)}
          </Text>
          <Text className="text-sm text-[#666] mt-1">por {item.author?.name || item.user?.Username || "Desconhecido"}</Text>
          <Text className="text-xs text-[#999] mt-0.5">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</Text>
        </View>
        <View
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: statusColors[item.status]?.bg || "#eee" }}
        >
          <Text
            className="text-xs font-semibold capitalize"
            style={{ color: statusColors[item.status]?.text || "#666" }}
          >
            {item.status || "pending"}
          </Text>
        </View>
      </View>

      {/* Acoes */}
      <View className="flex-row mt-3 pt-3 border-t border-[#3A6604]/10">
        <TouchableOpacity
          onPress={() => handleDelete(item._id || item.id)}
          className="flex-row items-center"
        >
          <Ionicons name="trash-outline" size={18} color="#C62828" />
          <Text className="text-[#C62828] text-sm ml-1 font-semibold">Apagar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F1F8E9]">
      {/* Header */}
      <View className="bg-[#3A6604] px-6 pt-6 pb-8 rounded-b-[32px]">
        <Text className="text-white text-2xl font-bold">Publicacoes</Text>
        <Text className="text-white/80 text-base mt-1">{posts.length} total</Text>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-6 mt-4 mb-2"
      >
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            className={`px-4 py-2 rounded-full mr-2 ${
              filter === f ? "bg-[#3A6604]" : "bg-white border border-[#3A6604]/20"
            }`}
          >
            <Text
              className={`text-sm font-semibold capitalize ${
                filter === f ? "text-white" : "text-[#3A6604]"
              }`}
            >
              {f === "all" ? "Todas" : f}
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
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3A6604" />
        }
        ListEmptyComponent={
          <View className="items-center mt-12">
            <Ionicons name="newspaper-outline" size={48} color="#3A6604" />
            <Text className="text-[#666] mt-4">Nenhuma publicacao encontrada.</Text>
          </View>
        }
      />
    </View>
  );
}