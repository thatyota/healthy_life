// importa o hook useAuth do Clerk para verificar se o user está logado
import { useAuth } from "@clerk/clerk-expo"
// importa o useApiClient para fazer chamadas autenticadas ao backend
import { useApiClient, userApi } from "@/utils/api";
// importa o useMutation do tanstack query para gerir o estado da chamada
import { useMutation } from "@tanstack/react-query";
// importa o useEffect e useDebugValue do React
import { useDebugValue, useEffect } from "react";

/**
 * useUserSync — hook que sincroniza o user no backend quando faz login
 * 
 * Este hook corre automaticamente quando o user faz login (isSignedIn = true)
 * e chama POST /users/sync no backend. O backend usa o clerkId do token JWT
 * para encontrar o user no MongoDB ou criar um novo se não existir.
 * 
 * O sync é feito apenas uma vez por sessão — quando syncUserMutation.data
 * já existe, não chama de novo para evitar chamadas desnecessárias.
 * 
 * Este hook não retorna nada (return null) porque o objetivo é apenas
 * garantir que o user existe no MongoDB com os dados atualizados.
 */
export const useUserSync = () => {
    // isSignedIn vem do Clerk — true quando o user está autenticado
    const { isSignedIn } = useAuth();
    // api é o client axios configurado com o token do Clerk
    const api = useApiClient();

    /**
     * syncUserMutation — mutation do tanstack query que chama userApi.syncUser
     * 
     * mutationFn: a função que faz a chamada POST /users/sync
     * onSuccess: corre quando a chamada tem sucesso
     * onError: corre quando a chamada falha
     */
    const syncUserMutation = useMutation({
        // mutationFn é a função que a mutation executa
        // chama userApi.syncUser(api) que faz POST /users/sync
        mutationFn: () => {
            return userApi.syncUser(api);
        },
        // onSuccess corre quando o backend responde com sucesso (200)
        // response.data contém o documento do user no MongoDB
        onSuccess: (response: any) => {
            // log para confirmar que o sync foi bem-sucedido
            // mostra o nome e role do user sincronizado
            console.log("User synced:", JSON.stringify(response.data?.user));
        },
        // onError corre quando a chamada ao backend falha
        // pode ser erro de rede, 500, 401 (token inválido), etc.
        onError: (error: any) => {
            // log do erro para debug
            console.error("Sync error:", error?.response?.data || error.message);
        },
    });

    /**
     * useEffect que dispara automaticamente quando isSignedIn muda
     * 
     * Quando o user faz login (isSignedIn passa de false para true),
     * este efeito verifica se ainda não fez sync e chama syncUserMutation.mutate()
     * 
     * A dependência [isSignedIn] faz com que este efeito corra sempre
     * que o estado de autenticação muda.
     */
    useEffect(() => {
        // só executa o sync se o user estiver logado
        // se não estiver logado, não faz nada (evita chamadas desnecessárias)
        if (!isSignedIn) return;

        // só executa o sync se ainda não tiver data (ainda não sincronizou)
        // syncUserMutation.data existe quando a mutation já correu com sucesso
        // assim evita sincronizar múltiplas vezes na mesma sessão
        if (!syncUserMutation.data) {
            // dispara a mutation para sincronizar o user no backend
            syncUserMutation.mutate();
        }
        // a dependência é isSignedIn — corre sempre que o login muda
    }, [isSignedIn]);

    // useDebugValue mostra o estado no React DevTools
    // útil para debug durante desenvolvimento
    useDebugValue(isSignedIn ? "signed-in" : "signed-out");

    // este hook não retorna dados — o objetivo é apenas o sync automático
    return null;
};