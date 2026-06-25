import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, postApi } from "@/utils/api";

export interface Post {
  _id: string;
  Content: string;
  Image: string;
  Likes: string[];
  Comments: string[];
  user: {
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
    onSuccess: () => {
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