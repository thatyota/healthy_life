// importa o Tabs do expo-router para criar a barra de navegacao inferior
import { Tabs } from "expo-router";
// importa o useAuth do Clerk para verificar se o user esta logado
import { useAuth } from "@clerk/clerk-expo";
// importa o useApiClient para fazer chamadas ao backend
import { useApiClient } from "../../utils/api";
// importa os hooks do React para estado e efeitos
import { useEffect, useState } from "react";
// importa o useSafeAreaInsets para respeitar as areas seguras do ecra
import { useSafeAreaInsets } from "react-native-safe-area-context";
// importa o Feather para os icones dos tabs
import { Feather } from "@expo/vector-icons";
// importa View do React Native para os componentes visuais
import { View } from "react-native";
// importa o useTheme para tema
import { useTheme } from "../context/ThemeContext";

/**
 * TabsLayout — layout da barra de navegacao inferior (bottom tabs)
 *
 * Este componente define os tabs do app: Home, Search, Create, Notifications, Profile e Admin.
 * O tab Admin so aparece se o user tiver role "admin" no MongoDB.
 *
 * Cada tab corresponde a um ficheiro na pasta app/(tabs)/:
 * - index.tsx -> tab Home
 * - search.tsx -> tab Search
 * - createposts.tsx -> tab Create (o ficheiro chama-se createposts nao create)
 * - notifications.tsx -> tab Notifications
 * - profile.tsx -> tab Profile
 * - admin.tsx -> tab Admin (so para admins)
 */
export default function TabsLayout() {
    // insets guarda as dimensoes das areas seguras do ecra
    // top: altura da status bar / notch
    // bottom: altura da home indicator (iPhone) ou navegacao (Android)
    const insets = useSafeAreaInsets();

    // isSignedIn vem do Clerk — true se o user fez login, false se nao
    const { isSignedIn } = useAuth();

    // api e o client axios configurado com o token do Clerk
    const api = useApiClient();

    // darkMode vem do ThemeContext
    const { darkMode } = useTheme();

    // unreadCount guarda quantas notificacoes o user tem por ler
    const [unreadCount, setUnreadCount] = useState(0);

    // isAdmin indica se o user logado tem role "admin" no MongoDB
    const [isAdmin, setIsAdmin] = useState(false);

    /**
     * useEffect que busca as notificacoes e verifica se o user e admin
     *
     * Corre quando o componente monta e quando isSignedIn ou api mudam.
     */
    useEffect(() => {
        // so executa se o user estiver logado
        if (!isSignedIn) return;

        /**
         * fetchNotifications — busca as notificacoes do user no backend
         */
        const fetchNotifications = async () => {
            try {
                const response = await api.get("/notifications");
                const unread = response.data?.notifications?.filter(
                    (n: any) => !n.isRead
                ) || [];
                setUnreadCount(unread.length);
            } catch (error) {
                // se der erro, nao faz nada
            }
        };

        /**
         * checkAdmin — verifica se o user tem role "admin" no MongoDB
         */
        const checkAdmin = async () => {
            try {
                const response = await api.get("/users/me");
                setIsAdmin(response?.data?.user?.role === "admin");
            } catch (error) {
                setIsAdmin(false);
            }
        };

        fetchNotifications();
        checkAdmin();

        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [isSignedIn, api]);

    /**
     * renderTabIcon — funcao que renderiza o icone e o indicador de tab ativo
     */
    const renderTabIcon = (iconName: string, color: string, focused: boolean) => (
        <View className="items-center justify-center">
            <Feather name={iconName as any} size={22} color={focused ? (darkMode ? "#a8e063" : "#3A6604") : color} />
            {focused && <View className="w-1 h-1 rounded-full mt-1" style={{ backgroundColor: darkMode ? "#a8e063" : "#3A6604" }} />}
        </View>
    );

    // cores da barra de tabs consoante o tema
    const tabBarBg = darkMode ? "#1a2f0a" : "#FFFFFF";
    const tabBarBorder = darkMode ? "#3e5f23" : "#E0E0E0";
    const activeColor = darkMode ? "#a8e063" : "#3A6604";
    const inactiveColor = darkMode ? "#7cb342" : "#999999";

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: activeColor,
                tabBarInactiveTintColor: inactiveColor,
                tabBarShowLabel: false,
                tabBarStyle: {
                    paddingBottom: insets.bottom,
                    height: 60 + insets.bottom,
                    backgroundColor: tabBarBg,
                    borderTopWidth: 1,
                    borderTopColor: tabBarBorder,
                },
                headerShown: false,
            }}
        >
            {/* Tab Home — feed principal do app */}
            <Tabs.Screen
                name="index"
                options={{
                    title: "",
                    tabBarIcon: ({ color, focused }) => renderTabIcon("home", color, focused),
                }}
            />

            {/* Tab Search — pesquisa de users e posts */}
            <Tabs.Screen
                name="search"
                options={{
                    title: "",
                    tabBarIcon: ({ color, focused }) => renderTabIcon("search", color, focused),
                }}
            />

            {/* Tab Create — criar novo post */}
            {/* O ficheiro chama-se createposts.tsx nao create.tsx */}
            <Tabs.Screen
                name="createposts"
                options={{
                    title: "",
                    tabBarIcon: ({ color, focused }) => renderTabIcon("plus-circle", color, focused),
                }}
            />

            {/* Tab Notifications — notificacoes do user */}
            <Tabs.Screen
                name="notifications"
                options={{
                    title: "",
                    tabBarIcon: ({ color, focused }) => renderTabIcon("bell", color, focused),
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: "#FF4444",
                        color: "#FFFFFF",
                        fontSize: 10,
                        fontWeight: "bold",
                    },
                }}
            />

            {/* Tab Profile — perfil do user logado */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: "",
                    tabBarIcon: ({ color, focused }) => renderTabIcon("user", color, focused),
                }}
            />

            {/* Tab Admin — painel de administracao */}
            {/* So aparece se o user tiver role "admin" no MongoDB */}
            <Tabs.Screen
                name="admin"
                options={{
                    title: "",
                    tabBarIcon: ({ color, focused }) => renderTabIcon("shield", color, focused),
                    href: isAdmin ? undefined : null as any,
                }}
            />
        </Tabs>
    );
}