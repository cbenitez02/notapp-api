import { Request } from 'express';

export interface LoginDto {
  email: string;
  password: string;
  ipAddress: string;
  userAgent: string;
}

export interface LoginResponseDto {
  user: {
    id: string;
    fullname: string;
    email: string;
    role: 'buyer' | 'seller' | 'both' | 'admin';
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
  ipAddress: string;
  userAgent: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  emailVerified: boolean;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface RefreshJwtPayload {
  type: 'refresh';
  tokenId: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    emailVerified: boolean;
  };
}
