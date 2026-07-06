import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// =============================================================================
// useAdmin Hook
// =============================================================================
// Verifica se o user logado tem role admin via API
// Chama /api/admin/check (protegido por protectRoute, nao por requireAdmin)
// =============================================================================

export function useAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-check"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/check");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = data?.isAdmin === true;

  return { isAdmin, isLoading };
}

// =============================================================================
// useModerationLogs
// =============================================================================

export function useModerationLogs() {
  return useQuery({
    queryKey: ["moderation-logs"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/logs");
      return res.data;
    },
  });
}

// =============================================================================
// useAdminPosts
// =============================================================================

export function useAdminPosts() {
  return useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/posts");
      return res.data;
    },
  });
}

// =============================================================================
// useDeletePostAdmin
// =============================================================================

export function useDeletePostAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      await axios.delete(`/api/admin/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    },
  });
}

// =============================================================================
// useAdminUsers
// =============================================================================

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/users");
      return res.data;
    },
  });
}

// =============================================================================
// useBanUser
// =============================================================================

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await axios.post(`/api/admin/users/${userId}/ban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

// =============================================================================
// useTimeoutUser
// =============================================================================

export function useTimeoutUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, duration }: { userId: string; duration: number }) => {
      await axios.post(`/api/admin/users/${userId}/timeout`, { duration });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

// =============================================================================
// useUnbanUser
// =============================================================================

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await axios.post(`/api/admin/users/${userId}/unban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}