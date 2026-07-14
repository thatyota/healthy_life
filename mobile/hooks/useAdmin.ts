import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// =============================================================================
// useAdmin Hook
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
// useAdminStats — NOVO
// =============================================================================
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/stats");
      return res.data;
    },
    refetchInterval: 30000,
  });
}

// =============================================================================
// useAdminActivity — NOVO
// =============================================================================
export function useAdminActivity() {
  return useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/activity");
      return res.data;
    },
    refetchInterval: 30000,
  });
}

// =============================================================================
// useAdminPosts
// =============================================================================
export function useAdminPosts(params?: { search?: string }) {
  return useQuery({
    queryKey: ["admin-posts", params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      const res = await axios.get(`/api/admin/posts?${query.toString()}`);
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
export function useAdminUsers(params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      if (params?.status) query.append("status", params.status);
      const res = await axios.get(`/api/admin/users?${query.toString()}`);
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
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      await axios.post(`/api/admin/users/${userId}/ban`, { reason });
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
    mutationFn: async ({ userId, duration, reason }: { userId: string; duration: number; reason?: string }) => {
      await axios.post(`/api/admin/users/${userId}/timeout`, { duration, reason });
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

// =============================================================================
// useRemoveTimeout — NOVO
// =============================================================================
export function useRemoveTimeout() {
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

// =============================================================================
// useAdminComments — NOVO
// =============================================================================
export function useAdminComments(params?: { search?: string }) {
  return useQuery({
    queryKey: ["admin-comments", params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      const res = await axios.get(`/api/admin/comments?${query.toString()}`);
      return res.data;
    },
  });
}

// =============================================================================
// useDeleteCommentAdmin — NOVO
// =============================================================================
export function useDeleteCommentAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      await axios.delete(`/api/admin/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
    },
  });
}