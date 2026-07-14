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
import { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserPosts } from "@/hooks/useUserPosts";
import { useSignOut } from "@/hooks/useSignOut";
import { useDeleteAccount } from "@/hooks/useDeleteAccount";
import ProfilePostCard from "@/components/ProfilePostCard";
import EditProfileModal from "@/components/EditProfileModal";
import { useTheme } from "../context/ThemeContext";

/**
 * ProfileScreen — ecra de perfil do user logado
 *
 * Mostra os dados do user (nome, bio, foto, banner, followers, following),
 * os posts do user, e um modal de definicoes com tema e idioma.
 */
export default function ProfileScreen() {
    // ----------------------------------------
    // HOOKS
    // ----------------------------------------
    // useCurrentUser = busca os dados do user logado (inclui nome, bio, foto, etc.)
    // refetchUser = funcao para buscar dados novos (usada no onSuccess do edit)
    const { data: user, isLoading: userLoading, error: userError, refetch: refetchUser } = useCurrentUser();
    // useUserPosts = busca os posts do user logado
    const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useUserPosts(user?.Username || "");
    // useSignOut = faz logout e redireciona para login
    const { handleSignOut } = useSignOut();
    // useDeleteAccount = apaga a conta do user
    const deleteAccount = useDeleteAccount();
    // useTheme = darkMode, language, toggleDarkMode, setLanguage
    const { darkMode, toggleDarkMode, language, setLanguage } = useTheme();

    // ----------------------------------------
    // ESTADO LOCAL
    // ----------------------------------------
    // refreshing = true quando o user faz pull-to-refresh
    const [refreshing, setRefreshing] = useState(false);
    // editModalVisible = true quando o modal de editar perfil esta aberto
    const [editModalVisible, setEditModalVisible] = useState(false);
    // settingsVisible = true quando o modal de definicoes esta aberto
    const [settingsVisible, setSettingsVisible] = useState(false);

    /**
     * onRefresh — funcao chamada quando o user faz pull-to-refresh
     *
     * Atualiza os dados do user e os posts em paralelo.
     */
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // Promise.all executa as duas chamadas em paralelo (mais rapido)
        await Promise.all([refetchUser(), refetchPosts()]);
        setRefreshing(false);
    }, [refetchUser, refetchPosts]);

    /**
     * changeLanguage — muda o idioma da app
     */
    const changeLanguage = (langCode: "pt" | "en") => {
        setLanguage(langCode);
    };

    /**
     * handleLogout — mostra alerta de confirmacao antes de fazer logout
     */
    const handleLogout = () => {
        Alert.alert(lang.sair, lang.confirmSair, [
            { text: lang.cancelar, style: "cancel" },
            {
                text: lang.sair,
                style: "destructive",
                onPress: () => {
                    setSettingsVisible(false);  // fecha o modal de definicoes
                    handleSignOut();            // faz logout
                },
            },
        ]);
    };

    /**
     * handleDeleteAccountPress — mostra alerta de confirmacao antes de apagar conta
     */
    const handleDeleteAccountPress = () => {
        Alert.alert(lang.deletar, lang.confirmDeletar, [
            { text: lang.cancelar, style: "cancel" },
            {
                text: lang.deletar,
                style: "destructive",
                onPress: () => {
                    setSettingsVisible(false);
                    deleteAccount.mutate();
                },
            },
        ]);
    };

    // ----------------------------------------
    // TRADUCOES
    // ----------------------------------------
    const t = {
        pt: {
            perfil: "Perfil",
            editarPerfil: "Editar perfil",
            receitas: "Receitas",
            seguidores: "Seguidores",
            aSeguir: "A seguir",
            minhasReceitas: "Minhas Receitas",
            semReceitas: "Ainda nao ha receitas",
            partilhaPrimeira: "Partilha a tua primeira receita saudavel!",
            definicoes: "Definicoes",
            idioma: "Idioma",
            conta: "Conta",
            sair: "Sair da conta",
            deletar: "Deletar conta",
            confirmSair: "Tens a certeza que queres sair?",
            confirmDeletar: "Esta acao e irreversivel. Todos os teus dados serao eliminados permanentemente.",
            cancelar: "Cancelar",
            tema: "Modo Escuro",
            aparencia: "APARENCIA",
            carregando: "A carregar...",
            erro: "Erro",
            erroCarregar: "Erro ao carregar",
            tentarNovamente: "Tentar novamente",
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
            carregando: "Loading...",
            erro: "Error",
            erroCarregar: "Error loading",
            tentarNovamente: "Try again",
        },
    };

    const lang = t[language];

    // ----------------------------------------
    // TEMA — Paleta de cores suave e agradavel
    // ----------------------------------------
    const theme = {
        bg: darkMode ? "#0f1f0f" : "#F1F8E9",
        cardBg: darkMode ? "#1a2e1a" : "#FFFFFF",
        headerBg: darkMode ? "#162616" : "#FFFFFF",
        text: darkMode ? "#a3d977" : "#3A6604",
        textSecondary: darkMode ? "#7a9e5c" : "#486623",
        textBody: darkMode ? "#c8ddb8" : "#1a1a1a",
        textMuted: darkMode ? "#5a7a4a" : "#666666",
        border: darkMode ? "#2a4a2a" : "#C8E6C9",
        banner: darkMode ? "#1a301a" : "#C8E6C9",
        avatarBg: "#3A6604",
        separator: darkMode ? "#1e351e" : "#E8F5E9",
        loading: darkMode ? "#7bc043" : "#65B307",
        error: "#e57373",
        errorBg: darkMode ? "#3a1e1e" : "#FFEBEE",
        buttonBg: darkMode ? "#4a8a3a" : "#65B307",
        buttonText: "#FFFFFF",
        modalBg: darkMode ? "#1a2e1a" : "#FFFFFF",
        modalOverlay: "rgba(0,0,0,0.6)",
        switchTrackActive: "#4a8a3a",
        switchTrackInactive: darkMode ? "#2a4a2a" : "#C8E6C9",
        langSelectedBg: darkMode ? "#2a4a2a" : "#E8F5E9",
        langSelectedBorder: darkMode ? "#5a8a4a" : "#65B307",
        langSelectedText: darkMode ? "#a3d977" : "#3A6604",
        langUnselectedText: darkMode ? "#6a9a5a" : "#486623",
        logoutBg: darkMode ? "#3a2e1a" : "#FFF3E0",
        logoutText: "#e6a050",
        deleteBg: darkMode ? "#3a1e1e" : "#FFEBEE",
        deleteText: "#e57373",
        emptyBg: darkMode ? "#1e351e" : "#E8F5E9",
        emptyIcon: darkMode ? "#5a8a4a" : "#65B307",
    };

    // ----------------------------------------
    // LOADING
    // ----------------------------------------
    if (userLoading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: theme.bg }}>
                <ActivityIndicator size="large" color={theme.loading} />
                <Text className="mt-3" style={{ color: theme.textSecondary }}>{lang.carregando}</Text>
            </SafeAreaView>
        );
    }

    // ----------------------------------------
    // ERRO
    // ----------------------------------------
    if (userError || !user) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center px-6" style={{ backgroundColor: theme.bg }}>
                <View className="w-16 h-16 rounded-full justify-center items-center mb-4" style={{ backgroundColor: theme.errorBg }}>
                    <Ionicons name="warning-outline" size={32} color={theme.error} />
                </View>
                <Text className="font-bold text-lg" style={{ color: theme.error }}>{lang.erro}</Text>
                <Text className="text-sm text-center mt-2" style={{ color: theme.textSecondary }}>{userError?.message || lang.erroCarregar}</Text>
                <TouchableOpacity onPress={() => refetchUser()} className="mt-4 px-6 py-2 rounded-full" style={{ backgroundColor: theme.buttonBg }}>
                    <Text className="font-bold" style={{ color: theme.buttonText }}>{lang.tentarNovamente}</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // ----------------------------------------
    // DADOS DO USER
    // ----------------------------------------
    const displayName = `${user.FirstName || ""} ${user.LastName || ""}`.trim() || user.Username;
    const postsCount = posts?.length || 0;
    const followersCount = user.Followers?.length || 0;
    const followingCount = user.Following?.length || 0;

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 py-3 border-b" style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}>
                <Text className="text-xl font-bold" style={{ color: theme.text }}>{lang.perfil}</Text>
                <TouchableOpacity onPress={() => setSettingsVisible(true)} activeOpacity={0.7}>
                    <Ionicons name="settings-outline" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.loading} colors={[theme.loading]} />
                }
            >
                {/* Banner */}
                {user.bannerImage ? (
                    <Image source={{ uri: user.bannerImage }} className="w-full h-32" />
                ) : (
                    <View className="w-full h-32" style={{ backgroundColor: theme.banner }} />
                )}

                {/* Avatar & Edit Button */}
                <View className="px-4 -mt-10 flex-row justify-between items-end">
                    {user.ProfilePicture ? (
                        <Image source={{ uri: user.ProfilePicture }} className="w-20 h-20 rounded-full border-4" style={{ borderColor: theme.cardBg }} />
                    ) : (
                        <View className="w-20 h-20 rounded-full border-4 justify-center items-center" style={{ backgroundColor: theme.avatarBg, borderColor: theme.cardBg }}>
                            <Text className="text-white text-2xl font-bold">{user.Username?.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={() => setEditModalVisible(true)} className="px-5 py-2 rounded-full border" style={{ backgroundColor: theme.cardBg, borderColor: theme.loading }}>
                        <Text className="font-bold text-sm" style={{ color: theme.text }}>{lang.editarPerfil}</Text>
                    </TouchableOpacity>
                </View>

                {/* Info */}
                <View className="px-4 mt-3">
                    <Text className="font-bold text-xl" style={{ color: theme.text }}>{displayName}</Text>
                    <Text style={{ color: theme.textSecondary }}>@{user.Username}</Text>
                    {user.bio ? <Text className="mt-2 text-[15px]" style={{ color: theme.textBody }}>{user.bio}</Text> : null}
                    {user.location ? (
                        <View className="flex-row items-center mt-2">
                            <Feather name="map-pin" size={14} color={theme.loading} />
                            <Text className="ml-1 text-sm" style={{ color: theme.textSecondary }}>{user.location}</Text>
                        </View>
                    ) : null}

                    <View className="flex-row mt-4 gap-6">
                        <View className="items-center">
                            <Text className="font-bold text-lg" style={{ color: theme.text }}>{postsCount}</Text>
                            <Text className="text-sm" style={{ color: theme.textSecondary }}>{lang.receitas}</Text>
                        </View>
                        <TouchableOpacity className="items-center">
                            <Text className="font-bold text-lg" style={{ color: theme.text }}>{followersCount}</Text>
                            <Text className="text-sm" style={{ color: theme.textSecondary }}>{lang.seguidores}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="items-center">
                            <Text className="font-bold text-lg" style={{ color: theme.text }}>{followingCount}</Text>
                            <Text className="text-sm" style={{ color: theme.textSecondary }}>{lang.aSeguir}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Separador */}
                <View className="h-2 mt-4" style={{ backgroundColor: theme.separator }} />

                {/* Posts */}
                <View className="flex-row items-center px-4 py-3">
                    <Ionicons name="restaurant-outline" size={18} color={theme.text} />
                    <Text className="font-bold text-lg ml-2" style={{ color: theme.text }}>{lang.minhasReceitas}</Text>
                </View>

                {postsLoading && !posts ? (
                    <View className="py-10 justify-center items-center">
                        <ActivityIndicator size="large" color={theme.loading} />
                    </View>
                ) : posts && posts.length > 0 ? (
                    posts.map((post: any) => <ProfilePostCard key={post._id} post={post} isOwnProfile={true} />)
                ) : (
                    <View className="py-20 justify-center items-center px-6">
                        <View className="w-20 h-20 rounded-full justify-center items-center mb-4" style={{ backgroundColor: theme.emptyBg }}>
                            <Ionicons name="restaurant-outline" size={40} color={theme.emptyIcon} />
                        </View>
                        <Text className="font-bold text-lg" style={{ color: theme.text }}>{lang.semReceitas}</Text>
                        <Text className="text-base mt-2 text-center" style={{ color: theme.textSecondary }}>{lang.partilhaPrimeira}</Text>
                    </View>
                )}
            </ScrollView>

            {/* ============================================ */}
            {/* EDIT PROFILE MODAL */}
            {/* ============================================ */}
            {/* onSuccess = chama refetchUser() para atualizar o perfil com os dados novos */}
            <EditProfileModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
                onSuccess={() => {
                    // Quando o editar perfil guarda com sucesso:
                    // 1. Atualiza os dados do user (nome, bio, etc.)
                    refetchUser();
                    // 2. Atualiza os posts (se mudou o nome/foto)
                    refetchPosts();
                }}
                user={user}
            />

            {/* Settings Modal */}
            <Modal visible={settingsVisible} transparent animationType="slide" onRequestClose={() => setSettingsVisible(false)}>
                <View className="flex-1 justify-end" style={{ backgroundColor: theme.modalOverlay }}>
                    <View className="rounded-t-3xl px-4 pt-6 pb-10" style={{ backgroundColor: theme.modalBg }}>
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold" style={{ color: theme.text }}>{lang.definicoes}</Text>
                            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                                <Ionicons name="close" size={28} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-sm font-semibold uppercase mb-3" style={{ color: theme.textSecondary }}>{lang.aparencia}</Text>
                        <View className="flex-row items-center justify-between p-4 rounded-xl border mb-6" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
                            <View className="flex-row items-center">
                                <Ionicons name={darkMode ? "moon" : "sunny"} size={22} color={theme.text} />
                                <Text className="ml-3 font-medium" style={{ color: theme.textBody }}>{lang.tema}</Text>
                            </View>
                            <Switch
                                value={darkMode}
                                onValueChange={toggleDarkMode}
                                trackColor={{ false: theme.switchTrackInactive, true: theme.switchTrackActive }}
                                thumbColor="#fff"
                            />
                        </View>

                        <Text className="text-sm font-semibold uppercase mb-3" style={{ color: theme.textSecondary }}>{lang.idioma}</Text>
                        <View className="flex-row gap-3 mb-6">
                            <TouchableOpacity
                                onPress={() => changeLanguage("pt")}
                                className="flex-1 py-3 rounded-xl items-center border"
                                style={{
                                    backgroundColor: language === "pt" ? theme.langSelectedBg : theme.cardBg,
                                    borderColor: language === "pt" ? theme.langSelectedBorder : theme.border,
                                }}
                            >
                                <Text className="font-bold" style={{ color: language === "pt" ? theme.langSelectedText : theme.langUnselectedText }}>Portugues</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => changeLanguage("en")}
                                className="flex-1 py-3 rounded-xl items-center border"
                                style={{
                                    backgroundColor: language === "en" ? theme.langSelectedBg : theme.cardBg,
                                    borderColor: language === "en" ? theme.langSelectedBorder : theme.border,
                                }}
                            >
                                <Text className="font-bold" style={{ color: language === "en" ? theme.langSelectedText : theme.langUnselectedText }}>English</Text>
                            </TouchableOpacity>
                        </View>

                        <Text className="text-sm font-semibold uppercase mb-3" style={{ color: theme.textSecondary }}>{lang.conta}</Text>
                        <TouchableOpacity onPress={handleLogout} className="flex-row items-center py-4 px-4 rounded-xl mb-3" style={{ backgroundColor: theme.logoutBg }}>
                            <MaterialIcons name="logout" size={22} color={theme.logoutText} />
                            <Text className="font-bold ml-3 text-[15px]" style={{ color: theme.logoutText }}>{lang.sair}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDeleteAccountPress} className="flex-row items-center py-4 px-4 rounded-xl" style={{ backgroundColor: theme.deleteBg }}>
                            <MaterialIcons name="delete-forever" size={22} color={theme.deleteText} />
                            <Text className="font-bold ml-3 text-[15px]" style={{ color: theme.deleteText }}>{lang.deletar}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}