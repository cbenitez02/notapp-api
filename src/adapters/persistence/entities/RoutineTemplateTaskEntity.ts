import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RoutinePriority } from '../../../core/interfaces/routine.interface';
import { CategoryEntity } from './CategoryEntity';
import { RoutineEntity } from './RoutineEntity';

@Entity({ name: 'routine_template_tasks' })
@Index(['routine_id', 'sort_order'])
export class RoutineTemplateTaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => RoutineEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routine_id' })
  routine!: RoutineEntity;

  @Column('char', { length: 36 })
  routine_id!: string;

  @Column({ length: 120 })
  title!: string;

  @Column({ type: 'time', nullable: true })
  time_local?: string;

  @Column({ type: 'smallint', nullable: true })
  duration_min?: number;

  @ManyToOne(() => CategoryEntity, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: CategoryEntity;

  @Column('char', { length: 36, nullable: true })
  category_id?: string;

  @Column({ type: 'enum', enum: RoutinePriority, default: RoutinePriority.MEDIA })
  priority!: RoutinePriority;

  @Column({ length: 500, nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  sort_order!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
