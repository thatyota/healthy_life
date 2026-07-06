import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useApiClient } from "../utils/api";

/**
 * useCreatePost - Hook para criar posts com imagem
 * 
 * Funcionalidades:
 * - Escrever texto (content)
 * - Selecionar imagem da galeria (SEM crop, imagem inteira)
 * - Tirar foto com camera (SEM crop)
 * - Remover imagem selecionada
 * - Publicar post (texto + imagem opcional)
 */
export const useCreatePost = () => {
    const [content, setContent] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const api = useApiClient();
    const queryClient = useQueryClient();

    // Mutation para criar post no backend
    const createPostMutation = useMutation({
        mutationFn: async (postData: {content: string, imageUri?: string}) => {
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

            return api.post("/posts", formData, {
                headers: { "Content-Type": "multipart/form-data"},
            });
        },
        onSuccess: () => {
            setContent("");
            setSelectedImage(null);
            queryClient.invalidateQueries({ queryKey: ["posts"]});
            Alert.alert("Sucesso","Post criado com sucesso!");
        },
        onError: (error: any) => {
            Alert.alert("Erro", error?.response?.data?.error || "Erro ao criar post. Tenta novamente.");
        },
    });

    // Seleciona imagem da galeria ou camera - SEM CROP
    const handleImagePicker = async (useCamera: boolean = false) => {
        const permissionResult = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.status !== "granted") {
            const source = useCamera ? "camera" : "galeria";
            Alert.alert("Permissao necessaria", `Por favor da permissao para aceder a ${source}`);
            return;
        }

        // SEM CROP - imagem inteira
        const pickerOptions = {
            allowsEditing: false,   // ← SEM CROP! Imagem inteira
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

    // Cria o post (valida primeiro)
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