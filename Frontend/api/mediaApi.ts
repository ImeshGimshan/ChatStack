import axios from "axios";

const getBaseURL = () => {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        return "/api/media"; // proxied via next.config.ts rewrites → NEXT_PUBLIC_MEDIA_API
    }
    return process.env.NEXT_PUBLIC_MEDIA_API || "http://localhost:3004";
};

const mediaApi = axios.create({
    baseURL: getBaseURL(),
});

mediaApi.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("authToken");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

mediaApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== "undefined") {
                localStorage.removeItem("authToken");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default mediaApi;
