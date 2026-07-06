import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import React, { useState, useRef, useCallback } from "react";
import { useSignIn, useSignUp, useAuth, useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApiClient } from "../../utils/api";
import type { AxiosInstance } from "axios";

// === TIPOS ===
type AuthMode = "login" | "register";
type AdminSubMode = "login" | "register";

// === COMPONENTE PRINCIPAL ===
export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados do modal admin
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminSubMode, setAdminSubMode] = useState<AdminSubMode>("login");
  const [adminCode, setAdminCode] = useState("");
  const [adminCodeVerified, setAdminCodeVerified] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const apiClient: AxiosInstance = useApiClient();

  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const { signOut } = useAuth();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: "oauth_apple" });

  // === REDIRECIONAR COM BASE NO ROLE ===
  const redirectByRole = useCallback(async () => {
    try {
      await new Promise((r) => setTimeout(r, 500));
      const response = await apiClient.get("/auth/me");
      const userRole = response?.data?.user?.role || "user";

      if (userRole === "admin") {
        router.replace("/(admin)");
      } else {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error("Erro ao verificar role:", error);
      router.replace("/(tabs)");
    }
  }, [apiClient]);

  // === SYNC USER ===
  const syncUser = useCallback(async (
    clerkId: string,
    userEmail: string,
    userFirstName: string,
    userLastName: string,
    userUsername: string,
    userRole: string,
    code?: string
  ) => {
    try {
      await apiClient.post("/auth/sync", {
        clerkId,
        email: userEmail,
        firstName: userFirstName,
        lastName: userLastName,
        username: userUsername,
        role: userRole,
        adminCode: code,
      });
    } catch (error: any) {
      console.error("Erro ao sync user:", error);
      if (error?.response?.data?.error?.includes("inválido")) {
        throw new Error(error.response.data.error);
      }
    }
  }, [apiClient]);

  // === VERIFICAR CODIGO ADMIN (BACKEND + FALLBACK LOCAL) ===
  const verifyAdminCode = async () => {
    if (!adminCode.trim()) {
      Alert.alert("Erro", "Insere o código de administrador");
      return;
    }

    setVerifyingCode(true);
    try {
      // Tenta verificar no backend primeiro
      const response = await apiClient.post("/auth/verify-admin", {
        adminCode: adminCode.trim(),
      });

      if (response?.data?.valid === true) {
        setAdminCodeVerified(true);
        return;
      }
    } catch (error: any) {
      console.log("Backend não disponível ou rota não encontrada, usando fallback local");

      // FALLBACK: Se backend não tem a rota (404), verifica localmente
      // ⚠️ EM PRODUÇÃO: Remover isto e usar apenas backend!
      if (error?.response?.status === 404) {
        // Código hardcoded para teste (deve ser igual ao .env do backend)
        const LOCAL_ADMIN_CODE = "ADMINADMIN123"; // Muda para o teu código!

        if (adminCode.trim() === LOCAL_ADMIN_CODE) {
          setAdminCodeVerified(true);
          Alert.alert(
            "Modo de Teste",
            "Código verificado em modo local. O backend não está atualizado."
          );
          setVerifyingCode(false);
          return;
        }
      }

      let errorMsg = "Erro ao verificar código";
      if (error?.response?.data?.error) {
        errorMsg = error.response.data.error;
      }
      Alert.alert("Erro", errorMsg);
    } finally {
      setVerifyingCode(false);
    }
  };

  // === LOGIN ===
  const handleLogin = async () => {
    if (!signInLoaded || !signIn) return;
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erro", "Preenche email e password");
      return;
    }
    setIsLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password: password.trim(),
      });
      if (result.status === "complete") {
        if (setSignInActive) {
          await setSignInActive({ session: result.createdSessionId });
        }
        await redirectByRole();
      } else {
        Alert.alert("Erro", "Login falhou. Verifica as credenciais.");
      }
    } catch (err: any) {
      Alert.alert("Erro", err.errors?.[0]?.message || err.message || "Erro no login");
    } finally {
      setIsLoading(false);
    }
  };

  // === REGISTO USER ===
  const handleRegister = async () => {
    if (!signUpLoaded || !signUp) return;
    if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim() || !username.trim()) {
      Alert.alert("Erro", "Preenche todos os campos");
      return;
    }
    setIsLoading(true);
    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        password: password.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
      });
      if (result.status === "complete") {
        if (setSignUpActive) {
          await setSignUpActive({ session: result.createdSessionId });
        }
        if (result.createdUserId) {
          await syncUser(
            result.createdUserId,
            email.trim(),
            firstName.trim(),
            lastName.trim(),
            username.trim(),
            "user"
          );
        }
        router.replace("/(tabs)");
      } else if (result.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        Alert.alert("Verificação", "Código enviado para o email!");
      }
    } catch (err: any) {
      Alert.alert("Erro", err.errors?.[0]?.message || err.message || "Erro no registo");
    } finally {
      setIsLoading(false);
    }
  };

  // === LOGIN ADMIN ===
  const handleAdminLogin = async () => {
    if (!signInLoaded || !signIn) return;
    if (!adminEmail.trim() || !adminPassword.trim()) {
      Alert.alert("Erro", "Preenche email e password");
      return;
    }
    setIsLoading(true);
    try {
      const result = await signIn.create({
        identifier: adminEmail.trim(),
        password: adminPassword.trim(),
      });
      if (result.status === "complete") {
        if (setSignInActive) {
          await setSignInActive({ session: result.createdSessionId });
        }
        await redirectByRole();
      } else {
        Alert.alert("Erro", "Login falhou. Verifica as credenciais.");
      }
    } catch (err: any) {
      Alert.alert("Erro", err.errors?.[0]?.message || err.message || "Erro no login admin");
    } finally {
      setIsLoading(false);
    }
  };

  // === REGISTO ADMIN ===
  const handleAdminRegister = async () => {
    if (!signUpLoaded || !signUp) return;
    if (!adminEmail.trim() || !adminPassword.trim() || !adminFirstName.trim() || !adminLastName.trim() || !adminUsername.trim()) {
      Alert.alert("Erro", "Preenche todos os campos");
      return;
    }
    setIsLoading(true);
    try {
      const result = await signUp.create({
        emailAddress: adminEmail.trim(),
        password: adminPassword.trim(),
        firstName: adminFirstName.trim(),
        lastName: adminLastName.trim(),
        username: adminUsername.trim(),
        unsafeMetadata: { adminCode: adminCode.trim() },
      });
      if (result.status === "complete") {
        if (setSignUpActive) {
          await setSignUpActive({ session: result.createdSessionId });
        }
        if (result.createdUserId) {
          await syncUser(
            result.createdUserId,
            adminEmail.trim(),
            adminFirstName.trim(),
            adminLastName.trim(),
            adminUsername.trim(),
            "admin",
            adminCode.trim()
          );
        }
        setAdminModalVisible(false);
        resetAdminForm();
        router.replace("/(admin)");
      } else if (result.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        Alert.alert("Verificação", "Código enviado para o email!");
      }
    } catch (err: any) {
      if (err.message?.includes("inválido")) {
        await signOut();
      }
      Alert.alert("Erro", err.errors?.[0]?.message || err.message || "Erro no registo admin");
    } finally {
      setIsLoading(false);
    }
  };

  // === LOGIN GOOGLE ===
  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, signUp: googleSignUp } = await startGoogleOAuth();
      if (createdSessionId && setSignInActive) {
        await setSignInActive({ session: createdSessionId });
        if (googleSignUp?.createdUserId) {
          await syncUser(
            googleSignUp.createdUserId,
            googleSignUp.emailAddress || email,
            googleSignUp.firstName || "",
            googleSignUp.lastName || "",
            googleSignUp.username || email.split("@")[0],
            "user"
          );
        }
        await redirectByRole();
      }
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro com Google");
    }
  };

  // === LOGIN APPLE ===
  const handleAppleSignIn = async () => {
    try {
      const { createdSessionId, signUp: appleSignUp } = await startAppleOAuth();
      if (createdSessionId && setSignInActive) {
        await setSignInActive({ session: createdSessionId });
        if (appleSignUp?.createdUserId) {
          await syncUser(
            appleSignUp.createdUserId,
            appleSignUp.emailAddress || email,
            appleSignUp.firstName || "",
            appleSignUp.lastName || "",
            appleSignUp.username || email.split("@")[0],
            "user"
          );
        }
        await redirectByRole();
      }
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro com Apple");
    }
  };

  // === RESET ===
  const resetAdminForm = () => {
    setAdminCode("");
    setAdminCodeVerified(false);
    setAdminEmail("");
    setAdminPassword("");
    setAdminFirstName("");
    setAdminLastName("");
    setAdminUsername("");
    setAdminSubMode("login");
    setShowAdminPassword(false);
  };

  const handleSubmit = () => {
    if (mode === "login") handleLogin();
    else if (mode === "register") handleRegister();
  };

  const handleAdminSubmit = () => {
    if (adminSubMode === "login") handleAdminLogin();
    else handleAdminRegister();
  };

  const changeMode = (newMode: AuthMode) => {
    setMode(newMode);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const renderInput = (
    icon: string,
    placeholder: string,
    value: string,
    onChange: (text: string) => void,
    options?: {
      secure?: boolean;
      showSecure?: boolean;
      onToggleSecure?: () => void;
      keyboardType?: any;
      autoCapitalize?: any;
      highlight?: boolean;
    }
  ) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
        borderWidth: options?.highlight ? 2 : 1,
        borderColor: options?.highlight ? "#3A6604" : "#C8E6C9",
      }}
    >
      <Feather name={icon as any} size={20} color={options?.highlight ? "#3A6604" : "#8DA87A"} />
      <TextInput
        style={{ flex: 1, marginLeft: 12, fontSize: 16, color: "#1A1A1A" }}
        placeholder={placeholder}
        placeholderTextColor="#8DA87A"
        value={value}
        onChangeText={onChange}
        secureTextEntry={options?.secure}
        keyboardType={options?.keyboardType}
        autoCapitalize={options?.autoCapitalize}
      />
      {options?.showSecure !== undefined && options.onToggleSecure && (
        <TouchableOpacity onPress={options.onToggleSecure}>
          <Feather name={options.showSecure ? "eye-off" : "eye"} size={20} color="#8DA87A" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F1F8E9" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Logo */}
          <View style={{ alignItems: "center", marginTop: 20, marginBottom: 10 }}>
            <Image
              source={require("../../assets/images/auth_logo.png")}
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "#3A6604", marginTop: 8 }}>
              Healthy Life
            </Text>
            <Text style={{ fontSize: 14, color: "#486623", marginTop: 4 }}>
              Partilha receitas saudáveis
            </Text>
          </View>

          {/* Tabs */}
          <View
            style={{
              flexDirection: "row",
              marginHorizontal: 20,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 4,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#C8E6C9",
            }}
          >
            {(["login", "register"] as AuthMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => changeMode(m)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: mode === m ? "#3A6604" : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontWeight: "600",
                    fontSize: 14,
                    color: mode === m ? "#FFFFFF" : "#486623",
                  }}
                >
                  {m === "login" ? "Login" : "Registar"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Formulário */}
          <View style={{ paddingHorizontal: 20 }}>
            {mode === "register" &&
              renderInput("at-sign", "Username", username, setUsername, { autoCapitalize: "none" })}
            {mode === "register" &&
              renderInput("user", "Primeiro nome", firstName, setFirstName, { autoCapitalize: "words" })}
            {mode === "register" &&
              renderInput("user", "Último nome", lastName, setLastName, { autoCapitalize: "words" })}
            {renderInput("mail", "Email", email, setEmail, {
              keyboardType: "email-address",
              autoCapitalize: "none",
            })}
            {renderInput("lock", "Password", password, setPassword, {
              secure: !showPassword,
              showSecure: showPassword,
              onToggleSecure: () => setShowPassword(!showPassword),
            })}

            {mode === "login" && (
              <TouchableOpacity
                onPress={() => router.push("/forgotpassword")}
                style={{ alignSelf: "flex-end", marginBottom: 16 }}
              >
                <Text style={{ color: "#3A6604", fontSize: 14 }}>Esqueceste a password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              style={{
                backgroundColor: "#3A6604",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                marginBottom: 20,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>
                  {mode === "login" ? "Entrar" : "Criar Conta"}
                </Text>
              )}
            </TouchableOpacity>

            {mode === "login" && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: "#C8E6C9" }} />
                <Text style={{ marginHorizontal: 12, color: "#8DA87A", fontSize: 14 }}>ou entrar com</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: "#C8E6C9" }} />
              </View>
            )}

            {mode === "login" && (
              <View style={{ gap: 12, marginBottom: 20 }}>
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    paddingVertical: 14,
                    borderWidth: 1,
                    borderColor: "#C8E6C9",
                  }}
                >
                  <Ionicons name="logo-google" size={20} color="#3A6604" />
                  <Text style={{ marginLeft: 8, color: "#3A6604", fontWeight: "600" }}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAppleSignIn}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#1A1A1A",
                    borderRadius: 16,
                    paddingVertical: 14,
                  }}
                >
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <Text style={{ marginLeft: 8, color: "#FFFFFF", fontWeight: "600" }}>Apple</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* LINK ENTRAR COMO ADMINISTRADOR */}
            {mode === "login" && (
              <TouchableOpacity
                onPress={() => {
                  resetAdminForm();
                  setAdminModalVisible(true);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 8,
                  paddingVertical: 12,
                }}
              >
                <Ionicons name="shield-checkmark-outline" size={18} color="#3A6604" />
                <Text style={{ marginLeft: 8, color: "#3A6604", fontWeight: "600", fontSize: 14 }}>
                  Entrar como Administrador
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL ADMIN */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={adminModalVisible}
        onRequestClose={() => {
          setAdminModalVisible(false);
          resetAdminForm();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: "#F1F8E9",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingHorizontal: 24,
                paddingTop: 20,
                paddingBottom: 40,
                maxHeight: "90%",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="shield-checkmark" size={28} color="#3A6604" />
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#1F2937", marginLeft: 10 }}>
                    Acesso Administrador
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setAdminModalVisible(false);
                    resetAdminForm();
                  }}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {!adminCodeVerified ? (
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#486623",
                        marginBottom: 16,
                        textAlign: "center",
                      }}
                    >
                      Insere o código de segurança para aceder como administrador
                    </Text>

                    {renderInput("shield", "Código de segurança", adminCode, setAdminCode, {
                      highlight: true,
                      autoCapitalize: "characters",
                    })}

                    <TouchableOpacity
                      onPress={verifyAdminCode}
                      disabled={verifyingCode}
                      style={{
                        backgroundColor: "#3A6604",
                        borderRadius: 16,
                        paddingVertical: 16,
                        alignItems: "center",
                        marginTop: 8,
                        opacity: verifyingCode ? 0.7 : 1,
                      }}
                    >
                      {verifyingCode ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>
                          Verificar Código
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View
                      style={{
                        flexDirection: "row",
                        backgroundColor: "#FFFFFF",
                        borderRadius: 12,
                        padding: 4,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: "#C8E6C9",
                      }}
                    >
                      {(["login", "register"] as AdminSubMode[]).map((m) => (
                        <TouchableOpacity
                          key={m}
                          onPress={() => setAdminSubMode(m)}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 8,
                            backgroundColor: adminSubMode === m ? "#3A6604" : "transparent",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: "600",
                              fontSize: 14,
                              color: adminSubMode === m ? "#FFFFFF" : "#486623",
                            }}
                          >
                            {m === "login" ? "Entrar" : "Registar"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {adminSubMode === "register" &&
                      renderInput("at-sign", "Username", adminUsername, setAdminUsername, {
                        autoCapitalize: "none",
                      })}
                    {adminSubMode === "register" &&
                      renderInput("user", "Primeiro nome", adminFirstName, setAdminFirstName, {
                        autoCapitalize: "words",
                      })}
                    {adminSubMode === "register" &&
                      renderInput("user", "Último nome", adminLastName, setAdminLastName, {
                        autoCapitalize: "words",
                      })}
                    {renderInput("mail", "Email", adminEmail, setAdminEmail, {
                      keyboardType: "email-address",
                      autoCapitalize: "none",
                    })}
                    {renderInput("lock", "Password", adminPassword, setAdminPassword, {
                      secure: !showAdminPassword,
                      showSecure: showAdminPassword,
                      onToggleSecure: () => setShowAdminPassword(!showAdminPassword),
                    })}

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#E8F5E9",
                        borderRadius: 16,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: "#3A6604",
                      }}
                    >
                      <Feather name="check-circle" size={20} color="#3A6604" />
                      <Text style={{ marginLeft: 12, fontSize: 14, color: "#3A6604", fontWeight: "600" }}>
                        Código verificado
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={handleAdminSubmit}
                      disabled={isLoading}
                      style={{
                        backgroundColor: "#3A6604",
                        borderRadius: 16,
                        paddingVertical: 16,
                        alignItems: "center",
                        marginTop: 8,
                        opacity: isLoading ? 0.7 : 1,
                      }}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>
                          {adminSubMode === "login" ? "Entrar como Admin" : "Registar como Admin"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}