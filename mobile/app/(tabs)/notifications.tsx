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

// ============================================
// NotificationsScreen — ecra de notificacoes
// ============================================
// Mostra todas as notificacoes do user (likes, comentarios, follows, delete_post).
// Permite marcar todas como lidas, fazer pull-to-refresh e apagar com swipe.
export default function NotificationsScreen() {
    // ----------------------------------------
    // HOOKS
    // ----------------------------------------
    // useNotifications = busca as notificacoes do backend
    // data = array de notificacoes, isLoading = true enquanto busca, refetch = atualiza manualmente
    const { data: notifications, isLoading, refetch } = useNotifications();
    // useMarkAllAsRead = marca TODAS as notificacoes como lidas de uma vez
    const markAllAsRead = useMarkAllAsRead();

    // ----------------------------------------
    // ESTADO LOCAL
    // ----------------------------------------
    // refreshing = true quando o user faz pull-to-refresh (arrastar para baixo)
    const [refreshing, setRefreshing] = useState(false);

    // darkMode e language vem do ThemeContext (tema escuro/claro e idioma)
    const { darkMode, language } = useTheme();

    // ----------------------------------------
    // FUNCAO: onRefresh
    // ----------------------------------------
    // Chamada quando o user faz pull-to-refresh (arrasta a lista para baixo)
    // Atualiza as notificacoes chamando refetch do useNotifications
    const onRefresh = useCallback(async () => {
        setRefreshing(true);   // Mostra o indicador de loading
        await refetch();       // Busca dados novos do backend
        setRefreshing(false);  // Esconde o indicador
    }, [refetch]);

    // ----------------------------------------
    // CONTADOR DE NAO LIDAS
    // ----------------------------------------
    // Filtra as notificacoes que tem read === false e conta quantas sao
    const unreadCount = notifications?.filter((n) => !n.read).length || 0;

    // ----------------------------------------
    // TRADUCOES
    // ----------------------------------------
    // Objeto com textos em PT e EN consoante o idioma selecionado
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

    // lang = textos no idioma atual (pt ou en)
    const lang = t[language];

    // ----------------------------------------
    // CORES DO TEMA
    // ----------------------------------------
    // Cores diferentes consoante darkMode (true = escuro, false = claro)
    const theme = {
        bg: darkMode ? "#1a2f0a" : "#F1F8E9",           // fundo principal
        cardBg: darkMode ? "#2d4a1e" : "#FFFFFF",        // fundo dos cards
        text: darkMode ? "#a8e063" : "#3A6604",         // texto principal
        textSecondary: darkMode ? "#7cb342" : "#486623", // texto secundario
        textBody: darkMode ? "#dcedc8" : "#1a1a1a",     // texto do corpo
        border: darkMode ? "#3e5f23" : "#C8E6C9",        // borda
        loading: darkMode ? "#8bc34a" : "#65B307",       // loading spinner
        emptyBg: darkMode ? "#2d4a1e" : "#E8F5E9",       // fundo do empty state
        buttonBg: darkMode ? "#2d4a1e" : "#E8F5E9",       // fundo do botao
        buttonText: darkMode ? "#8bc34a" : "#65B307",     // texto do botao
    };

    // ----------------------------------------
    // FUNCAO: handleMarkAllAsRead
    // ----------------------------------------
    // Marca todas as notificacoes como lidas e depois atualiza a lista
    const handleMarkAllAsRead = useCallback(() => {
        // Chama o hook useMarkAllAsRead
        markAllAsRead.mutate(undefined, {
            // onSuccess = corre quando o backend responde com sucesso
            onSuccess: () => {
                // Atualiza a lista para mostrar todas como lidas
                refetch();
            },
        });
    }, [markAllAsRead, refetch]);

    // ----------------------------------------
    // RENDER
    // ----------------------------------------
    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
            {/* ============================================ */}
            {/* HEADER — titulo e botao de marcar todas lidas */}
            {/* ============================================ */}
            <View
                className="flex-row justify-between items-center px-4 py-3.5 border-b"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
            >
                {/* Titulo do ecra */}
                <Text className="text-xl font-bold" style={{ color: theme.text }}>
                    {lang.notificacoes}
                </Text>

                {/* Botao de marcar todas lidas (so aparece se houver nao lidas) */}
                {unreadCount > 0 && (
                    <TouchableOpacity
                        onPress={handleMarkAllAsRead}
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

            {/* ============================================ */}
            {/* CONTEUDO — loading, lista ou empty state */}
            {/* ============================================ */}
            {isLoading ? (
                // Loading — mostra spinner enquanto busca dados
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={theme.loading} />
                </View>
            ) : notifications && notifications.length > 0 ? (
                // Lista de notificacoes — mostra cada uma com NotificationItem
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <NotificationItem
                            notification={item}
                            // onDelete = funcao que atualiza a lista quando apagamos uma notificacao
                            onDelete={() => refetch()}
                        />
                    )}
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
                // Empty state — quando nao ha notificacoes
                <View className="flex-1 justify-center items-center px-6">
                    <View
                        className="w-20 h-20 rounded-full justify-center items-center mb-4"
                        style={{ backgroundColor: theme.emptyBg }}
                    >
                        <Ionicons name="notifications-outline" size={40} color={theme.loading} />
                    </View>
                    <Text className="font-bold text-lg text-center" style={{ color: theme.text }}>
                        {lang.semNotificacoes}
                    </Text>
                    <Text className="text-base mt-2 text-center" style={{ color: theme.textSecondary }}>
                        {lang.descNotificacoes}
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}