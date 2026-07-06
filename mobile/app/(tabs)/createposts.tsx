import { View, Text, Image, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native'
import React from 'react'
import { useCreatePost } from '@/hooks/useCreatePost';
import { useUser } from '@clerk/clerk-expo';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

/**
 * CreatePostScreen - Tab dedicada para criar receitas
 * 
 * Acedida pelo botao + no bottom bar.
 * Permite escrever texto e adicionar imagem inteira (sem crop).
 */
const CreatePostScreen = () => {
    const router = useRouter();
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

    const { user } = useUser();

    // Publica e volta para o feed
    const handlePost = async () => {
        await createPost();
        router.push("/" as any);
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#E8F5E9]">
                <TouchableOpacity onPress={() => router.push("/" as any)}>
                    <Ionicons name="close" size={24} color="#3A6604" />
                </TouchableOpacity>
                <Text className="text-[#3A6604] font-bold text-lg">Nova Receita</Text>
                <TouchableOpacity
                    onPress={handlePost}
                    disabled={isCreating || !(content.trim() || selectedImage)}
                >
                    {isCreating ? (
                        <ActivityIndicator size="small" color="#3A6604" />
                    ) : (
                        <Text className={`font-bold text-sm ${
                            content.trim() || selectedImage ? "text-[#3A6604]" : "text-[#C8E6C9]"
                        }`}>
                            Publicar
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
                        {/* User info */}
                        <View className="flex-row items-center mb-4">
                            <Image
                                source={{ uri: user?.imageUrl || "https://via.placeholder.com/48" }}
                                className="w-10 h-10 rounded-full mr-3"
                            />
                            <Text className="text-[#3A6604] font-bold text-sm">
                                {user?.firstName || user?.username || "User"}
                            </Text>
                        </View>

                        {/* Text input */}
                        <TextInput
                            className="text-[#1a1a1a] text-base min-h-[100px]"
                            placeholder="Partilha a tua receita saudavel..."
                            placeholderTextColor="#8E8E8E"
                            multiline
                            value={content}
                            onChangeText={setContent}
                            maxLength={280}
                            autoFocus
                        />

                        {/* Imagem selecionada - INTEIRA, sem crop */}
                        {selectedImage && (
                            <View className="mt-4">
                                <View className="relative">
                                    <Image
                                        source={{ uri: selectedImage }}
                                        className="rounded-2xl"
                                        style={{ width: width - 32, height: (width - 32) * 0.75 }}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full items-center justify-center"
                                        onPress={removeImage}
                                    >
                                        <Feather name="x" size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Bottom bar */}
                <View className="flex-row justify-between items-center px-4 py-3 border-t border-[#E8F5E9] bg-white">
                    <View className="flex-row gap-5">
                        <TouchableOpacity onPress={pickImageFromGallery}>
                            <Feather name="image" size={22} color="#3A6604" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={takePhoto}>
                            <Feather name="camera" size={22} color="#3A6604" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center gap-3">
                        {content.length > 0 && (
                            <Text className={`text-xs font-medium ${
                                content.length > 250 ? "text-[#C62828]" : "text-[#486623]"
                            }`}>
                                {280 - content.length}
                            </Text>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default CreatePostScreen;