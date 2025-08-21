import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Routine } from '../../src/core/entities/Routine';
import { RoutineTask } from '../../src/core/entities/RoutineTask';
import { CreateRoutineTaskDto, RoutineTaskStatus } from '../../src/core/interfaces/routine.interface';
import { IRoutineRepository } from '../../src/core/repositories/IRoutineRepository';
import { IRoutineTaskRepository } from '../../src/core/repositories/IRoutineTaskRepository';
import { CreateRoutineTaskUseCase } from '../../src/core/usecases/routine_tasks/CreateRoutineTaskUseCase';

describe('CreateRoutineTaskUseCase', () => {
  let createRoutineTaskUseCase: CreateRoutineTaskUseCase;
  let mockRoutineTaskRepository: IRoutineTaskRepository;
  let mockRoutineRepository: IRoutineRepository;

  beforeEach(() => {
    mockRoutineTaskRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByRoutineId: vi.fn(),
      findByUserAndDate: vi.fn(),
      findByFilters: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      existsById: vi.fn(),
      existsByRoutineAndDate: vi.fn(),
    };

    mockRoutineRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByFilters: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      existsById: vi.fn(),
    };

    createRoutineTaskUseCase = new CreateRoutineTaskUseCase(mockRoutineTaskRepository, mockRoutineRepository);
  });

  it('should create routine task when valid DTO is provided', async () => {
    // Arrange
    const createRoutineTaskDto: CreateRoutineTaskDto = {
      routineId: 'test-routine-id',
      userId: 'test-user-id',
      dateLocal: '2025-08-14',
      timeLocal: '06:00:00',
      durationMin: 60,
    };

    const mockRoutine = new Routine('test-routine-id', 'test-user-id', 'Morning Workout', undefined, [1, 2, 3, 4, 5], true, new Date());

    const expectedRoutineTask = new RoutineTask(
      'test-task-id',
      createRoutineTaskDto.routineId,
      createRoutineTaskDto.userId,
      createRoutineTaskDto.dateLocal,
      createRoutineTaskDto.timeLocal,
      createRoutineTaskDto.durationMin,
      RoutineTaskStatus.PENDING,
      undefined,
      undefined,
      undefined,
      new Date(),
      new Date(),
    );

    vi.mocked(mockRoutineRepository.findById).mockResolvedValue(mockRoutine);
    vi.mocked(mockRoutineTaskRepository.existsByRoutineAndDate).mockResolvedValue(false);
    vi.mocked(mockRoutineTaskRepository.save).mockResolvedValue(expectedRoutineTask);

    // Act
    const result = await createRoutineTaskUseCase.execute(createRoutineTaskDto);

    // Assert
    expect(result).toEqual(expectedRoutineTask);
    expect(mockRoutineRepository.findById).toHaveBeenCalledWith(createRoutineTaskDto.routineId);
    expect(mockRoutineTaskRepository.existsByRoutineAndDate).toHaveBeenCalledWith(createRoutineTaskDto.routineId, createRoutineTaskDto.dateLocal);
    expect(mockRoutineTaskRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw error when routine does not exist', async () => {
    // Arrange
    const createRoutineTaskDto: CreateRoutineTaskDto = {
      routineId: 'non-existent-routine-id',
      userId: 'test-user-id',
      dateLocal: '2025-08-14',
    };

    vi.mocked(mockRoutineRepository.findById).mockResolvedValue(null);

    // Act & Assert
    await expect(createRoutineTaskUseCase.execute(createRoutineTaskDto)).rejects.toThrow('Routine not found');
  });

  it('should throw error when routine does not belong to user', async () => {
    // Arrange
    const createRoutineTaskDto: CreateRoutineTaskDto = {
      routineId: 'test-routine-id',
      userId: 'different-user-id',
      dateLocal: '2025-08-14',
    };

    const mockRoutine = new Routine('test-routine-id', 'original-user-id', 'Morning Workout', undefined, [1, 2, 3, 4, 5], true, new Date());

    vi.mocked(mockRoutineRepository.findById).mockResolvedValue(mockRoutine);

    // Act & Assert
    await expect(createRoutineTaskUseCase.execute(createRoutineTaskDto)).rejects.toThrow('Routine does not belong to the specified user');
  });

  it('should throw error when task already exists for routine and date', async () => {
    // Arrange
    const createRoutineTaskDto: CreateRoutineTaskDto = {
      routineId: 'test-routine-id',
      userId: 'test-user-id',
      dateLocal: '2025-08-14',
    };

    const mockRoutine = new Routine('test-routine-id', 'test-user-id', 'Morning Workout', undefined, [1, 2, 3, 4, 5], true, new Date());

    vi.mocked(mockRoutineRepository.findById).mockResolvedValue(mockRoutine);
    vi.mocked(mockRoutineTaskRepository.existsByRoutineAndDate).mockResolvedValue(true);

    // Act & Assert
    await expect(createRoutineTaskUseCase.execute(createRoutineTaskDto)).rejects.toThrow('A task already exists for this routine and date');
  });

  it('should throw error when routineId is empty', async () => {
    // Arrange
    const createRoutineTaskDto: CreateRoutineTaskDto = {
      routineId: '',
      userId: 'test-user-id',
      dateLocal: '2025-08-14',
    };

    // Act & Assert
    await expect(createRoutineTaskUseCase.execute(createRoutineTaskDto)).rejects.toThrow('Routine ID is required');
  });

  it('should throw error when userId is empty', async () => {
    // Arrange
    const createRoutineTaskDto: CreateRoutineTaskDto = {
      routineId: 'test-routine-id',
      userId: '',
      dateLocal: '2025-08-14',
    };

    // Act & Assert
    await expect(createRoutineTaskUseCase.execute(createRoutineTaskDto)).rejects.toThrow('User ID is required');
  });

  it('should throw error when date format is invalid', async () => {
    // Arrange
    const createRoutineTaskDto: CreateRoutineTaskDto = {
      routineId: 'test-routine-id',
      userId: 'test-user-id',
      dateLocal: '2025/08/14', // Invalid format
    };

    // Act & Assert
    await expect(createRoutineTaskUseCase.execute(createRoutineTaskDto)).rejects.toThrow('Valid date is required. Use YYYY-MM-DD format');
  });

  it('should throw error when time format is invalid', async () => {
    // Arrange
    const createRoutineTaskDto: CreateRoutineTaskDto = {
      routineId: 'test-routine-id',
      userId: 'test-user-id',
      dateLocal: '2025-08-14',
      timeLocal: '25:00:00', // Invalid hour
    };

    // Act & Assert
    await expect(createRoutineTaskUseCase.execute(createRoutineTaskDto)).rejects.toThrow('Invalid time format. Use HH:MM:SS format');
  });

  it('should throw error when duration is out of range', async () => {
    // Arrange
    const createRoutineTaskDto: CreateRoutineTaskDto = {
      routineId: 'test-routine-id',
      userId: 'test-user-id',
      dateLocal: '2025-08-14',
      durationMin: 1500, // More than 1440 minutes
    };

    // Act & Assert
    await expect(createRoutineTaskUseCase.execute(createRoutineTaskDto)).rejects.toThrow('Duration must be between 1 and 1440 minutes');
  });
});
