export interface CreatePasswordResetTokenDto {
  email: string;
  expiresInMinutes?: number;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface PasswordResetTokenResponseDto {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  isValid: boolean;
}

export interface PasswordResetTokenFilters {
  userId?: string;
  isUsed?: boolean;
  isValid?: boolean;
}