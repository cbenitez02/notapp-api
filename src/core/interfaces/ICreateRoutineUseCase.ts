import { Routine } from '../entities/Routine';
import { CreateRoutineDto } from '../interfaces/routine.interface';

export interface ICreateRoutineUseCase {
  execute(createRoutineDto: CreateRoutineDto): Promise<Routine>;
}
