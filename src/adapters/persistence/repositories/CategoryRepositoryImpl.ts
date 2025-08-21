import { Repository } from 'typeorm';
import { Category } from '../../../core/entities/Category';
import { CategoryFilters } from '../../../core/interfaces/category.interface';
import { ICategoryRepository } from '../../../core/repositories/ICategoryRepository';
import { CategoryEntity } from '../entities/CategoryEntity';

export class CategoryRepositoryImpl implements ICategoryRepository {
  constructor(private readonly categoryRepository: Repository<CategoryEntity>) {}

  async save(category: Category): Promise<Category> {
    const categoryEntity = this.toEntity(category);
    const savedEntity = await this.categoryRepository.save(categoryEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Category | null> {
    const categoryEntity = await this.categoryRepository.findOne({
      where: { id },
    });

    return categoryEntity ? this.toDomain(categoryEntity) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    const categoryEntity = await this.categoryRepository.findOne({
      where: { name },
    });

    return categoryEntity ? this.toDomain(categoryEntity) : null;
  }

  async findAll(): Promise<Category[]> {
    const categoryEntities = await this.categoryRepository.find({
      where: { active: true },
      order: { sort_order: 'ASC', name: 'ASC' },
    });

    return categoryEntities.map((entity) => this.toDomain(entity));
  }

  async findByFilters(filters: CategoryFilters): Promise<Category[]> {
    const queryBuilder = this.categoryRepository.createQueryBuilder('category');

    if (filters.active !== undefined) {
      queryBuilder.andWhere('category.active = :active', { active: filters.active });
    }

    if (filters.name) {
      queryBuilder.andWhere('category.name LIKE :name', { name: `%${filters.name}%` });
    }

    queryBuilder.orderBy('category.sort_order', 'ASC').addOrderBy('category.name', 'ASC');

    const categoryEntities = await queryBuilder.getMany();
    return categoryEntities.map((entity) => this.toDomain(entity));
  }

  async update(id: string, category: Partial<Category>): Promise<Category | null> {
    const existingEntity = await this.categoryRepository.findOne({ where: { id } });

    if (!existingEntity) {
      return null;
    }

    // Actualizar solo los campos que están definidos
    if (category.name !== undefined) existingEntity.name = category.name;
    if (category.description !== undefined) existingEntity.description = category.description;
    if (category.color !== undefined) existingEntity.color = category.color;
    if (category.icon !== undefined) existingEntity.icon = category.icon;
    if (category.active !== undefined) existingEntity.active = category.active;
    if (category.sortOrder !== undefined) existingEntity.sort_order = category.sortOrder;

    const updatedEntity = await this.categoryRepository.save(existingEntity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.categoryRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.categoryRepository.count({ where: { id } });
    return count > 0;
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.categoryRepository.count({ where: { name } });
    return count > 0;
  }

  private toEntity(category: Category): CategoryEntity {
    const entity = new CategoryEntity();
    entity.id = category.id;
    entity.name = category.name;
    entity.description = category.description;
    entity.color = category.color;
    entity.icon = category.icon;
    entity.active = category.active;
    entity.sort_order = category.sortOrder;
    entity.created_at = category.createdAt;
    entity.updated_at = category.updatedAt;
    return entity;
  }

  private toDomain(entity: CategoryEntity): Category {
    return new Category(
      entity.id,
      entity.name,
      entity.description,
      entity.color,
      entity.icon,
      entity.active,
      entity.sort_order,
      entity.created_at,
      entity.updated_at,
    );
  }
}
