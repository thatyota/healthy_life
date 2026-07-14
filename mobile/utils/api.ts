// URL base da API — aponta para o backend hospedado na Vercel
// Este e o endpoint unico que todas as chamadas usam como base
const API_BASE_URL = "https://healthy-life-sable.vercel.app/api";

// importa o useAuth do Clerk para obter o token JWT do user logado
import { useAuth } from "@clerk/clerk-expo";
// importa o axios para fazer chamadas HTTP ao backend
import axios, { AxiosInstance } from "axios";

/**
 * createApiClient — cria um client axios configurado com interceptores
 * 
 * Os interceptores adicionam automaticamente o token JWT do Clerk
 * em cada request, garantindo que o backend possa verificar a identidade
 * do user atraves do middleware protectRoute.
 * 
 * O getToken e uma funcao que vem do useAuth() do Clerk
 * e retorna o token JWT assinado pelo Clerk (expira em 60 segundos)
 */
export const createApiClient = (getToken: () => Promise<string | null>): AxiosInstance => {
  // cria uma instancia do axios com a URL base do backend
  // todas as chamadas serao feitas para https://healthy-life-sable.vercel.app/api/...
  const api = axios.create({ baseURL: API_BASE_URL });

  // interceptor de request: corre ANTES de cada chamada HTTP
  // adiciona o token JWT no header Authorization
  api.interceptors.request.use(async (config) => {
    // busca o token do Clerk (token JWT assinado pelo Clerk)
    // este token contem o clerkId do user e expira em 60 segundos
    const token = await getToken();
    // se o token existir, adiciona no header Authorization no formato Bearer
    // o backend usa este token para identificar o user via Clerk
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // retorna a config modificada para o axios continuar o request
    return config;
  });

  // interceptor de response: corre DEPOIS de cada chamada HTTP
  // retorna a resposta normalmente (sem logs de debug)
  api.interceptors.response.use(
    (response) => {
      // retorna a resposta para quem chamou a API
      return response;
    },
    // se der erro na chamada, rejeita a promise com o erro
    // quem chamou a API pode tratar o erro no catch
    (error) => {
      return Promise.reject(error);
    }
  );

  // retorna a instancia do axios configurada
  return api;
};

/**
 * useApiClient — hook que cria o client axios com o token do Clerk
 * 
 * Deve ser usado dentro de componentes React para ter acesso
 * ao contexto de autenticacao do Clerk.
 * 
 * Exemplo de uso:
 * const api = useApiClient();
 * const response = await api.get("/users/me");
 */
export const useApiClient = (): AxiosInstance => {
  // getToken vem do Clerk — retorna o token JWT do user logado
  const { getToken } = useAuth();
  // cria o client axios com o getToken do Clerk
  return createApiClient(getToken);
};

/**
 * userApi — funcoes para interagir com a API de users
 * 
 * Todas as funcoes recebem o api client como argumento
 * para garantir que o token esta presente no request.
 */
export const userApi = {
  // syncUser: sincroniza o user no backend (cria ou atualiza no MongoDB)
  // chamado automaticamente pelo useUserSync quando o user faz login
  // o backend usa o clerkId do token para encontrar ou criar o user
  syncUser: (api: AxiosInstance) => api.post("/users/sync"),

  // getCurrentUser: busca o documento do user atual no MongoDB
  // usado para obter o role, perfil, followers, following, etc.
  // retorna o documento completo do user logado
  getCurrentUser: (api: AxiosInstance) => api.get("/users/me"),

  // updateProfile: atualiza os dados do perfil do user
  // recebe um objeto com os campos a atualizar (bio, location, etc.)
  updateProfile: (api: AxiosInstance, data: any) => api.put("/users/profile", data),
};

/**
 * postApi — funcoes para interagir com a API de posts
 * 
 * Todas as funcoes recebem o api client como argumento
 * para garantir que o token esta presente no request.
 */
export const postApi = {
  // getPosts: busca todos os posts do feed
  // retorna uma lista de posts ordenados por data
  getPosts: (api: AxiosInstance) => api.get("/posts"),

  // getPost: busca um post especifico pelo ID
  // usado quando o user clica num post para ver detalhes
  getPost: (api: AxiosInstance, postId: string) => api.get(`/posts/${postId}`),

  // getUserPosts: busca todos os posts de um user especifico
  // usado no perfil do user para mostrar os posts dele
  getUserPosts: (api: AxiosInstance, username: string) => api.get(`/posts/user/${username}`),

  // likePost: adiciona ou remove um like num post
  // o backend verifica se o user ja deu like e alterna o estado
  likePost: (api: AxiosInstance, postId: string) => api.post(`/posts/${postId}/like`),

  // deletePost: apaga um post pelo ID
  // so funciona se o user for o autor do post
  deletePost: (api: AxiosInstance, postId: string) => api.delete(`/posts/${postId}`),
};

/**
 * commentApi — funcoes para interagir com a API de comentarios
 * 
 * Todas as funcoes recebem o api client como argumento
 * para garantir que o token esta presente no request.
 */
export const commentApi = {
  // getComments: busca todos os comentarios de um post
  // retorna uma lista de comentarios ordenados por data
  getComments: (api: AxiosInstance, postId: string) => api.get(`/comments/post/${postId}`),

  // createComment: adiciona um comentario a um post
  // recebe o conteudo do comentario como string
  createComment: (api: AxiosInstance, postId: string, content: string) =>
    api.post(`/comments/post/${postId}`, { content }),

  // deleteComment: apaga um comentario pelo ID
  // so funciona se o user for o autor do comentario
  deleteComment: (api: AxiosInstance, commentId: string) => api.delete(`/comments/${commentId}`),
};