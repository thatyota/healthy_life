import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { usePosts, useLikePost } from "@/hooks/usePosts";
import { useComments, useCreateComment } from "@/hooks/useComments";
import CommentItem from "@/components/CommentItem";
import { useState } from "react";

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
  return `${Math.floor(days / 7)}sem`;
}

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams();
  const router = useRouter();
  const { userId } = useAuth();
  const { data: posts } = usePosts();
  const likeMutation = useLikePost();
  const { data: comments, isLoading: commentsLoading } = useComments(postId as string);
  const createCommentMutation = useCreateComment();
  const [commentText, setCommentText] = useState("");

  const post = posts?.find((p) => p._id === postId);

  if (!post) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9] justify-center items-center">
        <ActivityIndicator size="large" color="#65B307" />
      </SafeAreaView>
    );
  }

  const postUser = post.User || post.user;
  const isLiked = post.Likes?.includes(userId || "");
  const likeCount = post.Likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  const displayName =
    `${postUser?.FirstName || ""} ${postUser?.LastName || ""}`.trim() ||
    postUser?.Username;

  const handleLike = () => {
    likeMutation.mutate(post._id);
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    createCommentMutation.mutate(
      { postId: postId as string, content: commentText.trim() },
      { onSuccess: () => setCommentText("") }
    );
  };

  const timeAgo = post.createdAt ? formatTimeAgo(post.createdAt) : "";

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-[#C8E6C9]">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#3A6604" />
        </TouchableOpacity>
        <Text className="text-[#3A6604] font-bold text-lg">Receita</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Post */}
        <View className="bg-white p-4 border-b border-[#E8F5E9]">
          {/* User */}
          <TouchableOpacity
            onPress={() => router.push(`/profile/${postUser?.Username}` as any)}
            className="flex-row items-center mb-3"
          >
            {postUser?.ProfilePicture ? (
              <Image
                source={{ uri: postUser.ProfilePicture }}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-[#3A6604] justify-center items-center">
                <Text className="text-white font-bold text-sm">
                  {postUser?.Username?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View className="ml-3">
              <Text className="text-[#3A6604] font-bold text-[15px]">
                {displayName}
              </Text>
              <Text className="text-[#486623] text-[13px]">
                @{postUser?.Username} · {timeAgo}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Content */}
          {post.Content ? (
            <Text className="text-[#1a1a1a] text-[15px] leading-[22px] mb-3">
              {post.Content}
            </Text>
          ) : null}

          {/* Image */}
          {post.Image ? (
            <Image
              source={{ uri: post.Image }}
              className="w-full aspect-[4/3] rounded-xl mb-3"
              resizeMode="cover"
            />
          ) : null}

          {/* Actions */}
          <View className="flex-row items-center gap-6 pt-2 border-t border-[#E8F5E9]">
            <TouchableOpacity onPress={handleLike} className="flex-row items-center gap-1">
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={22}
                color={isLiked ? "#ED4956" : "#486623"}
              />
              <Text className={`text-[13px] ${isLiked ? "text-[#ED4956]" : "text-[#486623]"}`}>
                {likeCount}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center gap-1">
              <Ionicons name="chatbubble-outline" size={20} color="#486623" />
              <Text className="text-[#486623] text-[13px]">{commentCount}</Text>
            </View>

            <TouchableOpacity>
              <Feather name="send" size={20} color="#486623" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments */}
        <View className="px-4 py-3">
          <Text className="text-[#3A6604] font-bold text-[15px] mb-2">
            Comentários ({commentCount})
          </Text>
        </View>

        {commentsLoading ? (
          <View className="py-4 justify-center items-center">
            <ActivityIndicator size="small" color="#65B307" />
          </View>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} postId={postId as string} />
          ))
        ) : (
          <View className="py-10 justify-center items-center">
            <Text className="text-[#486623] text-base">Ainda não há comentários</Text>
          </View>
        )}
      </ScrollView>

      {/* Comment Input */}
      <View className="bg-white border-t border-[#C8E6C9] px-4 py-3 flex-row items-center gap-3">
        <TextInput
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Adicionar comentário..."
          placeholderTextColor="#8E8E8E"
          className="flex-1 bg-[#F1F8E9] rounded-full px-4 py-2.5 text-[#1a1a1a]"
          multiline
          maxLength={280}
        />
        <TouchableOpacity
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || createCommentMutation.isPending}
          className={`px-5 py-2.5 rounded-full ${
            commentText.trim() ? "bg-[#65B307]" : "bg-[#C8E6C9]"
          }`}
        >
          <Text className="text-white font-bold text-sm">
            {createCommentMutation.isPending ? "..." : "Publicar"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}