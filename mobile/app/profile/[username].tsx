import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useApiClient, postApi } from "@/utils/api";
import { Post } from "@/hooks/usePosts";

const API_URL = "https://healthy-life-sable.vercel.app/api";

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const { userId, getToken } = useAuth();
  const api = useApiClient();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      console.log("🔍 Buscando perfil:", username);
      const response = await fetch(`${API_URL}/users/profile/${username}`);
      const data = await response.json();
      console.log("✅ Perfil encontrado:", data.user?.Username);
      setUser(data.user);
    } catch (error: any) {
      console.error("❌ Erro perfil:", error.message);
    }
  };

  const fetchUserPosts = async () => {
    setPostsLoading(true);
    setError(null);
    try {
      console.log("🔍 Buscando posts do user:", username);
      const response = await postApi.getUserPosts(api, username as string);
      console.log("✅ Posts encontrados:", response.data.posts?.length || 0);
      console.log("📊 Posts data:", JSON.stringify(response.data, null, 2));
      setPosts(response.data.posts || []);
    } catch (error: any) {
      console.error("❌ Erro posts:", error.message);
      console.error("   Status:", error.response?.status);
      console.error("   Data:", error.response?.data);
      setError(error.response?.data?.error || error.message);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchUserPosts()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [username]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchUserPosts()]);
    setRefreshing(false);
  }, []);

  const handleFollow = async () => {
    const token = await getToken();
    try {
      const response = await fetch(`${API_URL}/users/follow/${user._id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        setIsFollowing(!isFollowing);
        fetchProfile();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9] justify-center items-center">
        <ActivityIndicator size="large" color="#65B307" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9] justify-center items-center">
        <Text className="text-[#486623]">User not found</Text>
      </SafeAreaView>
    );
  }

  const isOwnProfile = userId === user.clerkId;
  const displayName = `${user.FirstName || ""} ${user.LastName || ""}`.trim() || user.Username;

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-[#C8E6C9]">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#3A6604" />
        </TouchableOpacity>
        <View>
          <Text className="font-bold text-lg text-[#3A6604]">{displayName}</Text>
          <Text className="text-[#486623] text-sm">
            {user.Followers?.length || 0} seguidores
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#65B307"
            colors={["#65B307"]}
          />
        }
      >
        {/* Banner */}
        {user.bannerImage ? (
          <Image source={{ uri: user.bannerImage }} className="w-full h-32" />
        ) : (
          <View className="w-full h-32 bg-[#C8E6C9]" />
        )}

        {/* Avatar & Follow Button */}
        <View className="px-4 -mt-10 flex-row justify-between items-end">
          {user.ProfilePicture ? (
            <Image
              source={{ uri: user.ProfilePicture }}
              className="w-20 h-20 rounded-full border-4 border-white"
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-[#3A6604] border-4 border-white justify-center items-center">
              <Text className="text-white text-2xl font-bold">
                {user.Username?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {!isOwnProfile && (
            <TouchableOpacity
              onPress={handleFollow}
              className={`px-6 py-2 rounded-full ${
                isFollowing
                  ? "bg-white border border-[#65B307]"
                  : "bg-[#65B307]"
              }`}
            >
              <Text
                className={`font-bold ${
                  isFollowing ? "text-[#3A6604]" : "text-white"
                }`}
              >
                {isFollowing ? "A seguir" : "Seguir"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info */}
        <View className="px-4 mt-3">
          <Text className="font-bold text-xl text-[#3A6604]">
            {user.FirstName} {user.LastName}
          </Text>
          <Text className="text-[#486623]">@{user.Username}</Text>

          {user.bio ? (
            <Text className="text-[#1a1a1a] mt-2 text-[15px]">{user.bio}</Text>
          ) : null}

          {user.location ? (
            <View className="flex-row items-center mt-2">
              <Feather name="map-pin" size={14} color="#65B307" />
              <Text className="text-[#486623] ml-1 text-sm">
                {user.location}
              </Text>
            </View>
          ) : null}

          {/* Stats */}
          <View className="flex-row mt-4 gap-6">
            <View className="items-center">
              <Text className="font-bold text-[#3A6604] text-lg">
                {posts.length}
              </Text>
              <Text className="text-[#486623] text-sm">Receitas</Text>
            </View>
            <View className="items-center">
              <Text className="font-bold text-[#3A6604] text-lg">
                {user.Followers?.length || 0}
              </Text>
              <Text className="text-[#486623] text-sm">Seguidores</Text>
            </View>
            <View className="items-center">
              <Text className="font-bold text-[#3A6604] text-lg">
                {user.Following?.length || 0}
              </Text>
              <Text className="text-[#486623] text-sm">A seguir</Text>
            </View>
          </View>
        </View>

        {/* Posts Section */}
        <View className="h-2 bg-[#E8F5E9] mt-4" />
        <View className="flex-row items-center px-4 py-3">
          <Ionicons name="restaurant-outline" size={18} color="#3A6604" />
          <Text className="text-[#3A6604] font-bold text-lg ml-2">
            Receitas de {user.FirstName || user.Username}
          </Text>
        </View>

        {error ? (
          <View className="py-10 justify-center items-center px-6">
            <Text className="text-[#C62828] text-base text-center">Erro: {error}</Text>
            <TouchableOpacity onPress={fetchUserPosts} className="mt-3 px-4 py-2 bg-[#65B307] rounded-full">
              <Text className="text-white font-bold">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : postsLoading ? (
          <View className="py-10 justify-center items-center">
            <ActivityIndicator size="large" color="#65B307" />
          </View>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <TouchableOpacity
              key={post._id}
              onPress={() => router.push(`/post/${post._id}` as any)}
              activeOpacity={0.9}
              className="bg-white mx-3 mb-3 rounded-2xl shadow-sm border border-[#E8F5E9] overflow-hidden"
            >
              {/* Post Header */}
              <View className="flex-row items-center px-4 pt-3 pb-2">
                <Text className="text-[#486623] text-[13px]">
                  {post.createdAt ? formatDate(post.createdAt) : ""}
                </Text>
              </View>

              {/* Content */}
              {post.Content ? (
                <View className="px-4 pb-2">
                  <Text className="text-[#1a1a1a] text-[15px] leading-[22px]" numberOfLines={3}>
                    {post.Content}
                  </Text>
                </View>
              ) : null}

              {/* Image */}
              {post.Image ? (
                <View className="px-4 pb-3">
                  <Image
                    source={{ uri: post.Image }}
                    className="w-full aspect-[4/3] rounded-xl"
                    resizeMode="cover"
                  />
                </View>
              ) : null}

              {/* Stats */}
              <View className="flex-row items-center px-4 pb-3 gap-4">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="heart" size={16} color="#65B307" />
                  <Text className="text-[#486623] text-[13px]">
                    {post.Likes?.length || 0} curtidas
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="chatbubble-outline" size={16} color="#486623" />
                  <Text className="text-[#486623] text-[13px]">
                    {post.comments?.length || 0} comentários
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="py-20 justify-center items-center px-6">
            <View className="w-20 h-20 rounded-full bg-[#E8F5E9] justify-center items-center mb-4">
              <Ionicons name="restaurant-outline" size={40} color="#65B307" />
            </View>
            <Text className="text-[#3A6604] font-bold text-lg text-center">
              Ainda não há receitas
            </Text>
            <Text className="text-[#486623] text-base mt-2 text-center">
              Este chef ainda não partilhou nenhuma receita.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString("pt-PT");
}