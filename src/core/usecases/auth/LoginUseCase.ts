import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../entities/User';
import { UserSession } from '../../entities/UserSession';
import { LoginDto, LoginResponseDto } from '../../interfaces/auth.interface';
import { IUserRepository } from '../../repositories/IUserRepository';
import { IUserSessionRepository } from '../../repositories/IUserSessionRepository';

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userSessionRepository: IUserSessionRepository,
  ) {}

  async execute(loginDto: LoginDto): Promise<LoginResponseDto> {
    this.validateLoginDto(loginDto);

    const { email, password, ipAddress, userAgent } = loginDto;

    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(email.toLocaleLowerCase().trim());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verificar que la cuenta esté activa
    if (!user.isActive) {
      throw new Error('User account is not active');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Verificar email
    if (!user.emailVerified) {
      throw new Error('Please verify your email before logging in');
    }

    // Generar tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();

    // Crear sesion
    const session = new UserSession(
      uuidv4(),
      user.id,
      refreshToken,
      ipAddress,
      userAgent,
      new Date(),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      true,
    );

    await this.userSessionRepository.create(session);

    return {
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
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
      expiresIn: '1h', // Token de 1 hora
      issuer: 'notapp',
      audience: 'notapp-users',
    });
  }

  private generateRefreshToken(): string {
    return jwt.sign({ type: 'refresh', tokenId: uuidv4() }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
  }

  private validateLoginDto(dto: LoginDto): void {
    if (!dto.email?.includes('@')) {
      throw new Error('Valid email is required');
    }
    if (!dto.password || dto.password.length < 6) {
      throw new Error('Password is required');
    }
  }
}
