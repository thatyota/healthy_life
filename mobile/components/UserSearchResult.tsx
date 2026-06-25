import { View, Text, Image, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

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
  const displayName = `${user.FirstName} ${user.LastName}`.trim() || user.Username;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/profile/${user.Username}` as any)}
      className="flex-row items-center px-4 py-3 active:bg-[#E8F5E9]"
    >
      {user.ProfilePicture ? (
        <Image
          source={{ uri: user.ProfilePicture }}
          className="w-[52px] h-[52px] rounded-full border-2 border-[#83E509]"
        />
      ) : (
        <View className="w-[52px] h-[52px] rounded-full bg-[#3A6604] justify-center items-center border-2 border-[#83E509]">
          <Text className="text-white text-xl font-semibold">
            {user.Username?.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View className="flex-1 ml-3">
        <Text className="text-[#3A6604] font-semibold text-[15px]">{displayName}</Text>
        <Text className="text-[#486623] text-[14px] mt-[1px]">@{user.Username}</Text>
        {user.Followers && user.Followers.length > 0 ? (
          <Text className="text-[#65B307] text-[13px] mt-[2px]">
            {user.Followers.length.toLocaleString()} seguidores
          </Text>
        ) : null}
      </View>

      <Feather name="chevron-right" size={20} color="#65B307" />
    </TouchableOpacity>
  );
}