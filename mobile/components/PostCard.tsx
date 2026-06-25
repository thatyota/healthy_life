import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useLikePost, useDeletePost, Post } from "@/hooks/usePosts";
import { useRouter } from "expo-router";

interface Props {
  post: Post;
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

export default function PostCard({ post }: Props) {
  const { userId } = useAuth();
  const router = useRouter();
  const likeMutation = useLikePost();
  const deleteMutation = useDeletePost();

  // Verifica se o user existe, senão usa fallback
  const postUser = post.User || post.user;
  const isLiked = post.Likes?.includes(userId || "");
  const likeCount = post.Likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  const displayName =
    `${postUser?.FirstName || ""} ${postUser?.LastName || ""}`.trim() ||
    postUser?.Username ||
    "Utilizador";

  const username = postUser?.Username || "user";
  const profilePicture = postUser?.ProfilePicture;

  const handleLike = () => {
    likeMutation.mutate(post._id);
  };

  const handleDelete = () => {
    Alert.alert("Eliminar receita", "Tens a certeza que queres eliminar esta receita?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteMutation.mutate(post._id),
      },
    ]);
  };

  const timeAgo = post.createdAt ? formatTimeAgo(post.createdAt) : "";

  return (
    <View className="bg-white mx-3 mb-3 rounded-2xl shadow-sm border border-[#E8F5E9] overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.push(`/profile/${username}` as any)}
          className="flex-row items-center flex-1"
        >
          {profilePicture ? (
            <Image
              source={{ uri: profilePicture }}
              className="w-10 h-10 rounded-full border-2 border-[#83E509]"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-[#3A6604] justify-center items-center border-2 border-[#83E509]">
              <Text className="text-white font-bold text-sm">
                {username?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text className="text-[#3A6604] font-bold text-[15px]">{displayName}</Text>
            <Text className="text-[#486623] text-[13px]">
              @{username} · {timeAgo}
            </Text>
          </View>
        </TouchableOpacity>

        {postUser?._id === userId && (
          <TouchableOpacity onPress={handleDelete} className="p-1">
            <Feather name="more-horizontal" size={20} color="#486623" />
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

      {/* Actions */}
      <View className="flex-row items-center px-4 pb-4 gap-6">
        <TouchableOpacity onPress={handleLike} className="flex-row items-center gap-1.5">
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={22}
            color={isLiked ? "#65B307" : "#486623"}
          />
          {likeCount > 0 && (
            <Text
              className={`text-[13px] font-semibold ${
                isLiked ? "text-[#65B307]" : "text-[#486623]"
              }`}
            >
              {likeCount}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center gap-1.5">
          <Ionicons name="chatbubble-outline" size={20} color="#486623" />
          {commentCount > 0 && (
            <Text className="text-[#486623] text-[13px] font-semibold">{commentCount}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity>
          <Feather name="send" size={20} color="#486623" />
        </TouchableOpacity>

        <TouchableOpacity className="ml-auto">
          <Ionicons name="bookmark-outline" size={20} color="#486623" />
        </TouchableOpacity>
      </View>
    </View>
  );
}