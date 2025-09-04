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

  // Método para crear una sola tarea (mantener retrocompatibilidad)
  async execute(routineId: string, userId: string, taskDto: CreateRoutineTaskDto): Promise<RoutineTask> {
    const tasks = await this.executeMultiple(routineId, userId, [taskDto]);
    return tasks[0];
  }

  // Nuevo método para crear múltiples tareas
  async executeMultiple(routineId: string, userId: string, taskDtos: CreateRoutineTaskDto[]): Promise<RoutineTask[]> {
    // Verificar que la rutina existe y pertenece al usuario
    const routine = await this.routineRepository.findById(routineId);
    if (!routine) {
      throw new Error('Routine not found');
    }

    if (routine.userId !== userId) {
      throw new Error('Access denied: routine does not belong to user');
    }

    // Obtener el siguiente sortOrder para las nuevas tareas
    const existingTasks = await this.routineTaskRepository.findByRoutineId(routineId);
    let maxSortOrder = existingTasks.length > 0 ? Math.max(...existingTasks.map((t) => t.sortOrder)) : 0;

    const createdTasks: RoutineTask[] = [];

    // Crear cada tarea
    for (let i = 0; i < taskDtos.length; i++) {
      const taskDto = taskDtos[i];

      // Generar un nuevo ID para la tarea
      const newTaskId = uuidv4();

      // Calcular sortOrder: usar el proporcionado o auto-incrementar
      const sortOrder = taskDto.sortOrder ?? maxSortOrder + 1 + i;

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
        sortOrder,
        new Date(),
        new Date(),
      );

      // Guardar la tarea
      const createdTask = await this.routineTaskRepository.create(newTask);
      createdTasks.push(createdTask);
    }

    return createdTasks;
  }
}
