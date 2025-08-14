export interface CreateUserDto {
  fullname: string;
  email: string;
  password: string;
  role: 'buyer' | 'seller' | 'both' | 'admin';
}

export interface CreateUserSessionDto {
  userId: string;
  refreshToken: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
}

export interface UpdateUserSessionDto {
  refreshToken?: string;
  expiresAt?: Date;
}

export interface UserSessionResponseDto {
  id: string;
  userId: string;
  refreshToken?: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface UserSessionFilters {
  userId?: string;
  isActive?: boolean;
  ipAddress?: string;
}
