import api from './api';
import type { LoginRequestDto, AuthResponseDto } from '../types/auth'; // We need to define these types

export const authService = {
    login: async (data: LoginRequestDto): Promise<AuthResponseDto> => {
        const response = await api.post<AuthResponseDto>('/auth/login', data);
        if (response.data.accessToken) {
            localStorage.setItem('token', response.data.accessToken);
            // Store other details if needed, e.g., refreshToken, user info
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        // window.location.href = '/login'; // Optional: Redirect to login
    },

    getCurrentUser: () => {
        // Decode token or get user from local storage if stored
        return localStorage.getItem('token');
    },

    getUserProfile: () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

            // Add padding if missing
            while (base64.length % 4) {
                base64 += '=';
            }

            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            console.log('Decoded JWT Payload:', payload);

            // Helper to get claim by multiple possible keys
            const getClaim = (keys: string[]) => {
                for (const key of keys) {
                    if (payload[key] !== undefined && payload[key] !== null) return payload[key];
                }
                return null;
            };

            // Even more robust role extraction: check ALL keys for anything containing 'role'
            const roles: string[] = [];
            for (const key in payload) {
                if (key.toLowerCase().includes('role')) {
                    const val = payload[key];
                    if (Array.isArray(val)) {
                        roles.push(...val.map(v => String(v)));
                    } else if (val) {
                        roles.push(String(val));
                    }
                }
            }

            return {
                id: getClaim([
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
                    "id",
                    "sub",
                    "nameid",
                    "UserId"
                ]),
                username: getClaim([
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
                    "unique_name",
                    "username",
                    "name"
                ]),
                fullName: payload["fullName"] || payload["FullName"] || getClaim(["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "name"]) || "",
                roles: Array.isArray(roles) ? roles : roles ? [roles] : []
            };
        } catch (e) {
            console.error('Failed to decode token', e);
            return null;
        }
    },

    hasRole: (role: string) => {
        const profile = authService.getUserProfile();
        if (!profile || !profile.roles) return false;
        const matches = profile.roles.some((r: any) =>
            typeof r === 'string' && r.toLowerCase() === role.toLowerCase()
        );
        console.log(`Role Check: [${role}] -> ${matches}`, profile?.roles);
        return matches;
    }
};
