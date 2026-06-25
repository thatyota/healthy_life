import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserPosts } from "@/hooks/useUserPosts";
import { useSignOut } from "@/hooks/useSignOut";
import ProfilePostCard from "@/components/ProfilePostCard";
import EditProfileModal from "@/components/EditProfileModal";

export default function ProfileScreen() {
  const { userId } = useAuth();
  const { data: user, isLoading: userLoading, error: userError, refetch: refetchUser } = useCurrentUser();
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useUserPosts(user?.Username || "");
  const { handleSignOut } = useSignOut();
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchUser(), refetchPosts()]);
    setRefreshing(false);
  }, [refetchUser, refetchPosts]);

  if (userLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9] justify-center items-center">
        <ActivityIndicator size="large" color="#65B307" />
        <Text className="text-[#486623] mt-3">A carregar perfil...</Text>
      </SafeAreaView>
    );
  }

  if (userError || !user) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9] justify-center items-center px-6">
        <View className="w-16 h-16 rounded-full bg-[#FFEBEE] justify-center items-center mb-4">
          <Ionicons name="warning-outline" size={32} color="#C62828" />
        </View>
        <Text className="text-[#C62828] font-bold text-lg">Erro ao carregar perfil</Text>
        <Text className="text-[#486623] text-sm text-center mt-2">
          {userError?.message || "Não foi possível carregar os dados do perfil"}
        </Text>
        <TouchableOpacity 
          onPress={() => refetchUser()}
          className="mt-4 px-6 py-2 bg-[#65B307] rounded-full"
        >
          <Text className="text-white font-bold">Tentar novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const displayName = `${user.FirstName || ""} ${user.LastName || ""}`.trim() || user.Username;
  const postsCount = posts?.length || 0;
  const followersCount = user.Followers?.length || 0;
  const followingCount = user.Following?.length || 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-[#C8E6C9]">
        <Text className="text-xl font-bold text-[#3A6604]">Perfil</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Feather name="log-out" size={22} color="#C62828" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#65B307" colors={["#65B307"]} />
        }
      >
        {/* Banner */}
        {user.bannerImage ? (
          <Image source={{ uri: user.bannerImage }} className="w-full h-32" />
        ) : (
          <View className="w-full h-32 bg-[#C8E6C9]" />
        )}

        {/* Avatar & Edit Button */}
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

          <TouchableOpacity
            onPress={() => setEditModalVisible(true)}
            className="px-5 py-2 rounded-full border border-[#65B307] bg-white"
          >
            <Text className="text-[#3A6604] font-bold text-sm">Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View className="px-4 mt-3">
          <Text className="font-bold text-xl text-[#3A6604]">{displayName}</Text>
          <Text className="text-[#486623]">@{user.Username}</Text>

          {user.bio ? <Text className="text-[#1a1a1a] mt-2 text-[15px]">{user.bio}</Text> : null}

          {user.location ? (
            <View className="flex-row items-center mt-2">
              <Feather name="map-pin" size={14} color="#65B307" />
              <Text className="text-[#486623] ml-1 text-sm">{user.location}</Text>
            </View>
          ) : null}

          <View className="flex-row mt-4 gap-6">
            <View className="items-center">
              <Text className="font-bold text-[#3A6604] text-lg">{postsCount}</Text>
              <Text className="text-[#486623] text-sm">Receitas</Text>
            </View>
            <TouchableOpacity className="items-center">
              <Text className="font-bold text-[#3A6604] text-lg">{followersCount}</Text>
              <Text className="text-[#486623] text-sm">Seguidores</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <Text className="font-bold text-[#3A6604] text-lg">{followingCount}</Text>
              <Text className="text-[#486623] text-sm">A seguir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View className="h-2 bg-[#E8F5E9] mt-4" />

        {/* Posts Section */}
        <View className="flex-row items-center px-4 py-3">
          <Ionicons name="restaurant-outline" size={18} color="#3A6604" />
          <Text className="text-[#3A6604] font-bold text-lg ml-2">Minhas Receitas</Text>
        </View>

        {postsLoading && !posts ? (
          <View className="py-10 justify-center items-center">
            <ActivityIndicator size="large" color="#65B307" />
          </View>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <ProfilePostCard key={post._id} post={post} isOwnProfile={true} />
          ))
        ) : (
          <View className="py-20 justify-center items-center px-6">
            <View className="w-20 h-20 rounded-full bg-[#E8F5E9] justify-center items-center mb-4">
              <Ionicons name="restaurant-outline" size={40} color="#65B307" />
            </View>
            <Text className="text-[#3A6604] font-bold text-lg">Ainda não há receitas</Text>
            <Text className="text-[#486623] text-base mt-2 text-center">
              Partilha a tua primeira receita saudável!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        user={user}
      />
    </SafeAreaView>
  );
}