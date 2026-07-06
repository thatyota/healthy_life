import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterScreen() {
  const router = useRouter();
  // Core 2: useSignUp retorna { isLoaded, signUp, setActive }
  const { isLoaded, signUp, setActive } = useSignUp();

  // estados do formulario
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // estado para codigo de verificacao
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // funcao para criar conta - Core 2 API
  const handleSignUp = async () => {
    if (!email || !password) return;
    setError("");

    if (!isLoaded) return;
    setIsLoading(true);

    try {
      // Core 2: signUp.create() em vez de signUp.password()
      await signUp!.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      // Core 2: prepara verificacao de email
      await signUp!.prepareEmailAddressVerification({
        strategy: "email_code",
      });
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.message || "Erro ao criar conta";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // funcao para verificar o codigo - Core 2 API
  const handleVerify = async () => {
    if (!code) return;
    setError("");

    if (!isLoaded) return;
    setIsLoading(true);

    try {
      // Core 2: tenta verificar o codigo
      const result = await signUp!.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        // Core 2: usa setActive() em vez de finalize()
        await setActive!({ session: result.createdSessionId });
        router.replace("/(tabs)" as Href);
      } else {
        setError("Verificação incompleta. Tenta novamente.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || "Código inválido";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // verifica se esta no estado de verificacao - Core 2
  const isVerificationMode =
    signUp?.status === "missing_requirements" &&
    signUp?.unverifiedFields?.includes("email_address");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#F1F8E9]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-8 pt-12">
          {/* botao voltar */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-6"
          >
            <Ionicons name="arrow-back" size={24} color="#3A6604" />
          </TouchableOpacity>

          {/* titulo */}
          <Text className="text-[#3A6604] text-2xl font-bold mb-2">
            {isVerificationMode ? "Verifica o teu email" : "Criar conta"}
          </Text>
          <Text className="text-[#486623] text-base mb-6">
            {isVerificationMode
              ? `Enviamos um código para ${email}`
              : "Preenche os dados para criares a tua conta"}
          </Text>

          {/* mensagem de erro */}
          {error ? (
            <View className="bg-[#FFEBEE] border border-[#EF5350] rounded-xl px-4 py-3 mb-4">
              <Text className="text-[#C62828] text-sm text-center">
                {error}
              </Text>
            </View>
          ) : null}

          {!isVerificationMode ? (
            // formulario de registro
            <View className="gap-3">
              {/* input primeiro nome */}
              <View className="flex-row items-center bg-white border border-[#C8E6C9] rounded-full px-4 py-3">
                <Ionicons name="person-outline" size={20} color="#486623" />
                <TextInput
                  className="flex-1 ml-3 text-[#1a1a1a] text-base"
                  placeholder="Primeiro nome"
                  placeholderTextColor="#8E8E8E"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!isLoading}
                />
              </View>

              {/* input ultimo nome */}
              <View className="flex-row items-center bg-white border border-[#C8E6C9] rounded-full px-4 py-3">
                <Ionicons name="person-outline" size={20} color="#486623" />
                <TextInput
                  className="flex-1 ml-3 text-[#1a1a1a] text-base"
                  placeholder="Último nome"
                  placeholderTextColor="#8E8E8E"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!isLoading}
                />
              </View>

              {/* input email */}
              <View className="flex-row items-center bg-white border border-[#C8E6C9] rounded-full px-4 py-3">
                <Ionicons name="mail-outline" size={20} color="#486623" />
                <TextInput
                  className="flex-1 ml-3 text-[#1a1a1a] text-base"
                  placeholder="Email"
                  placeholderTextColor="#8E8E8E"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                />
              </View>

              {/* input password */}
              <View className="flex-row items-center bg-white border border-[#C8E6C9] rounded-full px-4 py-3">
                <Ionicons name="lock-closed-outline" size={20} color="#486623" />
                <TextInput
                  className="flex-1 ml-3 text-[#1a1a1a] text-base"
                  placeholder="Password (min. 8 caracteres)"
                  placeholderTextColor="#8E8E8E"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
                {/* botao para mostrar/esconder password */}
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#486623"
                  />
                </TouchableOpacity>
              </View>

              {/* botao criar conta */}
              <TouchableOpacity
                className="bg-[#3A6604] rounded-full py-3.5 items-center mt-2"
                onPress={handleSignUp}
                disabled={isLoading || !email || !password}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Criar conta
                  </Text>
                )}
              </TouchableOpacity>

              {/* link para login - usa cast para Href para evitar erro de tipo */}
              <TouchableOpacity
                onPress={() => router.push("/(auth)" as Href)}
                className="items-center mt-2"
              >
                <Text className="text-[#486623] text-sm">
                  Já tens conta?{" "}
                  <Text className="text-[#3A6604] font-bold">Entrar</Text>
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // tela de verificacao
            <View className="gap-3">
              {/* input codigo */}
              <View className="flex-row items-center bg-white border border-[#C8E6C9] rounded-full px-4 py-3">
                <Ionicons name="key-outline" size={20} color="#486623" />
                <TextInput
                  className="flex-1 ml-3 text-[#1a1a1a] text-base"
                  placeholder="Código de verificação"
                  placeholderTextColor="#8E8E8E"
                  keyboardType="number-pad"
                  value={code}
                  onChangeText={setCode}
                  editable={!isLoading}
                  maxLength={6}
                />
              </View>

              {/* botao verificar */}
              <TouchableOpacity
                className="bg-[#3A6604] rounded-full py-3.5 items-center mt-2"
                onPress={handleVerify}
                disabled={isLoading || !code}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Verificar
                  </Text>
                )}
              </TouchableOpacity>

              {/* reenviar codigo */}
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await signUp!.prepareEmailAddressVerification({
                      strategy: "email_code",
                    });
                  } catch (err: any) {
                    setError(err?.errors?.[0]?.longMessage || "Erro ao reenviar");
                  }
                }}
                className="items-center mt-2"
              >
                <Text className="text-[#3A6604] text-sm font-medium">
                  Reenviar código
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}