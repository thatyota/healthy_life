import React from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useModerationLogs } from "../../hooks/useAdmin";
import { Ionicons } from "@expo/vector-icons";

/**
 * AdminModeration - Tela de historico de acoes de moderacao
 * Mostra logs de ban, unban, timeout, delete_post, delete_comment.
 * Dados: useModerationLogs() -> GET /api/admin/logs
 */
export default function AdminModeration() {
  const { data, isLoading } = useModerationLogs();

  const logs = data?.logs || [];

  // Retorna icone para cada tipo de acao
  const getActionIcon = (action: string) => {
    switch (action) {
      case "ban": return <Ionicons name="ban" size={16} color="#EF4444" />;
      case "unban": return <Ionicons name="checkmark-circle" size={16} color="#22C55E" />;
      case "timeout": return <Ionicons name="time" size={16} color="#F97316" />;
      case "delete_post": return <Ionicons name="trash" size={16} color="#EF4444" />;
      case "delete_comment": return <Ionicons name="chatbubble-ellipses" size={16} color="#EF4444" />;
      default: return <Ionicons name="alert" size={16} color="#8E8E8E" />;
    }
  };

  // Retorna classes de cor para cada acao
  const getActionColor = (action: string) => {
    switch (action) {
      case "ban": return "bg-red-100 text-red-700";
      case "unban": return "bg-green-100 text-green-700";
      case "timeout": return "bg-orange-100 text-orange-700";
      case "delete_post": return "bg-red-50 text-red-600";
      case "delete_comment": return "bg-red-50 text-red-600";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Renderiza cada log
  const renderLog = ({ item }: { item: any }) => (
    <View className="bg-white rounded-xl p-4 mb-2 border border-[#C8E6C9]">
      <View className="flex-row items-center mb-2">
        <View className="mr-2">{getActionIcon(item.action)}</View>
        <Text className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${getActionColor(item.action)}`}>
          {item.action.replace("_", " ")}
        </Text>
        <Text className="text-xs text-[#8E8E8E] ml-auto">
          {new Date(item.createdAt).toLocaleString("pt-PT")}
        </Text>
      </View>

      <View className="flex-row items-center mb-1">
        <Text className="text-sm text-[#3A6604] font-bold">{item.adminId?.name || "Admin"}</Text>
        <Text className="text-xs text-[#8E8E8E] mx-1">-&gt;</Text>
        <Text className="text-sm text-[#486623]">{item.targetUserId?.name || "Sistema"}</Text>
      </View>

      <View className="bg-[#F1F8E9] rounded-lg p-2 mt-1">
        <Text className="text-xs text-[#486623] italic">&quot;{item.reason}&quot;</Text>
      </View>

      {item.duration && (
        <Text className="text-xs text-orange-600 mt-1">
          Duracao: {item.duration}h | Expira: {new Date(item.expiresAt).toLocaleString("pt-PT")}
        </Text>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-[#F1F8E9]">
      <View className="bg-[#3A6604] pt-14 pb-4 px-5">
        <Text className="text-white text-xl font-bold">Logs Moderacao</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#3A6604" className="mt-10" />
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLog}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center mt-10">
              <Ionicons name="shield-checkmark" size={48} color="#C8E6C9" />
              <Text className="text-[#8E8E8E] mt-2">Nenhuma acao de moderacao</Text>
            </View>
          }
        />
      )}
    </View>
  );
}