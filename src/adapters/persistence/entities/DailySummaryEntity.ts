import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'daily_summaries' })
@Unique(['user_id', 'date_local'])
export class DailySummary {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('char', { length: 36 })
  user_id!: string;

  @Column({ type: 'date' })
  date_local!: string;

  @Column({ type: 'int', default: 0 })
  total_completed!: number;

  @Column({ type: 'int', default: 0 })
  total_missed!: number;

  @Column({ type: 'int', default: 0 })
  total_in_progress!: number;

  @Column({ type: 'int', default: 0 })
  total_pending!: number;

  @Column({ type: 'int', default: 0 })
  total_skipped!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progress_percent!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
