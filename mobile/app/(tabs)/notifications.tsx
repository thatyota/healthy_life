import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNotifications, useMarkAllAsRead } from "@/hooks/useNotifications";
import NotificationItem from "@/components/NotificationItem";

export default function NotificationsScreen() {
  const { data: notifications, isLoading, refetch } = useNotifications();
  const markAllAsRead = useMarkAllAsRead();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]">
      <View className="flex-row justify-between items-center px-4 py-3.5 bg-white border-b border-[#C8E6C9]">
        <Text className="text-xl font-bold text-[#3A6604]">Notificações</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAllAsRead.mutate()}
            className="flex-row items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9] rounded-full"
            activeOpacity={0.7}
          >
            <Feather name="check-circle" size={16} color="#65B307" />
            <Text className="text-[#65B307] font-semibold text-[13px]">
              Marcar todas lidas
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#65B307" />
        </View>
      ) : notifications && notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <NotificationItem notification={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#65B307"
              colors={["#65B307"]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 rounded-full bg-[#E8F5E9] justify-center items-center mb-4">
            <Ionicons name="notifications-outline" size={40} color="#65B307" />
          </View>
          <Text className="text-[#3A6604] font-bold text-lg text-center">
            Sem notificações
          </Text>
          <Text className="text-[#486623] text-base mt-2 text-center">
            Quando alguém interagir contigo, aparece aqui.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}