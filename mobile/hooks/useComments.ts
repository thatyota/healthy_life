import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, commentApi } from "@/utils/api";

export interface Comment {
  _id: string;
  content: string;
  likes: string[];
  user: {
    _id: string;
    Username: string;
    FirstName: string;
    LastName: string;
    ProfilePicture: string;
  };
  post: string;
  createdAt: string;
}

export const useComments = (postId: string) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      try {
        console.log(`🔍 Buscando comentários do post: ${postId}`);
        const response = await commentApi.getComments(api, postId);
        console.log("✅ Comentários:", response.data.comments?.length || 0);
        return response.data.comments as Comment[];
      } catch (error: any) {
        console.error("❌ Erro ao buscar comentários:", error.message);
        throw error;
      }
    },
    enabled: !!postId,
  });
};

export const useCreateComment = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      console.log(`📝 Criando comentário no post ${postId}:`, content);
      const response = await commentApi.createComment(api, postId, content);
      console.log("✅ Comentário criado:", response.data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: any) => {
      console.error("❌ Erro ao criar comentário:", error.message);
    },
  });
};

export const useDeleteComment = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const response = await commentApi.deleteComment(api, commentId);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};