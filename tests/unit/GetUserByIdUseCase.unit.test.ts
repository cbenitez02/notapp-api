import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '../../src/core/entities/User';
import { IUserRepository } from '../../src/core/repositories/IUserRepository';
import { GetUserByIdUseCase } from '../../src/core/usecases/users/GetUserByIdUseCase';

describe('GetUserByIdUseCase', () => {
  let getUserByIdUseCase: GetUserByIdUseCase;
  let mockUserRepository: IUserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    };
    getUserByIdUseCase = new GetUserByIdUseCase(mockUserRepository);
  });

  it('should return user when valid ID is provided', async () => {
    // Arrange
    const userId = 'test-user-id';
    const expectedUser = new User(userId, 'John Doe', 'john@example.com', 'hashedPassword', 'buyer', false, true, new Date(), new Date());

    vi.mocked(mockUserRepository.findById).mockResolvedValue(expectedUser);

    // Act
    const result = await getUserByIdUseCase.execute(userId);

    // Assert
    expect(result).toEqual(expectedUser);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
  });

  it('should return null when user is not found', async () => {
    // Arrange
    const userId = 'non-existent-user-id';
    vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

    // Act
    const result = await getUserByIdUseCase.execute(userId);

    // Assert
    expect(result).toBeNull();
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
  });

  it('should throw error when userId is empty', async () => {
    // Act & Assert
    await expect(getUserByIdUseCase.execute('')).rejects.toThrow('User ID is required');
    expect(mockUserRepository.findById).not.toHaveBeenCalled();
  });

  it('should throw error when userId is null or undefined', async () => {
    // Act & Assert
    await expect(getUserByIdUseCase.execute(null as any)).rejects.toThrow('User ID is required');
    await expect(getUserByIdUseCase.execute(undefined as any)).rejects.toThrow('User ID is required');
    expect(mockUserRepository.findById).not.toHaveBeenCalled();
  });

  it('should handle repository errors gracefully', async () => {
    // Arrange
    const userId = 'test-user-id';
    const repositoryError = new Error('Database connection failed');
    vi.mocked(mockUserRepository.findById).mockRejectedValue(repositoryError);

    // Act & Assert
    await expect(getUserByIdUseCase.execute(userId)).rejects.toThrow('Error retrieving user: Database connection failed');
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
  });
});
