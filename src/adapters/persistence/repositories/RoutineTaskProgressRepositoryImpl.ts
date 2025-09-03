import { DataSource, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RoutineTaskProgress } from '../../../core/entities/RoutineTaskProgress';
import { RoutineTaskStatus } from '../../../core/interfaces/routine.interface';
import { IRoutineTaskProgressRepository } from '../../../core/repositories/IRoutineTaskProgressRepository';
import { RoutineTaskProgressEntity } from '../entities/RoutineTaskProgressEntity';

export class RoutineTaskProgressRepositoryImpl implements IRoutineTaskProgressRepository {
  private readonly repository: Repository<RoutineTaskProgressEntity>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(RoutineTaskProgressEntity);
  }

  async create(progress: RoutineTaskProgress): Promise<RoutineTaskProgress> {
    const entity = this.toEntity(progress);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async update(progress: RoutineTaskProgress): Promise<RoutineTaskProgress> {
    const entity = this.toEntity(progress);
    await this.repository.save(entity);
    const updatedEntity = await this.repository.findOne({
      where: { id: progress.id },
    });
    if (!updatedEntity) {
      throw new Error(`RoutineTaskProgress with ID ${progress.id} not found after update`);
    }
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new Error(`RoutineTaskProgress with ID ${id} not found`);
    }
  }

  async findById(id: string): Promise<RoutineTaskProgress | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByTemplateTaskId(templateTaskId: string): Promise<RoutineTaskProgress[]> {
    const entities = await this.repository.find({
      where: { routine_template_task_id: templateTaskId },
      order: { date_local: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByTemplateTaskIdAndDate(templateTaskId: string, dateLocal: string): Promise<RoutineTaskProgress | null> {
    const entity = await this.repository.findOne({
      where: {
        routine_template_task_id: templateTaskId,
        date_local: dateLocal,
      },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByTemplateTaskIdsAndDate(templateTaskIds: string[], dateLocal: string): Promise<RoutineTaskProgress[]> {
    if (templateTaskIds.length === 0) {
      return [];
    }

    const entities = await this.repository.find({
      where: {
        routine_template_task_id: In(templateTaskIds),
        date_local: dateLocal,
      },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByUserIdAndDate(userId: string, dateLocal: string): Promise<RoutineTaskProgress[]> {
    const entities = await this.repository.find({
      where: {
        user_id: userId,
        date_local: dateLocal,
      },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByUserIdAndDateRange(userId: string, startDate: string, endDate: string): Promise<RoutineTaskProgress[]> {
    const entities = await this.repository
      .createQueryBuilder('progress')
      .where('progress.user_id = :userId', { userId })
      .andWhere('progress.date_local >= :startDate', { startDate })
      .andWhere('progress.date_local <= :endDate', { endDate })
      .orderBy('progress.date_local', 'DESC')
      .getMany();

    return entities.map((entity) => this.toDomain(entity));
  }

  async findAll(): Promise<RoutineTaskProgress[]> {
    const entities = await this.repository.find({
      order: { date_local: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  // Nuevos métodos para gestión automática de estados
  async findByTaskAndDate(taskId: string, dateLocal: string): Promise<RoutineTaskProgress | null> {
    const entity = await this.repository.findOne({
      where: {
        routine_template_task_id: taskId,
        date_local: dateLocal,
      },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserAndDateAndStatuses(userId: string, dateLocal: string, statuses: RoutineTaskStatus[]): Promise<RoutineTaskProgress[]> {
    const entities = await this.repository.find({
      where: {
        user_id: userId,
        date_local: dateLocal,
        status: In(statuses),
      },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async updateStatus(id: string, status: RoutineTaskStatus): Promise<void> {
    const result = await this.repository.update(id, {
      status: status,
      updated_at: new Date(),
    });

    if (result.affected === 0) {
      throw new Error(`RoutineTaskProgress with ID ${id} not found`);
    }
  }

  async createFromDto(dto: {
    routineTemplateTaskId: string;
    userId: string;
    dateLocal: string;
    status?: RoutineTaskStatus;
    notes?: string;
  }): Promise<RoutineTaskProgress> {
    const progress = new RoutineTaskProgress(
      uuidv4(),
      dto.routineTemplateTaskId,
      dto.userId,
      dto.dateLocal,
      dto.status || RoutineTaskStatus.PENDING,
      undefined,
      undefined,
      dto.notes,
      new Date(),
      new Date(),
    );

    return await this.create(progress);
  }

  private toEntity(domain: RoutineTaskProgress): RoutineTaskProgressEntity {
    const entity = new RoutineTaskProgressEntity();
    entity.id = domain.id;
    entity.routine_template_task_id = domain.routineTemplateTaskId;
    entity.user_id = domain.userId;
    entity.date_local = domain.dateLocal;
    entity.status = domain.status;
    entity.started_at_local = domain.startedAtLocal;
    entity.completed_at_local = domain.completedAtLocal;
    entity.notes = domain.notes;
    entity.created_at = domain.createdAt;
    entity.updated_at = domain.updatedAt;
    return entity;
  }

  private toDomain(entity: RoutineTaskProgressEntity): RoutineTaskProgress {
    return new RoutineTaskProgress(
      entity.id,
      entity.routine_template_task_id,
      entity.user_id,
      entity.date_local,
      entity.status,
      entity.started_at_local,
      entity.completed_at_local,
      entity.notes,
      entity.created_at,
      entity.updated_at,
    );
  }
}
