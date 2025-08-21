import { ICategoryRepository } from '../../repositories/ICategoryRepository';

export class GetAllCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute() {
    return await this.categoryRepository.findAll();
  }
}
