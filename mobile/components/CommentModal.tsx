import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { useState, useEffect } from "react";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useComments, useCreateComment, Comment } from "@/hooks/useComments";
import { useLikePost } from "@/hooks/usePosts";
import CommentItem from "./CommentItem";

const { height } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postUser: any;
  postContent: string;
  postImage?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  onLike: () => void;
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
  return `${Math.floor(days / 7)}sem`;
}

export default function CommentModal({
  visible,
  onClose,
  postId,
  postUser,
  postContent,
  postImage,
  likesCount,
  commentsCount,
  isLiked,
  onLike,
}: Props) {
  const { userId } = useAuth();
  const { data: comments, isLoading, refetch } = useComments(postId);
  const createCommentMutation = useCreateComment();
  const [commentText, setCommentText] = useState("");

  const displayName =
    `${postUser?.FirstName || ""} ${postUser?.LastName || ""}`.trim() ||
    postUser?.Username;

  const handleSubmit = () => {
    if (!commentText.trim()) return;
    createCommentMutation.mutate(
      { postId, content: commentText.trim() },
      { onSuccess: () => setCommentText("") }
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end"
      >
        <TouchableOpacity
          className="absolute top-0 left-0 right-0 bottom-0 bg-black/50"
          onPress={onClose}
          activeOpacity={1}
        />

        <View
          className="bg-[#F1F8E9] rounded-t-3xl overflow-hidden"
          style={{ height: height * 0.75 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-center px-4 py-3 bg-white border-b border-[#C8E6C9]">
            <TouchableOpacity onPress={onClose} className="absolute left-4">
              <Feather name="x" size={24} color="#3A6604" />
            </TouchableOpacity>
            <Text className="text-[#3A6604] font-bold text-lg">Comentários</Text>
            <View className="w-8" />
          </View>

          {/* Post Preview */}
          <View className="bg-white px-4 py-3 border-b border-[#E8F5E9]">
            <View className="flex-row items-center mb-2">
              {postUser?.ProfilePicture ? (
                <Image
                  source={{ uri: postUser.ProfilePicture }}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <View className="w-8 h-8 rounded-full bg-[#3A6604] justify-center items-center">
                  <Text className="text-white text-xs font-bold">
                    {postUser?.Username?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="ml-2 flex-1">
                <Text className="text-[#3A6604] font-bold text-[14px]">
                  {displayName}
                </Text>
                <Text className="text-[#486623] text-[12px]">
                  @{postUser?.Username}
                </Text>
              </View>
              <TouchableOpacity onPress={onLike} className="flex-row items-center gap-1">
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={20}
                  color={isLiked ? "#ED4956" : "#486623"}
                />
                <Text className={`text-[12px] ${isLiked ? "text-[#ED4956]" : "text-[#486623]"}`}>
                  {likesCount}
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="text-[#1a1a1a] text-[14px]" numberOfLines={2}>
              {postContent}
            </Text>
          </View>

          {/* Comments List */}
          <FlatList
            data={comments || []}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <CommentItem comment={item} postId={postId} />}
            ListEmptyComponent={
              !isLoading ? (
                <View className="py-10 justify-center items-center">
                  <Text className="text-[#486623] text-base">Ainda não há comentários</Text>
                  <Text className="text-[#8E8E8E] text-sm mt-1">
                    Sê o primeiro a comentar!
                  </Text>
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

          {/* Input */}
          <View className="bg-white border-t border-[#C8E6C9] px-4 py-3 flex-row items-center gap-3">
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Adicionar comentário..."
              placeholderTextColor="#8E8E8E"
              className="flex-1 bg-[#F1F8E9] rounded-full px-4 py-2.5 text-[#1a1a1a] text-[14px]"
              multiline
              maxLength={280}
            />
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!commentText.trim() || createCommentMutation.isPending}
              className={`px-4 py-2 rounded-full ${
                commentText.trim() ? "bg-[#65B307]" : "bg-[#C8E6C9]"
              }`}
            >
              <Text className="text-white font-bold text-sm">
                {createCommentMutation.isPending ? "..." : "Enviar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}