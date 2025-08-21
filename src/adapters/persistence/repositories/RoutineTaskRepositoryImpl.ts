import { Repository } from 'typeorm';
import { RoutineTask } from '../../../core/entities/RoutineTask';
import { RoutineTaskFilters } from '../../../core/interfaces/routine.interface';
import { IRoutineTaskRepository } from '../../../core/repositories/IRoutineTaskRepository';
import { RoutineTaskEntity } from '../entities/RoutineTaskEntity';

export class RoutineTaskRepositoryImpl implements IRoutineTaskRepository {
  constructor(private readonly routineTaskRepository: Repository<RoutineTaskEntity>) {}

  async save(routineTask: RoutineTask): Promise<RoutineTask> {
    const routineTaskEntity = this.toEntity(routineTask);
    const savedEntity = await this.routineTaskRepository.save(routineTaskEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<RoutineTask | null> {
    const routineTaskEntity = await this.routineTaskRepository.findOne({
      where: { id },
    });

    return routineTaskEntity ? this.toDomain(routineTaskEntity) : null;
  }

  async findByUserId(userId: string): Promise<RoutineTask[]> {
    const routineTaskEntities = await this.routineTaskRepository.find({
      where: { user_id: userId },
      order: { date_local: 'DESC', created_at: 'DESC' },
    });

    return routineTaskEntities.map((entity) => this.toDomain(entity));
  }

  async findByRoutineId(routineId: string): Promise<RoutineTask[]> {
    const routineTaskEntities = await this.routineTaskRepository.find({
      where: { routine_id: routineId },
      order: { date_local: 'DESC', created_at: 'DESC' },
    });

    return routineTaskEntities.map((entity) => this.toDomain(entity));
  }

  async findByUserAndDate(userId: string, dateLocal: string): Promise<RoutineTask[]> {
    const routineTaskEntities = await this.routineTaskRepository.find({
      where: { user_id: userId, date_local: dateLocal },
      order: { created_at: 'ASC' },
    });

    return routineTaskEntities.map((entity) => this.toDomain(entity));
  }

  async findByFilters(filters: RoutineTaskFilters): Promise<RoutineTask[]> {
    const queryBuilder = this.routineTaskRepository.createQueryBuilder('task');

    if (filters.userId) {
      queryBuilder.andWhere('task.user_id = :userId', { userId: filters.userId });
    }

    if (filters.routineId) {
      queryBuilder.andWhere('task.routine_id = :routineId', { routineId: filters.routineId });
    }

    if (filters.dateLocal) {
      queryBuilder.andWhere('task.date_local = :dateLocal', { dateLocal: filters.dateLocal });
    }

    if (filters.status) {
      queryBuilder.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('task.date_local >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('task.date_local <= :dateTo', { dateTo: filters.dateTo });
    }

    queryBuilder.orderBy('task.date_local', 'DESC').addOrderBy('task.created_at', 'DESC');

    const routineTaskEntities = await queryBuilder.getMany();
    return routineTaskEntities.map((entity) => this.toDomain(entity));
  }

  async update(id: string, routineTask: Partial<RoutineTask>): Promise<RoutineTask | null> {
    const existingEntity = await this.routineTaskRepository.findOne({ where: { id } });
    if (!existingEntity) {
      return null;
    }

    // Actualizar solo los campos que están definidos
    if (routineTask.timeLocal !== undefined) existingEntity.time_local = routineTask.timeLocal;
    if (routineTask.durationMin !== undefined) existingEntity.duration_min = routineTask.durationMin;
    if (routineTask.status !== undefined) existingEntity.status = routineTask.status;
    if (routineTask.startedAtLocal !== undefined) existingEntity.started_at_local = routineTask.startedAtLocal;
    if (routineTask.completedAtLocal !== undefined) existingEntity.completed_at_local = routineTask.completedAtLocal;
    if (routineTask.description !== undefined) existingEntity.description = routineTask.description;

    // Actualizar la fecha de modificación
    existingEntity.updated_at = new Date();

    const updatedEntity = await this.routineTaskRepository.save(existingEntity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.routineTaskRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.routineTaskRepository.count({ where: { id } });
    return count > 0;
  }

  async existsByRoutineAndDate(routineId: string, dateLocal: string): Promise<boolean> {
    const count = await this.routineTaskRepository.count({
      where: { routine_id: routineId, date_local: dateLocal },
    });
    return count > 0;
  }

  private toEntity(routineTask: RoutineTask): RoutineTaskEntity {
    const entity = new RoutineTaskEntity();
    entity.id = routineTask.id;
    entity.routine_id = routineTask.routineId;
    entity.user_id = routineTask.userId;
    entity.date_local = routineTask.dateLocal;
    entity.time_local = routineTask.timeLocal;
    entity.duration_min = routineTask.durationMin;
    entity.status = routineTask.status;
    entity.started_at_local = routineTask.startedAtLocal;
    entity.completed_at_local = routineTask.completedAtLocal;
    entity.description = routineTask.description;
    entity.created_at = routineTask.createdAt;
    entity.updated_at = routineTask.updatedAt;
    return entity;
  }

  private toDomain(entity: RoutineTaskEntity): RoutineTask {
    return new RoutineTask(
      entity.id,
      entity.routine_id,
      entity.user_id,
      entity.title,
      entity.date_local,
      entity.time_local,
      entity.duration_min,
      entity.category_id,
      undefined, // category - se carga por separado si se necesita
      entity.priority,
      entity.status,
      entity.started_at_local,
      entity.completed_at_local,
      entity.description,
      entity.created_at,
      entity.updated_at,
    );
  }
}
