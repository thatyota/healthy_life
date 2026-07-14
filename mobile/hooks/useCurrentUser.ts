import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient, userApi } from "@/utils/api";
import { useAuth } from "@clerk/clerk-expo";

// ─── TIPO: CurrentUser ───────────────────────────────────
// Define a estrutura dos dados do user que vêm do backend
// Cada campo é uma informação do perfil do user
export interface CurrentUser {
  _id: string;              // ID do MongoDB (ex: "64a1b2c3...")
  clerkId: string;          // ID do Clerk (ex: "user_abc123...")
  Username: string;         // @username (ex: "davidnascimento")
  FirstName: string;        // Primeiro nome (ex: "David")
  LastName: string;         // Último nome (ex: "Nascimento")
  email: string;            // Email do user
  ProfilePicture: string;   // URL da foto de perfil
  bannerImage: string;      // URL da imagem de capa
  bio: string;              // Biografia/descrição
  location: string;         // Localização
  Followers: string[];      // Array de IDs de quem segue este user
  Following: string[];      // Array de IDs de quem este user segue
  createdAt: string;        // Data de criação da conta
}

// ─── HOOK: useCurrentUser ────────────────────────────────
// Busca os dados do user logado no backend
// Só funciona se o user estiver autenticado (logado)
export const useCurrentUser = () => {
  // api = cliente HTTP para fazer pedidos ao backend
  const api = useApiClient();

  // isSignedIn = true se o user estiver logado, false se não estiver
  // Vem do Clerk (sistema de autenticação)
  const { isSignedIn } = useAuth();

  // useQuery = hook do TanStack Query que busca dados do servidor
  // e guarda em cache (não precisa buscar sempre)
  return useQuery({
    // queryKey = identificador único desta query
    // ["currentUser"] = nome da cache
    // Se outro componente usar a mesma key, partilha os dados
    queryKey: ["currentUser"],

    // queryFn = função que busca os dados
    // É chamada automaticamente pelo useQuery
    queryFn: async () => {
      try {
        // Log para debug — mostra no console que está a buscar
        console.log("🔍 A buscar current user...");

        // Faz o pedido GET ao backend: /api/users/me
        // userApi.getCurrentUser é uma função que faz o GET
        const response = await userApi.getCurrentUser(api);

        // Log para debug — mostra os dados recebidos
        console.log("✅ Current user:", response.data);

        // Converte os dados para o tipo CurrentUser e devolve
        return response.data.user as CurrentUser;

      } catch (error: any) {
        // Se der erro 401 = Unauthorized (não autorizado)
        // Significa que o user não está logado
        if (error.response?.status === 401) {
          console.log("⚠️ User não autenticado (401)");
          return null;  // retorna null em vez de crashar
        }

        // Outros erros: mostra no console para debug
        console.error("❌ Erro ao buscar current user:", error.message);
        console.error("   Status:", error.response?.status);
        console.error("   Data:", error.response?.data);

        // Lança o erro para o TanStack Query tratar
        throw error;
      }
    },

    // enabled = só executa a query se esta condição for true
    // Se isSignedIn for false (user não logado), não faz o pedido
    // Evita erro 401 desnecessário
    enabled: isSignedIn === true,

    // retry = quantas vezes tenta novamente se der erro
    // Se for 401, não tenta de novo (é inútil, user não está logado)
    // Outros erros: tenta até 3 vezes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 3;
    },
  });
};

// ─── HOOK: useUpdateProfile ──────────────────────────────
// Atualiza o perfil do user logado (nome, bio, foto, etc.)
// Usa useMutation porque altera dados no servidor (POST/PUT)
export const useUpdateProfile = () => {
  // api = cliente HTTP para fazer pedidos ao backend
  const api = useApiClient();

  // queryClient = controla a cache do TanStack Query
  // Permite invalidar (apagar) dados em cache para forçar refetch
  const queryClient = useQueryClient();

  // useMutation = hook para alterar dados no servidor
  // Diferente do useQuery: não guarda em cache, executa quando chamamos
  return useMutation({
    // mutationFn = função que faz o pedido de atualização
    // Recebe os dados a atualizar (ex: { FirstName: "Novo", bio: "Nova bio" })
    mutationFn: async (data: any) => {
      // Faz o pedido POST/PUT ao backend: /api/users/profile
      const response = await userApi.updateProfile(api, data);
      return response.data;  // devolve os dados atualizados
    },

    // onSuccess = corre quando a atualização tem sucesso
    onSuccess: () => {
      // Invalida a cache do currentUser — força buscar dados novos
      // Assim o perfil mostra os dados atualizados imediatamente
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      // Invalida também a cache dos posts
      // Se o user mudou o nome/foto, os posts no feed atualizam
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};