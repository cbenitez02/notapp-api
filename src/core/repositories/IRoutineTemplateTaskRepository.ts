import { RoutineTemplateTask } from '../entities/RoutineTemplateTask';

export interface IRoutineTemplateTaskRepository {
  create(task: RoutineTemplateTask): Promise<RoutineTemplateTask>;
  update(task: RoutineTemplateTask): Promise<RoutineTemplateTask>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<RoutineTemplateTask | null>;
  findByRoutineId(routineId: string): Promise<RoutineTemplateTask[]>;
  findByRoutineIds(routineIds: string[]): Promise<RoutineTemplateTask[]>;
  findAll(): Promise<RoutineTemplateTask[]>;
}
