import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/utils/api";

export interface Notification {
  _id: string;
  from: {
    _id: string;
    Username: string;
    FirstName: string;
    LastName: string;
    ProfilePicture: string;
  };
  to: string;
  type: "follow" | "like" | "comment";
  post?: string;
  comment?: string;
  read: boolean;
  createdAt: string;
}

export const useNotifications = () => {
  const api = useApiClient();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get("/notifications");
      return response.data.notifications as Notification[];
    },
  });
};

export const useMarkAsRead = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

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