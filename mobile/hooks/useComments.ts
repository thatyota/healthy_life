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
      const response = await commentApi.getComments(api, postId);
      return response.data.comments as Comment[];
    },
    enabled: !!postId,
  });
};

export const useCreateComment = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const response = await commentApi.createComment(api, postId, content);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
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