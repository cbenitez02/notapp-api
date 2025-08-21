import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Routine } from '../../src/core/entities/Routine';
import { CreateRoutineDto } from '../../src/core/interfaces/routine.interface';
import { IRoutineRepository } from '../../src/core/repositories/IRoutineRepository';
import { CreateRoutineUseCase } from '../../src/core/usecases/routines/CreateRoutineUseCase';

describe('CreateRoutineUseCase', () => {
  let createRoutineUseCase: CreateRoutineUseCase;
  let mockRoutineRepository: IRoutineRepository;

  beforeEach(() => {
    mockRoutineRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByFilters: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      existsById: vi.fn(),
    };
    createRoutineUseCase = new CreateRoutineUseCase(mockRoutineRepository);
  });

  it('should create routine when valid DTO is provided', async () => {
    // Arrange
    const createRoutineDto: CreateRoutineDto = {
      userId: 'test-user-id',
      title: 'Morning Workout',
      defaultTimeLocal: '06:00:00',
      repeatDaysJson: [1, 2, 3, 4, 5], // Monday to Friday
      active: true,
    };

    const expectedRoutine = new Routine(
      'test-routine-id',
      createRoutineDto.userId,
      createRoutineDto.title,
      createRoutineDto.defaultTimeLocal,
      createRoutineDto.repeatDaysJson,
      createRoutineDto.active,
      new Date(),
    );

    vi.mocked(mockRoutineRepository.save).mockResolvedValue(expectedRoutine);

    // Act
    const result = await createRoutineUseCase.execute(createRoutineDto);

    // Assert
    expect(result).toEqual(expectedRoutine);
    expect(mockRoutineRepository.save).toHaveBeenCalledTimes(1);
    expect(mockRoutineRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: createRoutineDto.userId,
        title: createRoutineDto.title,
        defaultTimeLocal: createRoutineDto.defaultTimeLocal,
        repeatDaysJson: createRoutineDto.repeatDaysJson,
        active: createRoutineDto.active,
      }),
    );
  });

  it('should throw error when userId is empty', async () => {
    // Arrange
    const createRoutineDto: CreateRoutineDto = {
      userId: '',
      title: 'Morning Workout',
      repeatDaysJson: [1, 2, 3, 4, 5],
    };

    // Act & Assert
    await expect(createRoutineUseCase.execute(createRoutineDto)).rejects.toThrow('User ID is required');
  });

  it('should throw error when title is too short', async () => {
    // Arrange
    const createRoutineDto: CreateRoutineDto = {
      userId: 'test-user-id',
      title: 'A',
      repeatDaysJson: [1, 2, 3, 4, 5],
    };

    // Act & Assert
    await expect(createRoutineUseCase.execute(createRoutineDto)).rejects.toThrow('Title is required and must be at least 2 characters');
  });

  it('should throw error when repeatDaysJson is empty', async () => {
    // Arrange
    const createRoutineDto: CreateRoutineDto = {
      userId: 'test-user-id',
      title: 'Morning Workout',
      repeatDaysJson: [],
    };

    // Act & Assert
    await expect(createRoutineUseCase.execute(createRoutineDto)).rejects.toThrow('Repeat days must be provided');
  });

  it('should throw error when repeatDaysJson contains invalid day', async () => {
    // Arrange
    const createRoutineDto: CreateRoutineDto = {
      userId: 'test-user-id',
      title: 'Morning Workout',
      repeatDaysJson: [1, 8, 3], // 8 is invalid (should be 1-7)
    };

    // Act & Assert
    await expect(createRoutineUseCase.execute(createRoutineDto)).rejects.toThrow('Repeat days must be integers between 1 (Monday) and 7 (Sunday)');
  });

  it('should throw error when time format is invalid', async () => {
    // Arrange
    const createRoutineDto: CreateRoutineDto = {
      userId: 'test-user-id',
      title: 'Morning Workout',
      defaultTimeLocal: '25:00:00', // Invalid hour
      repeatDaysJson: [1, 2, 3, 4, 5],
    };

    // Act & Assert
    await expect(createRoutineUseCase.execute(createRoutineDto)).rejects.toThrow('Invalid default time format. Use HH:MM:SS format');
  });
});
