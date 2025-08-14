import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column()
  fullname!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: ['buyer', 'seller', 'both', 'admin'], default: 'buyer' })
  role!: 'buyer' | 'seller' | 'both' | 'admin';

  @Column({ default: false, name: 'email_verified' })
  emailVerified!: boolean;

  @Column({ default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
