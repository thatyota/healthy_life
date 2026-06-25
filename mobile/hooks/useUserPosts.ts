import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, postApi } from "@/utils/api";
import { Post } from "./usePosts";

export const useUserPosts = (username: string) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["userPosts", username],
    queryFn: async () => {
      const response = await postApi.getUserPosts(api, username);
      return response.data.posts as Post[];
    },
    enabled: !!username,
  });
};