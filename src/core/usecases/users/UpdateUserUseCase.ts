import { User } from '../../entities/User';
import { IUserRepository } from '../../repositories/IUserRepository';

export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, updateData: Partial<User>): Promise<User> {
    // Validate inputs
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Valid User ID is required');
    }
    const normalizedUserId = userId.trim();

    if (!updateData || typeof updateData !== 'object') {
      throw new Error('Update data must be a valid object');
    }

    // Check if user exists
    const userExists = await this.userRepository.findById(normalizedUserId);
    if (!userExists) {
      throw new Error('User not found');
    }

    // Validate email if provided
    if (updateData.email && updateData.email !== userExists.email) {
      const userWithEmail = await this.userRepository.findByEmail(updateData.email);
      if (userWithEmail) {
        throw new Error('User already exists with this email');
      }
    }

    // Filter out undefined properties
    const filteredUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, value]) => value !== undefined));

    // Update user
    const updatedUser = await this.userRepository.update(normalizedUserId, filteredUpdateData);
    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    return updatedUser;
  }
}
