import { ScrollView, Text, View, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useUserSync } from "@/hooks/useUserSync";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/components/PostCard";
import { useCallback, useState } from "react";
import { useTheme } from "../context/ThemeContext";

/**
 * HomeScreen — feed principal de receitas
 *
 * Mostra a lista de posts/receitas recentes do app.
 * O user pode fazer pull-to-refresh para atualizar o feed.
 * Para criar um post, usa o botao "+" na barra de tabs.
 */
export default function HomeScreen() {
    // sincroniza o user com o backend (cria/atualiza no MongoDB)
    useUserSync();

    // busca os posts do backend
    // data = array de posts, isLoading = true enquanto busca, isError = true se der erro
    // error = objeto com detalhes do erro, refetch = funcao para buscar de novo
    const { data: posts, isLoading, isError, error, refetch } = usePosts();

    // refreshing = true quando o user faz pull-to-refresh (arrastar para baixo)
    const [refreshing, setRefreshing] = useState(false);

    // darkMode e language vem do ThemeContext (tema escuro/claro e idioma)
    const { darkMode, language } = useTheme();

    /**
     * onRefresh — funcao chamada quando o user faz pull-to-refresh
     *
     * Atualiza os posts do feed chamando refetch do usePosts.
     */
    const onRefresh = useCallback(async () => {
        // ativa o indicador de refresh
        setRefreshing(true);
        // espera a chamada ao backend terminar
        await refetch();
        // desativa o indicador de refresh
        setRefreshing(false);
    }, [refetch]);

    // traducoes para o feed
    const t = {
        pt: {
            receitasRecentes: "Receitas Recentes",
            carregando: "A carregar receitas...",
            erro: "Erro ao carregar",
            erroDesconhecido: "Erro desconhecido",
            tentarNovamente: "Puxa para baixo para tentar novamente",
            semReceitas: "Ainda nao ha receitas",
            partilhaPrimeira: "Usa o botao + em baixo para partilhar a primeira",
        },
        en: {
            receitasRecentes: "Recent Recipes",
            carregando: "Loading recipes...",
            erro: "Error loading",
            erroDesconhecido: "Unknown error",
            tentarNovamente: "Pull down to try again",
            semReceitas: "No recipes yet",
            partilhaPrimeira: "Use the + button below to share the first one",
        },
    };

    const lang = t[language];

    // cores do tema — verdes escuros em vez de preto no dark mode
    const theme = {
        // cor de fundo principal
        // dark: verde musgo muito escuro | light: verde claro padrao
        bg: darkMode ? "#1a2f0a" : "#F1F8E9",
        // cor do texto principal
        // dark: verde lima claro | light: verde escuro padrao
        text: darkMode ? "#a8e063" : "#3A6604",
        // cor do texto secundario
        // dark: verde musgo claro | light: verde medio
        textSecondary: darkMode ? "#7cb342" : "#486623",
        // cor do texto do corpo
        // dark: branco esverdeado | light: preto
        textBody: darkMode ? "#dcedc8" : "#1a1a1a",
        // cor do loading
        // dark: verde lima | light: verde padrao
        loading: darkMode ? "#8bc34a" : "#65B307",
        // cor do erro
        error: "#C62828",
        // cor de fundo do erro
        // dark: vermelho escuro | light: vermelho claro
        errorBg: darkMode ? "#3e1e1e" : "#FFEBEE",
        // cor de fundo do empty state
        // dark: verde floresta | light: verde muito claro
        emptyBg: darkMode ? "#2d4a1e" : "#E8F5E9",
        // cor do placeholder
        // dark: verde musgo | light: cinza
        placeholder: darkMode ? "#7cb342" : "#8E8E8E",
    };

    /**
     * getErrorMessage — retorna uma STRING com a mensagem de erro
     *
     * IMPORTANTE: Esta funcao DEVE retornar uma string (texto).
     * Se retornar um objeto, o React crasha com:
     * "Objects are not valid as a React child"
     *
     * O erro pode vir em diferentes formatos:
     * - error.response.data.error (string do backend)
     * - error.response.data (objeto com code + message)
     * - error.message (mensagem do axios)
     * - lang.erro (fallback)
     */
    const getErrorMessage = () => {
        // Se nao ha erro, retorna mensagem generica
        if (!error) return lang.erroDesconhecido;

        const err = error as any;

        // CASO 1: error.response.data.error = string do backend
        // Ex: "A server error has occurred"
        if (err.response?.data?.error && typeof err.response.data.error === "string") {
            return err.response.data.error;
        }

        // CASO 2: error.response.data.message = outro formato comum
        if (err.response?.data?.message && typeof err.response.data.message === "string") {
            return err.response.data.message;
        }

        // CASO 3: error.response.data = objeto com code + message
        // Ex: { code: "500", message: "A server error..." }
        // Neste caso pegamos apenas a propriedade message
        if (err.response?.data?.message) {
            return err.response.data.message;
        }

        // CASO 4: error.message = mensagem do axios
        if (err.message && typeof err.message === "string") {
            return err.message;
        }

        // CASO 5: fallback — retorna texto generico
        return lang.erro;
    };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }} edges={["top"]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.loading} colors={[theme.loading]} />
                }
            >
                {/* Titulo da seccao */}
                <View className="flex-row items-center px-4 py-3">
                    <Feather name="trending-up" size={18} color={theme.text} />
                    <Text className="font-bold text-lg ml-2" style={{ color: theme.text }}>{lang.receitasRecentes}</Text>
                </View>

                {/* Loading */}
                {isLoading && !posts ? (
                    <View className="flex-1 justify-center items-center py-10">
                        <ActivityIndicator size="large" color={theme.loading} />
                        <Text className="mt-3" style={{ color: theme.textSecondary }}>{lang.carregando}</Text>
                    </View>
                ) : isError ? (
                    <View className="flex-1 justify-center items-center py-10 px-6">
                        <View className="w-16 h-16 rounded-full justify-center items-center mb-4" style={{ backgroundColor: theme.errorBg }}>
                            <Ionicons name="warning-outline" size={32} color={theme.error} />
                        </View>
                        <Text className="text-base text-center font-bold" style={{ color: theme.error }}>{lang.erro}</Text>
                        {/* getErrorMessage() retorna STRING — React consegue renderizar */}
                        <Text className="text-sm text-center mt-2" style={{ color: theme.textSecondary }}>{getErrorMessage()}</Text>
                        <Text className="text-xs text-center mt-4" style={{ color: theme.placeholder }}>{lang.tentarNovamente}</Text>
                    </View>
                ) : posts && posts.length > 0 ? (
                    /* Lista de posts */
                    posts.map((post) => <PostCard key={post._id} post={post} />)
                ) : (
                    <View className="flex-1 justify-center items-center py-20 px-6">
                        <View className="w-20 h-20 rounded-full justify-center items-center mb-4" style={{ backgroundColor: theme.emptyBg }}>
                            <Ionicons name="restaurant-outline" size={40} color={theme.loading} />
                        </View>
                        <Text className="font-bold text-lg text-center" style={{ color: theme.text }}>{lang.semReceitas}</Text>
                        <Text className="text-base mt-2 text-center" style={{ color: theme.textSecondary }}>{lang.partilhaPrimeira}</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}