import { v4 as uuidv4 } from 'uuid';
import { UserSession } from '../../entities/UserSession';
import { CreateUserSessionDto } from '../../interfaces/user.interface';
import { IUserRepository } from '../../repositories/IUserRepository';
import { IUserSessionRepository } from '../../repositories/IUserSessionRepository';

export class CreateUserSessionUseCase {
  constructor(
    private readonly userSessionRepository: IUserSessionRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(createSessionDto: CreateUserSessionDto): Promise<UserSession> {
    this.validateCreateSessionDto(createSessionDto);

    const { userId, refreshToken, ipAddress, userAgent, expiresAt } = createSessionDto;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('Cannot create session for inactive user');
    }

    const newSession = new UserSession(uuidv4(), userId, refreshToken, ipAddress, userAgent, new Date(), expiresAt);

    return await this.userSessionRepository.create(newSession);
  }

  private validateCreateSessionDto(dto: CreateUserSessionDto): void {
    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!dto.refreshToken || dto.refreshToken.trim().length === 0) {
      throw new Error('Refresh token is required');
    }

    if (!dto.ipAddress || dto.ipAddress.trim().length === 0) {
      throw new Error('IP address is required');
    }

    if (!dto.userAgent || dto.userAgent.trim().length === 0) {
      throw new Error('User agent is required');
    }

    if (!dto.expiresAt || dto.expiresAt <= new Date()) {
      throw new Error('Valid expiration date is required');
    }
  }
}
