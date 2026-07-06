import { useSSO } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useCallback, useState } from "react";
import { useApiClient } from "@/utils/api";

// hook para autenticacao social (Google/Apple) - Core 3 usa useSSO
export const useSocialAuth = () => {
  const router = useRouter();
  const api = useApiClient();
  // Core 3: useSSO em vez de useOAuth
  const { startSSOFlow } = useSSO();
  const [isLoading, setIsLoading] = useState(false);

  // funcao para iniciar auth social
  const handleSocialAuth = useCallback(
    async (strategy: "oauth_google" | "oauth_apple") => {
      setIsLoading(true);
      try {
        // Core 3: startSSOFlow em vez de startOAuthFlow
        const { createdSessionId, setActive, signUp } = await startSSOFlow({
          strategy,
          redirectUrl: Linking.createURL("/(tabs)", { scheme: "myapp" }),
        });

        if (createdSessionId) {
          // Core 3: OAuth ainda usa setActive (nao finalize)
          await setActive!({ session: createdSessionId });

          // se for novo user, sincroniza com o backend
          if (signUp?.createdUserId) {
            await api.post("/users/sync");
          }

          // navega para as tabs
          router.replace("/(tabs)");
        }
      } catch (err) {
        console.error("OAuth error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [startSSOFlow, router, api]
  );

  return { handleSocialAuth, isLoading };
};