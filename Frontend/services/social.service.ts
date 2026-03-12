import socialApi from "@/api/socialApi";

export interface Connection {
    id: number;
    requesterId: number;
    addresseeId: number;
    status: ConnectionStatus;
    message: string | null;
    createdAt: string;
    updatedAt: string;
}

export type ConnectionStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN" | "BLOCKED" | "NONE";

export interface ConnectionStatusResponse {
    status: ConnectionStatus;
}

export interface ConnectionCountResponse {
    userId: number;
    connectionCount: number;
}

export interface MutualConnectionsResponse {
    mutualConnections: number[];
    count: number;
}

export interface Suggestion {
    userId: number;
    mutualConnections: number;
}

export const socialService = {
    sendRequest: async (addresseeId: number, message?: string): Promise<Connection> => {
        const { data } = await socialApi.post(`/api/connection/request/${addresseeId}`, { message });
        return data;
    },

    acceptRequest: async (connectionId: number): Promise<Connection> => {
        const { data } = await socialApi.patch(`/api/connection/${connectionId}/accept`);
        return data;
    },

    rejectRequest: async (connectionId: number): Promise<Connection> => {
        const { data } = await socialApi.patch(`/api/connection/${connectionId}/reject`);
        return data;
    },

    withdrawRequest: async (connectionId: number): Promise<Connection> => {
        const { data } = await socialApi.delete(`/api/connection/${connectionId}/withdraw`);
        return data;
    },

    removeConnection: async (connectionId: number): Promise<{ message: string }> => {
        const { data } = await socialApi.delete(`/api/connection/${connectionId}/remove`);
        return data;
    },

    blockUser: async (targetUserId: number): Promise<Connection> => {
        const { data } = await socialApi.post(`/api/connection/block/${targetUserId}`);
        return data;
    },

    unblockUser: async (targetUserId: number): Promise<{ message: string }> => {
        const { data } = await socialApi.delete(`/api/connection/unblock/${targetUserId}`);
        return data;
    },

    getMyConnections: async (): Promise<Connection[]> => {
        const { data } = await socialApi.get("/api/connection/me");
        return data;
    },

    getPendingRequests: async (): Promise<Connection[]> => {
        const { data } = await socialApi.get("/api/connection/pending");
        return data;
    },

    getSentRequests: async (): Promise<Connection[]> => {
        const { data } = await socialApi.get("/api/connection/sent");
        return data;
    },

    getSuggestions: async (): Promise<Suggestion[]> => {
        const { data } = await socialApi.get("/api/connection/suggestions");
        return data;
    },

    getStatus: async (targetUserId: number): Promise<ConnectionStatusResponse> => {
        const { data } = await socialApi.get(`/api/connection/status/${targetUserId}`);
        return data;
    },

    getConnectionCount: async (userId: number): Promise<ConnectionCountResponse> => {
        const { data } = await socialApi.get(`/api/connection/count/${userId}`);
        return data;
    },

    getMutualConnections: async (targetUserId: number): Promise<MutualConnectionsResponse> => {
        const { data } = await socialApi.get(`/api/connection/mutual/${targetUserId}`);
        return data;
    },

    getUserConnections: async (userId: number): Promise<Connection[]> => {
        const { data } = await socialApi.get(`/api/connection/user/${userId}`);
        return data;
    },
};
