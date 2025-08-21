import { Request, Response } from 'express';
import { CreateDailySummaryDto, DailySummaryFilters, DailySummaryResponseDto, UpdateDailySummaryDto } from '../../core/interfaces/routine.interface';
import { CreateDailySummaryUseCase } from '../../core/usecases/daily_summaries/CreateDailySummaryUseCase';
import { DeleteDailySummaryUseCase } from '../../core/usecases/daily_summaries/DeleteDailySummaryUseCase';
import { GetDailySummariesByFiltersUseCase } from '../../core/usecases/daily_summaries/GetDailySummariesByFiltersUseCase';
import { GetDailySummariesByUserIdUseCase } from '../../core/usecases/daily_summaries/GetDailySummariesByUserIdUseCase';
import { GetDailySummaryByIdUseCase } from '../../core/usecases/daily_summaries/GetDailySummaryByIdUseCase';
import { GetDailySummaryByUserAndDateUseCase } from '../../core/usecases/daily_summaries/GetDailySummaryByUserAndDateUseCase';
import { UpdateDailySummaryUseCase } from '../../core/usecases/daily_summaries/UpdateDailySummaryUseCase';

export class DailySummaryController {
  constructor(
    private readonly createDailySummaryUseCase: CreateDailySummaryUseCase,
    private readonly getDailySummaryByIdUseCase: GetDailySummaryByIdUseCase,
    private readonly getDailySummaryByUserAndDateUseCase: GetDailySummaryByUserAndDateUseCase,
    private readonly getDailySummariesByUserIdUseCase: GetDailySummariesByUserIdUseCase,
    private readonly getDailySummariesByFiltersUseCase: GetDailySummariesByFiltersUseCase,
    private readonly updateDailySummaryUseCase: UpdateDailySummaryUseCase,
    private readonly deleteDailySummaryUseCase: DeleteDailySummaryUseCase,
  ) {}

  public async create(req: Request, res: Response): Promise<void> {
    try {
      // Validar request body
      const validationError = this.validateCreateDailySummaryRequest(req.body);

      if (validationError.length > 0) {
        res.status(400).json({ message: 'Validation failed', errors: validationError });
        return;
      }

      const { userId, dateLocal, totalCompleted, totalMissed, totalInProgress, totalPending, totalSkipped, progressPercent } = req.body;
      const dailySummaryDto: CreateDailySummaryDto = {
        userId: userId.trim(),
        dateLocal: dateLocal.trim(),
        totalCompleted,
        totalMissed,
        totalInProgress,
        totalPending,
        totalSkipped,
        progressPercent,
      };

      const dailySummary = await this.createDailySummaryUseCase.execute(dailySummaryDto);

      const dailySummaryResponse: DailySummaryResponseDto = {
        id: dailySummary.id,
        userId: dailySummary.userId,
        dateLocal: dailySummary.dateLocal,
        totalCompleted: dailySummary.totalCompleted,
        totalMissed: dailySummary.totalMissed,
        totalInProgress: dailySummary.totalInProgress,
        totalPending: dailySummary.totalPending,
        totalSkipped: dailySummary.totalSkipped,
        progressPercent: dailySummary.progressPercent,
        createdAt: dailySummary.createdAt,
        updatedAt: dailySummary.updatedAt,
      };

      res.status(201).json({ success: true, data: dailySummaryResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'DailySummary ID is required' });
        return;
      }

      const dailySummary = await this.getDailySummaryByIdUseCase.execute(id);

      if (!dailySummary) {
        res.status(404).json({ message: 'DailySummary not found' });
        return;
      }

      const dailySummaryResponse: DailySummaryResponseDto = {
        id: dailySummary.id,
        userId: dailySummary.userId,
        dateLocal: dailySummary.dateLocal,
        totalCompleted: dailySummary.totalCompleted,
        totalMissed: dailySummary.totalMissed,
        totalInProgress: dailySummary.totalInProgress,
        totalPending: dailySummary.totalPending,
        totalSkipped: dailySummary.totalSkipped,
        progressPercent: dailySummary.progressPercent,
        createdAt: dailySummary.createdAt,
        updatedAt: dailySummary.updatedAt,
      };

      res.status(200).json({ success: true, data: dailySummaryResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async getByUserAndDate(req: Request, res: Response): Promise<void> {
    try {
      const { userId, date } = req.params;
      if (!userId || !date) {
        res.status(400).json({ message: 'User ID and date are required' });
        return;
      }

      const dailySummary = await this.getDailySummaryByUserAndDateUseCase.execute(userId, date);

      if (!dailySummary) {
        res.status(404).json({ message: 'DailySummary not found' });
        return;
      }

      const dailySummaryResponse: DailySummaryResponseDto = {
        id: dailySummary.id,
        userId: dailySummary.userId,
        dateLocal: dailySummary.dateLocal,
        totalCompleted: dailySummary.totalCompleted,
        totalMissed: dailySummary.totalMissed,
        totalInProgress: dailySummary.totalInProgress,
        totalPending: dailySummary.totalPending,
        totalSkipped: dailySummary.totalSkipped,
        progressPercent: dailySummary.progressPercent,
        createdAt: dailySummary.createdAt,
        updatedAt: dailySummary.updatedAt,
      };

      res.status(200).json({ success: true, data: dailySummaryResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async getByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ message: 'User ID is required' });
        return;
      }

      const dailySummaries = await this.getDailySummariesByUserIdUseCase.execute(userId);

      const dailySummariesResponse: DailySummaryResponseDto[] = dailySummaries.map((dailySummary) => ({
        id: dailySummary.id,
        userId: dailySummary.userId,
        dateLocal: dailySummary.dateLocal,
        totalCompleted: dailySummary.totalCompleted,
        totalMissed: dailySummary.totalMissed,
        totalInProgress: dailySummary.totalInProgress,
        totalPending: dailySummary.totalPending,
        totalSkipped: dailySummary.totalSkipped,
        progressPercent: dailySummary.progressPercent,
        createdAt: dailySummary.createdAt,
        updatedAt: dailySummary.updatedAt,
      }));

      res.status(200).json({ success: true, data: dailySummariesResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async getByFilters(req: Request, res: Response): Promise<void> {
    try {
      const filters: DailySummaryFilters = req.query as unknown as DailySummaryFilters;

      // Validar filtros
      const validationError = this.validateFilters(filters);
      if (validationError.length > 0) {
        res.status(400).json({ message: 'Validation failed', errors: validationError });
        return;
      }

      const dailySummaries = await this.getDailySummariesByFiltersUseCase.execute(filters);

      const dailySummariesResponse: DailySummaryResponseDto[] = dailySummaries.map((dailySummary) => ({
        id: dailySummary.id,
        userId: dailySummary.userId,
        dateLocal: dailySummary.dateLocal,
        totalCompleted: dailySummary.totalCompleted,
        totalMissed: dailySummary.totalMissed,
        totalInProgress: dailySummary.totalInProgress,
        totalPending: dailySummary.totalPending,
        totalSkipped: dailySummary.totalSkipped,
        progressPercent: dailySummary.progressPercent,
        createdAt: dailySummary.createdAt,
        updatedAt: dailySummary.updatedAt,
      }));

      res.status(200).json({ success: true, data: dailySummariesResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'DailySummary ID is required' });
        return;
      }

      // Validar request body
      const validationError = this.validateUpdateDailySummaryRequest(req.body);

      if (validationError.length > 0) {
        res.status(400).json({ message: 'Validation failed', errors: validationError });
        return;
      }

      const updateDto: UpdateDailySummaryDto = req.body;

      const dailySummary = await this.updateDailySummaryUseCase.execute(id, updateDto);

      if (!dailySummary) {
        res.status(404).json({ message: 'DailySummary not found' });
        return;
      }

      const dailySummaryResponse: DailySummaryResponseDto = {
        id: dailySummary.id,
        userId: dailySummary.userId,
        dateLocal: dailySummary.dateLocal,
        totalCompleted: dailySummary.totalCompleted,
        totalMissed: dailySummary.totalMissed,
        totalInProgress: dailySummary.totalInProgress,
        totalPending: dailySummary.totalPending,
        totalSkipped: dailySummary.totalSkipped,
        progressPercent: dailySummary.progressPercent,
        createdAt: dailySummary.createdAt,
        updatedAt: dailySummary.updatedAt,
      };

      res.status(200).json({ success: true, data: dailySummaryResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'DailySummary ID is required' });
        return;
      }

      await this.deleteDailySummaryUseCase.execute(id);
      res.status(204).json({ success: true });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  private validateCreateDailySummaryRequest(body: CreateDailySummaryDto): string[] {
    const errors: string[] = [];

    if (!body.userId || typeof body.userId !== 'string' || body.userId.trim().length === 0) {
      errors.push('User ID is required');
    }

    if (!body.dateLocal || typeof body.dateLocal !== 'string' || !this.isValidDate(body.dateLocal)) {
      errors.push('Valid date is required. Use YYYY-MM-DD format');
    }

    if (body.totalCompleted !== undefined && (typeof body.totalCompleted !== 'number' || body.totalCompleted < 0)) {
      errors.push('Total completed must be a non-negative number');
    }

    if (body.totalMissed !== undefined && (typeof body.totalMissed !== 'number' || body.totalMissed < 0)) {
      errors.push('Total missed must be a non-negative number');
    }

    if (body.totalInProgress !== undefined && (typeof body.totalInProgress !== 'number' || body.totalInProgress < 0)) {
      errors.push('Total in progress must be a non-negative number');
    }

    if (body.totalPending !== undefined && (typeof body.totalPending !== 'number' || body.totalPending < 0)) {
      errors.push('Total pending must be a non-negative number');
    }

    if (body.totalSkipped !== undefined && (typeof body.totalSkipped !== 'number' || body.totalSkipped < 0)) {
      errors.push('Total skipped must be a non-negative number');
    }

    if (body.progressPercent !== undefined && (typeof body.progressPercent !== 'number' || body.progressPercent < 0 || body.progressPercent > 100)) {
      errors.push('Progress percent must be a number between 0 and 100');
    }

    return errors;
  }

  private validateUpdateDailySummaryRequest(body: UpdateDailySummaryDto): string[] {
    const errors: string[] = [];

    if (body.totalCompleted !== undefined && (typeof body.totalCompleted !== 'number' || body.totalCompleted < 0)) {
      errors.push('Total completed must be a non-negative number');
    }

    if (body.totalMissed !== undefined && (typeof body.totalMissed !== 'number' || body.totalMissed < 0)) {
      errors.push('Total missed must be a non-negative number');
    }

    if (body.totalInProgress !== undefined && (typeof body.totalInProgress !== 'number' || body.totalInProgress < 0)) {
      errors.push('Total in progress must be a non-negative number');
    }

    if (body.totalPending !== undefined && (typeof body.totalPending !== 'number' || body.totalPending < 0)) {
      errors.push('Total pending must be a non-negative number');
    }

    if (body.totalSkipped !== undefined && (typeof body.totalSkipped !== 'number' || body.totalSkipped < 0)) {
      errors.push('Total skipped must be a non-negative number');
    }

    if (body.progressPercent !== undefined && (typeof body.progressPercent !== 'number' || body.progressPercent < 0 || body.progressPercent > 100)) {
      errors.push('Progress percent must be a number between 0 and 100');
    }

    return errors;
  }

  private validateFilters(filters: DailySummaryFilters): string[] {
    const errors: string[] = [];

    if (filters.dateLocal && !this.isValidDate(filters.dateLocal)) {
      errors.push('Invalid dateLocal format. Use YYYY-MM-DD format');
    }

    if (filters.dateFrom && !this.isValidDate(filters.dateFrom)) {
      errors.push('Invalid dateFrom format. Use YYYY-MM-DD format');
    }

    if (filters.dateTo && !this.isValidDate(filters.dateTo)) {
      errors.push('Invalid dateTo format. Use YYYY-MM-DD format');
    }

    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      errors.push('dateFrom cannot be after dateTo');
    }

    if (
      filters.progressPercentMin !== undefined &&
      (typeof filters.progressPercentMin !== 'number' || filters.progressPercentMin < 0 || filters.progressPercentMin > 100)
    ) {
      errors.push('progressPercentMin must be a number between 0 and 100');
    }

    if (
      filters.progressPercentMax !== undefined &&
      (typeof filters.progressPercentMax !== 'number' || filters.progressPercentMax < 0 || filters.progressPercentMax > 100)
    ) {
      errors.push('progressPercentMax must be a number between 0 and 100');
    }

    if (
      filters.progressPercentMin !== undefined &&
      filters.progressPercentMax !== undefined &&
      filters.progressPercentMin > filters.progressPercentMax
    ) {
      errors.push('progressPercentMin cannot be greater than progressPercentMax');
    }

    return errors;
  }

  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }

  private handleError(error: unknown, res: Response): void {
    console.error('DailySummaryController error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ message: error.message });
      } else if (error.message.includes('already exists')) {
        res.status(409).json({ message: error.message });
      } else if (
        error.message.includes('required') ||
        error.message.includes('must be') ||
        error.message.includes('cannot') ||
        error.message.includes('Invalid')
      ) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
