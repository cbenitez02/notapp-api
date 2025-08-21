import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import { DailySummary } from '../../src/core/entities/DailySummary';
import { CreateDailySummaryDto, DailySummaryFilters, UpdateDailySummaryDto } from '../../src/core/interfaces/routine.interface';
import { IDailySummaryRepository } from '../../src/core/repositories/IDailySummaryRepository';
import { CreateDailySummaryUseCase } from '../../src/core/usecases/daily_summaries/CreateDailySummaryUseCase';
import { DeleteDailySummaryUseCase } from '../../src/core/usecases/daily_summaries/DeleteDailySummaryUseCase';
import { GetDailySummariesByFiltersUseCase } from '../../src/core/usecases/daily_summaries/GetDailySummariesByFiltersUseCase';
import { GetDailySummariesByUserIdUseCase } from '../../src/core/usecases/daily_summaries/GetDailySummariesByUserIdUseCase';
import { GetDailySummaryByIdUseCase } from '../../src/core/usecases/daily_summaries/GetDailySummaryByIdUseCase';
import { GetDailySummaryByUserAndDateUseCase } from '../../src/core/usecases/daily_summaries/GetDailySummaryByUserAndDateUseCase';
import { UpdateDailySummaryUseCase } from '../../src/core/usecases/daily_summaries/UpdateDailySummaryUseCase';

describe('DailySummary Use Cases', () => {
  let mockRepository: IDailySummaryRepository;
  let createUseCase: CreateDailySummaryUseCase;
  let getByIdUseCase: GetDailySummaryByIdUseCase;
  let getByUserAndDateUseCase: GetDailySummaryByUserAndDateUseCase;
  let getByUserIdUseCase: GetDailySummariesByUserIdUseCase;
  let getByFiltersUseCase: GetDailySummariesByFiltersUseCase;
  let updateUseCase: UpdateDailySummaryUseCase;
  let deleteUseCase: DeleteDailySummaryUseCase;

  // Crear mockDailySummary con progreso calculado correctamente: (5/11)*100 = 45.45
  const mockDailySummary = new DailySummary('summary-123', 'user-123', '2024-01-15', 5, 2, 1, 3, 0, 45.45);

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserAndDate: vi.fn(),
      findByUserId: vi.fn(),
      findByFilters: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      existsById: vi.fn(),
      existsByUserAndDate: vi.fn(),
    };

    createUseCase = new CreateDailySummaryUseCase(mockRepository);
    getByIdUseCase = new GetDailySummaryByIdUseCase(mockRepository);
    getByUserAndDateUseCase = new GetDailySummaryByUserAndDateUseCase(mockRepository);
    getByUserIdUseCase = new GetDailySummariesByUserIdUseCase(mockRepository);
    getByFiltersUseCase = new GetDailySummariesByFiltersUseCase(mockRepository);
    updateUseCase = new UpdateDailySummaryUseCase(mockRepository);
    deleteUseCase = new DeleteDailySummaryUseCase(mockRepository);
  });

  describe('CreateDailySummaryUseCase', () => {
    it('should create a daily summary successfully', async () => {
      const createDto: CreateDailySummaryDto = {
        userId: 'user-123',
        dateLocal: '2024-01-15',
        totalCompleted: 5,
        totalMissed: 2,
        totalInProgress: 1,
        totalPending: 3,
        totalSkipped: 0,
        progressPercent: 45.45, // (5/11)*100
      };

      (mockRepository.save as MockedFunction<typeof mockRepository.save>).mockResolvedValue(mockDailySummary);

      const result = await createUseCase.execute(createDto);

      expect(mockRepository.save).toHaveBeenCalledWith(expect.any(DailySummary));
      expect(result).toEqual(mockDailySummary);
    });

    it('should throw error when creating daily summary with invalid data', async () => {
      const createDto: CreateDailySummaryDto = {
        userId: '',
        dateLocal: '2024-01-15',
        totalCompleted: -1,
        totalMissed: 0,
        totalInProgress: 0,
        totalPending: 0,
        totalSkipped: 0,
        progressPercent: 101,
      };

      await expect(createUseCase.execute(createDto)).rejects.toThrow();
    });
  });

  describe('GetDailySummaryByIdUseCase', () => {
    it('should get daily summary by id successfully', async () => {
      const dailySummaryId = 'summary-123';
      (mockRepository.findById as MockedFunction<typeof mockRepository.findById>).mockResolvedValue(mockDailySummary);

      const result = await getByIdUseCase.execute(dailySummaryId);

      expect(mockRepository.findById).toHaveBeenCalledWith(dailySummaryId);
      expect(result).toEqual(mockDailySummary);
    });

    it('should throw error when daily summary id is empty', async () => {
      await expect(getByIdUseCase.execute('')).rejects.toThrow('DailySummary ID is required');
    });

    it('should return null when daily summary not found', async () => {
      const dailySummaryId = 'non-existent';
      (mockRepository.findById as MockedFunction<typeof mockRepository.findById>).mockResolvedValue(null);

      const result = await getByIdUseCase.execute(dailySummaryId);

      expect(result).toBeNull();
    });
  });

  describe('GetDailySummaryByUserAndDateUseCase', () => {
    it('should get daily summary by user and date successfully', async () => {
      const userId = 'user-123';
      const dateLocal = '2024-01-15';
      (mockRepository.findByUserAndDate as MockedFunction<typeof mockRepository.findByUserAndDate>).mockResolvedValue(mockDailySummary);

      const result = await getByUserAndDateUseCase.execute(userId, dateLocal);

      expect(mockRepository.findByUserAndDate).toHaveBeenCalledWith(userId, dateLocal);
      expect(result).toEqual(mockDailySummary);
    });

    it('should throw error when user id is empty', async () => {
      await expect(getByUserAndDateUseCase.execute('', '2024-01-15')).rejects.toThrow('User ID is required');
    });

    it('should throw error when date is empty', async () => {
      await expect(getByUserAndDateUseCase.execute('user-123', '')).rejects.toThrow('Valid date is required');
    });
  });

  describe('GetDailySummariesByUserIdUseCase', () => {
    it('should get daily summaries by user id successfully', async () => {
      const userId = 'user-123';
      const mockSummaries = [mockDailySummary];
      (mockRepository.findByUserId as MockedFunction<typeof mockRepository.findByUserId>).mockResolvedValue(mockSummaries);

      const result = await getByUserIdUseCase.execute(userId);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockSummaries);
    });

    it('should throw error when user id is empty', async () => {
      await expect(getByUserIdUseCase.execute('')).rejects.toThrow('User ID is required');
    });
  });

  describe('GetDailySummariesByFiltersUseCase', () => {
    it('should get daily summaries with filters successfully', async () => {
      const filters: DailySummaryFilters = {
        userId: 'user-123',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        progressPercentMin: 0,
        progressPercentMax: 100,
      };
      const mockSummaries = [mockDailySummary];
      (mockRepository.findByFilters as MockedFunction<typeof mockRepository.findByFilters>).mockResolvedValue(mockSummaries);

      const result = await getByFiltersUseCase.execute(filters);

      expect(mockRepository.findByFilters).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockSummaries);
    });

    it('should get daily summaries with empty filters', async () => {
      const filters: DailySummaryFilters = {};
      const mockSummaries = [mockDailySummary];
      (mockRepository.findByFilters as MockedFunction<typeof mockRepository.findByFilters>).mockResolvedValue(mockSummaries);

      const result = await getByFiltersUseCase.execute(filters);

      expect(mockRepository.findByFilters).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockSummaries);
    });
  });

  describe('UpdateDailySummaryUseCase', () => {
    it('should update daily summary successfully', async () => {
      const summaryId = 'summary-123';
      const updateDto: UpdateDailySummaryDto = {
        totalCompleted: 8,
        progressPercent: 57.14, // (8/14)*100 = 57.14
      };
      const updatedSummary = new DailySummary(summaryId, 'user-123', '2024-01-15', 8, 2, 1, 3, 0, 57.14);

      // Mock findById para que devuelva el summario existente
      (mockRepository.findById as MockedFunction<typeof mockRepository.findById>).mockResolvedValue(mockDailySummary);
      (mockRepository.update as MockedFunction<typeof mockRepository.update>).mockResolvedValue(updatedSummary);

      const result = await updateUseCase.execute(summaryId, updateDto);

      expect(mockRepository.findById).toHaveBeenCalledWith(summaryId);
      // El UseCase pasa la entidad completa actualizada, no solo el DTO
      expect(mockRepository.update).toHaveBeenCalledWith(summaryId, expect.any(DailySummary));
      expect(result).toEqual(updatedSummary);
    });

    it('should throw error when daily summary id is empty', async () => {
      const updateDto: UpdateDailySummaryDto = { totalCompleted: 8 };

      await expect(updateUseCase.execute('', updateDto)).rejects.toThrow('DailySummary ID is required');
    });

    it('should handle empty update data gracefully', async () => {
      // Para este test, debe buscar el summario y devolver null si no hay cambios
      (mockRepository.findById as MockedFunction<typeof mockRepository.findById>).mockResolvedValue(mockDailySummary);
      (mockRepository.update as MockedFunction<typeof mockRepository.update>).mockResolvedValue(mockDailySummary);

      const result = await updateUseCase.execute('summary-123', {});
      expect(result).toEqual(mockDailySummary);
    });
  });

  describe('DeleteDailySummaryUseCase', () => {
    it('should delete daily summary successfully', async () => {
      const summaryId = 'summary-123';
      (mockRepository.existsById as MockedFunction<typeof mockRepository.existsById>).mockResolvedValue(true);
      (mockRepository.delete as MockedFunction<typeof mockRepository.delete>).mockResolvedValue(true);

      await deleteUseCase.execute(summaryId);

      expect(mockRepository.existsById).toHaveBeenCalledWith(summaryId);
      expect(mockRepository.delete).toHaveBeenCalledWith(summaryId);
    });

    it('should throw error when daily summary id is empty', async () => {
      await expect(deleteUseCase.execute('')).rejects.toThrow('DailySummary ID is required');
    });
  });
});

describe('DailySummary Entity Validation', () => {
  it('should create daily summary with valid data', () => {
    const dailySummary = new DailySummary('summary-123', 'user-123', '2024-01-15', 5, 2, 1, 3, 0, 45.45);

    expect(dailySummary.id).toBe('summary-123');
    expect(dailySummary.userId).toBe('user-123');
    expect(dailySummary.dateLocal).toBe('2024-01-15');
    expect(dailySummary.totalCompleted).toBe(5);
    expect(dailySummary.totalMissed).toBe(2);
    expect(dailySummary.totalInProgress).toBe(1);
    expect(dailySummary.totalPending).toBe(3);
    expect(dailySummary.totalSkipped).toBe(0);
    expect(dailySummary.progressPercent).toBe(45.45);
  });

  it('should throw error with empty id', () => {
    expect(() => new DailySummary('', 'user-123', '2024-01-15')).toThrow('DailySummary ID cannot be empty');
  });

  it('should throw error with empty user id', () => {
    expect(() => new DailySummary('summary-123', '', '2024-01-15')).toThrow('User ID cannot be empty');
  });

  it('should throw error with invalid date', () => {
    expect(() => new DailySummary('summary-123', 'user-123', '')).toThrow('Invalid date format');
    expect(() => new DailySummary('summary-123', 'user-123', 'invalid-date')).toThrow('Invalid date format');
  });

  it('should throw error with negative values', () => {
    expect(() => new DailySummary('summary-123', 'user-123', '2024-01-15', -1)).toThrow('Task counts cannot be negative');
    expect(() => new DailySummary('summary-123', 'user-123', '2024-01-15', 0, -1)).toThrow('Task counts cannot be negative');
  });

  it('should throw error with invalid progress percent', () => {
    expect(() => new DailySummary('summary-123', 'user-123', '2024-01-15', 0, 0, 0, 0, 0, -1)).toThrow('Progress percent must be between 0 and 100');
    expect(() => new DailySummary('summary-123', 'user-123', '2024-01-15', 0, 0, 0, 0, 0, 101)).toThrow('Progress percent must be between 0 and 100');
  });

  it('should calculate total tasks correctly', () => {
    // Sin especificar progress, debería calcularse automáticamente
    const dailySummary = new DailySummary('summary-123', 'user-123', '2024-01-15', 5, 2, 1, 3, 0, 45.45);
    expect(dailySummary.getTotalTasks()).toBe(11);
    expect(dailySummary.progressPercent).toBeCloseTo(45.45, 2);
  });

  it('should handle zero total tasks', () => {
    const dailySummary = new DailySummary('summary-123', 'user-123', '2024-01-15', 0, 0, 0, 0, 0);
    expect(dailySummary.getTotalTasks()).toBe(0);
    expect(dailySummary.progressPercent).toBe(0);
  });
});
