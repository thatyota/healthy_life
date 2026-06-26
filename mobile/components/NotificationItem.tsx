import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Notification } from "@/hooks/useNotifications";
import { useRouter } from "expo-router";
import { useMarkAsRead } from "@/hooks/useNotifications";

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
  const markAsRead = useMarkAsRead();

  const getNotificationText = () => {
    switch (notification.type) {
      case "follow":
        return "começou a seguir-te";
      case "like":
        return "gostou da tua receita";
      case "comment":
        return "comentou na tua receita";
      default:
        return "interagiu contigo";
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "follow":
        return <Ionicons name="person-add" size={20} color="#65B307" />;
      case "like":
        return <Ionicons name="heart" size={20} color="#ED4956" />;
      case "comment":
        return <Ionicons name="chatbubble" size={20} color="#3A6604" />;
      default:
        return <Ionicons name="notifications" size={20} color="#486623" />;
    }
  };

  const handlePress = () => {
    if (!notification.read) {
      markAsRead.mutate(notification._id);
    }

    if (notification.type === "follow") {
      router.push(`/profile/${notification.from.Username}` as any);
    } else if (notification.post) {
      router.push(`/post/${notification.post}` as any);
    }
  };

  const displayName = `${notification.from?.FirstName || ""} ${notification.from?.LastName || ""}`.trim() || notification.from?.Username;

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`flex-row items-center px-4 py-3 border-b border-[#E8F5E9] ${
        !notification.read ? "bg-[#E8F5E9]" : "bg-white"
      }`}
    >
      {/* Avatar */}
      {notification.from?.ProfilePicture ? (
        <Image
          source={{ uri: notification.from.ProfilePicture }}
          className="w-12 h-12 rounded-full"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-[#3A6604] justify-center items-center">
          <Text className="text-white font-bold text-lg">
            {notification.from?.Username?.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Icon badge */}
      <View className="absolute left-14 top-3 w-5 h-5 rounded-full bg-white justify-center items-center">
        {getIcon()}
      </View>

      {/* Content */}
      <View className="flex-1 ml-3">
        <Text className="text-[#1a1a1a] text-[14px] leading-[20px]">
          <Text className="font-bold text-[#3A6604]">{displayName}</Text>{" "}
          {getNotificationText()}
        </Text>
        <Text className="text-[#486623] text-[12px] mt-1">
          {formatTimeAgo(notification.createdAt)}
        </Text>
      </View>

      {/* Unread dot */}
      {!notification.read && (
        <View className="w-2.5 h-2.5 rounded-full bg-[#65B307]" />
      )}
    </TouchableOpacity>
  );
}