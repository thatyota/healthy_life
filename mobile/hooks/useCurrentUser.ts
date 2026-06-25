import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, userApi } from "@/utils/api";

export interface CurrentUser {
  _id: string;
  clerkId: string;
  Username: string;
  FirstName: string;
  LastName: string;
  email: string;
  ProfilePicture: string;
  bannerImage: string;
  bio: string;
  location: string;
  Followers: string[];
  Following: string[];
  createdAt: string;
}

export const useCurrentUser = () => {
  const api = useApiClient();

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        console.log("🔍 A buscar current user...");
        const response = await userApi.getCurrentUser(api);
        console.log("✅ Current user:", response.data);
        return response.data.user as CurrentUser;
      } catch (error: any) {
        console.error("❌ Erro ao buscar current user:", error.message);
        console.error("   Status:", error.response?.status);
        console.error("   Data:", error.response?.data);
        throw error;
      }
    },
  });
};

export const useUpdateProfile = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await userApi.updateProfile(api, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};