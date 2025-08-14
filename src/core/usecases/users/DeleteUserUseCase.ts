import { IUserRepository } from '../../repositories/IUserRepository';

export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<void> {
    // Validación de entrada más estricta
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Valid User ID is required');
    }

    const normalizedUserId = userId.trim();

    const userExists = await this.userRepository.findById(normalizedUserId);
    if (!userExists) {
      throw new Error('User not found');
    }

    await this.userRepository.delete(normalizedUserId);
  }
}
