import { useQuery } from "@tanstack/react-query";
import { useApiClient, postApi } from "@/utils/api";
import { Post } from "./usePosts";

export const useUserPosts = (username: string) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["userPosts", username],
    queryFn: async () => {
      try {
        console.log(`🔍 A buscar posts do user: ${username}`);
        const response = await postApi.getUserPosts(api, username);
        console.log("✅ Posts do user:", response.data.posts?.length || 0);
        return response.data.posts as Post[];
      } catch (error: any) {
        console.error("❌ Erro ao buscar posts do user:", error.message);
        throw error;
      }
    },
    enabled: !!username,
  });
};