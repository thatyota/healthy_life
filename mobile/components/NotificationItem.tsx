"use client";

import React, { useRef, useCallback, useState } from "react";
import { View, Text, Image, TouchableOpacity, Animated, PanResponder, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMarkAsRead, useDeleteNotification, useFollowUser } from "@/hooks/useNotifications";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useApiClient } from "@/utils/api";
import type { Notification } from "@/hooks/useNotifications";

// ============================================
// PROPS do componente
// ============================================
// notification = objeto com os dados da notificação
// onDelete = função que o parent chama quando apagamos (para atualizar a lista)
interface NotificationItemProps {
  notification: Notification;
  onDelete?: () => void;
}

// ============================================
// COMPONENTE: NotificationItem
// ============================================
// Mostra UMA notificação no ecrã de notificações
//
// Tipos suportados:
// - "follow": alguém começou a seguir-te
// - "like": alguém gostou do teu post
// - "comment": alguém comentou no teu post
// - "delete_post": moderador removeu o teu post
// - "delete_comment": moderador removeu o teu comentário
//
// Para "delete_post" e "delete_comment":
// - Não mostra avatar do admin (mostra ícone de lixo)
// - Mostra "Moderador" como remetente
// - Mostra o motivo da remoção
//
// Quando clicas numa notificação de like/comment:
// - Verifica se o post ainda existe antes de navegar
// - Se não existir → mostra alerta "Esta publicação já não existe"
// ============================================

export default function NotificationItem({ notification, onDelete }: NotificationItemProps) {
  // ----------------------------------------
  // HOOKS
  // ----------------------------------------
  // useMarkAsRead = hook para marcar notificação como lida
  const markAsRead = useMarkAsRead();
  // useDeleteNotification = hook para apagar notificação
  const deleteNotification = useDeleteNotification();
  // useFollowUser = hook para seguir/deixar de seguir alguém
  const followUser = useFollowUser();
  // useCurrentUser = hook para buscar os dados do user logado
  const { data: currentUser } = useCurrentUser();
  // useApiClient = client axios configurado com o token do Clerk
  const api = useApiClient();

  // ----------------------------------------
  // ESTADO LOCAL
  // ----------------------------------------
  // translateX = valor animado para o efeito de swipe (arrastar para o lado)
  // Começa em 0 (posição normal)
  const translateX = useRef(new Animated.Value(0)).current;
  // isFollowing = true se o user logado JÁ segue a pessoa da notificação
  // Verifica se o ID do remetente está na lista Following do user logado
  const isFollowing = currentUser?.Following?.includes(notification.from._id) || false;
  // checkingPost = true enquanto verifica se o post existe
  const [checkingPost, setCheckingPost] = useState(false);

  // ----------------------------------------
  // HELPERS
  // ----------------------------------------
  // isAdminDelete = true se for notificação de remoção (post ou comentário)
  // Usado para esconder a foto do admin e mostrar "Moderador"
  const isAdminDelete = notification.type === "delete_post" || notification.type === "delete_comment";

  // ----------------------------------------
  // PAN RESPONDER (efeito de swipe para apagar)
  // ----------------------------------------
  // PanResponder = API do React Native para detectar gestos (arrastar)
  const panResponder = useRef(
    PanResponder.create({
      // onStartShouldSetPanResponder = true significa que este componente captura o gesto
      onStartShouldSetPanResponder: () => true,
      // onMoveShouldSetPanResponder = true significa que captura movimento
      onMoveShouldSetPanResponder: () => true,

      // onPanResponderMove = corre enquanto arrastamos o dedo
      // dx = distância horizontal arrastada
      onPanResponderMove: (_, { dx }) => {
        // Só permite arrastar para a esquerda (dx negativo)
        if (dx < 0) {
          // Atualiza a posição X do card (efeito visual de arrastar)
          translateX.setValue(dx);
        }
      },

      // onPanResponderRelease = corre quando largamos o dedo
      onPanResponderRelease: (_, { dx }) => {
        // Se arrastamos mais de 100 pixels para a esquerda → apaga
        if (dx < -100) {
          // Anima o card a sair da tela (para a esquerda)
          Animated.timing(translateX, {
            toValue: -500,      // Sai 500px para a esquerda
            duration: 200,      // 200ms de animação
            useNativeDriver: true,
          }).start(() => {
            // Quando a animação acaba → apaga a notificação no backend
            handleDelete();
          });
        } else {
          // Se não arrastou o suficiente → volta à posição original (0)
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // ----------------------------------------
  // FUNÇÃO: handleDelete
  // ----------------------------------------
  // Apaga a notificação no backend e chama onDelete do parent
  const handleDelete = useCallback(() => {
    // Chama o hook useDeleteNotification com o ID da notificação
    deleteNotification.mutate(notification._id, {
      // onSuccess = corre quando o backend responde com sucesso
      onSuccess: () => {
        // Chama a função onDelete do parent (para atualizar a lista)
        onDelete?.();
      },
      // onError = corre quando dá erro
      onError: (error: any) => {
        console.error("Erro ao apagar notificação:", error);
        Alert.alert("Erro", "Não foi possível apagar a notificação");
      },
    });
  }, [notification._id, deleteNotification, onDelete]);

  // ----------------------------------------
  // FUNÇÃO: checkPostExists
  // ----------------------------------------
  // Verifica se o post ainda existe antes de navegar
  // Usa o api client (axios) em vez de fetch para manter consistência
  // Se não existir → mostra alerta
  const checkPostExists = useCallback(async (postId: string): Promise<boolean> => {
    try {
      setCheckingPost(true);
      // Faz um GET ao post para verificar se existe
      const response = await api.get(`/posts/${postId}`);
      setCheckingPost(false);
      // Se o post existir → retorna true
      return true;
    } catch (error: any) {
      setCheckingPost(false);
      // Se der 404 → o post não existe
      if (error?.response?.status === 404) {
        return false;
      }
      // Outros erros → assume que não existe (segurança)
      console.error("Erro ao verificar post:", error);
      return false;
    }
  }, [api]);

  // ----------------------------------------
  // FUNÇÃO: handlePress
  // ----------------------------------------
  // Quando clicamos na notificação → marca como lida e navega
  const handlePress = useCallback(async () => {
    // Se a notificação ainda não foi lida → marca como lida
    if (!notification.read) {
      markAsRead.mutate(notification._id);
    }

    // Se for notificação de follow → vai para o perfil da pessoa
    if (notification.type === "follow") {
      router.push(`/(tabs)/profile/${notification.from.Username}` as any);
    }
    // Se for notificação de like ou comment → verifica se o post existe antes de navegar
    else if (notification.type === "like" || notification.type === "comment") {
      // Se não tem post associado → mostra alerta
      if (!notification.post) {
        Alert.alert("Publicação indisponível", "Esta publicação já não existe.");
        return;
      }

      // Verifica se o post ainda existe
      const exists = await checkPostExists(notification.post);
      if (exists) {
        router.push(`/(tabs)/post/${notification.post}` as any);
      } else {
        Alert.alert("Publicação indisponível", "Esta publicação já não existe.");
      }
    }
    // Se for delete_post ou delete_comment → não navega (só mostra a notificação)
  }, [notification, markAsRead, checkPostExists]);

  // ----------------------------------------
  // FUNÇÃO: handleFollow
  // ----------------------------------------
  // Segue ou deixa de seguir a pessoa da notificação
  const handleFollow = useCallback(() => {
    // Chama o hook useFollowUser com o ID do remetente
    followUser.mutate(notification.from._id, {
      onSuccess: () => {
        console.log(isFollowing ? "Deixou de seguir" : "Seguiu", notification.from.Username);
      },
      onError: (error: any) => {
        console.error("Erro ao seguir:", error);
        Alert.alert("Erro", "Não foi possível seguir este utilizador");
      },
    });
  }, [notification.from._id, followUser, isFollowing]);

  // ----------------------------------------
  // FUNÇÃO: getNotificationText
  // ----------------------------------------
  // Devolve o texto da ação consoante o tipo de notificação
  const getNotificationText = () => {
    switch (notification.type) {
      case "follow":
        return "começou a seguir-te";
      case "like":
        return "gostou da tua publicação";
      case "comment":
        return "comentou na tua publicação";
      case "delete_post":
        return "removeu a tua publicação";
      case "delete_comment":
        return "removeu o teu comentário";
      default:
        return "interagiu contigo";
    }
  };

  // ----------------------------------------
  // FUNÇÃO: getIconName
  // ----------------------------------------
  // Devolve o nome do ícone consoante o tipo
  const getIconName = () => {
    switch (notification.type) {
      case "follow":
        return "person-add";
      case "like":
        return "heart";
      case "comment":
        return "chatbubble";
      case "delete_post":
      case "delete_comment":
        return "trash";
      default:
        return "notifications";
    }
  };

  // ----------------------------------------
  // FUNÇÃO: getIconColor
  // ----------------------------------------
  // Devolve a cor do ícone consoante o tipo
  const getIconColor = () => {
    switch (notification.type) {
      case "follow":
        return "#83E509";  // Verde
      case "like":
        return "#ED4956";  // Vermelho
      case "comment":
        return "#2196F3";  // Azul
      case "delete_post":
      case "delete_comment":
        return "#C62828";  // Vermelho escuro
      default:
        return "#666";
    }
  };

  // ----------------------------------------
  // RENDER
  // ----------------------------------------
  // senderName = nome a mostrar
  // Se for delete_post ou delete_comment → mostra "Moderador" (não o nome do admin)
  // Senão → mostra FirstName + LastName
  const senderName = isAdminDelete
    ? "Moderador"
    : `${notification.from?.FirstName || ""} ${notification.from?.LastName || ""}`.trim();

  return (
    <View className="relative">
      {/* Fundo vermelho que aparece quando arrastamos (efeito visual) */}
      <View className="absolute right-0 top-0 bottom-0 w-24 bg-red-500 justify-center items-center rounded-lg">
        <Ionicons name="trash" size={24} color="white" />
        <Text className="text-white text-xs mt-1">Apagar</Text>
      </View>

      {/* Card da notificação (arrastável) */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={handlePress}
          disabled={checkingPost}
          className={`flex-row items-center p-4 border-b border-gray-100 ${
            // Se não foi lida → fundo cinza claro
            !notification.read ? "bg-gray-50" : "bg-white"
          }`}
        >
          {/* ============================================ */}
          {/* AVATAR / ÍCONE */}
          {/* ============================================ */}
          {/* Se for delete_post ou delete_comment → mostra ícone de lixo em vez da foto do admin */}
          {isAdminDelete ? (
            <View
              className="w-12 h-12 rounded-full justify-center items-center"
              style={{ backgroundColor: "#FFEBEE" }}  // Fundo vermelho claro
            >
              <Ionicons name="trash" size={24} color="#C62828" />
            </View>
          ) : (
            <View className="relative">
              {notification.from?.ProfilePicture ? (
                <Image
                  source={{ uri: notification.from.ProfilePicture }}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-gray-200 justify-center items-center">
                  <Text className="text-gray-500 font-bold">
                    {notification.from?.FirstName?.[0] || "?"}
                  </Text>
                </View>
              )}

              {/* Ícone pequeno do tipo de notificação (canto inferior direito do avatar) */}
              <View
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full justify-center items-center"
                style={{ backgroundColor: getIconColor() }}
              >
                <Ionicons name={getIconName()} size={10} color="white" />
              </View>
            </View>
          )}

          {/* ============================================ */}
          {/* TEXTO DA NOTIFICAÇÃO */}
          {/* ============================================ */}
          <View className="flex-1 ml-3">
            <Text className="text-sm text-gray-800">
              {/* Nome em negrito */}
              <Text className="font-bold">{senderName}</Text>
              {/* Texto da ação */}
              <Text> {getNotificationText()}</Text>
            </Text>

            {/* Se for delete_post ou delete_comment → mostra o motivo em vermelho */}
            {isAdminDelete && notification.reason && (
              <Text className="text-xs text-red-600 mt-1 italic">
                Motivo: {notification.reason}
              </Text>
            )}

            {/* Se for delete_post ou delete_comment → mostra o conteúdo removido */}
            {isAdminDelete && notification.postTitle && (
              <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                "{notification.postTitle}"
              </Text>
            )}

            {/* Data da notificação */}
            <Text className="text-xs text-gray-400 mt-1">
              {new Date(notification.createdAt).toLocaleDateString("pt-PT")}
            </Text>
          </View>

          {/* ============================================ */}
          {/* BOTÃO "SEGUIR" (só para follow) */}
          {/* ============================================ */}
          {notification.type === "follow" && (
            <TouchableOpacity
              onPress={handleFollow}
              className={`px-4 py-2 rounded-full ${
                // Se já estou a seguir → fundo cinza
                isFollowing
                  ? "bg-gray-200"
                  // Se não estou a seguir → fundo verde
                  : "bg-[#83E509]"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isFollowing ? "text-gray-600" : "text-white"
                }`}
              >
                {/* Texto do botão muda consoante o estado */}
                {isFollowing ? "A seguir" : "Seguir"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Indicador de loading enquanto verifica se o post existe */}
          {checkingPost && (
            <ActivityIndicator size="small" color="#3A6604" className="ml-2" />
          )}

          {/* Bolinha azul (só aparece se não foi lida) */}
          {!notification.read && !checkingPost && (
            <View className="w-2 h-2 rounded-full bg-blue-500 ml-2" />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}