import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../entities/User';
import { RefreshJwtPayload, RefreshTokenDto, RefreshTokenResponse } from '../../interfaces/auth.interface';
import { IUserRepository } from '../../repositories/IUserRepository';
import { IUserSessionRepository } from '../../repositories/IUserSessionRepository';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userSessionRepository: IUserSessionRepository,
  ) {}

  async execute(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    const { refreshToken, ipAddress, userAgent } = refreshTokenDto;

    // Verificar el refresh token
    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as RefreshJwtPayload;
    } catch (error) {
      console.error('Error verifying refresh token:', error);
      throw new Error('Invalid refresh token');
    }

    // Buscar la sesión activa
    const session = await this.userSessionRepository.findByRefreshToken(refreshToken);
    if (!session?.isValidForRefresh()) {
      throw new Error('Session is not valid for refresh');
    }

    // Verificar que el usuario existe y esta activo
    const user = await this.userRepository.findById(session.userId);
    if (!user?.isActive) {
      throw new Error('User not found or inactive');
    }

    // Verificar  IP y User Agent
    if (session.ipAddress !== ipAddress || session.userAgent !== userAgent) {
      // Log security event
      console.warn(`Suspicious refresh attempt for user ${user.id}`);
    }

    // Generar nuevos tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken();

    // Actualizar la sesión
    session.updateRefreshToken(newRefreshToken);
    session.extendSession(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 días
    await this.userSessionRepository.save(session);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  private generateAccessToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      type: 'access',
    };

    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: '1h', // 1 hora
      issuer: 'notapp',
      audience: 'notapp-users',
    });
  }

  private generateRefreshToken(): string {
    return jwt.sign({ type: 'refresh', tokenId: uuidv4() }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
  }
}
