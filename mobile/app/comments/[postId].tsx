import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { usePosts, useLikePost } from "@/hooks/usePosts";
import { useComments, useCreateComment } from "@/hooks/useComments";
import CommentItem from "@/components/CommentItem";

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

export default function CommentsPage() {
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
    if (!commentText.trim()) {
      console.log("⚠️ Comentário vazio, ignorando");
      return;
    }
    
    console.log("🚀 Enviando comentário:", commentText.trim());
    
    createCommentMutation.mutate(
      { postId: postId as string, content: commentText.trim() },
      {
        onSuccess: () => {
          console.log("✅ Comentário enviado com sucesso!");
          setCommentText("");
        },
        onError: (error: any) => {
          console.error("❌ Erro ao enviar:", error.message);
        },
      }
    );
  };

  const timeAgo = post.createdAt ? formatTimeAgo(post.createdAt) : "";

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-[#C8E6C9]">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#3A6604" />
          </TouchableOpacity>
          <Text className="text-[#3A6604] font-bold text-lg">Comentários</Text>
        </View>

        {/* Post Preview */}
        <View className="bg-white px-4 py-3 border-b border-[#E8F5E9]">
          <View className="flex-row items-center mb-2">
            {postUser?.ProfilePicture ? (
              <Image source={{ uri: postUser.ProfilePicture }} className="w-8 h-8 rounded-full" />
            ) : (
              <View className="w-8 h-8 rounded-full bg-[#3A6604] justify-center items-center">
                <Text className="text-white text-xs font-bold">
                  {postUser?.Username?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View className="ml-2 flex-1">
              <Text className="text-[#3A6604] font-bold text-[14px]">{displayName}</Text>
              <Text className="text-[#486623] text-[12px]">@{postUser?.Username}</Text>
            </View>
            <TouchableOpacity onPress={handleLike} className="flex-row items-center gap-1">
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={20}
                color={isLiked ? "#ED4956" : "#486623"}
              />
              <Text className={`text-[12px] ${isLiked ? "text-[#ED4956]" : "text-[#486623]"}`}>
                {likeCount}
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-[#1a1a1a] text-[14px]" numberOfLines={2}>
            {post.Content}
          </Text>
          <Text className="text-[#8E8E8E] text-[12px] mt-1">{timeAgo}</Text>
        </View>

        {/* Comments List */}
        <FlatList
          data={comments || []}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <CommentItem comment={item} postId={postId as string} />}
          ListEmptyComponent={
            !commentsLoading ? (
              <View className="py-10 justify-center items-center">
                <Text className="text-[#486623] text-base">Ainda não há comentários</Text>
                <Text className="text-[#8E8E8E] text-sm mt-1">Sê o primeiro a comentar!</Text>
              </View>
            ) : (
              <View className="py-4 justify-center items-center">
                <ActivityIndicator size="small" color="#65B307" />
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
          className="flex-1"
        />

        {/* Comment Input */}
        <View className="bg-white border-t border-[#C8E6C9] px-4 py-3 flex-row items-center gap-3">
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Adicionar comentário..."
            placeholderTextColor="#8E8E8E"
            className="flex-1 bg-[#F1F8E9] rounded-full px-4 py-2.5 text-[#1a1a1a] text-[14px]"
            multiline={false}
            maxLength={280}
            onSubmitEditing={handleSubmitComment}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || createCommentMutation.isPending}
            className={`px-4 py-2 rounded-full ${
              commentText.trim() && !createCommentMutation.isPending
                ? "bg-[#65B307]"
                : "bg-[#C8E6C9]"
            }`}
          >
            <Text className="text-white font-bold text-sm">
              {createCommentMutation.isPending ? "..." : "Enviar"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}