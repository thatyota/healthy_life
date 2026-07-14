// importa os hooks do React para estado e efeitos
import { useEffect, useState } from "react";
// importa os componentes do React Native para a UI
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
// importa o useApiClient para fazer chamadas ao backend
import { useApiClient } from "../../utils/api";
// importa o useAuth do Clerk para verificar autenticacao
import { useAuth } from "@clerk/clerk-expo";
// importa o useRouter para navegacao
import { useRouter } from "expo-router";
// importa o Feather para icones
import { Feather } from "@expo/vector-icons";
// importa o SafeAreaView para respeitar as areas seguras
import { SafeAreaView } from "react-native-safe-area-context";
// importa o useTheme para tema e idioma
import { useTheme } from "../context/ThemeContext";

/**
 * AdminTab — painel de administracao dentro dos tabs
 *
 * Este ecra mostra as funcionalidades de administracao do app.
 * So e acessivel atraves do tab Admin (que so aparece para admins).
 *
 * Funcionalidades:
 * - Ver total de users registados
 * - Ver total de reports pendentes
 * - Gerir users (lista, banir, promover a admin)
 * - Ver reports de users (posts/comentarios reportados)
 */
export default function AdminTab() {
    // router e usado para navegar entre ecras
    const router = useRouter();
    // api e o client axios configurado com o token do Clerk
    const api = useApiClient();
    // isSignedIn vem do Clerk — true se o user esta logado
    const { isSignedIn } = useAuth();

    // darkMode e language vem do ThemeContext
    const { darkMode, language } = useTheme();

    // loading indica se os dados estao a carregar
    const [loading, setLoading] = useState(true);

    // totalUsers guarda o numero total de users no app
    const [totalUsers, setTotalUsers] = useState(0);
    // totalReports guarda o numero de reports pendentes
    const [totalReports, setTotalReports] = useState(0);

    // isAdmin verifica se o user tem role admin no MongoDB
    const [isAdmin, setIsAdmin] = useState(false);

    // traducoes
    const t = {
        pt: {
            painelAdmin: "Painel Admin",
            estatisticas: "Estatisticas",
            acoesRapidas: "Acoes Rapidas",
            gerirUsers: "Gerir Users",
            verReports: "Ver Reports",
            acessoNegado: "Acesso negado — so admins podem ver este ecra",
            carregando: "A carregar painel admin...",
            users: "Users",
            reports: "Reports",
        },
        en: {
            painelAdmin: "Admin Panel",
            estatisticas: "Statistics",
            acoesRapidas: "Quick Actions",
            gerirUsers: "Manage Users",
            verReports: "View Reports",
            acessoNegado: "Access denied — only admins can view this screen",
            carregando: "Loading admin panel...",
            users: "Users",
            reports: "Reports",
        },
    };

    const lang = t[language];

    // cores do tema — verdes escuros em vez de preto
    // quando darkMode e true, usa verdes escuros e musgo
    // quando darkMode e false, usa os verdes claros normais
    const theme = {
        // cor de fundo principal do ecra
        // dark: verde musgo muito escuro | light: verde claro padrao
        bg: darkMode ? "#1a2f0a" : "#F1F8E9",
        // cor de fundo dos cards e componentes
        // dark: verde floresta escuro | light: branco
        cardBg: darkMode ? "#2d4a1e" : "#FFFFFF",
        // cor do texto principal (titulos)
        // dark: verde lima claro | light: verde escuro padrao
        text: darkMode ? "#a8e063" : "#3A6604",
        // cor do texto secundario
        // dark: verde musgo claro | light: verde medio
        textSecondary: darkMode ? "#7cb342" : "#486623",
        // cor do texto do corpo
        // dark: branco esverdeado | light: preto
        textBody: darkMode ? "#dcedc8" : "#1a1a1a",
        // cor da borda
        // dark: verde escuro | light: verde claro
        border: darkMode ? "#3e5f23" : "#C8E6C9",
        // cor do loading
        // dark: verde lima | light: verde padrao
        loading: darkMode ? "#8bc34a" : "#65B307",
        // cor de fundo do empty state
        // dark: verde escuro | light: verde muito claro
        emptyBg: darkMode ? "#2d4a1e" : "#E8F5E9",
        // cor de fundo dos cards de estatistica
        statCardBg: darkMode ? "#2d4a1e" : "#FFFFFF",
        // cor do texto dos valores
        statText: darkMode ? "#FFFFFF" : "#333333",
        // cor do texto dos labels
        statLabel: darkMode ? "#aed581" : "#666666",
        // cor de fundo dos botoes de acao
        actionBg: darkMode ? "#2d4a1e" : "#FFFFFF",
        // cor do texto dos botoes
        actionText: darkMode ? "#dcedc8" : "#333333",
        // cor da seta dos botoes
        actionArrow: darkMode ? "#7cb342" : "#999999",
    };

    /**
     * useEffect que busca os dados do admin ao montar o componente
     *
     * 1. Verifica se o user esta logado
     * 2. Verifica se o user e admin (GET /users/me)
     * 3. Se nao for admin, redireciona para o feed
     * 4. Se for admin, busca o total de users e reports
     */
    useEffect(() => {
        const loadAdminData = async () => {
            try {
                // verifica se o user esta logado
                if (!isSignedIn) return;

                // busca o documento do user para verificar o role
                const userResponse = await api.get("/users/me");
                const role = userResponse?.data?.user?.role;

                // se o role nao for "admin", redireciona para o feed
                if (role !== "admin") {
                    setIsAdmin(false);
                    router.replace("/(tabs)");
                    return;
                }

                // o user e admin
                setIsAdmin(true);

                // busca as estatisticas do admin
                try {
                    const statsResponse = await api.get("/admin/stats");
                    const stats = statsResponse.data?.stats || {};
                    setTotalUsers(stats.totalUsers || 0);
                    setTotalReports(stats.totalReports || 0);
                } catch (e) {
                    // se /admin/stats falhar, tenta buscar users e reports separadamente
                    try {
                        const usersResponse = await api.get("/admin/users");
                        const users = usersResponse.data?.users || [];
                        setTotalUsers(users.length);
                    } catch (e2) {
                        setTotalUsers(0);
                    }
                    setTotalReports(0);
                }

            } catch (error) {
                console.error("Erro ao carregar dados admin:", error);
            } finally {
                // desativa o loading sempre que termina
                setLoading(false);
            }
        };

        loadAdminData();
    }, [isSignedIn, api, router]);

    // se esta a carregar, mostra spinner
    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: theme.bg }}>
                <ActivityIndicator size="large" color={theme.loading} />
                <Text className="mt-4 font-medium" style={{ color: theme.text }}>
                    {lang.carregando}
                </Text>
            </SafeAreaView>
        );
    }

    // se nao e admin, mostra mensagem
    if (!isAdmin) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: theme.bg }}>
                <Text className="text-lg" style={{ color: theme.textSecondary }}>{lang.acessoNegado}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
            <ScrollView className="flex-1 px-4 pt-4">
                {/* Titulo do painel */}
                <Text className="text-2xl font-bold mb-6" style={{ color: theme.text }}>
                    {lang.painelAdmin}
                </Text>

                {/* Seccao de estatisticas */}
                <Text className="text-lg font-semibold mb-3" style={{ color: theme.textBody }}>
                    {lang.estatisticas}
                </Text>

                {/* Cards de estatisticas em grid de 2 colunas */}
                <View className="flex-row flex-wrap justify-between mb-6">
                    {/* Card de Users */}
                    <StatCard
                        icon="users"
                        label={lang.users}
                        value={totalUsers}
                        color="#3A6604"
                        theme={theme}
                    />
                    {/* Card de Reports */}
                    <StatCard
                        icon="flag"
                        label={lang.reports}
                        value={totalReports}
                        color="#F44336"
                        theme={theme}
                    />
                </View>

                {/* Seccao de acoes rapidas */}
                <Text className="text-lg font-semibold mb-3" style={{ color: theme.textBody }}>
                    {lang.acoesRapidas}
                </Text>

                {/* Botao para gerir users */}
                <ActionButton
                    icon="users"
                    label={lang.gerirUsers}
                    onPress={() => {/* navegar para ecra de users */}}
                    theme={theme}
                />
                {/* Botao para ver reports */}
                <ActionButton
                    icon="flag"
                    label={lang.verReports}
                    onPress={() => {/* navegar para ecra de reports */}}
                    theme={theme}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

/**
 * StatCard — componente que mostra uma estatistica num card
 *
 * Recebe o icone, label, valor, cor e tema para renderizar um card visual.
 */
function StatCard({
    icon,
    label,
    value,
    color,
    theme,
}: {
    icon: string;
    label: string;
    value: number;
    color: string;
    theme: any;
}) {
    return (
        <View
            className="w-[48%] rounded-xl p-4 mb-3 shadow-sm"
            style={{ backgroundColor: theme.statCardBg, elevation: 2 }}
        >
            <Feather name={icon as any} size={24} color={color} />
            <Text className="text-2xl font-bold mt-2" style={{ color: theme.statText }}>
                {value}
            </Text>
            <Text className="text-sm mt-1" style={{ color: theme.statLabel }}>
                {label}
            </Text>
        </View>
    );
}

/**
 * ActionButton — botao de acao para o painel admin
 *
 * Recebe o icone, label, funcao onPress e tema.
 * Renderiza um botao clicavel com icone e texto.
 */
function ActionButton({
    icon,
    label,
    onPress,
    theme,
}: {
    icon: string;
    label: string;
    onPress: () => void;
    theme: any;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="rounded-xl p-4 mb-3 flex-row items-center shadow-sm"
            style={{ backgroundColor: theme.actionBg, elevation: 2 }}
        >
            <Feather name={icon as any} size={20} color="#3A6604" />
            <Text className="font-medium ml-3 flex-1" style={{ color: theme.actionText }}>
                {label}
            </Text>
            <Feather name="chevron-right" size={20} color={theme.actionArrow} />
        </TouchableOpacity>
    );
}