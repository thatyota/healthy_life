import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function AuthScreen() {
  const router = useRouter();
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Animacoes
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideXAnim = useRef(new Animated.Value(0)).current;
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regCode, setRegCode] = useState("");
  const [isVerificationMode, setIsVerificationMode] = useState(false);

  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const switchTab = (tab: "login" | "register") => {
    if (tab === activeTab) return;

    // Animacao de saida
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideXAnim, {
        toValue: tab === "register" ? -20 : 20,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(indicatorAnim, {
        toValue: tab === "register" ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setActiveTab(tab);
      setLoginError("");
      setRegError("");

      // Reset posicao para animacao de entrada
      slideXAnim.setValue(tab === "register" ? 20 : -20);

      // Animacao de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideXAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const indicatorPosition = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["2%", "50%"],
  });

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) return;
    setLoginError("");
    if (!signInLoaded) return;
    setLoginLoading(true);

    try {
      const result = await signIn!.create({
        identifier: loginEmail,
        password: loginPassword,
      });

      if (result.status === "complete") {
        await setSignInActive!({ session: result.createdSessionId });
        router.replace("/(tabs)" as Href);
      } else {
        setLoginError("Login incompleto. Verifica os dados.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.message || "Erro ao fazer login";
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regEmail || !regPassword) return;
    setRegError("");
    if (!signUpLoaded) return;
    setRegLoading(true);

    try {
      await signUp!.create({
        emailAddress: regEmail,
        password: regPassword,
        firstName,
        lastName,
      });

      await signUp!.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setIsVerificationMode(true);
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.message || "Erro ao criar conta";
      setRegError(msg);
    } finally {
      setRegLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!regCode) return;
    setRegError("");
    if (!signUpLoaded) return;
    setRegLoading(true);

    try {
      const result = await signUp!.attemptEmailAddressVerification({
        code: regCode,
      });

      if (result.status === "complete") {
        await setSignUpActive!({ session: result.createdSessionId });
        router.replace("/(tabs)" as Href);
      } else {
        setRegError("Verificação incompleta. Tenta novamente.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || "Código inválido";
      setRegError(msg);
    } finally {
      setRegLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading("google");
    setTimeout(() => {
      setLoginError("Login com Google em breve!");
      setSocialLoading(null);
    }, 1000);
  };

  const handleAppleLogin = async () => {
    setSocialLoading("apple");
    setTimeout(() => {
      setLoginError("Login com Apple em breve!");
      setSocialLoading(null);
    }, 1000);
  };

  const renderForm = () => {
    if (activeTab === "login") {
      return (
        <View className="gap-3">
          <View className="flex-row items-center bg-white border border-[#C8E6C9] rounded-full px-4 py-3">
            <Ionicons name="mail-outline" size={20} color="#486623" />
            <TextInput
              className="flex-1 ml-3 text-[#1a1a1a] text-base"
              placeholder="Email"
              placeholderTextColor="#8E8E8E"
              autoCapitalize="none"
              keyboardType="email-address"
              value={loginEmail}
              onChangeText={setLoginEmail}
              editable={!loginLoading}
            />
          </View>

          <View className="flex-row items-center bg-white border border-[#C8E6C9] rounded-full px-4 py-3">
            <Ionicons name="lock-closed-outline" size={20} color="#486623" />
            <TextInput
              className="flex-1 ml-3 text-[#1a1a1a] text-base"
              placeholder="Password"
              placeholderTextColor="#8E8E8E"
              secureTextEntry={!loginShowPassword}
              value={loginPassword}
              onChangeText={setLoginPassword}
              editable={!loginLoading}
            />
            <TouchableOpacity onPress={() => setLoginShowPassword(!loginShowPassword)}>
              <Ionicons
                name={loginShowPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#486623"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgotpassword" as Href)}
            className="self-end"
          >
            <Text className="text-[#3A6604] text-sm font-medium">
              Esqueceste a password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#3A6604] rounded-full py-3.5 items-center mt-2"
            onPress={handleLogin}
            disabled={loginLoading || !loginEmail || !loginPassword}
            activeOpacity={0.8}
          >
            {loginLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Entrar</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    if (isVerificationMode) {
      return (
        <View className="gap-3">
          <Text className="text-[#3A6604] text-lg font-bold text-center mb-2">
            Verifica o teu email
          </Text>
          <Text className="text-[#486623] text-sm text-center mb-4">
            Enviamos um código para {regEmail}
          </Text>

          <View className="flex-row items-center bg-white border border-[#C8E6C9] rounded-full px-4 py-3">
            <Ionicons name="key-outline" size={20} color="#486623" />
            <TextInput
              className="flex-1 ml-3 text-[#1a1a1a] text-base"
              placeholder="Código de verificação"
              placeholderTextColor="#8E8E8E"
              keyboardType="number-pad"
              value={regCode}
              onChangeText={setRegCode}
              editable={!regLoading}
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            className="bg-[#3A6604] rounded-full py-3.5 items-center mt-2"
            onPress={handleVerifyCode}
            disabled={regLoading || !regCode}
            activeOpacity={0.8}
          >
            {regLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Verificar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              try {
                await signUp!.prepareEmailAddressVerification({
                  strategy: "email_code",
                });
                setRegError("");
              } catch (err: any) {
                setRegError(err?.errors?.[0]?.longMessage || "Erro ao reenviar");
              }
            }}
            className="items-center mt-2"
          >
            <Text className="text-[#3A6604] text-sm font-medium">
              Reenviar código
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsVerificationMode(false)}
            className="items-center mt-2"
          >
            <Text className="text-[#486623] text-sm">
              Voltar ao registo
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="gap-3">
        <View className="flex-row items-center bg-white border border-[#C8E6C9] rounded-full px-4 py-3">
          <Ionicons name="person-outline" size={20} color="#486623" />
          <TextInput
            className="flex-1 ml-3 text-[#1a1a1a] text-base"
            placeholder="Primeiro nome"
            placeholderTextColor="#8E8E8E"
            value={firstName}
            onChangeText={setFirstName}
            editable={!regLoading}
          />
        </View>

        <View className="flex-row items-center bg-white border border-[#C8E6C9] rounded-full px-4 py-3">
          <Ionicons name="person-outline" size={20} color="#486623" />
          <TextInput
            className="flex-1 ml-3 text-[#1a1a1a] text-base"
            placeholder="Último nome"
            placeholderTextColor="#8E8E8E"
            value={lastName}
            onChangeText={setLastName}
            editable={!regLoading}
          />
        </View>

        <View className="flex-row items-center bg-white border border-[#C8E6C9] rounded-full px-4 py-3">
          <Ionicons name="mail-outline" size={20} color="#486623" />
          <TextInput
            className="flex-1 ml-3 text-[#1a1a1a] text-base"
            placeholder="Email"
            placeholderTextColor="#8E8E8E"
            autoCapitalize="none"
            keyboardType="email-address"
            value={regEmail}
            onChangeText={setRegEmail}
            editable={!regLoading}
          />
        </View>

        <View className="flex-row items-center bg-white border border-[#C8E6C9] rounded-full px-4 py-3">
          <Ionicons name="lock-closed-outline" size={20} color="#486623" />
          <TextInput
            className="flex-1 ml-3 text-[#1a1a1a] text-base"
            placeholder="Password (min. 8 caracteres)"
            placeholderTextColor="#8E8E8E"
            secureTextEntry={!regShowPassword}
            value={regPassword}
            onChangeText={setRegPassword}
            editable={!regLoading}
          />
          <TouchableOpacity onPress={() => setRegShowPassword(!regShowPassword)}>
            <Ionicons
              name={regShowPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#486623"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-[#3A6604] rounded-full py-3.5 items-center mt-2"
          onPress={handleRegister}
          disabled={regLoading || !regEmail || !regPassword}
          activeOpacity={0.8}
        >
          {regLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Criar conta</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#F1F8E9]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-8 pt-14 pb-8">
          {/* Logo */}
          <View className="items-center mb-6">
            <Image
              source={require("../../assets/images/auth_logo.png")}
              style={{ width: 90, height: 90 }}
              resizeMode="contain"
            />
            <Text className="text-[#3A6604] text-2xl font-bold mt-2">Healthy Life</Text>
            <Text className="text-[#486623] text-sm mt-1">
              Partilha receitas saudáveis
            </Text>
          </View>

          {/* Tab Switcher com contorno e indicador animado */}
          <View className="flex-row bg-white rounded-2xl border border-[#C8E6C9] mb-6 overflow-hidden relative p-1.5">
            {/* Background indicador animado */}
            <Animated.View
              className="absolute top-1.5 bottom-1.5 bg-[#3A6604] rounded-xl"
              style={{
                left: indicatorPosition,
                width: "48%",
              }}
            />

            <TouchableOpacity
              onPress={() => switchTab("login")}
              className="flex-1 py-3 items-center rounded-xl z-10"
              activeOpacity={0.8}
            >
              <Text
                className={`font-bold text-sm ${
                  activeTab === "login" ? "text-white" : "text-[#8E8E8E]"
                }`}
              >
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => switchTab("register")}
              className="flex-1 py-3 items-center rounded-xl z-10"
              activeOpacity={0.8}
            >
              <Text
                className={`font-bold text-sm ${
                  activeTab === "register" ? "text-white" : "text-[#8E8E8E]"
                }`}
              >
                Registar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Messages */}
          {loginError && activeTab === "login" ? (
            <View className="bg-[#FFEBEE] border border-[#EF5350] rounded-xl px-4 py-3 mb-4">
              <Text className="text-[#C62828] text-sm text-center">{loginError}</Text>
            </View>
          ) : null}

          {regError && activeTab === "register" ? (
            <View className="bg-[#FFEBEE] border border-[#EF5350] rounded-xl px-4 py-3 mb-4">
              <Text className="text-[#C62828] text-sm text-center">{regError}</Text>
            </View>
          ) : null}

          {/* Form com animacao */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateX: slideXAnim }],
            }}
          >
            {renderForm()}
          </Animated.View>

          {/* Social Login - em baixo */}
          <View className="mt-8 gap-3">
            <View className="flex-row items-center mb-2">
              <View className="flex-1 h-px bg-[#C8E6C9]" />
              <Text className="text-[#8E8E8E] text-xs mx-3">ou entrar com</Text>
              <View className="flex-1 h-px bg-[#C8E6C9]" />
            </View>

            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={socialLoading === "google"}
              className="flex-row items-center justify-center bg-white border border-[#C8E6C9] rounded-full py-3"
              activeOpacity={0.8}
            >
              {socialLoading === "google" ? (
                <ActivityIndicator size="small" color="#3A6604" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#3A6604" />
                  <Text className="text-[#3A6604] font-semibold text-sm ml-2">
                    Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAppleLogin}
              disabled={socialLoading === "apple"}
              className="flex-row items-center justify-center bg-[#1a1a1a] rounded-full py-3"
              activeOpacity={0.8}
            >
              {socialLoading === "apple" ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="white" />
                  <Text className="text-white font-semibold text-sm ml-2">
                    Apple
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}