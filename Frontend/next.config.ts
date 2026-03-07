import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                pathname: "/**",
            },
        ],
    },
    async rewrites() {
        return [
            // Proxy chat-service REST calls to avoid browser CORS in dev
            {
                source: "/api/chat/:path*",
                destination: `${process.env.NEXT_PUBLIC_CHAT_API || "http://localhost:3333"}/:path*`,
            },
            // Proxy media-service calls to avoid browser CORS in dev
            {
                source: "/api/media/:path*",
                destination: `${process.env.NEXT_PUBLIC_MEDIA_API || "http://localhost:3004"}/:path*`,
            },
        ];
    },
};

export default nextConfig;
