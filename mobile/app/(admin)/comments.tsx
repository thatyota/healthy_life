import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdminComments, useDeleteCommentAdmin } from "../../hooks/useAdmin";

export default function AdminComments() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useAdminComments({ search });
  const comments = data?.comments || [];

  const deleteComment = useDeleteCommentAdmin();

  const handleDelete = (commentId: string, content: string) => {
    Alert.alert(
      "Remover Comentario",
      content.substring(0, 60) + (content.length > 60 ? "..." : ""),
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => deleteComment.mutate(commentId),
        },
      ]
    );
  };

  const renderComment = ({ item }: { item: any }) => (
    <View className="bg-white rounded-2xl p-4 mb-3 mx-6 shadow-sm border border-[#3A6604]/10">
      <View className="flex-row items-start">
        <View className="w-10 h-10 rounded-full bg-[#E8F5E9] justify-center items-center mr-3">
          <Text className="text-[#3A6604] font-bold text-base">
            {(item.user?.FirstName || item.user?.Username || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-[#1B1B1B]">
            {item.user?.FirstName} {item.user?.LastName}
          </Text>
          <Text className="text-xs text-[#999]">@{item.user?.Username}</Text>
          <Text className="text-sm text-[#333] mt-2 leading-5">{item.content}</Text>
          <Text className="text-xs text-[#999] mt-2">
            Em: {item.post?.content?.substring(0, 40)}...
          </Text>
          <Text className="text-xs text-[#bbb] mt-1">
            {new Date(item.createdAt).toLocaleString("pt-PT")}
          </Text>
        </View>
      </View>

      <View className="flex-row mt-3 pt-3 border-t border-[#3A6604]/10 justify-end">
        <TouchableOpacity
          onPress={() => handleDelete(item._id, item.content)}
          className="flex-row items-center bg-[#FFEBEE] px-3 py-2 rounded-xl"
        >
          <Ionicons name="trash-outline" size={16} color="#C62828" />
          <Text className="text-[#C62828] text-sm ml-1 font-semibold">Remover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F1F8E9]">
      <View className="bg-[#3A6604] px-6 pt-6 pb-8 rounded-b-[32px]">
        <Text className="text-white text-2xl font-bold">Comentarios</Text>
        <Text className="text-white/80 text-base mt-1">{data?.total || 0} total</Text>
      </View>

      <View className="mx-6 mt-4 mb-2">
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm border border-[#3A6604]/10">
          <Ionicons name="search" size={18} color="#3A6604" />
          <TextInput
            placeholder="Pesquisar comentarios..."
            placeholderTextColor="#999"
            className="flex-1 ml-2 text-[#1B1B1B]"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#999" />
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
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3A6604" />
        }
        ListEmptyComponent={
          <View className="items-center mt-12">
            <Ionicons name="chatbubble-outline" size={48} color="#3A6604" />
            <Text className="text-[#666] mt-4">Nenhum comentario encontrado.</Text>
          </View>
        }
      />
    </View>
  );
}