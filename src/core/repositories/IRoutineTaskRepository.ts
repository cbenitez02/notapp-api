import { RoutineTask } from '../entities/RoutineTask';
import { RoutineTaskFilters } from '../interfaces/routine.interface';

export interface IRoutineTaskRepository {
  save(routineTask: RoutineTask): Promise<RoutineTask>;
  findById(id: string): Promise<RoutineTask | null>;
  findByUserId(userId: string): Promise<RoutineTask[]>;
  findByRoutineId(routineId: string): Promise<RoutineTask[]>;
  findByUserAndDate(userId: string, dateLocal: string): Promise<RoutineTask[]>;
  findByFilters(filters: RoutineTaskFilters): Promise<RoutineTask[]>;
  update(id: string, routineTask: Partial<RoutineTask>): Promise<RoutineTask | null>;
  delete(id: string): Promise<boolean>;
  existsById(id: string): Promise<boolean>;
  existsByRoutineAndDate(routineId: string, dateLocal: string): Promise<boolean>;
}
