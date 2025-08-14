import { User } from '../../entities/User';
import { IUserRepository } from '../../repositories/IUserRepository';

export class GetUserByIdUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<User | null> {
    // Validar que el userId no esté vacío
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    // Validar formato UUID (opcional, pero recomendado)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new Error('Invalid User ID format');
    }

    try {
      const user = await this.userRepository.findById(userId);
      return user;
    } catch (error) {
      console.error('GetUserByIdUseCase - Error:', error);
      throw new Error('Error retrieving user: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
}
