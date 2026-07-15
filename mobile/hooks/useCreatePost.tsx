import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@clerk/clerk-expo";

// URL base da API
const API_BASE_URL = "https://healthy-life-sable.vercel.app/api";

/**
 * useCreatePost - Hook para criar posts com imagem
 * 
 * IMPORTANTE: Usa fetch em vez de axios porque o axios tem problemas
 * com FormData no React Native. O fetch lida corretamente com
 * multipart/form-data.
 */
export const useCreatePost = () => {
    const [content, setContent] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    const createPostMutation = useMutation({
        mutationFn: async (postData: {content: string, imageUri?: string}) => {
            // Busca o token do Clerk
            const token = await getToken();
            if (!token) {
                throw new Error("Nao autenticado");
            }

            // Cria o FormData
            const formData = new FormData();

            if (postData.content) formData.append("content", postData.content);

            if (postData.imageUri) {
                const uriParts = postData.imageUri.split(".");
                const fileType = uriParts[uriParts.length -1].toLowerCase();

                const mimeTypeMap: Record<string, string> = {
                    png: "image/png",
                    gif: "image/gif",
                    webp: "image/webp",
                }; 
                const mimeType = mimeTypeMap[fileType] || "image/jpeg";

                formData.append("image", {
                    uri: postData.imageUri,
                    name: `image.${fileType}`,
                    type: mimeType,
                } as any); 
            }

            // Usa fetch em vez de axios para upload de ficheiros
            // O fetch no React Native lida corretamente com FormData
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    // NAO definir Content-Type — o fetch define automaticamente
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `Erro ${response.status}`);
            }

            return data;
        },
        onSuccess: () => {
            setContent("");
            setSelectedImage(null);
            queryClient.invalidateQueries({ queryKey: ["posts"]});
            Alert.alert("Sucesso","Post criado com sucesso!");
        },
        onError: (error: any) => {
            console.error("=== ERRO AO CRIAR POST ===");
            console.error("Erro:", error.message);
            console.error("===========================");
            Alert.alert("Erro", error.message || "Erro ao criar post. Tenta novamente.");
        },
    });

    const handleImagePicker = async (useCamera: boolean = false) => {
        const permissionResult = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.status !== "granted") {
            const source = useCamera ? "camera" : "galeria";
            Alert.alert("Permissao necessaria", `Por favor da permissao para aceder a ${source}`);
            return;
        }

        const pickerOptions = {
            allowsEditing: false,
            quality: 0.8,
        };

        const result = useCamera
            ? await ImagePicker.launchCameraAsync(pickerOptions)
            : await ImagePicker.launchImageLibraryAsync({
                ...pickerOptions,
                mediaTypes: ["images"],
            });

        if (!result.canceled) setSelectedImage(result.assets[0].uri);
    };

    const createPost = () => {
        if (!content.trim() && !selectedImage) {
            Alert.alert("Post vazio", "Escreve algo ou adiciona uma imagem antes de publicar!");
            return;
        }

        const postData: { content: string; imageUri?: string} = {
            content: content.trim(),
        };

        if (selectedImage) postData.imageUri = selectedImage;

        createPostMutation.mutate(postData);
    };

    return {
        content,
        setContent,
        selectedImage,
        isCreating: createPostMutation.isPending,
        pickImageFromGallery: () => handleImagePicker(false),
        takePhoto: () => handleImagePicker(true),
        removeImage: () => setSelectedImage(null),
        createPost,
    };
};