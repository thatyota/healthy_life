import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useClerk } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const { handleEmailLinkVerification } = useClerk();

  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      // Core 2: verifica o link de email
      await handleEmailLinkVerification({});
      setStatus("success");
    } catch (err: any) {
      if (err?.code === "expired") {
        setStatus("expired");
      } else {
        setStatus("error");
        setErrorMessage(err?.message || "Erro ao verificar email");
      }
    }
  };

  // tela de loading
  if (status === "loading") {
    return (
      <View className="flex-1 bg-[#F1F8E9] justify-center items-center px-6">
        <Image
          source={require("../../assets/images/auth_logo.png")}
          className="w-20 h-20 mb-4"
          resizeMode="contain"
        />
        <Text className="text-[#3A6604] text-xl font-bold mb-2">
          Healthy Life
        </Text>
        <Text className="text-[#486623] text-sm text-center mb-6">
          A verificar o teu email...
        </Text>
        <ActivityIndicator size="large" color="#3A6604" />
      </View>
    );
  }

  // tela de sucesso
  if (status === "success") {
    return (
      <View className="flex-1 bg-[#F1F8E9] justify-center items-center px-6">
        <View className="w-20 h-20 rounded-full bg-[#E8F5E9] items-center justify-center mb-4">
          <Ionicons name="checkmark-circle" size={48} color="#3A6604" />
        </View>
        <Text className="text-[#3A6604] text-2xl font-bold mb-2">
          Email verificado!
        </Text>
        <Text className="text-[#486623] text-sm text-center mb-8">
          A tua conta foi verificada com sucesso. Ja podes comecar a partilhar receitas saudaveis!
        </Text>
        <TouchableOpacity
          className="bg-[#3A6604] rounded-2xl py-3.5 px-8"
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-sm">Comecar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // tela de erro ou expirado
  return (
    <View className="flex-1 bg-[#F1F8E9] justify-center items-center px-6">
      <View className="w-20 h-20 rounded-full bg-[#FFEBEE] items-center justify-center mb-4">
        <Ionicons name="close-circle" size={48} color="#C62828" />
      </View>
      <Text className="text-[#C62828] text-xl font-bold mb-2">
        {status === "expired" ? "Link expirado" : "Erro na verificacao"}
      </Text>
      <Text className="text-[#486623] text-sm text-center mb-8">
        {status === "expired"
          ? "O link de verificacao expirou. Solicita um novo codigo."
          : errorMessage || "Ocorreu um erro ao verificar o teu email."}
      </Text>
      <TouchableOpacity
        className="bg-[#3A6604] rounded-2xl py-3.5 px-8"
        onPress={() => router.replace("/(auth)")}
        activeOpacity={0.8}
      >
        <Text className="text-white font-bold text-sm">Voltar ao login</Text>
      </TouchableOpacity>
    </View>
  );
}