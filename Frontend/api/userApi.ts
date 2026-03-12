import axios from "axios";

const getBaseURL = () => {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        return "/api/user";
    }
    return process.env.NEXT_PUBLIC_USER_API || "http://localhost:5010";
};

const userApi = axios.create({
    baseURL: getBaseURL(),
});

userApi.interceptors.request.use(
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

userApi.interceptors.response.use(
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

export default userApi;