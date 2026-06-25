import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
  Pressable,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useLikePost, useDeletePost, Post } from "@/hooks/usePosts";
import { useRouter } from "expo-router";

interface Props {
  post: Post;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m`;
  return `${Math.floor(days / 365)}a`;
}

export default function PostCard({ post }: Props) {
  const { userId } = useAuth();
  const router = useRouter();
  const likeMutation = useLikePost();
  const deleteMutation = useDeletePost();
  
  // Animação do coração
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [likedLocally, setLikedLocally] = useState<boolean | null>(null);

  const postUser = post.User || post.user;
  const isLikedFromServer = post.Likes?.includes(userId || "");
  const isLiked = likedLocally !== null ? likedLocally : isLikedFromServer;
  const likeCount = post.Likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  const displayName =
    `${postUser?.FirstName || ""} ${postUser?.LastName || ""}`.trim() ||
    postUser?.Username;

  const username = postUser?.Username || "user";
  const profilePicture = postUser?.ProfilePicture;

  // Animação do like
  const animateLike = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLike = () => {
    // Atualização instantânea local
    setLikedLocally(!isLiked);
    animateLike();
    
    // Chama o server em background
    likeMutation.mutate(post._id, {
      onSettled: () => {
        // Reset do estado local quando o server responder
        setLikedLocally(null);
      },
    });
  };

  const handleDelete = () => {
    Alert.alert("Eliminar receita", "Tens a certeza que queres eliminar esta receita?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteMutation.mutate(post._id),
      },
    ]);
  };

  const navigateToComments = () => {
    router.push(`/comments/${post._id}` as any);
  };

  const timeAgo = post.createdAt ? formatTimeAgo(post.createdAt) : "";

  return (
    <View className="bg-white mx-3 mb-3 rounded-2xl shadow-sm border border-[#E8F5E9] overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.push(`/profile/${username}` as any)}
          className="flex-row items-center flex-1"
        >
          {profilePicture ? (
            <Image
              source={{ uri: profilePicture }}
              className="w-10 h-10 rounded-full border-2 border-[#83E509]"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-[#3A6604] justify-center items-center border-2 border-[#83E509]">
              <Text className="text-white font-bold text-sm">
                {username?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text className="text-[#3A6604] font-bold text-[15px]">{displayName}</Text>
            <Text className="text-[#486623] text-[13px]">
              @{username} · {timeAgo}
            </Text>
          </View>
        </TouchableOpacity>

        {postUser?._id === userId && (
          <TouchableOpacity onPress={handleDelete} className="p-1">
            <Feather name="more-horizontal" size={20} color="#486623" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {post.Content ? (
        <TouchableOpacity onPress={navigateToComments}>
          <View className="px-4 pb-2">
            <Text className="text-[#1a1a1a] text-[15px] leading-[22px]">{post.Content}</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Image */}
      {post.Image ? (
        <TouchableOpacity onPress={navigateToComments}>
          <View className="px-4 pb-3">
            <Image
              source={{ uri: post.Image }}
              className="w-full aspect-[4/3] rounded-xl"
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Actions */}
      <View className="flex-row items-center px-4 pb-4 gap-6">
        {/* Like com animação */}
        <Pressable onPress={handleLike} className="flex-row items-center gap-1.5">
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={22}
              color={isLiked ? "#ED4956" : "#486623"}
            />
          </Animated.View>
          {likeCount > 0 && (
            <Text className={`text-[13px] font-semibold ${isLiked ? "text-[#ED4956]" : "text-[#486623]"}`}>
              {likeCount}
            </Text>
          )}
        </Pressable>

        {/* Comment - navega para página */}
        <TouchableOpacity
          onPress={navigateToComments}
          className="flex-row items-center gap-1.5"
        >
          <Ionicons name="chatbubble-outline" size={20} color="#486623" />
          {commentCount > 0 && (
            <Text className="text-[#486623] text-[13px] font-semibold">{commentCount}</Text>
          )}
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity>
          <Feather name="send" size={20} color="#486623" />
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity className="ml-auto">
          <Ionicons name="bookmark-outline" size={20} color="#486623" />
        </TouchableOpacity>
      </View>
    </View>
  );
}