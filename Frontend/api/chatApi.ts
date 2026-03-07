import axios from "axios";

// When running locally, use the Next.js proxy rewrite to avoid CORS.
// In production (same origin as backend), use the direct env var.
const getBaseURL = () => {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        return "/api/chat"; // proxied via next.config.ts rewrites → NEXT_PUBLIC_CHAT_API
    }
    return process.env.NEXT_PUBLIC_CHAT_API || "http://localhost:3333";
};

const chatApi = axios.create({
    baseURL: getBaseURL(),
    headers: {
        "Content-Type": "application/json",
    },
});

chatApi.interceptors.request.use(
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

chatApi.interceptors.response.use(
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

export default chatApi;
