import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useApiClient } from "@/utils/api";
import { Comment, useDeleteComment } from "@/hooks/useComments";

interface Props {
  comment: Comment;
  postId: string;
  onDelete?: () => void;
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

/**
 * CommentItem — Componente de comentario
 *
 * Funcionalidades:
 * - Mostra avatar, nome, username, tempo relativo, conteudo
 * - Like (placeholder)
 * - Swipe para a esquerda para apagar (se for o autor)
 * - Icone de lixo para admin apagar comentarios de outros
 * - Modal de confirmacao com motivo para admin
 */
export default function CommentItem({ comment, postId, onDelete }: Props) {
  const { userId } = useAuth();
  const apiClient = useApiClient();
  const deleteMutation = useDeleteComment();

  // Estados
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentMongoId, setCurrentMongoId] = useState<string | null>(null);
  const [adminDeleteModalVisible, setAdminDeleteModalVisible] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Animacao de swipe
  const translateX = useRef(new Animated.Value(0)).current;

  // Verifica se e admin e busca o mongoId
  React.useEffect(() => {
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
  }, []);

  // Verifica se o user logado e o autor do comentario
  const isOwnComment = currentMongoId ? comment.user?._id === currentMongoId : false;

  // PanResponder para swipe (apenas para o autor)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isOwnComment,
      onMoveShouldSetPanResponder: () => isOwnComment,
      onPanResponderMove: (_, { dx }) => {
        if (dx < 0) translateX.setValue(dx);
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -100) {
          Animated.timing(translateX, {
            toValue: -500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            handleDeleteOwnComment();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Apaga o proprio comentario
  const handleDeleteOwnComment = useCallback(() => {
    Alert.alert(
      "Apagar comentario",
      "Tens a certeza que queres apagar este comentario?",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          },
        },
        {
          text: "Apagar",
          style: "destructive",
          onPress: () => {
            deleteMutation.mutate(
              { commentId: comment._id, postId },
              {
                onSuccess: () => onDelete?.(),
                onError: () => {
                  Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                  }).start();
                },
              }
            );
          },
        },
      ]
    );
  }, [comment._id, postId, deleteMutation, onDelete, translateX]);

  // Admin abre modal para apagar comentario
  const handleAdminDelete = () => {
    setAdminDeleteModalVisible(true);
  };

  // Confirma remocao pelo admin
  const confirmAdminDelete = async () => {
    if (!deleteReason.trim()) {
      Alert.alert("Motivo obrigatorio", "Por favor, explica porque este comentario esta a ser removido.");
      return;
    }

    setIsDeleting(true);
    try {
      await apiClient.delete(`/comments/${comment._id}/admin-delete`, {
        data: { reason: deleteReason.trim() },
      });

      setAdminDeleteModalVisible(false);
      setDeleteReason("");
      onDelete?.();
      Alert.alert("Sucesso", "Comentario removido com sucesso.");
    } catch (error: any) {
      console.error("Admin delete comment error:", error);
      const errorMsg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Nao foi possivel remover o comentario.";
      Alert.alert("Erro", errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayName =
    `${comment.user?.FirstName || ""} ${comment.user?.LastName || ""}`.trim() ||
    comment.user?.Username;
  const timeAgo = comment.createdAt ? formatTimeAgo(comment.createdAt) : "";

  return (
    <>
      <View className="relative">
        {/* Fundo vermelho que aparece quando arrastamos (apenas para o autor) */}
        {isOwnComment && (
          <View className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 justify-center items-center">
            <Ionicons name="trash" size={20} color="white" />
          </View>
        )}

        {/* Card do comentario */}
        <Animated.View
          style={{ transform: [{ translateX }] }}
          {...(isOwnComment ? panResponder.panHandlers : {})}
        >
          <View className="flex-row px-4 py-3 border-b border-[#E8F5E9] bg-white">
            {comment.user?.ProfilePicture ? (
              <Image
                source={{ uri: comment.user.ProfilePicture }}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <View className="w-8 h-8 rounded-full bg-[#3A6604] justify-center items-center">
                <Text className="text-white text-xs font-bold">
                  {comment.user?.Username?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View className="flex-1 ml-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1 flex-wrap">
                  <Text className="text-[#3A6604] font-bold text-[14px]">
                    {displayName}
                  </Text>
                  <Text className="text-[#486623] text-[12px]">
                    @{comment.user?.Username}
                  </Text>
                  <Text className="text-[#8E8E8E] text-[12px]">· {timeAgo}</Text>
                </View>

                {/* Admin delete: lixo vermelho — so para admin em comentarios de outros */}
                {isAdmin && !isOwnComment && (
                  <TouchableOpacity onPress={handleAdminDelete} className="p-1">
                    <Ionicons name="trash-outline" size={16} color="#e57373" />
                  </TouchableOpacity>
                )}

                {/* Proprio comentario: icone de lixo (fallback se swipe nao funcionar) */}
                {isOwnComment && (
                  <TouchableOpacity onPress={handleDeleteOwnComment} className="p-1">
                    <Feather name="trash-2" size={14} color="#C62828" />
                  </TouchableOpacity>
                )}
              </View>

              <Text className="text-[#1a1a1a] text-[14px] mt-1 leading-[20px]">
                {comment.content}
              </Text>

              <TouchableOpacity className="flex-row items-center mt-2 gap-1">
                <Ionicons name="heart-outline" size={14} color="#486623" />
                <Text className="text-[#486623] text-[12px]">
                  {comment.likes?.length || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
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
                Remover Comentario
              </Text>
            </View>

            <Text className="text-[#486623] text-sm mb-4">
              Estas a remover um comentario como moderador. Explica o motivo para que o autor possa compreender.
            </Text>

            <TextInput
              className="bg-[#F1F8E9] rounded-xl px-4 py-3 text-[#1B5E20] text-sm min-h-[80px]"
              placeholder="Explica porque este comentario esta a ser removido..."
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