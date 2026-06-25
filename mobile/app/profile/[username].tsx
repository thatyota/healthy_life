import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";

const API_URL = "https://healthy-life-sable.vercel.app/api";

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const { userId, getToken } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/users/profile/${username}`);
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-[#C8E6C9]">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#3A6604" />
        </TouchableOpacity>
        <View>
          <Text className="font-bold text-lg text-[#3A6604]">
            {user.FirstName} {user.LastName}
          </Text>
          <Text className="text-[#486623] text-sm">
            {user.Followers?.length || 0} seguidores
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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
            Receitas
          </Text>
        </View>
        <View className="pb-10 px-6">
          <Text className="text-[#486623] text-center">
            As receitas deste chef aparecem aqui
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}