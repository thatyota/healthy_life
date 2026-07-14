import { useApiClient, userApi } from "@/utils/api";
import { useAuth } from "@clerk/clerk-expo"
import { useMutation } from "@tanstack/react-query";
import { useDebugValue, useEffect } from "react";


export const useUserSync = () => {
    const { isSignedIn } = useAuth();
    const api = useApiClient();

    const syncUserMutation = useMutation({
        mutationFn: () => {
            console.log("🔍 [useUserSync] ==============================");
            console.log("🔍 [useUserSync] A chamar userApi.syncUser()...");
            console.log("🔍 [useUserSync] isSignedIn:", isSignedIn);
            console.log("🔍 [useUserSync] Stack trace:", new Error().stack);
            return userApi.syncUser(api);
        },
        onSuccess: (response: any) => {
            console.log("✅ [useUserSync] Sync SUCESSO");
            console.log("✅ [useUserSync] Resposta:", JSON.stringify(response.data, null, 2));
            console.log("✅ [useUserSync] Role após sync:", response.data?.user?.role);
        },
        onError: (error: any) => {
            console.error("❌ [useUserSync] Sync ERRO:", error);
            console.error("❌ [useUserSync] Detalhes:", error?.response?.data || error.message);
        },
    });

    //auto-sync user when signed in
    useEffect(() => {
        console.log("🔍 [useUserSync useEffect] ==============================");
        console.log("🔍 [useUserSync useEffect] isSignedIn mudou para:", isSignedIn);
        console.log("🔍 [useUserSync useEffect] syncUserMutation.data:", syncUserMutation.data ? "JÁ TEM DATA" : "NÃO TEM DATA");
        console.log("🔍 [useUserSync useEffect] Stack trace:", new Error().stack);

        //if user is signed in and user is not synced yet, sync user
        if (isSignedIn && !syncUserMutation.data) {
            console.log("🚀 [useUserSync useEffect] VAI DISPARAR syncUserMutation.mutate()!");
            syncUserMutation.mutate();
        } else {
            console.log("⏸️ [useUserSync useEffect] NÃO vai disparar (isSignedIn:", isSignedIn, ", tem data:", !!syncUserMutation.data, ")");
        }
    }, [isSignedIn]);

    return null;

};