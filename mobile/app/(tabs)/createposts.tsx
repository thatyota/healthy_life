import { View, Text, Image, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native'
import React from 'react'
import { useCreatePost } from '@/hooks/useCreatePost';
import { useUser } from '@clerk/clerk-expo';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

// obtem a largura do ecra para dimensionar a imagem
const { width } = Dimensions.get('window');

/**
 * CreatePostScreen — ecra para criar novas receitas/posts
 *
 * Acedido pelo botao "+" na barra de tabs.
 * Permite ao user escrever texto e adicionar uma imagem.
 *
 * Funcionalidades:
 * - Escrever texto da receita (max 280 caracteres)
 * - Adicionar imagem da galeria
 * - Tirar foto com a camara
 * - Remover imagem selecionada
 * - Publicar o post
 */
export default function CreatePostScreen() {
    const router = useRouter();

    // hook que gere o estado de criacao do post
    const {
        content,
        setContent,
        selectedImage,
        isCreating,
        pickImageFromGallery,
        takePhoto,
        removeImage,
        createPost
    } = useCreatePost();

    // user vem do Clerk — contem os dados do user logado
    const { user } = useUser();

    // darkMode e language vem do ThemeContext
    const { darkMode, language } = useTheme();

    // traducoes
    const t = {
        pt: {
            novaReceita: "Nova Receita",
            publicar: "Publicar",
            partilhaReceita: "Partilha a tua receita saudavel...",
        },
        en: {
            novaReceita: "New Recipe",
            publicar: "Publish",
            partilhaReceita: "Share your healthy recipe...",
        },
    };

    const lang = t[language];

    // cores do tema — verdes escuros em vez de preto no dark mode
    const theme = {
        // cor de fundo principal
        bg: darkMode ? "#1a2f0a" : "#FFFFFF",
        // cor de fundo dos cards
        cardBg: darkMode ? "#2d4a1e" : "#FFFFFF",
        // cor do texto principal
        text: darkMode ? "#a8e063" : "#3A6604",
        // cor do texto secundario
        textSecondary: darkMode ? "#7cb342" : "#486623",
        // cor do texto do corpo
        textBody: darkMode ? "#dcedc8" : "#1a1a1a",
        // cor da borda
        border: darkMode ? "#3e5f23" : "#E8F5E9",
        // cor do texto do input
        inputText: darkMode ? "#dcedc8" : "#1a1a1a",
        // cor do placeholder
        placeholder: darkMode ? "#7cb342" : "#8E8E8E",
        // cor do loading
        loading: darkMode ? "#8bc34a" : "#65B307",
        // cor do botao desativado
        disabled: darkMode ? "#555555" : "#C8E6C9",
        // cor do overlay da imagem
        imageOverlay: "rgba(0,0,0,0.6)",
        // cor do contador normal
        counterNormal: darkMode ? "#7cb342" : "#486623",
        // cor do contador de aviso
        counterWarning: "#C62828",
    };

    /**
     * handlePost — publica o post e volta para o feed
     *
     * Chama createPost() do hook e depois navega para o feed.
     */
    const handlePost = async () => {
        await createPost();
        router.push("/" as any);
    };

    // verifica se o botao de publicar deve estar ativo
    // precisa de texto ou imagem para publicar
    const canPublish = content.trim() || selectedImage;

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }} edges={["top"]}>
            {/* Header — titulo e botao de publicar */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: theme.border }}>
                {/* Botao de fechar (volta para o feed) */}
                <TouchableOpacity onPress={() => router.push("/" as any)}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                {/* Titulo do ecra */}
                <Text className="font-bold text-lg" style={{ color: theme.text }}>{lang.novaReceita}</Text>
                {/* Botao de publicar */}
                <TouchableOpacity
                    onPress={handlePost}
                    disabled={isCreating || !canPublish}
                >
                    {isCreating ? (
                        // mostra spinner enquanto publica
                        <ActivityIndicator size="small" color={theme.text} />
                    ) : (
                        // texto do botao — muda de cor se estiver desativado
                        <Text className="font-bold text-sm" style={{ color: canPublish ? theme.text : theme.disabled }}>
                            {lang.publicar}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    <View className="p-4">
                        {/* Info do user (foto e nome) */}
                        <View className="flex-row items-center mb-4">
                            <Image
                                source={{ uri: user?.imageUrl || "https://via.placeholder.com/48" }}
                                className="w-10 h-10 rounded-full mr-3"
                            />
                            <Text className="font-bold text-sm" style={{ color: theme.text }}>
                                {user?.firstName || user?.username || "User"}
                            </Text>
                        </View>

                        {/* Campo de texto da receita */}
                        <TextInput
                            className="text-base min-h-[100px]"
                            style={{ color: theme.inputText }}
                            placeholder={lang.partilhaReceita}
                            placeholderTextColor={theme.placeholder}
                            multiline
                            value={content}
                            onChangeText={setContent}
                            maxLength={280}
                            autoFocus
                        />

                        {/* Imagem selecionada (se houver) */}
                        {selectedImage && (
                            <View className="mt-4">
                                <View className="relative">
                                    <Image
                                        source={{ uri: selectedImage }}
                                        className="rounded-2xl"
                                        style={{ width: width - 32, height: (width - 32) * 0.75 }}
                                        resizeMode="cover"
                                    />
                                    {/* Botao de remover imagem */}
                                    <TouchableOpacity
                                        className="absolute top-2 right-2 w-8 h-8 rounded-full items-center justify-center"
                                        style={{ backgroundColor: theme.imageOverlay }}
                                        onPress={removeImage}
                                    >
                                        <Feather name="x" size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Barra inferior — botoes de imagem e contador */}
                <View className="flex-row justify-between items-center px-4 py-3 border-t" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
                    <View className="flex-row gap-5">
                        {/* Botao de adicionar imagem da galeria */}
                        <TouchableOpacity onPress={pickImageFromGallery}>
                            <Feather name="image" size={22} color={theme.text} />
                        </TouchableOpacity>
                        {/* Botao de tirar foto */}
                        <TouchableOpacity onPress={takePhoto}>
                            <Feather name="camera" size={22} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center gap-3">
                        {/* Contador de caracteres (aparece quando ha texto) */}
                        {content.length > 0 && (
                            <Text className="text-xs font-medium" style={{ color: content.length > 250 ? theme.counterWarning : theme.counterNormal }}>
                                {280 - content.length}
                            </Text>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}