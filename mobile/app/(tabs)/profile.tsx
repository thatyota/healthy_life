import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Modal,
    Alert,
    Switch,
  } from "react-native";
  import { useState, useCallback, useEffect } from "react";
  import { SafeAreaView } from "react-native-safe-area-context";
  import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
  import { useAuth } from "@clerk/clerk-expo";
  import { useCurrentUser } from "@/hooks/useCurrentUser";
  import { useUserPosts } from "@/hooks/useUserPosts";
  import { useSignOut } from "@/hooks/useSignOut";
  import { useDeleteAccount } from "@/hooks/useDeleteAccount";
  import ProfilePostCard from "@/components/ProfilePostCard";
  import EditProfileModal from "@/components/EditProfileModal";
  import AsyncStorage from "@react-native-async-storage/async-storage";

  // Traducoes simples
  const t = {
    pt: {
      perfil: "Perfil",
      editarPerfil: "Editar perfil",
      receitas: "Receitas",
      seguidores: "Seguidores",
      aSeguir: "A seguir",
      minhasReceitas: "Minhas Receitas",
      semReceitas: "Ainda não há receitas",
      partilhaPrimeira: "Partilha a tua primeira receita saudável!",
      definicoes: "Definições",
      idioma: "Idioma",
      conta: "Conta",
      sair: "Sair da conta",
      deletar: "Deletar conta",
      confirmSair: "Tens a certeza que queres sair?",
      confirmDeletar: "Esta ação é irreversível. Todos os teus dados serão eliminados permanentemente.",
      cancelar: "Cancelar",
      tema: "Modo Escuro",
      aparencia: "APARÊNCIA",
    },
    en: {
      perfil: "Profile",
      editarPerfil: "Edit profile",
      receitas: "Recipes",
      seguidores: "Followers",
      aSeguir: "Following",
      minhasReceitas: "My Recipes",
      semReceitas: "No recipes yet",
      partilhaPrimeira: "Share your first healthy recipe!",
      definicoes: "Settings",
      idioma: "Language",
      conta: "Account",
      sair: "Sign out",
      deletar: "Delete account",
      confirmSair: "Are you sure you want to sign out?",
      confirmDeletar: "This action is irreversible. All your data will be permanently deleted.",
      cancelar: "Cancel",
      tema: "Dark Mode",
      aparencia: "APPEARANCE",
    },
  };

  export default function ProfileScreen() {
    const { data: user, isLoading: userLoading, error: userError, refetch: refetchUser } = useCurrentUser();
    const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useUserPosts(user?.Username || "");
    const { handleSignOut } = useSignOut();
    const deleteAccount = useDeleteAccount();
    const [refreshing, setRefreshing] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [language, setLanguage] = useState<"pt" | "en">("pt");
    const [darkMode, setDarkMode] = useState(false);
    const [loadingPrefs, setLoadingPrefs] = useState(true);

    // Carrega preferencias
    useEffect(() => {
      const load = async () => {
        try {
          const lang = await AsyncStorage.getItem("language");
          const theme = await AsyncStorage.getItem("theme");
          if (lang === "en" || lang === "pt") setLanguage(lang);
          if (theme) setDarkMode(theme === "dark");
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingPrefs(false);
        }
      };
      load();
    }, []);

    const lang = t[language];

    const onRefresh = useCallback(async () => {
      setRefreshing(true);
      await Promise.all([refetchUser(), refetchPosts()]);
      setRefreshing(false);
    }, [refetchUser, refetchPosts]);

    const changeLanguage = async (langCode: "pt" | "en") => {
      setLanguage(langCode);
      await AsyncStorage.setItem("language", langCode);
    };

    const toggleTheme = async () => {
      const newTheme = !darkMode;
      setDarkMode(newTheme);
      await AsyncStorage.setItem("theme", newTheme ? "dark" : "light");
    };

    const handleLogout = () => {
      Alert.alert(lang.sair, lang.confirmSair, [
        { text: lang.cancelar, style: "cancel" },
        { text: lang.sair, style: "destructive", onPress: () => { setSettingsVisible(false); handleSignOut(); } },
      ]);
    };

    const handleDeleteAccountPress = () => {
      Alert.alert(lang.deletar, lang.confirmDeletar, [
        { text: lang.cancelar, style: "cancel" },
        { text: lang.deletar, style: "destructive", onPress: () => { setSettingsVisible(false); deleteAccount.mutate(); } },
      ]);
    };

    if (userLoading || loadingPrefs) {
      return (
        <SafeAreaView className="flex-1 bg-[#F1F8E9] justify-center items-center">
          <ActivityIndicator size="large" color="#65B307" />
          <Text className="text-[#486623] mt-3">A carregar...</Text>
        </SafeAreaView>
      );
    }

    if (userError || !user) {
      return (
        <SafeAreaView className="flex-1 bg-[#F1F8E9] justify-center items-center px-6">
          <View className="w-16 h-16 rounded-full bg-[#FFEBEE] justify-center items-center mb-4">
            <Ionicons name="warning-outline" size={32} color="#C62828" />
          </View>
          <Text className="text-[#C62828] font-bold text-lg">Erro</Text>
          <Text className="text-[#486623] text-sm text-center mt-2">{userError?.message || "Erro ao carregar"}</Text>
          <TouchableOpacity onPress={() => refetchUser()} className="mt-4 px-6 py-2 bg-[#65B307] rounded-full">
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
          <Text className="text-xl font-bold text-[#3A6604]">{lang.perfil}</Text>
          <TouchableOpacity onPress={() => setSettingsVisible(true)} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={24} color="#3A6604" />
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
              <Image source={{ uri: user.ProfilePicture }} className="w-20 h-20 rounded-full border-4 border-white" />
            ) : (
              <View className="w-20 h-20 rounded-full bg-[#3A6604] border-4 border-white justify-center items-center">
                <Text className="text-white text-2xl font-bold">{user.Username?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => setEditModalVisible(true)} className="px-5 py-2 rounded-full border border-[#65B307] bg-white">
              <Text className="text-[#3A6604] font-bold text-sm">{lang.editarPerfil}</Text>
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
                <Text className="text-[#486623] text-sm">{lang.receitas}</Text>
              </View>
              <TouchableOpacity className="items-center">
                <Text className="font-bold text-[#3A6604] text-lg">{followersCount}</Text>
                <Text className="text-[#486623] text-sm">{lang.seguidores}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="items-center">
                <Text className="font-bold text-[#3A6604] text-lg">{followingCount}</Text>
                <Text className="text-[#486623] text-sm">{lang.aSeguir}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="h-2 bg-[#E8F5E9] mt-4" />

          {/* Posts */}
          <View className="flex-row items-center px-4 py-3">
            <Ionicons name="restaurant-outline" size={18} color="#3A6604" />
            <Text className="text-[#3A6604] font-bold text-lg ml-2">{lang.minhasReceitas}</Text>
          </View>

          {postsLoading && !posts ? (
            <View className="py-10 justify-center items-center">
              <ActivityIndicator size="large" color="#65B307" />
            </View>
          ) : posts && posts.length > 0 ? (
            posts.map((post) => <ProfilePostCard key={post._id} post={post} isOwnProfile={true} />)
          ) : (
            <View className="py-20 justify-center items-center px-6">
              <View className="w-20 h-20 rounded-full bg-[#E8F5E9] justify-center items-center mb-4">
                <Ionicons name="restaurant-outline" size={40} color="#65B307" />
              </View>
              <Text className="text-[#3A6604] font-bold text-lg">{lang.semReceitas}</Text>
              <Text className="text-[#486623] text-base mt-2 text-center">{lang.partilhaPrimeira}</Text>
            </View>
          )}
        </ScrollView>

        <EditProfileModal visible={editModalVisible} onClose={() => setEditModalVisible(false)} user={user} />

        {/* Settings Modal */}
        <Modal visible={settingsVisible} transparent animationType="slide" onRequestClose={() => setSettingsVisible(false)}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl px-4 pt-6 pb-10">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-[#3A6604]">{lang.definicoes}</Text>
                <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                  <Ionicons name="close" size={28} color="#486623" />
                </TouchableOpacity>
              </View>

              {/* Tema Escuro */}
              <Text className="text-[#486623] text-sm font-semibold uppercase mb-3">{lang.aparencia}</Text>
              <View className="flex-row items-center justify-between p-4 rounded-xl border border-[#C8E6C9] bg-white mb-6">
                <View className="flex-row items-center">
                  <Ionicons name={darkMode ? "moon" : "sunny"} size={22} color="#3A6604" />
                  <Text className="ml-3 font-medium text-[#1a1a1a]">{lang.tema}</Text>
                </View>
                <Switch value={darkMode} onValueChange={toggleTheme} trackColor={{ false: "#C8E6C9", true: "#3A6604" }} thumbColor="#fff" />
              </View>

              {/* Idioma */}
              <Text className="text-[#486623] text-sm font-semibold uppercase mb-3">{lang.idioma}</Text>
              <View className="flex-row gap-3 mb-6">
                <TouchableOpacity
                  onPress={() => changeLanguage("pt")}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    language === "pt" ? "bg-[#E8F5E9] border-[#65B307]" : "bg-white border-[#C8E6C9]"
                  }`}
                >
                  <Text className={`font-bold ${language === "pt" ? "text-[#3A6604]" : "text-[#486623]"}`}>Português</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => changeLanguage("en")}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    language === "en" ? "bg-[#E8F5E9] border-[#65B307]" : "bg-white border-[#C8E6C9]"
                  }`}
                >
                  <Text className={`font-bold ${language === "en" ? "text-[#3A6604]" : "text-[#486623]"}`}>English</Text>
                </TouchableOpacity>
              </View>

              {/* Conta */}
              <Text className="text-[#486623] text-sm font-semibold uppercase mb-3">{lang.conta}</Text>
              <TouchableOpacity onPress={handleLogout} className="flex-row items-center py-4 px-4 bg-[#FFF3E0] rounded-xl mb-3">
                <MaterialIcons name="logout" size={22} color="#E65100" />
                <Text className="text-[#E65100] font-bold ml-3 text-[15px]">{lang.sair}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteAccountPress} className="flex-row items-center py-4 px-4 bg-[#FFEBEE] rounded-xl">
                <MaterialIcons name="delete-forever" size={22} color="#C62828" />
                <Text className="text-[#C62828] font-bold ml-3 text-[15px]">{lang.deletar}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }