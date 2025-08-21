import { IRoutineRepository } from '@core/repositories/IRoutineRepository';
import { Routine } from '../../entities/Routine';

export class GetRoutineByIdUseCase {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(id: string): Promise<Routine | null> {
    if (!id || id.trim().length === 0) {
      throw new Error('Routine ID is required');
    }

    return await this.routineRepository.findById(id.trim());
  }
}
