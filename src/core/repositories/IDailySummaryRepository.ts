import { DailySummary } from '../entities/DailySummary';
import { DailySummaryFilters } from '../interfaces/routine.interface';

export interface IDailySummaryRepository {
  save(dailySummary: DailySummary): Promise<DailySummary>;
  findById(id: string): Promise<DailySummary | null>;
  findByUserAndDate(userId: string, dateLocal: string): Promise<DailySummary | null>;
  findByUserId(userId: string): Promise<DailySummary[]>;
  findByFilters(filters: DailySummaryFilters): Promise<DailySummary[]>;
  update(id: string, dailySummary: Partial<DailySummary>): Promise<DailySummary | null>;
  delete(id: string): Promise<boolean>;
  existsById(id: string): Promise<boolean>;
  existsByUserAndDate(userId: string, dateLocal: string): Promise<boolean>;
}
