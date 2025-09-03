import { v4 as uuidv4 } from 'uuid';
import { RoutineTask } from '../../entities/RoutineTask';
import { CreateRoutineTaskDto, RoutinePriority } from '../../interfaces/routine.interface';
import { IRoutineRepository } from '../../repositories/IRoutineRepository';
import { IRoutineTaskRepository } from '../../repositories/IRoutineTaskRepository';

export class CreateTaskInRoutineUseCase {
  constructor(
    private readonly routineRepository: IRoutineRepository,
    private readonly routineTaskRepository: IRoutineTaskRepository,
  ) {}

  async execute(routineId: string, userId: string, taskDto: CreateRoutineTaskDto): Promise<RoutineTask> {
    // Verificar que la rutina existe y pertenece al usuario
    const routine = await this.routineRepository.findById(routineId);
    if (!routine) {
      throw new Error('Routine not found');
    }

    if (routine.userId !== userId) {
      throw new Error('Access denied: routine does not belong to user');
    }

    // Obtener el siguiente sortOrder para la nueva tarea
    const existingTasks = await this.routineTaskRepository.findByRoutineId(routineId);
    const maxSortOrder = existingTasks.length > 0 ? Math.max(...existingTasks.map((t) => t.sortOrder)) : 0;

    // Generar un nuevo ID para la tarea
    const newTaskId = uuidv4();

    // Crear la nueva tarea
    const newTask = new RoutineTask(
      newTaskId,
      routineId,
      routine.title, // routineName
      taskDto.title,
      taskDto.timeLocal || routine.defaultTimeLocal,
      taskDto.durationMin,
      taskDto.categoryId,
      undefined, // category - se resolverá en el repository
      taskDto.priority || RoutinePriority.MEDIA,
      taskDto.description,
      taskDto.sortOrder || maxSortOrder + 1,
      new Date(),
      new Date(),
    );

    // Guardar la tarea
    const createdTask = await this.routineTaskRepository.create(newTask);

    return createdTask;
  }
}
