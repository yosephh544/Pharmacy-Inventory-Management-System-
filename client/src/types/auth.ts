export interface LoginRequestDto {
    username: string; // The API expects "username", but we might map email to it
    password: string;
}

export interface AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
}
