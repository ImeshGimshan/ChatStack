// login , register, logout functions using axios

import authApi from "@/api/authApi";
import Cookies from "js-cookie";
import { Cookie } from "lucide-react";

export const authService = {
    async login(credentials: { username: string; password: string}) {
        const response = await authApi.post('/api/auth/login', credentials);
        const data = response.data;
        console.log('Login response data:', data);

        if (typeof data === 'string') {
            Cookies.set('token', data, { expires: 1, secure: false, sameSite: 'Lax' });
            const user = {id: 'unknown', username: credentials.username, email: '', token: data};
            Cookies.set('user' , JSON.stringify(user), { expires: 1 });
            return {user};
        }
        
        if (data && data.token) {
            Cookies.set('token', data.token, { expires: 1, secure: false, sameSite: 'Lax' });
            const user = {
                id: data.id || '0',
                username: data.username || 'User',
                email: data.email || '',
                token: data.token
            };
            Cookies.set('user' , JSON.stringify(user), { expires: 1 });
            return {user};
        }
        throw new Error('Invalid login response');
    },

    logout() {
        Cookies.remove('token');
        Cookies.remove('user');
        window.location.href = '/login';
    },

    getToken() {
        return Cookies.get('token');
    }
};