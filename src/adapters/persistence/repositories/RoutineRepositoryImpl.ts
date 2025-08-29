import { Repository } from 'typeorm';
import { Category } from '../../../core/entities/Category';
import { Routine } from '../../../core/entities/Routine';
import { RoutineTask } from '../../../core/entities/RoutineTask';
import { RoutineFilters } from '../../../core/interfaces/routine.interface';
import { IRoutineRepository } from '../../../core/repositories/IRoutineRepository';
import { RoutineEntity } from '../entities/RoutineEntity';
import { RoutineTemplateTaskEntity } from '../entities/RoutineTemplateTaskEntity';

export class RoutineRepositoryImpl implements IRoutineRepository {
  constructor(private readonly routineRepository: Repository<RoutineEntity>) {}

  async save(routine: Routine): Promise<Routine> {
    const routineEntity = this.toEntity(routine);
    const savedEntity = await this.routineRepository.save(routineEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Routine | null> {
    const routineEntity = await this.routineRepository.findOne({
      where: { id },
      relations: ['templateTasks', 'templateTasks.category'],
    });

    return routineEntity ? this.toDomain(routineEntity) : null;
  }

  async findByUserId(userId: string): Promise<Routine[]> {
    const routineEntities = await this.routineRepository.find({
      where: { user_id: userId },
      relations: ['templateTasks', 'templateTasks.category'],
      order: { created_at: 'DESC' },
    });

    return routineEntities.map((entity) => this.toDomain(entity));
  }

  async findByFilters(filters: RoutineFilters): Promise<Routine[]> {
    const queryBuilder = this.routineRepository
      .createQueryBuilder('routine')
      .leftJoinAndSelect('routine.templateTasks', 'templateTasks')
      .leftJoinAndSelect('templateTasks.category', 'templateCategory');

    if (filters.userId) {
      queryBuilder.andWhere('routine.user_id = :userId', { userId: filters.userId });
    }

    if (filters.active !== undefined) {
      queryBuilder.andWhere('routine.active = :active', { active: filters.active });
    }

    if (filters.title) {
      queryBuilder.andWhere('routine.title LIKE :title', { title: `%${filters.title}%` });
    }

    queryBuilder.orderBy('routine.created_at', 'DESC');

    const routineEntities = await queryBuilder.getMany();
    return routineEntities.map((entity) => this.toDomain(entity));
  }

  async update(id: string, routine: Partial<Routine>): Promise<Routine | null> {
    const existingEntity = await this.routineRepository.findOne({ where: { id } });
    if (!existingEntity) {
      return null;
    }

    // Actualizar solo los campos que están definidos
    if (routine.title !== undefined) existingEntity.title = routine.title;
    if (routine.defaultTimeLocal !== undefined) existingEntity.default_time_local = routine.defaultTimeLocal;
    if (routine.repeatDaysJson !== undefined) existingEntity.repeat_days_json = routine.repeatDaysJson;
    if (routine.active !== undefined) existingEntity.active = routine.active;

    const updatedEntity = await this.routineRepository.save(existingEntity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.routineRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.routineRepository.count({ where: { id } });
    return count > 0;
  }

  private toEntity(routine: Routine): RoutineEntity {
    const entity = new RoutineEntity();
    entity.id = routine.id;
    entity.user_id = routine.userId;
    entity.title = routine.title;
    entity.default_time_local = routine.defaultTimeLocal;
    entity.repeat_days_json = routine.repeatDaysJson;
    entity.active = routine.active;
    entity.created_at = routine.createdAt;
    return entity;
  }

  private toDomain(entity: RoutineEntity): Routine {
    const tasks = entity.templateTasks?.map((templateTaskEntity) => this.taskToDomain(templateTaskEntity)) || [];

    return new Routine(
      entity.id,
      entity.user_id,
      entity.title,
      entity.default_time_local,
      entity.repeat_days_json,
      entity.active,
      entity.created_at,
      tasks,
    );
  }

  private taskToDomain(entity: RoutineTemplateTaskEntity): RoutineTask {
    return new RoutineTask(
      entity.id,
      entity.routine_id,
      entity.title,
      entity.time_local,
      entity.duration_min,
      entity.category_id,
      entity.category
        ? new Category(
            entity.category.id,
            entity.category.name,
            entity.category.description,
            entity.category.color,
            entity.category.icon,
            entity.category.active,
            entity.category.sort_order,
            entity.category.created_at,
            entity.category.updated_at,
          )
        : undefined,
      entity.priority,
      entity.description,
      entity.sort_order,
      entity.created_at,
      entity.updated_at,
    );
  }
}
