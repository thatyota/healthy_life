import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

/**
 * Hook useSignOut
 * 
 * Faz logout do user e redireciona para a tela de login.
 * 
 * Uso:
 *   const { handleSignOut } = useSignOut();
 *   <TouchableOpacity onPress={handleSignOut}>
 *     <Text>Sair</Text>
 *   </TouchableOpacity>
 * 
 * Fluxo:
 * 1. Chama signOut() do Clerk (limpa sessão)
 * 2. router.replace("/(auth)") — navega para login sem histórico
 */
export const useSignOut = () => {
    const { signOut } = useClerk();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut();
            // Redireciona para login após logout
            router.replace("/(auth)");
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };
    return { handleSignOut };       
};