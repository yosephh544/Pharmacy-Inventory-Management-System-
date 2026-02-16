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
    }
};
