import userApi from "@/api/userApi";

export interface DeveloperProfile {
    userId: number;
    username: string;
    email: string;
    bio: string;
    avatarUrl: string | null;
    headline: string;
    skills: string[];
    openToCollaboration: boolean;
    githubUsername: string;
    experience: Experience[];
    education: Education[];
    address: Address;
    socialLinks: SocialLinks;
    createdAt: string;
    updatedAt: string;
}

export interface Experience {
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface Education {
    insitution: string;
    degree: string;
    fieldOfStudy: string;
    startYear: string;
    endYear: string;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
}

export interface SocialLinks {
    linkedin: string;
    github: string;
    twitter: string;
    website: string;
}

export interface ProfileCard {
    userId: number;
    username: string;
    headline: string;
    avatarUrl: string | null;
    skills: string[];
    openToCollaboration: boolean;
}

export interface DiscoverResponse {
    profiles: ProfileCard[];
    total: number;
    page: number;
    pages: number;
}

export type ProfileUpdatePayload = Partial<
    Pick<DeveloperProfile, "bio" | "avatarUrl" | "headline" | "skills" | "openToCollaboration" | "githubUsername" | "experience" | "education" | "address" | "socialLinks">
>;

export const userService = {
    getMyProfile: async (): Promise<DeveloperProfile> => {
        const { data } = await userApi.get("/api/profile/me");
        return data;
    },

    updateMyProfile: async (payload: ProfileUpdatePayload): Promise<DeveloperProfile> => {
        const { data } = await userApi.put("/api/profile/me", payload);
        return data.profile ?? data;
    },

    getProfileByUserId: async (userId: number): Promise<DeveloperProfile> => {
        const { data } = await userApi.get(`/api/profile/${userId}`);
        return data;
    },

    searchUsers: async (username: string): Promise<ProfileCard[]> => {
        const { data } = await userApi.get(`/api/profile/search`, { params: { username } });
        return data;
    },

    discoverProfiles: async (page = 1, limit = 20): Promise<DiscoverResponse> => {
        const { data } = await userApi.get(`/api/profile/discover`, { params: { page, limit } });
        return data;
    },
};
