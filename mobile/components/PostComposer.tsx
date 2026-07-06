import { View, Text, Image, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'
import { useCreatePost } from '@/hooks/useCreatePost';
import { useUser } from '@clerk/clerk-expo';
import { Feather } from '@expo/vector-icons';

/**
 * PostComposer - Componente para criar novas receitas
 * 
 * Funcionalidades:
 * - Escrever texto (max 280 chars)
 * - Adicionar imagem da galeria (SEM crop)
 * - Tirar foto com a câmara
 * - Remover imagem selecionada
 * - Publicar receita
 */
const PostComposer = () => {

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

    return (
        <View className='p-4 bg-white'>
            {/* Header com avatar e nome */}
            <View className='flex-row items-center mb-3'>
                <Image 
                    source={{ uri: user?.imageUrl || "https://via.placeholder.com/48" }} 
                    className='w-10 h-10 rounded-full mr-3'
                />
                <Text className='text-[#3A6604] font-bold text-sm'>
                    {user?.firstName || user?.username || "User"}
                </Text>
            </View>

            {/* Input de texto */}
            <TextInput
                className='text-[#1a1a1a] text-base min-h-[60px]'
                placeholder="Partilha a tua receita saudável..."
                placeholderTextColor="#8E8E8E"
                multiline
                value={content}
                onChangeText={setContent}
                maxLength={280}
            />

            {/* Preview da imagem selecionada - SEM CROP, imagem inteira */}
            {selectedImage && (
                <View className='mt-3'>
                    <View className='relative'>
                        <Image
                            source={{ uri: selectedImage }}
                            className='w-full rounded-2xl'
                            style={{ height: undefined, aspectRatio: 1 }}
                            resizeMode="contain"
                        />
                        {/* Botão remover imagem */}
                        <TouchableOpacity
                            className='absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full items-center justify-center'
                            onPress={removeImage}
                        >
                            <Feather name='x' size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Barra de ações */}
            <View className='flex-row justify-between items-center mt-4 pt-3 border-t border-[#E8F5E9]'>
                {/* Botões de imagem */}
                <View className='flex-row gap-4'>
                    <TouchableOpacity onPress={pickImageFromGallery}>
                        <Feather name='image' size={22} color="#3A6604" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={takePhoto}>
                        <Feather name='camera' size={22} color="#3A6604" />
                    </TouchableOpacity>
                </View>

                {/* Contador + Botão Publicar */}
                <View className='flex-row items-center gap-3'>
                    {content.length > 0 && (
                        <Text
                            className={`text-xs font-medium ${
                                content.length > 250 ? "text-[#C62828]" : "text-[#486623]"
                            }`}
                        >
                            {280 - content.length}
                        </Text>
                    )}
                    <TouchableOpacity
                        className={`px-6 py-2.5 rounded-full ${
                            content.trim() || selectedImage 
                                ? "bg-[#3A6604]" 
                                : "bg-[#C8E6C9]"
                        }`}
                        onPress={createPost}
                        disabled={isCreating || !(content.trim() || selectedImage)}
                    >
                        {isCreating ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text
                                className={`font-bold text-sm ${
                                    content.trim() || selectedImage 
                                        ? "text-white" 
                                        : "text-[#8E8E8E]"
                                }`}
                            >
                                Publicar
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default PostComposer;