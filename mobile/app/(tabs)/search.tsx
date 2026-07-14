import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Keyboard,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSearchUsers } from "@/hooks/useSearchUsers";
import UserSearchResult from "@/components/UserSearchResult";
import { useTheme } from "../context/ThemeContext";

/**
 * SearchScreen — ecra de pesquisa de users e posts
 *
 * Permite ao user pesquisar por outros users pelo username.
 * Mostra resultados em tempo real a medida que o user escreve.
 *
 * Estados:
 * - Estado inicial: mostra mensagem de boas-vindas
 * - Estado de pesquisa: mostra resultados ou mensagem de "nao encontrado"
 */
export default function SearchScreen() {
    // hook que gere a logica de pesquisa
    const {
        query,
        results,
        loading,
        hasSearched,
        handleSearch,
        clearSearch,
        setQuery,
    } = useSearchUsers();

    // darkMode e language vem do ThemeContext
    const { darkMode, language } = useTheme();

    // traducoes
    const t = {
        pt: {
            pesquisarChefs: "Pesquisar chefs...",
            descobreChefs: "Descobre novos chefs",
            pesquisaDesc: "Pesquisa por utilizadores e encontra receitas saudaveis",
            nenhumResultado: "Nenhum chef encontrado para",
            voltar: "Voltar",
        },
        en: {
            pesquisarChefs: "Search chefs...",
            descobreChefs: "Discover new chefs",
            pesquisaDesc: "Search for users and find healthy recipes",
            nenhumResultado: "No chef found for",
            voltar: "Back",
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
        // cor de fundo do input
        inputBg: darkMode ? "#2d4a1e" : "#E8F5E9",
        // cor do texto do input
        inputText: darkMode ? "#dcedc8" : "#3A6604",
        // cor do placeholder
        placeholder: darkMode ? "#7cb342" : "#486623",
        // cor do loading
        loading: darkMode ? "#8bc34a" : "#65B307",
        // cor de fundo do empty state
        emptyBg: darkMode ? "#2d4a1e" : "#E8F5E9",
        // cor do botao de limpar
        clearBg: darkMode ? "#7cb342" : "#486623",
    };

    // Estado de pesquisa ativa (user ja escreveu algo ou pesquisou)
    if (hasSearched || query.length > 0) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
                {/* Header com campo de pesquisa */}
                <View className="flex-row items-center px-3 py-2 gap-2 border-b" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
                    {/* Botao de voltar — limpa a pesquisa e volta ao estado inicial */}
                    <TouchableOpacity onPress={clearSearch}>
                        <Feather name="arrow-left" size={24} color={theme.text} />
                    </TouchableOpacity>

                    {/* Campo de pesquisa */}
                    <View className="flex-1 flex-row items-center rounded-full px-3 py-2" style={{ backgroundColor: theme.inputBg }}>
                        <Feather name="search" size={16} color={theme.loading} />
                        <TextInput
                            placeholder={lang.pesquisarChefs}
                            placeholderTextColor={theme.placeholder}
                            className="flex-1 ml-2 text-[15px]"
                            style={{ color: theme.inputText }}
                            value={query}
                            onChangeText={handleSearch}
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoFocus={true}
                            keyboardType="default"
                            returnKeyType="search"
                        />
                        {/* Botao de limpar pesquisa (aparece quando ha texto) */}
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => handleSearch("")}>
                                <View className="w-4 h-4 rounded-full justify-center items-center" style={{ backgroundColor: theme.clearBg }}>
                                    <Feather name="x" size={10} color="white" />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Resultados da pesquisa */}
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color={theme.loading} />
                    </View>
                ) : results.length === 0 ? (
                    <View className="flex-1 justify-center items-center px-6">
                        <View className="w-16 h-16 rounded-full justify-center items-center mb-4" style={{ backgroundColor: theme.emptyBg }}>
                            <Feather name="search" size={32} color={theme.loading} />
                        </View>
                        <Text className="text-base text-center" style={{ color: theme.textSecondary }}>
                            {lang.nenhumResultado} "{query}"
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => <UserSearchResult user={item} />}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        ItemSeparatorComponent={() => (
                            <View className="h-[0.5px] ml-[72px]" style={{ backgroundColor: theme.border }} />
                        )}
                    />
                )}
            </SafeAreaView>
        );
    }

    // Estado inicial (ainda nao pesquisou)
    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
            <View className="px-4 py-2 border-b" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <TouchableOpacity
                    onPress={() => {
                        setQuery("");
                        handleSearch("a");
                    }}
                    className="flex-row items-center rounded-full px-3 py-2.5"
                    style={{ backgroundColor: theme.inputBg }}
                >
                    <Feather name="search" size={16} color={theme.loading} />
                    <Text className="ml-2 text-[15px]" style={{ color: theme.placeholder }}>{lang.pesquisarChefs}</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-1 justify-center items-center">
                <View className="w-20 h-20 rounded-full justify-center items-center mb-4" style={{ backgroundColor: theme.emptyBg }}>
                    <Ionicons name="search" size={40} color={theme.loading} />
                </View>
                <Text className="font-bold text-lg" style={{ color: theme.text }}>{lang.descobreChefs}</Text>
                <Text className="text-base mt-2 text-center px-6" style={{ color: theme.textSecondary }}>{lang.pesquisaDesc}</Text>
            </View>
        </SafeAreaView>
    );
}