import { IRoutineRepository } from '@core/repositories/IRoutineRepository';

export class DeleteRoutineUseCase {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(id: string): Promise<boolean> {
    if (!id || id.trim().length === 0) {
      throw new Error('Routine ID is required');
    }

    const exists = await this.routineRepository.existsById(id.trim());
    if (!exists) {
      throw new Error('Routine not found');
    }

    return await this.routineRepository.delete(id.trim());
  }
}
