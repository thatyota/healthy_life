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
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsNewPassword, setNeedsNewPassword] = useState(false);

  // Passo 1: Envia codigo de reset para o email
  const sendCode = async () => {
    if (!email) return;
    setError("");

    if (!isLoaded) return;
    setIsLoading(true);

    try {
      // Cria o signIn com identifier
      await signIn.create({ identifier: email });

      // Prepara verificacao de email para reset de password
      // Usa as any para contornar tipos do TypeScript
      const factor = (signIn.supportedFirstFactors || []).find(
        (f: any) => f.strategy === "reset_password_email_code"
      ) as any;

      const emailAddressId = factor?.emailAddressId;

      if (!emailAddressId) {
        setError("Nao foi possivel encontrar o email para recuperacao.");
        setIsLoading(false);
        return;
      }

      await signIn.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId,
      } as any);

      setCodeSent(true);
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || "Erro ao enviar codigo";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Passo 2: Verifica o codigo
  const verifyCode = async () => {
    if (!code) return;
    setError("");

    if (!isLoaded) return;
    setIsLoading(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
      } as any);

      if (result.status === "needs_new_password") {
        setNeedsNewPassword(true);
      } else if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || "Codigo invalido";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Passo 3: Submete a nova password
  const submitNewPassword = async () => {
    if (!password) return;
    setError("");

    if (!isLoaded) return;
    setIsLoading(true);

    try {
      const result = await signIn.resetPassword({
        password,
      } as any);

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else if (result.status === "needs_second_factor") {
        setError("Verificacao adicional necessaria.");
      } else {
        setError("Erro ao redefinir password.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || "Erro ao definir password";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

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
          <TouchableOpacity onPress={() => router.back()} className="mb-6">
            <Ionicons name="arrow-back" size={24} color="#3A6604" />
          </TouchableOpacity>

          {/* titulo */}
          <Text className="text-[#3A6604] text-2xl font-bold mb-2">
            {needsNewPassword
              ? "Nova password"
              : codeSent
              ? "Verificar codigo"
              : "Recuperar password"}
          </Text>
          <Text className="text-[#486623] text-base mb-6">
            {needsNewPassword
              ? "Define a tua nova password"
              : codeSent
              ? `Introduz o codigo enviado para ${email}`
              : "Introduz o teu email para receberes um codigo de recuperacao"}
          </Text>

          {/* mensagem de erro */}
          {error ? (
            <View className="bg-[#FFEBEE] border border-[#EF5350] rounded-xl px-4 py-3 mb-4">
              <Text className="text-[#C62828] text-sm text-center">{error}</Text>
            </View>
          ) : null}

          {/* Passo 3: Nova password */}
          {needsNewPassword ? (
            <View className="gap-3">
              <View className="flex-row items-center bg-white border border-[#C8E6C9] rounded-full px-4 py-3">
                <Ionicons name="lock-closed-outline" size={20} color="#486623" />
                <TextInput
                  className="flex-1 ml-3 text-[#1a1a1a] text-base"
                  placeholder="Nova password"
                  placeholderTextColor="#8E8E8E"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#486623"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className="bg-[#3A6604] rounded-full py-3.5 items-center"
                onPress={submitNewPassword}
                disabled={isLoading || !password}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Definir nova password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : codeSent ? (
            /* Passo 2: Verificar codigo */
            <View className="gap-3">
              <View className="flex-row items-center bg-white border border-[#C8E6C9] rounded-full px-4 py-3">
                <Ionicons name="key-outline" size={20} color="#486623" />
                <TextInput
                  className="flex-1 ml-3 text-[#1a1a1a] text-base"
                  placeholder="Codigo de verificacao"
                  placeholderTextColor="#8E8E8E"
                  keyboardType="number-pad"
                  value={code}
                  onChangeText={setCode}
                  editable={!isLoading}
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                className="bg-[#3A6604] rounded-full py-3.5 items-center"
                onPress={verifyCode}
                disabled={isLoading || !code}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Verificar codigo
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={sendCode}
                className="items-center mt-2"
              >
                <Text className="text-[#3A6604] text-sm font-medium">
                  Reenviar codigo
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Passo 1: Introduzir email */
            <View className="gap-3">
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

              <TouchableOpacity
                className="bg-[#3A6604] rounded-full py-3.5 items-center"
                onPress={sendCode}
                disabled={isLoading || !email}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Enviar codigo
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* voltar para login */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)")}
            className="items-center mt-6"
          >
            <Text className="text-[#3A6604] text-sm font-medium">
              Voltar ao login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}