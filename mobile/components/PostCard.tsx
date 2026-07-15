import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useLikePost, useDeletePost, Post } from "@/hooks/usePosts";
import { useApiClient } from "@/utils/api";
import { useRouter } from "expo-router";

interface Props {
  post: Post;
  onDelete?: (postId: string) => void;
}

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
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m`;
  return `${Math.floor(days / 365)}a`;
}

/**
 * PostCard — Componente de card de post para o feed
 * 
 * Funcionalidades:
 * - Mostra avatar, nome, username, tempo relativo
 * - Conteúdo de texto e imagem
 * - Like com animação (só anima ao DAR like, não ao tirar)
 * - Contador de likes atualiza localmente para feedback imediato
 * - Comentários (navega para página)
 * - Admin delete: lixo vermelho para admins removerem posts de outros
 * 
 * Props:
 *   post: Post — objeto do post (User, Content, Image, Likes, etc.)
 *   onDelete: (postId: string) => void — callback quando post é removido
 */
export default function PostCard({ post, onDelete }: Props) {
  const { userId } = useAuth();
  const router = useRouter();
  const apiClient = useApiClient();
  const likeMutation = useLikePost();
  const deleteMutation = useDeletePost();

  // ─── Estados ──────────────────────────────────────────────
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentMongoId, setCurrentMongoId] = useState<string | null>(null);
  const [adminDeleteModalVisible, setAdminDeleteModalVisible] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Animação do coração — só anima ao DAR like
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Estado local do like — override temporário do servidor
  // null = usa o valor do servidor, true/false = usa o valor local
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);

  // Contador local de likes — para feedback imediato
  const [localLikeCount, setLocalLikeCount] = useState(post.Likes?.length || 0);

  // ─── Dados do post ────────────────────────────────────────
  const postUser = post.User || post.user;

  // isLikedFromServer = calculado a partir do post atual do servidor
  const isLikedFromServer = currentMongoId 
    ? post.Likes?.includes(currentMongoId) 
    : false;

  // isLiked = usa o override local se existir, senão usa o servidor
  // Quando o user interage, o override tem prioridade
  const isLiked = likedOverride !== null ? likedOverride : isLikedFromServer;

  // likeCount = usa local se o user interagiu recentemente, senão usa servidor
  const likeCount = likedOverride !== null ? localLikeCount : (post.Likes?.length || 0);

  const commentCount = post.comments?.length || 0;

  const displayName =
    `${postUser?.FirstName || ""} ${postUser?.LastName || ""}`.trim() ||
    postUser?.Username;

  const username = postUser?.Username || "user";
  const profilePicture = postUser?.ProfilePicture;

  // ─── Efeitos ─────────────────────────────────────────────

  /**
   * Busca o MongoDB _id do user logado e verifica se é admin.
   */
  useEffect(() => {
    let mounted = true;
    const checkUser = async () => {
      try {
        const meResponse = await apiClient.get("/users/me");
        const mongoId = meResponse?.data?.user?._id;
        if (mounted && mongoId) setCurrentMongoId(mongoId);
      } catch { /* ignora */ }

      try {
        const adminResponse = await apiClient.get("/admin/check");
        if (mounted) setIsAdmin(adminResponse?.data?.isAdmin === true);
      } catch {
        if (mounted) setIsAdmin(false);
      }
    };
    checkUser();
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Sincroniza o contador local quando o post MUDA (post diferente)
   * NÃO reseta quando o post atualiza (refetch) — para não "piscar" o like
   */
  useEffect(() => {
    setLikedOverride(null);
    setLocalLikeCount(post.Likes?.length || 0);
  }, [post._id]); // ← SÓ quando o ID do post muda, não quando Likes muda

  // ─── Helpers ─────────────────────────────────────────────

  const isOwner = currentMongoId ? postUser?._id === currentMongoId : false;

  /**
   * Anima o coração — scale de 1 → 1.3 → 1
   * Só é chamada quando o user DÁ like
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

  // ─── Handlers ────────────────────────────────────────────

  /**
   * handleLike — Toggle like no post
   * 
   * Lógica:
   * 1. Calcula o novo estado (inverte o atual)
   * 2. Atualiza o estado local imediatamente (feedback instantâneo)
   * 3. Atualiza o contador local (+1 se deu like, -1 se tirou)
   * 4. Só anima se estiver a DAR like
   * 5. Chama o backend — se falhar, reverte o estado local
   * 6. Limpa o override após 3 segundos para sincronizar com servidor
   */
  const handleLike = () => {
    const newLikedState = !isLiked;           // true = vai dar like, false = vai tirar

    // Atualiza estado local imediatamente
    setLikedOverride(newLikedState);
    setLocalLikeCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));

    // Só anima se estiver a DAR like
    if (newLikedState) {
      animateLike();
    }

    // Chama o backend
    likeMutation.mutate(post._id, {
      onSuccess: () => {
        // Sucesso — limpa o override após 2 segundos para sincronizar com servidor
        setTimeout(() => {
          setLikedOverride(null);
          setLocalLikeCount(post.Likes?.length || 0);
        }, 2000);
      },
      onError: () => {
        // Erro — reverte o estado local imediatamente
        setLikedOverride(!newLikedState);
        setLocalLikeCount(prev => newLikedState ? Math.max(0, prev - 1) : prev + 1);
        Alert.alert("Erro", "Não foi possível atualizar o like.");
      },
    });
  };

  const handleAdminDelete = () => {
    setAdminDeleteModalVisible(true);
  };

  /**
   * Confirma a remoção do post pelo admin.
   */
  const confirmAdminDelete = async () => {
    if (!deleteReason.trim()) {
      Alert.alert("Motivo obrigatório", "Por favor, explica porque este post está a ser removido.");
      return;
    }

    setIsDeleting(true);
    try {
      await apiClient.post(`/posts/${post._id}/admin-delete`, {
        reason: deleteReason.trim(),
      });

      setAdminDeleteModalVisible(false);
      setDeleteReason("");
      onDelete?.(post._id);

      Alert.alert("Sucesso", "Publicação removida com sucesso.");
    } catch (error: any) {
      console.error("Admin delete error:", error);
      const errorMsg = error?.response?.data?.error 
        || error?.response?.data?.message 
        || "Não foi possível remover a publicação.";
      Alert.alert("Erro", errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const navigateToComments = () => {
    router.push(`/comments/${post._id}` as any);
  };

  const timeAgo = post.createdAt ? formatTimeAgo(post.createdAt) : "";

  // ─── Render ──────────────────────────────────────────────
  return (
    <>
      <View className="bg-white mx-3 mb-3 rounded-2xl shadow-sm border border-[#E8F5E9] overflow-hidden">
        {/* Header: avatar + nome + username + tempo + admin delete */}
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

          {/* Admin delete: lixo vermelho — só para admin em posts de outros */}
          {isAdmin && !isOwner && (
            <TouchableOpacity onPress={handleAdminDelete} className="p-1">
              <Ionicons name="trash-outline" size={20} color="#e57373" />
            </TouchableOpacity>
          )}
        </View>

        {/* Conteúdo de texto */}
        {post.Content ? (
          <TouchableOpacity onPress={navigateToComments}>
            <View className="px-4 pb-2">
              <Text className="text-[#1a1a1a] text-[15px] leading-[22px]">{post.Content}</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Imagem */}
        {post.Image ? (
          <TouchableOpacity onPress={navigateToComments}>
            <View className="px-4 pb-3">
              <Image
                source={{ uri: post.Image }}
                className="w-full aspect-[4/3] rounded-xl"
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Ações: like, comentar */}
        <View className="flex-row items-center px-4 pb-4 gap-6">
          {/* Like com animação — só anima ao DAR like */}
          <Pressable onPress={handleLike} className="flex-row items-center gap-1.5">
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={22}
                color={isLiked ? "#ED4956" : "#486623"}
              />
            </Animated.View>
            {likeCount > 0 && (
              <Text className={`text-[13px] font-semibold ${isLiked ? "text-[#ED4956]" : "text-[#486623]"}`}>
                {likeCount}
              </Text>
            )}
          </Pressable>

          {/* Comentar */}
          <TouchableOpacity
            onPress={navigateToComments}
            className="flex-row items-center gap-1.5"
          >
            <Ionicons name="chatbubble-outline" size={20} color="#486623" />
            {commentCount > 0 && (
              <Text className="text-[#486623] text-[13px] font-semibold">{commentCount}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de admin delete */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={adminDeleteModalVisible}
        onRequestClose={() => {
          setAdminDeleteModalVisible(false);
          setDeleteReason("");
        }}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => {
            setAdminDeleteModalVisible(false);
            setDeleteReason("");
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl px-5 pt-6 pb-8"
          >
            <View className="w-12 h-1 bg-[#C8E6C9] rounded-full self-center mb-4" />

            <View className="flex-row items-center mb-4">
              <Ionicons name="shield" size={24} color="#3A6604" />
              <Text className="text-[#1B5E20] text-lg font-bold ml-2">
                Remover Publicação
              </Text>
            </View>

            <Text className="text-[#486623] text-sm mb-4">
              Estás a remover uma publicação como moderador. Explica o motivo para que o autor possa compreender.
            </Text>

            <TextInput
              className="bg-[#F1F8E9] rounded-xl px-4 py-3 text-[#1B5E20] text-sm min-h-[80px]"
              placeholder="Explica porque este post está a ser removido..."
              placeholderTextColor="#8E8E8E"
              multiline
              numberOfLines={3}
              value={deleteReason}
              onChangeText={setDeleteReason}
              textAlignVertical="top"
            />

            <View className="flex-row mt-5">
              <TouchableOpacity
                onPress={() => {
                  setAdminDeleteModalVisible(false);
                  setDeleteReason("");
                }}
                className="flex-1 bg-[#F1F8E9] rounded-xl py-3 mr-2 items-center"
              >
                <Text className="text-[#3A6604] font-semibold">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmAdminDelete}
                disabled={isDeleting}
                className="flex-1 bg-[#C62828] rounded-xl py-3 ml-2 items-center"
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Remover</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}