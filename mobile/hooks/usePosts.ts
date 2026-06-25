import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, postApi } from "@/utils/api";

export interface Post {
  _id: string;
  Content: string;
  Image: string;
  Likes: string[];
  comments: string[];
  User: {
    _id: string;
    Username: string;
    FirstName: string;
    LastName: string;
    ProfilePicture: string;
  };
  user?: {
    _id: string;
    Username: string;
    FirstName: string;
    LastName: string;
    ProfilePicture: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const usePosts = () => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const response = await postApi.getPosts(api);
      return response.data.posts as Post[];
    },
  });
};

export const useLikePost = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await postApi.likePost(api, postId);
      return response.data;
    },
    // Otimização: atualiza o cache imediatamente
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousPosts = queryClient.getQueryData<Post[]>(["posts"]);
      
      queryClient.setQueryData<Post[]>(["posts"], (old) => {
        if (!old) return old;
        return old.map((post) => {
          if (post._id === postId) {
            // Toggle like localmente
            const currentUserId = "current"; // Será substituído pelo clerk
            const isLiked = post.Likes.includes(currentUserId);
            return {
              ...post,
              Likes: isLiked 
                ? post.Likes.filter((id) => id !== currentUserId)
                : [...post.Likes, currentUserId],
            };
          }
          return post;
        });
      });

      return { previousPosts };
    },
    onError: (err, postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useDeletePost = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await postApi.deletePost(api, postId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};