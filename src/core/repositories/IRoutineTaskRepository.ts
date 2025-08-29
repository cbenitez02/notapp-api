import { RoutineTask } from '../entities/RoutineTask';

export interface IRoutineTaskRepository {
  create(task: RoutineTask): Promise<RoutineTask>;
  update(task: RoutineTask): Promise<RoutineTask>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<RoutineTask | null>;
  findByRoutineId(routineId: string): Promise<RoutineTask[]>;
  findByRoutineIds(routineIds: string[]): Promise<RoutineTask[]>;
  findAll(): Promise<RoutineTask[]>;
}
