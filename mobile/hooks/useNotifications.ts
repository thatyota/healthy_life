import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/utils/api";

// ============================================
// TIPO: Notification
// ============================================
// Define a estrutura de cada notificação que vem do backend
export interface Notification {
  _id: string;           // ID único da notificação no MongoDB
  from: {                 // Quem fez a ação (quem seguiu, deu like, etc.)
    _id: string;           // ID do user que fez a ação
    Username: string;      // Nome de utilizador
    FirstName: string;     // Primeiro nome
    LastName: string;      // Último nome
    ProfilePicture: string; // Foto de perfil
  };
  to: string;             // ID do user que recebeu a notificação
  // Tipos de notificação suportados:
  // - "follow": alguém começou a seguir
  // - "like": alguém gostou do teu post
  // - "comment": alguém comentou no teu post
  // - "delete_post": moderador removeu o teu post
  // - "delete_comment": moderador removeu o teu comentário
  type: "follow" | "like" | "comment" | "delete_post" | "delete_comment";
  post?: string;          // ID do post (só para like, comment, delete_post, delete_comment)
  comment?: string;        // ID do comentário (só para comment)
  reason?: string;        // Motivo da remoção (só para delete_post e delete_comment)
  postTitle?: string;     // Título/conteúdo removido (só para delete_post e delete_comment)
  read: boolean;          // true = já foi lida, false = não lida
  createdAt: string;      // Data de criação
}

// ============================================
// HOOK: useNotifications
// ============================================
// Busca todas as notificações do user logado
// Usa useQuery porque são dados que não mudam sozinhos — precisam de refetch
export const useNotifications = () => {
  const api = useApiClient();

  return useQuery({
    // queryKey = identificador único. Quando invalidamos "notifications", esta query atualiza
    queryKey: ["notifications"],

    // queryFn = função que busca os dados do servidor
    queryFn: async () => {
      const response = await api.get("/notifications");
      // response.data.notifications = array de notificações do backend
      return response.data.notifications as Notification[];
    },
  });
};

// ============================================
// HOOK: useMarkAsRead
// ============================================
// Marca UMA notificação como lida
// Usa useMutation porque altera dados no servidor
export const useMarkAsRead = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();  // Para invalidar a cache depois

  return useMutation({
    // mutationFn = função que faz o pedido PUT ao backend
    mutationFn: async (notificationId: string) => {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    },

    // onSuccess = corre quando o pedido tem sucesso
    onSuccess: () => {
      // Invalida a cache das notificações → força buscar dados novos
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

// ============================================
// HOOK: useMarkAllAsRead
// ============================================
// Marca TODAS as notificações como lidas de uma vez
export const useMarkAllAsRead = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.put("/notifications/read-all");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

// ============================================
// HOOK: useDeleteNotification
// ============================================
// Apaga uma notificação (usado no swipe para a direita)
export const useDeleteNotification = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

// ============================================
// HOOK: useFollowUser
// ============================================
// Segue um user pelo ID
// Também invalida a cache do currentUser para atualizar a lista Following
export const useFollowUser = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/users/follow/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalida notificações (para atualizar o botão "Seguir" → "A seguir")
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // Invalida currentUser (para atualizar a lista Following do user logado)
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
};