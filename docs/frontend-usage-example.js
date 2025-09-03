// Ejemplo de cómo usar la nueva funcionalidad desde el frontend

// 1. Obtener rutinas para el selector
const getRoutinesForSelector = async () => {
  try {
    const response = await fetch('/routines/user/selector', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.success) {
      return result.data; // Array de rutinas para el selector
    }
  } catch (error) {
    console.error('Error fetching routines for selector:', error);
  }
};

// 2. Crear una nueva tarea en una rutina específica
const createTaskInRoutine = async (routineId, taskData) => {
  try {
    const response = await fetch(`/routines/${routineId}/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    const result = await response.json();

    if (result.success) {
      return result.data; // Nueva tarea creada
    } else {
      // Manejar errores de validación
      console.error('Validation errors:', result.errors);
    }
  } catch (error) {
    console.error('Error creating task:', error);
  }
};

// Ejemplo de uso completo
const exampleUsage = async () => {
  // 1. Obtener rutinas para mostrar en el selector
  const routines = await getRoutinesForSelector();
  console.log('Available routines:', routines);

  // 2. Crear una nueva tarea en la primera rutina
  if (routines && routines.length > 0) {
    const selectedRoutineId = routines[0].id;

    const newTaskData = {
      title: 'Nueva tarea de ejemplo',
      timeLocal: '08:00:00',
      durationMin: 30,
      priority: 'Alta',
      description: 'Esta es una tarea de ejemplo creada mediante la API',
    };

    const createdTask = await createTaskInRoutine(selectedRoutineId, newTaskData);
    console.log('Task created:', createdTask);
  }
};

// Componente React de ejemplo
import { useEffect, useState } from 'react';

const CreateTaskForm = () => {
  const [routines, setRoutines] = useState([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState('');
  const [taskData, setTaskData] = useState({
    title: '',
    timeLocal: '',
    durationMin: '',
    priority: 'Media',
    description: '',
  });

  useEffect(() => {
    // Cargar rutinas al montar el componente
    const loadRoutines = async () => {
      const routinesList = await getRoutinesForSelector();
      setRoutines(routinesList || []);
    };

    loadRoutines();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRoutineId) {
      alert('Por favor selecciona una rutina');
      return;
    }

    const createdTask = await createTaskInRoutine(selectedRoutineId, taskData);

    if (createdTask) {
      alert('Tarea creada exitosamente!');
      // Resetear formulario o redirigir
      setTaskData({
        title: '',
        timeLocal: '',
        durationMin: '',
        priority: 'Media',
        description: '',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Rutina:</label>
        <select value={selectedRoutineId} onChange={(e) => setSelectedRoutineId(e.target.value)} required>
          <option value="">Seleccionar rutina...</option>
          {routines.map((routine) => (
            <option key={routine.id} value={routine.id}>
              {routine.title} ({routine.taskCount} tareas)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Título de la tarea:</label>
        <input
          type="text"
          value={taskData.title}
          onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
          required
          minLength="2"
          maxLength="120"
        />
      </div>

      <div>
        <label>Hora (opcional):</label>
        <input type="time" value={taskData.timeLocal} onChange={(e) => setTaskData({ ...taskData, timeLocal: e.target.value + ':00' })} />
      </div>

      <div>
        <label>Duración en minutos (opcional):</label>
        <input
          type="number"
          min="1"
          max="1440"
          value={taskData.durationMin}
          onChange={(e) => setTaskData({ ...taskData, durationMin: parseInt(e.target.value) })}
        />
      </div>

      <div>
        <label>Prioridad:</label>
        <select value={taskData.priority} onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}>
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
        </select>
      </div>

      <div>
        <label>Descripción (opcional):</label>
        <textarea value={taskData.description} onChange={(e) => setTaskData({ ...taskData, description: e.target.value })} maxLength="500" />
      </div>

      <button type="submit">Crear Tarea</button>
    </form>
  );
};

export default CreateTaskForm;
