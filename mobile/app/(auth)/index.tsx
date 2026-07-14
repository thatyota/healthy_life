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
  import { useApiClient } from "../../utils/api";  // path do teu hook
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
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [verifyingCode, setVerifyingCode] = useState(false);

    const [pendingVerification, setPendingVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [pendingSignUp, setPendingSignUp] = useState<any>(null);

    const [codeError, setCodeError] = useState("");
    const [codeAttempts, setCodeAttempts] = useState(0);
    const [codeInputError, setCodeInputError] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    const apiClient: AxiosInstance = useApiClient();

    const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
    const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
    const { signOut } = useAuth();
    const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
    const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: "oauth_apple" });

    // === GERAR USERNAME AUTOMÁTICO ===
    // gera um username unico a partir do email
    const generateUsername = (userEmail: string): string => {
      // pega a parte antes do @ e remove caracteres especiais
      const base = userEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      // adiciona 4 caracteres do timestamp para garantir unicidade
      const timestamp = Date.now().toString(36).slice(-4);
      return `${base}${timestamp}`;
    };

    // === REDIRECIONAR COM BASE NO ROLE ===
    // funcao que verifica o role do user e redireciona para a rota correta
    const redirectByRole = useCallback(async () => {
      try {
        // aguarda 500ms para o Clerk atualizar a sessao
        await new Promise((r) => setTimeout(r, 500));
        // busca o user atual no backend para obter o role
        const response = await apiClient.get("/users/me");
        // extrai o role da resposta, default "user" se nao existir
        const userRole = response?.data?.user?.role || "user";

        // se o role for admin, vai para o painel admin
        if (userRole === "admin") {
          router.replace("/(admin)");
        } else {
          // senao, vai para o feed normal
          router.replace("/(tabs)");
        }
      } catch (error: any) {
        // se der erro, loga e manda para o feed
        console.error("Erro ao verificar role:", error);
        router.replace("/(tabs)");
      }
    }, [apiClient]);

    // === SYNC USER ===
    // sincroniza o user no backend (cria ou atualiza no MongoDB)
    const syncUser = useCallback(async (
      clerkId: string,         // id do user no Clerk
      userEmail: string,        // email do user
      userFirstName: string,    // primeiro nome
      userLastName: string,     // ultimo nome
      userUsername: string,     // username gerado
      userRole: string,         // role: "user" ou "admin"
      code?: string             // codigo admin (opcional, so para registo admin)
    ) => {
      try {
        // envia os dados para o backend sincronizar
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
        // se o erro for codigo invalido, lanca excecao para mostrar no frontend
        if (error?.response?.data?.error?.includes("inválido")) {
          throw new Error(error.response.data.error);
        }
      }
    }, [apiClient]);

    // === VERIFICAR CODIGO ADMIN ===
    // verifica se o codigo de admin inserido e valido
    const verifyAdminCode = async () => {
      // limpa erro anterior
      setCodeError("");
      setCodeInputError(false);

      // verifica se inseriu algum codigo
      if (!adminCode.trim()) {
        setCodeError("Insere o código de administrador");
        setCodeInputError(true);
        return;
      }

      setVerifyingCode(true);

      try {
        // envia o codigo para o backend verificar
        const response = await apiClient.post("/auth/verify-admin", {
          adminCode: adminCode.trim(),
        });

        // se o backend confirmar que e valido, marca como verificado
        if (response?.data?.valid === true) {
          setAdminCodeVerified(true);
          setCodeError("");
          setCodeInputError(false);
          setCodeAttempts(0);
          return;
        }
      } catch (error: any) {
        // se o backend nao responder, usa fallback local
        console.log("Backend não disponível, usando fallback local");

        if (error?.response?.status === 404) {
          const LOCAL_ADMIN_CODE = "ADMINADMIN123";

          // verifica se o codigo corresponde ao local
          if (adminCode.trim() === LOCAL_ADMIN_CODE) {
            setAdminCodeVerified(true);
            setCodeError("");
            setCodeInputError(false);
            setCodeAttempts(0);
            Alert.alert(
              "Modo de Teste",
              "Código verificado em modo local. O backend não está atualizado."
            );
            setVerifyingCode(false);
            return;
          }
        }

        // codigo esta errado — incrementa tentativas
        const newAttempts = codeAttempts + 1;
        setCodeAttempts(newAttempts);
        setCodeInputError(true);

        // mensagens de erro progressivas
        let errorMsg = "Código incorreto. Tenta novamente.";
        if (newAttempts >= 3) {
          errorMsg = "Código incorreto. Verifica se escreveste bem ou contacta o suporte.";
        }
        if (newAttempts >= 5) {
          errorMsg = "Muitas tentativas falhadas. Tenta mais tarde.";
        }

        setCodeError(errorMsg);
      } finally {
        setVerifyingCode(false);
      }
    };

    // === LOGIN ===
    // faz login com email e password
    const handleLogin = async () => {
      // verifica se o signIn do Clerk esta carregado
      if (!signInLoaded || !signIn) return;
      // verifica se preencheu email e password
      if (!email.trim() || !password.trim()) {
        Alert.alert("Erro", "Preenche email e password");
        return;
      }
      setIsLoading(true);
      try {
        // cria a sessao de login no Clerk
        const result = await signIn.create({
          identifier: email.trim(),
          password: password.trim(),
        });
        // se o login for completo, ativa a sessao
        if (result.status === "complete") {
          if (setSignInActive) {
            await setSignInActive({ session: result.createdSessionId });
          }
          // redireciona com base no role
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
    // cria conta nova de user normal
    const handleRegister = async () => {
      // verifica se o signUp do Clerk esta carregado
      if (!signUpLoaded || !signUp) return;
      // verifica se preencheu todos os campos
      if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim() || !username.trim()) {
        Alert.alert("Erro", "Preenche todos os campos");
        return;
      }
      setIsLoading(true);
      try {
        // cria a conta no Clerk com os dados inseridos
        const result = await signUp.create({
          emailAddress: email.trim(),
          password: password.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim(),
        });
        // se o registo for completo, ativa a sessao e sincroniza
        if (result.status === "complete") {
          if (setSignUpActive) {
            await setSignUpActive({ session: result.createdSessionId });
          }
          if (result.createdUserId) {
            // sincroniza no backend com role "user"
            await syncUser(
              result.createdUserId,
              email.trim(),
              firstName.trim(),
              lastName.trim(),
              username.trim(),
              "user"
            );
          }
          // vai para o feed normal
          router.replace("/(tabs)");
        } else if (result.status === "missing_requirements") {
          // prepara verificacao por email se faltar requisitos
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
    // Se o user já é admin, vai para /(admin). Se não, vai para /(tabs).
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
      if (!adminEmail.trim() || !adminPassword.trim() || !adminFirstName.trim() || !adminLastName.trim()) {
        Alert.alert("Erro", "Preenche todos os campos");
        return;
      }

      const generatedUsername = generateUsername(adminEmail.trim());
      console.log("Username gerado:", generatedUsername);

      setIsLoading(true);
      try {
        const signUpData: any = {
          emailAddress: adminEmail.trim(),
          password: adminPassword.trim(),
          firstName: adminFirstName.trim(),
          lastName: adminLastName.trim(),
          unsafeMetadata: { adminCode: adminCode.trim() },
        };

        console.log("Dados do signUp:", JSON.stringify(signUpData, null, 2));

        const result = await signUp.create(signUpData);
        console.log("Resultado signUp:", result.status);

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
              generatedUsername,
              "admin",
              adminCode.trim()
            );
          }

          try {
            const makeAdminRes = await apiClient.post("/auth/make-admin");
            console.log(" Role forçado para admin:", makeAdminRes.data);
          } catch (e: any) {
            console.error("Erro ao forçar admin:", e?.response?.data || e.message);
          }

          setAdminModalVisible(false);
          resetAdminForm();
          router.replace("/(admin)");
        } else if (result.status === "missing_requirements") {
          // Guarda o signUp para usar na verificação
          setPendingSignUp(signUp);
          setPendingVerification(true);
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          Alert.alert("Verificação", "Código enviado para o email! Insere o código abaixo.");
        }
      } catch (err: any) {
        console.error("Erro:", err);
        let errorMsg = err.errors?.[0]?.message || err.message || "Erro no registo admin";
        Alert.alert("Erro", errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    // === VERIFICAR CÓDIGO OTP ===
    const handleVerifyOTP = async () => {
      if (!verificationCode.trim()) {
        Alert.alert("Erro", "Insere o código de verificação");
        return;
      }

      setIsLoading(true);
      try {
        const result = await pendingSignUp.attemptEmailAddressVerification({
          code: verificationCode.trim(),
        });

        console.log("Resultado verificação:", result.status);

        if (result.status === "complete") {
          if (setSignUpActive) {
            await setSignUpActive({ session: result.createdSessionId });
          }

          const generatedUsername = generateUsername(adminEmail.trim());

          if (result.createdUserId) {
            await syncUser(
              result.createdUserId,
              adminEmail.trim(),
              adminFirstName.trim(),
              adminLastName.trim(),
              generatedUsername,
              "admin",
              adminCode.trim()
            );
          }

          try {
            const makeAdminRes = await apiClient.post("/auth/make-admin");
            console.log(" Role forçado para admin (OTP):", makeAdminRes.data);
          } catch (e: any) {
            console.error("Erro ao forçar admin (OTP):", e?.response?.data || e.message);
          }

          // Reset estados
          setPendingVerification(false);
          setVerificationCode("");
          setPendingSignUp(null);
          setAdminModalVisible(false);
          resetAdminForm();
          router.replace("/(admin)");
        } else {
          Alert.alert("Erro", "Código inválido. Tenta novamente.");
        }
      } catch (err: any) {
        console.error("Erro verificação:", err);
        Alert.alert("Erro", err.errors?.[0]?.message || "Código inválido");
      } finally {
        setIsLoading(false);
      }
    };

    // === LOGIN GOOGLE ===
    // faz login com conta Google via OAuth
    const handleGoogleSignIn = async () => {
      try {
        // inicia o fluxo OAuth do Google
        const { createdSessionId, signUp: googleSignUp } = await startGoogleOAuth();
        // se obteve sessao, ativa e sincroniza
        if (createdSessionId && setSignInActive) {
          await setSignInActive({ session: createdSessionId });
          if (googleSignUp?.createdUserId) {
            // sincroniza o user no backend com role "user"
            await syncUser(
              googleSignUp.createdUserId,
              googleSignUp.emailAddress || email,
              googleSignUp.firstName || "",
              googleSignUp.lastName || "",
              googleSignUp.username || email.split("@")[0],
              "user"
            );
          }
          // redireciona com base no role
          await redirectByRole();
        }
      } catch (err: any) {
        Alert.alert("Erro", err.message || "Erro com Google");
      }
    };

    // === LOGIN APPLE ===
    // faz login com conta Apple via OAuth
    const handleAppleSignIn = async () => {
      try {
        // inicia o fluxo OAuth da Apple
        const { createdSessionId, signUp: appleSignUp } = await startAppleOAuth();
        // se obteve sessao, ativa e sincroniza
        if (createdSessionId && setSignInActive) {
          await setSignInActive({ session: createdSessionId });
          if (appleSignUp?.createdUserId) {
            // sincroniza o user no backend com role "user"
            await syncUser(
              appleSignUp.createdUserId,
              appleSignUp.emailAddress || email,
              appleSignUp.firstName || "",
              appleSignUp.lastName || "",
              appleSignUp.username || email.split("@")[0],
              "user"
            );
          }
          // redireciona com base no role
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
      setAdminSubMode("login");
      setShowAdminPassword(false);
      setPendingVerification(false);
      setVerificationCode("");
      setPendingSignUp(null);
      setCodeError("");
      setCodeAttempts(0);
      setCodeInputError(false);
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
        error?: boolean;
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
          borderWidth: options?.error ? 2 : options?.highlight ? 2 : 1,
          borderColor: options?.error ? "#C62828" : options?.highlight ? "#3A6604" : "#C8E6C9",
        }}
      >
        <Feather name={icon as any} size={20} color={options?.error ? "#C62828" : options?.highlight ? "#3A6604" : "#8DA87A"} />
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

                      {renderInput("shield", "Código de segurança", adminCode, (text) => {
                        setAdminCode(text);
                        if (codeError) {
                          setCodeError("");
                          setCodeInputError(false);
                        }
                      }, {
                        highlight: true,
                        autoCapitalize: "characters",
                        error: codeInputError,
                      })}

                      {/* Mensagem de erro embaixo do input */}
                      {codeError ? (
                        <Text
                          style={{
                            color: "#C62828",
                            fontSize: 13,
                            marginBottom: 12,
                            textAlign: "center",
                            fontWeight: "500",
                          }}
                        >
                          {codeError}
                        </Text>
                      ) : null}

                      {/* Contador de tentativas */}
                      {codeAttempts > 0 && !codeError ? (
                        <Text
                          style={{
                            color: "#FF9800",
                            fontSize: 12,
                            marginBottom: 12,
                            textAlign: "center",
                          }}
                        >
                          Tentativa {codeAttempts}/5
                        </Text>
                      ) : null}

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
                  ) : pendingVerification ? (
                    // === TELA DE VERIFICAÇÃO OTP ===
                    <View>
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#486623",
                          marginBottom: 8,
                          textAlign: "center",
                        }}
                      >
                        Código enviado para
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: "#3A6604",
                          marginBottom: 16,
                          textAlign: "center",
                        }}
                      >
                        {adminEmail}
                      </Text>

                      {renderInput("mail", "Código de verificação", verificationCode, setVerificationCode, {
                        keyboardType: "number-pad",
                        highlight: true,
                      })}

                      <TouchableOpacity
                        onPress={handleVerifyOTP}
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
                            Verificar Código
                          </Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setPendingVerification(false);
                          setVerificationCode("");
                        }}
                        style={{
                          alignItems: "center",
                          marginTop: 16,
                          paddingVertical: 8,
                        }}
                      >
                        <Text style={{ color: "#8DA87A", fontSize: 14 }}>
                          Voltar ao registo
                        </Text>
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