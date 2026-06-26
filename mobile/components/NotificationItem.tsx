import { View, Text, Image, TouchableOpacity, Animated, PanResponder } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Notification, useMarkAsRead, useDeleteNotification } from "@/hooks/useNotifications";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useRef, useCallback } from "react";

interface Props {
  notification: Notification;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function NotificationItem({ notification }: Props) {
  const router = useRouter();
  const { userId } = useAuth();
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx < -5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0 && gestureState.dx > -120) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -80) {
          deleteNotification.mutate(notification._id);
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }).start();
      },
    })
  ).current;

  const getNotificationText = () => {
    switch (notification.type) {
      case "follow": return "começou a seguir-te";
      case "like": return "gostou da tua receita";
      case "comment": return "comentou na tua receita";
      default: return "interagiu contigo";
    }
  };

  const getIconName = () => {
    switch (notification.type) {
      case "follow": return "person-add";
      case "like": return "heart";
      case "comment": return "chatbubble";
      default: return "notifications";
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case "follow": return "#65B307";
      case "like": return "#ED4956";
      case "comment": return "#3A6604";
      default: return "#486623";
    }
  };

  const handlePress = useCallback(() => {
    if (!notification.read) {
      markAsRead.mutate(notification._id);
    }
    if (notification.type === "follow") {
      router.push(`/profile/${notification.from.Username}` as any);
    } else if (notification.post) {
      router.push(`/post/${notification.post}` as any);
    }
  }, [notification, markAsRead, router]);

  const displayName = `${notification.from?.FirstName || ""} ${notification.from?.LastName || ""}`.trim() || notification.from?.Username;
  const isOwnProfile = userId === notification.from?._id;

  return (
    <View className="relative overflow-hidden">
      <View 
        className="absolute right-0 top-0 bottom-0 w-full bg-[#C62828] justify-center items-end pr-6"
        style={{ zIndex: 1 }}
      >
        <View className="items-center">
          <Ionicons name="trash-outline" size={24} color="white" />
          <Text className="text-white text-[11px] mt-1 font-medium">Eliminar</Text>
        </View>
      </View>

      <Animated.View
        style={{ transform: [{ translateX }], zIndex: 2 }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          className={`flex-row items-center px-4 py-3.5 border-b border-[#E8F5E9] ${
            !notification.read ? "bg-[#E8F5E9]" : "bg-white"
          }`}
        >
          <View className="relative">
            {notification.from?.ProfilePicture ? (
              <Image
                source={{ uri: notification.from.ProfilePicture }}
                className="w-[50px] h-[50px] rounded-full"
              />
            ) : (
              <View className="w-[50px] h-[50px] rounded-full bg-[#3A6604] justify-center items-center">
                <Text className="text-white font-bold text-lg">
                  {notification.from?.Username?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View className="absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] rounded-full bg-white justify-center items-center border-2 border-[#E8F5E9]">
              <Ionicons name={getIconName()} size={12} color={getIconColor()} />
            </View>
          </View>

          <View className="flex-1 ml-3.5 mr-2">
            <Text className="text-[#1a1a1a] text-[14px] leading-[20px]" numberOfLines={2}>
              <Text className="font-bold text-[#3A6604]">{displayName}</Text>
              <Text className="text-[#1a1a1a]"> {getNotificationText()}</Text>
            </Text>
            <Text className="text-[#65B307] text-[12px] mt-1 font-medium">
              {formatTimeAgo(notification.createdAt)}
            </Text>
          </View>

          {notification.type === "follow" && !isOwnProfile ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/profile/${notification.from.Username}` as any);
              }}
              className="px-4 py-2 bg-[#65B307] rounded-full"
            >
              <Text className="text-white font-bold text-[12px]">Seguir</Text>
            </TouchableOpacity>
          ) : !notification.read ? (
            <View className="w-2.5 h-2.5 rounded-full bg-[#65B307] ml-1" />
          ) : (
            <View className="w-2.5 h-2.5 rounded-full bg-transparent ml-1" />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}