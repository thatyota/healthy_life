import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useDeletePost, Post } from "@/hooks/usePosts";
import { useRouter } from "expo-router";

interface Props {
  post: Post;
  isOwnProfile: boolean;
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
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m`;
  return `${Math.floor(days / 365)}a`;
}

export default function ProfilePostCard({ post, isOwnProfile }: Props) {
  const router = useRouter();
  const deleteMutation = useDeletePost();

  const handleDelete = () => {
    Alert.alert(
      "Eliminar receita",
      "Tens a certeza que queres eliminar esta receita? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteMutation.mutate(post._id),
        },
      ]
    );
  };

  const timeAgo = post.createdAt ? formatTimeAgo(post.createdAt) : "";
  const likeCount = post.Likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  return (
    <View className="bg-white mx-3 mb-3 rounded-2xl shadow-sm border border-[#E8F5E9] overflow-hidden">
      {/* Header com tempo e delete */}
      <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
        <Text className="text-[#486623] text-[13px]">{timeAgo}</Text>
        {isOwnProfile && (
          <TouchableOpacity onPress={handleDelete} className="p-1">
            <Feather name="trash-2" size={18} color="#C62828" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {post.Content ? (
        <View className="px-4 pb-2">
          <Text className="text-[#1a1a1a] text-[15px] leading-[22px]">{post.Content}</Text>
        </View>
      ) : null}

      {/* Image */}
      {post.Image ? (
        <View className="px-4 pb-3">
          <Image
            source={{ uri: post.Image }}
            className="w-full aspect-[4/3] rounded-xl"
            resizeMode="cover"
          />
        </View>
      ) : null}

      {/* Stats */}
      <View className="flex-row items-center px-4 pb-3 gap-4">
        <View className="flex-row items-center gap-1">
          <Ionicons name="heart" size={16} color="#65B307" />
          <Text className="text-[#486623] text-[13px]">{likeCount} curtidas</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="chatbubble-outline" size={16} color="#486623" />
          <Text className="text-[#486623] text-[13px]">{commentCount} comentários</Text>
        </View>
      </View>
    </View>
  );
}