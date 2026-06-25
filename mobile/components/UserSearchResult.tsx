import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Props {
  user: {
    _id: string;
    Username: string;
    FirstName: string;
    LastName: string;
    ProfilePicture: string;
    bio: string;
    Followers: string[];
  };
}

export default function UserSearchResult({ user }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/profile/${user.Username}` as any)}
      className="flex-row items-center py-3 px-4 border-b border-gray-100 active:bg-gray-50"
    >
      {/* Avatar */}
      {user.ProfilePicture ? (
        <Image
          source={{ uri: user.ProfilePicture }}
          className="w-12 h-12 rounded-full"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-gray-300 justify-center items-center">
          <Text className="text-white text-lg font-bold">
            {user.Username?.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Info */}
      <View className="flex-1 ml-3">
        <Text className="font-bold text-gray-900 text-base">
          {user.FirstName} {user.LastName}
        </Text>
        <Text className="text-gray-500 text-sm">@{user.Username}</Text>
        {user.bio ? (
          <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={1}>
            {user.bio}
          </Text>
        ) : null}
      </View>

      {/* Followers count */}
      <View className="items-end">
        <Text className="text-gray-500 text-xs">
          {user.Followers?.length || 0} seguidores
        </Text>
        <Feather name="chevron-right" size={18} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}