import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { CurrentUser, useUpdateProfile } from "@/hooks/useCurrentUser";
import * as ImagePicker from "expo-image-picker";

interface Props {
  visible: boolean;
  onClose: () => void;
  user: CurrentUser;
}

export default function EditProfileModal({ visible, onClose, user }: Props) {
  const [firstName, setFirstName] = useState(user.FirstName || "");
  const [lastName, setLastName] = useState(user.LastName || "");
  const [bio, setBio] = useState(user.bio || "");
  const [location, setLocation] = useState(user.location || "");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const updateMutation = useUpdateProfile();

  const pickImage = async (type: "profile" | "banner") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: type === "profile" ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === "profile") {
        setProfileImage(result.assets[0].uri);
      } else {
        setBannerImage(result.assets[0].uri);
      }
    }
  };

  const handleSave = () => {
    const data: any = {};
    if (firstName !== user.FirstName) data.FirstName = firstName;
    if (lastName !== user.LastName) data.LastName = lastName;
    if (bio !== user.bio) data.bio = bio;
    if (location !== user.location) data.location = location;

    if (Object.keys(data).length === 0 && !profileImage && !bannerImage) {
      onClose();
      return;
    }

    updateMutation.mutate(data, {
      onSuccess: () => {
        Alert.alert("Sucesso", "Perfil atualizado!");
        onClose();
      },
      onError: () => {
        Alert.alert("Erro", "Não foi possível atualizar o perfil.");
      },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-[#F1F8E9]">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-[#C8E6C9]">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-[#486623] text-base">Cancelar</Text>
          </TouchableOpacity>
          <Text className="text-[#3A6604] font-bold text-lg">Editar Perfil</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text className="text-[#65B307] font-bold text-base">Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Banner */}
          <TouchableOpacity onPress={() => pickImage("banner")} className="relative">
            {bannerImage || user.bannerImage ? (
              <Image
                source={{ uri: bannerImage || user.bannerImage }}
                className="w-full h-32"
              />
            ) : (
              <View className="w-full h-32 bg-[#C8E6C9] justify-center items-center">
                <Feather name="camera" size={24} color="#3A6604" />
                <Text className="text-[#3A6604] text-sm mt-1">Banner</Text>
              </View>
            )}
            <View className="absolute bottom-2 right-2 w-8 h-8 bg-[#3A6604] rounded-full justify-center items-center">
              <Feather name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>

          {/* Avatar */}
          <View className="px-4 -mt-10">
            <TouchableOpacity onPress={() => pickImage("profile")}>
              {profileImage || user.ProfilePicture ? (
                <Image
                  source={{ uri: profileImage || user.ProfilePicture }}
                  className="w-20 h-20 rounded-full border-4 border-white"
                />
              ) : (
                <View className="w-20 h-20 rounded-full bg-[#3A6604] border-4 border-white justify-center items-center">
                  <Text className="text-white text-2xl font-bold">
                    {user.Username?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="absolute bottom-0 left-14 w-7 h-7 bg-[#65B307] rounded-full justify-center items-center border-2 border-white">
                <Feather name="camera" size={14} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View className="px-4 mt-6 gap-4">
            <View>
              <Text className="text-[#3A6604] font-semibold mb-1">Primeiro Nome</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                className="bg-white border border-[#C8E6C9] rounded-xl px-4 py-3 text-[#1a1a1a]"
                placeholderTextColor="#8E8E8E"
              />
            </View>

            <View>
              <Text className="text-[#3A6604] font-semibold mb-1">Último Nome</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                className="bg-white border border-[#C8E6C9] rounded-xl px-4 py-3 text-[#1a1a1a]"
                placeholderTextColor="#8E8E8E"
              />
            </View>

            <View>
              <Text className="text-[#3A6604] font-semibold mb-1">Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                maxLength={160}
                className="bg-white border border-[#C8E6C9] rounded-xl px-4 py-3 text-[#1a1a1a] h-24"
                placeholderTextColor="#8E8E8E"
                textAlignVertical="top"
              />
              <Text className="text-[#8E8E8E] text-xs text-right mt-1">{bio.length}/160</Text>
            </View>

            <View>
              <Text className="text-[#3A6604] font-semibold mb-1">Localização</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                className="bg-white border border-[#C8E6C9] rounded-xl px-4 py-3 text-[#1a1a1a]"
                placeholderTextColor="#8E8E8E"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}