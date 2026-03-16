import { useAuth, useClerk } from "@clerk/expo";
import axios, { AxiosInstance, formToJSON} from "axios";


const APi_BASE_URl = "https://healthy-life-sable.vercel.app/api"

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


export const useApiClient = (): AxiosInstance => {
    const {getToken}= useAuth();
    return createApiClient(getToken);
};

export const userApi = {
    syncUser: (api:AxiosInstance) => api.post("/users/sync"),
    getCurrentUser: (api: AxiosInstance) => api.get("/users/me"),
    updateProfile: (api: AxiosInstance, data: any) => api.put("/users/profile", data),
    

}