import axios from "axios";

const getBaseURL = () => {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        return "/api/social";
    }
    return process.env.NEXT_PUBLIC_SOCIAL_API || "http://localhost:3334";
}

const socialApi = axios.create({
    baseURL: getBaseURL(),
});

socialApi.interceptors.request.use(
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

socialApi.interceptors.response.use(
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

export default socialApi;