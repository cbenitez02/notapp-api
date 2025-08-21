import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50, unique: true })
  name!: string;

  @Column({ length: 255, nullable: true })
  description?: string;

  @Column({ length: 7, nullable: true })
  color?: string; // Color en formato hex (#FF5733)

  @Column({ length: 50, nullable: true })
  icon?: string; // Nombre del icono para el frontend

  @Column({ type: 'tinyint', default: 1 })
  active!: boolean;

  @Column({ type: 'int', default: 0 })
  sort_order!: number; // Para ordenar las categorías

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
