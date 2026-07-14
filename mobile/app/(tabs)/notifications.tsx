import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNotifications, useMarkAllAsRead } from "@/hooks/useNotifications";
import NotificationItem from "@/components/NotificationItem";
import { useTheme } from "../context/ThemeContext";

/**
 * NotificationsScreen — ecra de notificacoes do user
 *
 * Mostra todas as notificacoes do user (likes, comentarios, follows, mentions).
 * Permite marcar todas como lidas e fazer pull-to-refresh.
 */
export default function NotificationsScreen() {
    // busca as notificacoes do backend
    const { data: notifications, isLoading, refetch } = useNotifications();
    // hook para marcar todas as notificacoes como lidas
    const markAllAsRead = useMarkAllAsRead();

    // refreshing indica se o pull-to-refresh esta ativo
    const [refreshing, setRefreshing] = useState(false);

    // darkMode e language vem do ThemeContext
    const { darkMode, language } = useTheme();

    /**
     * onRefresh — funcao chamada quando o user faz pull-to-refresh
     *
     * Atualiza as notificacoes chamando refetch do useNotifications.
     */
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    // conta quantas notificacoes nao foram lidas
    const unreadCount = notifications?.filter((n) => !n.read).length || 0;

    // traducoes
    const t = {
        pt: {
            notificacoes: "Notificacoes",
            marcarTodasLidas: "Marcar todas lidas",
            semNotificacoes: "Sem notificacoes",
            descNotificacoes: "Quando alguem interagir contigo, aparece aqui.",
        },
        en: {
            notificacoes: "Notifications",
            marcarTodasLidas: "Mark all as read",
            semNotificacoes: "No notifications",
            descNotificacoes: "When someone interacts with you, it appears here.",
        },
    };

    const lang = t[language];

    // cores do tema — verdes escuros em vez de preto no dark mode
    const theme = {
        // cor de fundo principal
        bg: darkMode ? "#1a2f0a" : "#F1F8E9",
        // cor de fundo dos cards
        cardBg: darkMode ? "#2d4a1e" : "#FFFFFF",
        // cor do texto principal
        text: darkMode ? "#a8e063" : "#3A6604",
        // cor do texto secundario
        textSecondary: darkMode ? "#7cb342" : "#486623",
        // cor do texto do corpo
        textBody: darkMode ? "#dcedc8" : "#1a1a1a",
        // cor da borda
        border: darkMode ? "#3e5f23" : "#C8E6C9",
        // cor do loading
        loading: darkMode ? "#8bc34a" : "#65B307",
        // cor de fundo do empty state
        emptyBg: darkMode ? "#2d4a1e" : "#E8F5E9",
        // cor de fundo do botao
        buttonBg: darkMode ? "#2d4a1e" : "#E8F5E9",
        // cor do texto do botao
        buttonText: darkMode ? "#8bc34a" : "#65B307",
    };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
            {/* Header — titulo e botao de marcar todas lidas */}
            <View className="flex-row justify-between items-center px-4 py-3.5 border-b" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <Text className="text-xl font-bold" style={{ color: theme.text }}>{lang.notificacoes}</Text>
                {/* Botao de marcar todas lidas (so aparece se houver nao lidas) */}
                {unreadCount > 0 && (
                    <TouchableOpacity
                        onPress={() => markAllAsRead.mutate()}
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: theme.buttonBg }}
                        activeOpacity={0.7}
                    >
                        <Feather name="check-circle" size={16} color={theme.buttonText} />
                        <Text className="font-semibold text-[13px]" style={{ color: theme.buttonText }}>
                            {lang.marcarTodasLidas}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Lista de notificacoes ou mensagens de estado */}
            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={theme.loading} />
                </View>
            ) : notifications && notifications.length > 0 ? (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <NotificationItem notification={item} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.loading}
                            colors={[theme.loading]}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View className="flex-1 justify-center items-center px-6">
                    <View className="w-20 h-20 rounded-full justify-center items-center mb-4" style={{ backgroundColor: theme.emptyBg }}>
                        <Ionicons name="notifications-outline" size={40} color={theme.loading} />
                    </View>
                    <Text className="font-bold text-lg text-center" style={{ color: theme.text }}>{lang.semNotificacoes}</Text>
                    <Text className="text-base mt-2 text-center" style={{ color: theme.textSecondary }}>{lang.descNotificacoes}</Text>
                </View>
            )}
        </SafeAreaView>
    );
}