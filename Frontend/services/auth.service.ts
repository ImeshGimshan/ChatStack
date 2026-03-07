import authApi from "@/api/authApi";
import { LoginCredentials, LoginResponse, RegisterCredentials, RegisterResponse, VerifyEmailResponse } from "@/lib/types";
import axios from "axios";
import Cookies from "js-cookie";

const saveToken = (token: string): void => {
    localStorage.setItem('authToken', token);
    Cookies.set('token', token, { expires: 7 }); // needed for Socket.IO auth hook
}

const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
}

const removeToken = (): void => {
    localStorage.removeItem('authToken');
}

const isTokenExpired = (token: string): boolean => {
    try {
        const parts = token.split('.');
        if(parts.length !== 3) return true;

        const payload = JSON.parse(atob(parts[1]));

        const expiryTime = payload.exp * 1000;

        return Date.now() >= expiryTime;
    } catch (error) {
        return true;
    }
};

export const authService = {
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        try {
            const response = await authApi.post<LoginResponse>(
                '/api/auth/login',
                credentials
            );

            const {token, id, username, email} = response.data;
            if(!token || !id || !username || !email){
                throw new Error('Invalid login response');
            }
            saveToken(token);
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            
            if (axios.isAxiosError(error) && error.response){
                const errorData = error.response.data;
                // Backend sends { "Error": "message" } with capital E
                const message = errorData?.Error || errorData?.error || errorData?.message || 'Login failed';
                throw new Error(message);
            }
            throw new Error('Login failed');
        }
    },

    logout(): void {
        removeToken();
        Cookies.remove('token');
        authApi.post('/api/auth/logout').catch(() => {});
        window.location.href = '/login';
    },

    getToken(): string | null {
        const token = getToken();
        if (token && !isTokenExpired(token)) {
            return token;
        }
        return null;
    },

    isAuthenticated(): boolean {
        const token = getToken();
        if (!token) return false;
        return !isTokenExpired(token);
    },

    async register(credentials: {
        username: string;
        email: string;
        password: string;
    }) : Promise<RegisterResponse> {
        try {
            console.log('Sending registration request:', { 
                username: credentials.username, 
                email: credentials.email,
                passwordLength: credentials.password.length 
            });
            
            const response = await authApi.post<RegisterResponse>(
                "/api/auth/register",
                credentials
            );
            const { id, username, email} = response.data;
            if (!id || !username || !email) {
                throw new Error("Invalid register response");
            }
            return response.data;
        } catch (error) {
            console.error('Register error:', error);
            
            if (axios.isAxiosError(error) && error.response){
                const status = error.response.status;
                const errorData = error.response.data;
                
                // Log the full error response for debugging
                console.error('Backend error status:', status);
                console.error('Backend error data:', errorData);
                console.error('Error data type:', typeof errorData);
                
                // Check if error data is a string
                if (typeof errorData === 'string' && errorData.trim()) {
                    throw new Error(errorData);
                }
                
                // Backend sends { "Error": "message" } with capital E
                let message = errorData?.Error || errorData?.error || errorData?.message || errorData?.detail;
                
                // If no message, provide user-friendly messages based on status code
                if (!message) {
                    switch (status) {
                        case 409:
                            message = 'This email or username is already registered. Please use a different one or try logging in.';
                            break;
                        case 400:
                            message = 'Invalid registration data. Please check your input.';
                            break;
                        case 500:
                            message = 'Server error. Please try again later.';
                            break;
                        default:
                            message = `Registration failed (Status: ${status})`;
                    }
                }
                
                console.error('Final error message:', message);
                throw new Error(message);
            }
            throw new Error('Registration failed. Please check your connection and try again.');
        }
    },

    async verifyEmail(email: string, verificationCode: string): Promise<VerifyEmailResponse> {
        try {
            const response = await authApi.post<VerifyEmailResponse>(
                '/api/auth/verify',
                {
                    email,
                    code: verificationCode // Backend expects 'code' field
                }
            );
            const { message } = response.data;
            if (!message) {
                throw new Error('Invalid verify email response');
            }
            return response.data;
        } catch (error) {
            console.error('Verify email error:', error);
            
            if (axios.isAxiosError(error) && error.response) {
                const errorData = error.response.data;
                // Backend sends { "Error": "message" } with capital E
                const message = errorData?.Error || errorData?.error || errorData?.message || 'Email verification failed';
                throw new Error(message);
            }
            throw new Error('Email verification failed');
        }
    },

    async getCurrentUser(): Promise<any> {
        try {
            const response = await authApi.get('/api/auth/me');
            return response.data;
        } catch (error) {
            console.error('Get current user error:', error);
            throw error;
        }
    },
};