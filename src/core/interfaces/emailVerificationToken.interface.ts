export interface CreateEmailVerificationTokenDto {
  userId: string;
  expiresInMinutes?: number; // Default: 24 hours
}

export interface VerifyEmailTokenDto {
  token: string;
}

export interface EmailVerificationTokenResponseDto {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  isValid: boolean;
}

export interface EmailVerificationTokenFilters {
  userId?: string;
  isUsed?: boolean;
  isExpired?: boolean;
}
