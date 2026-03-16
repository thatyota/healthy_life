import { useSocialAuth } from "@/hooks/useSocialAuth";
import {  ActivityIndicator, Button, Image, Text, Touchable, TouchableOpacity, View } from "react-native";

/**
 * Index Screen — Authentication Entry Point
 *
 * Este é o ecrã inicial mostrado a utilizadores não autenticados.
 * Permite fazer login via Google ou Apple usando OAuth através do Clerk.
 *
 * Fluxo:
 *  1. Utilizador carrega num dos botões de Auth
 *  2. Clerk abre o browser/modal do provider (Google ou Apple)
 *  3. Após autenticação bem-sucedida, o Clerk redireciona para o ecrã principal
 *
 * TODO: Ligar os onPress handlers ao useOAuth() do Clerk
 * TODO: Pesquisar TouchableOpacity vs Pressable para estados de press mais complexos
 */
export default function Index() {
  /**
   * Controla o estado de carregamento dos botões.
   * Quando true, substitui o conteúdo do botão por um ActivityIndicator
   * e desabilita ambos os botões para evitar cliques duplos.
   * 
   * TODO: Substituir por estado real do hook useOAuth() do Clerk
   */
    const {handleSocialAuth, isLoading} = useSocialAuth()

  return (
      <View className="flex-1 bg-white">
       {/* Container principal — ocupa o ecrã todo e separa o logo dos botões */}
       <View className="flex-1 px-8 justify-between "> 
        {/* Secção superior — logo centrado verticalmente */}
        <View className="flex-1 justify-center">

          {/* Logo da app — carregado localmente de assets/images */}
          <View className="items-center">
            <Image
              source={require("../../assets/images/auth_logo.png")}
              className="size-96"
              resizeMode="contain"
            /> 
          </View>

          {/* Container dos botões de autenticação */}
          <View className="flex-col gap-2">

            {/* 
              Botão Google OAuth
              - Mostra o spinner azul (#4285F4) do Google enquanto carrega
              - Desabilitado durante o carregamento para evitar chamadas duplicadas
            */}
            <TouchableOpacity
             className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full py-3 px-6"
            onPress={() => handleSocialAuth("oauth_google")}
             disabled={isLoading}
             style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1},
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2, // elevation só funciona no Android, iOS usa shadow*
             }}
            >
              {/* Mostra spinner ou conteúdo do botão consoante isLoading */}
              {isLoading ? (
                <ActivityIndicator size="small" color="#4285F4"/>
              ) : (
              <View className="flex-row items-center justify-center">  
                <Image
                  source={require("../../assets/images/google.png")}
                  className="size-10 mr-3"
                  resizeMode="contain"
                /> 
                <Text className="text-black font-medium text-base">Continue with Google</Text>
              </View>
              )}
            </TouchableOpacity>

            {/* 
              Botão Apple OAuth
              - Apenas relevante em iOS (Apple não permite este login noutras plataformas)
              - Mostra spinner preto (#000) para combinar com a identidade visual da Apple
            */}
            <TouchableOpacity
             className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full py-3 px-6"
            onPress={() => handleSocialAuth("oauth_apple")}
             disabled={isLoading}
             style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1},
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
             }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000"/>
              ) : (
              <View className="flex-row items-center justify-center">  
                <Image
                  source={require("../../assets/images/apple.png")}
                  className="size-8 mr-3"
                  resizeMode="contain"
                /> 
                <Text className="text-black font-medium text-base">Continue with Apple</Text>
              </View>
                )}
            </TouchableOpacity>

          </View>

        </View>

        {/* 
          Aviso legal — Terms, Privacy Policy e Cookie Use
          Estes textos devem ser clicáveis e navegar para um WebView
          com os respetivos documentos legais.
        */}
        <Text className="text-center text-gray-500 text-xs leading-4 mb-6 px-2">
            By signing up, you agree to our <Text className="text-blue-500">Terms</Text>
            {", "}
            <Text className="text-blue-500">Privacy Policy</Text>
            {", and "}
            <Text className="text-blue-500">Cookie Use</Text>.
        </Text>

       </View>
    </View>
  );
}