import { View, Text, Image, TouchableOpacity, Animated, PanResponder } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Notification, useMarkAsRead, useDeleteNotification } from "@/hooks/useNotifications";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
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
        return gestureState.dx < -10 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0 && gestureState.dx > -200) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -100) {
          // swipe longo - deleta
          Animated.timing(translateX, {
            toValue: -500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            deleteNotification.mutate(notification._id);
          });
        } else {
          // volta ao sitio
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
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
    <View style={{ position: "relative", overflow: "hidden" }}>
      {/* fundo vermelho - fica ATRAS (zIndex menor) */}
      <View 
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "100%",
          backgroundColor: "#C62828",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: 24,
          zIndex: 1,
        }}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </View>

      {/* conteudo - fica NA FRENTE (zIndex maior) */}
      <Animated.View
        style={{ 
          transform: [{ translateX }],
          zIndex: 2,
          backgroundColor: !notification.read ? "#E8F5E9" : "white",
        }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: "#E8F5E9",
          }}
        >
          {/* avatar */}
          <View style={{ position: "relative" }}>
            {notification.from?.ProfilePicture ? (
              <Image
                source={{ uri: notification.from.ProfilePicture }}
                style={{ width: 48, height: 48, borderRadius: 24 }}
              />
            ) : (
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#3A6604", justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>
                  {notification.from?.Username?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "white",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: "#E8F5E9",
            }}>
              <Ionicons name={getIconName()} size={11} color={getIconColor()} />
            </View>
          </View>

          {/* texto */}
          <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
            <Text style={{ color: "#1a1a1a", fontSize: 14, lineHeight: 20 }} numberOfLines={2}>
              <Text style={{ fontWeight: "bold", color: "#3A6604" }}>{displayName}</Text>
              <Text style={{ color: "#1a1a1a" }}> {getNotificationText()}</Text>
            </Text>
            <Text style={{ color: "#65B307", fontSize: 12, marginTop: 4, fontWeight: "500" }}>
              {formatTimeAgo(notification.createdAt)}
            </Text>
          </View>

          {/* lado direito */}
          {notification.type === "follow" && !isOwnProfile ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/profile/${notification.from.Username}` as any);
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 6,
                backgroundColor: "#65B307",
                borderRadius: 999,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>Seguir</Text>
            </TouchableOpacity>
          ) : !notification.read ? (
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#65B307" }} />
          ) : null}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}