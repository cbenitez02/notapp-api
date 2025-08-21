import { Routine } from '../entities/Routine';
import { RoutineFilters } from '../interfaces/routine.interface';

export interface IRoutineRepository {
  save(routine: Routine): Promise<Routine>;
  findById(id: string): Promise<Routine | null>;
  findByUserId(userId: string): Promise<Routine[]>;
  findByFilters(filters: RoutineFilters): Promise<Routine[]>;
  update(id: string, routine: Partial<Routine>): Promise<Routine | null>;
  delete(id: string): Promise<boolean>;
  existsById(id: string): Promise<boolean>;
}
