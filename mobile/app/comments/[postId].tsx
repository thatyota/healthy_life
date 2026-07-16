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
  Animated,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useApiClient } from "@/utils/api";
import { usePosts, useLikePost } from "@/hooks/usePosts";
import { useComments, useCreateComment } from "@/hooks/useComments";
import CommentItem from "@/components/CommentItem";

/**
 * Formata a data relativa (ex: "agora", "5m", "2h", "3d")
 */
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

/**
 * CommentsPage — Página de detalhe de um post com comentários
 * 
 * Funcionalidades:
 * - Mostra o post com avatar, nome, conteúdo e imagem
 * - Like com coração vermelho e animação (igual ao PostCard)
 * - Lista de comentários com CommentItem
 * - Input para adicionar novo comentário
 * 
 * Correções:
 * - Busca o MongoDB _id do user logado para comparar com Likes
 * - Animação do coração ao dar like (igual ao PostCard)
 * - Remove botão de partilhar
 */
export default function CommentsPage() {
  const { postId } = useLocalSearchParams();
  const router = useRouter();
  const { userId } = useAuth();
  const api = useApiClient();
  const { data: posts } = usePosts();
  const likeMutation = useLikePost();
  const { data: comments, isLoading: commentsLoading } = useComments(postId as string);
  const createCommentMutation = useCreateComment();
  const [commentText, setCommentText] = useState("");
  const [currentMongoId, setCurrentMongoId] = useState<string | null>(null);

  // Animação do coração — igual ao PostCard
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const [localLikeCount, setLocalLikeCount] = useState(0);

  /**
   * Busca o MongoDB _id do user logado.
   * Necessário porque post.Likes guarda ObjectIds do MongoDB.
   */
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/users/me");
        const mongoId = response?.data?.user?._id;
        if (mongoId) setCurrentMongoId(mongoId);
      } catch (error) {
        console.error("Erro ao buscar user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  const post = posts?.find((p) => p._id === postId);

  // Sincroniza localLikeCount quando o post muda
  useEffect(() => {
    if (post) {
      setLocalLikeCount(post.Likes?.length || 0);
      setLikedOverride(null);
    }
  }, [post?._id]);

  if (!post) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9] justify-center items-center">
        <ActivityIndicator size="large" color="#65B307" />
      </SafeAreaView>
    );
  }

  const postUser = post.User || post.user;

  // isLiked = true se o currentMongoId está no array Likes do post
  const isLikedFromServer = currentMongoId ? post.Likes?.includes(currentMongoId) : false;
  const isLiked = likedOverride !== null ? likedOverride : isLikedFromServer;
  const likeCount = likedOverride !== null ? localLikeCount : (post.Likes?.length || 0);
  const commentCount = post.comments?.length || 0;

  const displayName =
    `${postUser?.FirstName || ""} ${postUser?.LastName || ""}`.trim() ||
    postUser?.Username;

  /**
   * Anima o coração — scale de 1 → 1.3 → 1
   * Igual ao PostCard
   */
  const animateLike = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Toggle like no post.
   * Atualiza estado local imediatamente e anima ao dar like.
   */
  const handleLike = () => {
    const newLikedState = !isLiked;
    setLikedOverride(newLikedState);
    setLocalLikeCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));

    if (newLikedState) {
      animateLike();
    }

    likeMutation.mutate(post._id, {
      onSuccess: () => {
        setTimeout(() => {
          setLikedOverride(null);
          setLocalLikeCount(post.Likes?.length || 0);
        }, 2000);
      },
      onError: () => {
        setLikedOverride(!newLikedState);
        setLocalLikeCount(prev => newLikedState ? Math.max(0, prev - 1) : prev + 1);
      },
    });
  };

  /**
   * Envia um novo comentário.
   */
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
          </View>

          <Text className="text-[#1a1a1a] text-[14px]" numberOfLines={2}>
            {post.Content}
          </Text>
          <Text className="text-[#8E8E8E] text-[12px] mt-1">{timeAgo}</Text>

          {/* Imagem do post */}
          {post.Image ? (
            <Image
              source={{ uri: post.Image }}
              className="w-full aspect-[4/3] rounded-xl mt-2"
              resizeMode="cover"
            />
          ) : null}

          {/* Ações: like e comentar (sem partilhar) */}
          <View className="flex-row items-center mt-3 gap-5">
            {/* Like com animação — igual ao PostCard */}
            <TouchableOpacity onPress={handleLike} className="flex-row items-center gap-1">
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={22}
                  color={isLiked ? "#ED4956" : "#486623"}
                />
              </Animated.View>
              <Text className={`text-[13px] font-semibold ${isLiked ? "text-[#ED4956]" : "text-[#486623]"}`}>
                {likeCount}
              </Text>
            </TouchableOpacity>

            {/* Comentar */}
            <View className="flex-row items-center gap-1">
              <Ionicons name="chatbubble-outline" size={20} color="#486623" />
              <Text className="text-[#486623] text-[13px] font-semibold">{commentCount}</Text>
            </View>
          </View>
        </View>

        {/* Título da secção de comentários */}
        <View className="px-4 py-2 bg-[#F1F8E9]">
          <Text className="text-[#3A6604] font-bold text-[15px]">
            Comentários ({commentCount})
          </Text>
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