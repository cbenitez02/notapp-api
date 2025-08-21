import { Repository } from 'typeorm';
import { DailySummary as DailySummaryDomain } from '../../../core/entities/DailySummary';
import { DailySummaryFilters } from '../../../core/interfaces/routine.interface';
import { IDailySummaryRepository } from '../../../core/repositories/IDailySummaryRepository';
import { DailySummary as DailySummaryEntity } from '../entities/DailySummaryEntity';

export class DailySummaryRepositoryImpl implements IDailySummaryRepository {
  constructor(private readonly dailySummaryRepository: Repository<DailySummaryEntity>) {}

  async save(dailySummary: DailySummaryDomain): Promise<DailySummaryDomain> {
    const dailySummaryEntity = this.toEntity(dailySummary);
    const savedEntity = await this.dailySummaryRepository.save(dailySummaryEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<DailySummaryDomain | null> {
    const dailySummaryEntity = await this.dailySummaryRepository.findOne({
      where: { id },
    });

    return dailySummaryEntity ? this.toDomain(dailySummaryEntity) : null;
  }

  async findByUserAndDate(userId: string, dateLocal: string): Promise<DailySummaryDomain | null> {
    const dailySummaryEntity = await this.dailySummaryRepository.findOne({
      where: { user_id: userId, date_local: dateLocal },
    });

    return dailySummaryEntity ? this.toDomain(dailySummaryEntity) : null;
  }

  async findByUserId(userId: string): Promise<DailySummaryDomain[]> {
    const dailySummaryEntities = await this.dailySummaryRepository.find({
      where: { user_id: userId },
      order: { date_local: 'DESC' },
    });

    return dailySummaryEntities.map((entity) => this.toDomain(entity));
  }

  async findByFilters(filters: DailySummaryFilters): Promise<DailySummaryDomain[]> {
    const queryBuilder = this.dailySummaryRepository.createQueryBuilder('summary');

    if (filters.userId) {
      queryBuilder.andWhere('summary.user_id = :userId', { userId: filters.userId });
    }

    if (filters.dateLocal) {
      queryBuilder.andWhere('summary.date_local = :dateLocal', { dateLocal: filters.dateLocal });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('summary.date_local >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('summary.date_local <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.progressPercentMin !== undefined) {
      queryBuilder.andWhere('summary.progress_percent >= :progressPercentMin', {
        progressPercentMin: filters.progressPercentMin,
      });
    }

    if (filters.progressPercentMax !== undefined) {
      queryBuilder.andWhere('summary.progress_percent <= :progressPercentMax', {
        progressPercentMax: filters.progressPercentMax,
      });
    }

    queryBuilder.orderBy('summary.date_local', 'DESC');

    const dailySummaryEntities = await queryBuilder.getMany();
    return dailySummaryEntities.map((entity) => this.toDomain(entity));
  }

  async update(id: string, dailySummary: Partial<DailySummaryDomain>): Promise<DailySummaryDomain | null> {
    const existingEntity = await this.dailySummaryRepository.findOne({ where: { id } });
    if (!existingEntity) {
      return null;
    }

    // Actualizar solo los campos que están definidos
    if (dailySummary.totalCompleted !== undefined) existingEntity.total_completed = dailySummary.totalCompleted;
    if (dailySummary.totalMissed !== undefined) existingEntity.total_missed = dailySummary.totalMissed;
    if (dailySummary.totalInProgress !== undefined) existingEntity.total_in_progress = dailySummary.totalInProgress;
    if (dailySummary.totalPending !== undefined) existingEntity.total_pending = dailySummary.totalPending;
    if (dailySummary.totalSkipped !== undefined) existingEntity.total_skipped = dailySummary.totalSkipped;
    if (dailySummary.progressPercent !== undefined) existingEntity.progress_percent = dailySummary.progressPercent;

    // Actualizar la fecha de modificación
    existingEntity.updated_at = new Date();

    const updatedEntity = await this.dailySummaryRepository.save(existingEntity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.dailySummaryRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.dailySummaryRepository.count({ where: { id } });
    return count > 0;
  }

  async existsByUserAndDate(userId: string, dateLocal: string): Promise<boolean> {
    const count = await this.dailySummaryRepository.count({
      where: { user_id: userId, date_local: dateLocal },
    });
    return count > 0;
  }

  private toEntity(dailySummary: DailySummaryDomain): DailySummaryEntity {
    const entity = new DailySummaryEntity();
    entity.id = dailySummary.id;
    entity.user_id = dailySummary.userId;
    entity.date_local = dailySummary.dateLocal;
    entity.total_completed = dailySummary.totalCompleted;
    entity.total_missed = dailySummary.totalMissed;
    entity.total_in_progress = dailySummary.totalInProgress;
    entity.total_pending = dailySummary.totalPending;
    entity.total_skipped = dailySummary.totalSkipped;
    entity.progress_percent = dailySummary.progressPercent;
    entity.created_at = dailySummary.createdAt;
    entity.updated_at = dailySummary.updatedAt;
    return entity;
  }

  private toDomain(entity: DailySummaryEntity): DailySummaryDomain {
    return new DailySummaryDomain(
      entity.id,
      entity.user_id,
      entity.date_local,
      entity.total_completed,
      entity.total_missed,
      entity.total_in_progress,
      entity.total_pending,
      entity.total_skipped,
      entity.progress_percent,
      entity.created_at,
      entity.updated_at,
    );
  }
}
