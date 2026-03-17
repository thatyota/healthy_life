import { useAuth, useClerk } from "@clerk/expo";
import axios, { AxiosInstance, formToJSON} from "axios";


const APi_BASE_URl = "https://healthy-life-sable.vercel.app/api"

// this will basically create an authenticated api, pass the token into our  headers
export const createApiClient =  (getToken: () => Promise<string |null> ) : AxiosInstance => {

    const api = axios.create({baseURL:APi_BASE_URl});

    api.interceptors.request.use(async (config) => {
        const token = await getToken()
        if(token) {
            config.headers.Authorization = `Bearer ${token}`
        }  
        return config;
    });
    return api;
};

/**
 * React hook that returns an authenticated Axios instance for the current Clerk user.
 *
 * Must be used inside React components or hooks (depends on `useAuth`).
 *
 * @returns `AxiosInstance` with the Clerk token automatically injected on each request.
 *
 * @example
 * function ProfileScreen() {
 *   const api = useApiClient();
 *   useEffect(() => {
 *     userApi.getCurrentUser(api).then(res => console.log(res.data));
 *   }, []);
 * }
 */
export const useApiClient = (): AxiosInstance => {
    const {getToken}= useAuth();
    return createApiClient(getToken);
};

/**
 * Collection of user-related API calls.
 *
 * Each function accepts an `AxiosInstance` (from `useApiClient`) to ensure authenticated requests.
 */
export const userApi = {
    /**
     * Syncs the authenticated user with the backend database.
     *
     * Should be called after login to ensure the user record exists (e.g. first Clerk sign-in).
     *
     * @param api - Authenticated Axios instance.
     */
    syncUser: (api:AxiosInstance) => api.post("/users/sync"),

    /**
     * Fetches the currently authenticated user's data.
     *
     * @param api - Authenticated Axios instance.
     */
    getCurrentUser: (api: AxiosInstance) => api.get("/users/me"),

    /**
     * Updates the authenticated user's profile.
     *
     * @param api  - Authenticated Axios instance.
     * @param data - Fields to update on the user profile.
     */
    updateProfile: (api: AxiosInstance, data: any) => api.put("/users/profile", data),


}