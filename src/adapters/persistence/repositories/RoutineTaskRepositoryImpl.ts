import { DataSource, In, Repository } from 'typeorm';
import { Category } from '../../../core/entities/Category';
import { RoutineTask } from '../../../core/entities/RoutineTask';
import { IRoutineTaskRepository } from '../../../core/repositories/IRoutineTaskRepository';
import { CategoryEntity } from '../entities/CategoryEntity';
import { RoutineTemplateTaskEntity } from '../entities/RoutineTemplateTaskEntity';

export class RoutineTaskRepositoryImpl implements IRoutineTaskRepository {
  private readonly repository: Repository<RoutineTemplateTaskEntity>;
  private readonly categoryRepository: Repository<CategoryEntity>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(RoutineTemplateTaskEntity);
    this.categoryRepository = dataSource.getRepository(CategoryEntity);
  }

  async create(task: RoutineTask): Promise<RoutineTask> {
    const entity = this.toEntity(task);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async update(task: RoutineTask): Promise<RoutineTask> {
    const entity = this.toEntity(task);
    await this.repository.save(entity);
    const updatedEntity = await this.repository.findOne({
      where: { id: task.id },
      relations: ['category'],
    });
    if (!updatedEntity) {
      throw new Error(`RoutineTask with ID ${task.id} not found after update`);
    }
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new Error(`RoutineTask with ID ${id} not found`);
    }
  }

  async findById(id: string): Promise<RoutineTask | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['category', 'routine'],
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByRoutineId(routineId: string): Promise<RoutineTask[]> {
    const entities = await this.repository.find({
      where: { routine_id: routineId },
      relations: ['category', 'routine'],
      order: { sort_order: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByRoutineIds(routineIds: string[]): Promise<RoutineTask[]> {
    if (routineIds.length === 0) {
      return [];
    }

    const entities = await this.repository.find({
      where: { routine_id: In(routineIds) },
      relations: ['category', 'routine'],
      order: { sort_order: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAll(): Promise<RoutineTask[]> {
    const entities = await this.repository.find({
      relations: ['category', 'routine'],
      order: { sort_order: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  private toEntity(domain: RoutineTask): RoutineTemplateTaskEntity {
    const entity = new RoutineTemplateTaskEntity();
    entity.id = domain.id;
    entity.routine_id = domain.routineId;
    entity.title = domain.title;
    entity.time_local = domain.timeLocal;
    entity.duration_min = domain.durationMin;
    entity.category_id = domain.categoryId;
    entity.priority = domain.priority;
    entity.description = domain.description;
    entity.sort_order = domain.sortOrder;
    entity.created_at = domain.createdAt;
    entity.updated_at = domain.updatedAt;
    return entity;
  }

  private toDomain(entity: RoutineTemplateTaskEntity): RoutineTask {
    const category = entity.category
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
      : undefined;

    const routineName = entity.routine?.title;

    return new RoutineTask(
      entity.id,
      entity.routine_id,
      routineName,
      entity.title,
      entity.time_local,
      entity.duration_min,
      entity.category_id,
      category,
      entity.priority,
      entity.description,
      entity.sort_order,
      entity.created_at,
      entity.updated_at,
    );
  }
}
