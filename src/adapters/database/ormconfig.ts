import { DataSource } from 'typeorm';
import { CategoryEntity } from '../persistence/entities/CategoryEntity';
import { EmailVerificationTokenEntity } from '../persistence/entities/EmailVerificationTokenEntity';
import { RoutineEntity } from '../persistence/entities/RoutineEntity';
import { RoutineTaskEntity } from '../persistence/entities/RoutineTaskEntity';
import { UserEntity } from '../persistence/entities/UserEntity';
import { UserSessionEntity } from '../persistence/entities/UserSessionEntity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: 'root',
  password: 'muycapo123',
  database: 'dev',
  synchronize: false,
  logging: false,
  entities: [UserEntity, UserSessionEntity, EmailVerificationTokenEntity, RoutineEntity, RoutineTaskEntity, CategoryEntity],
  migrations: [],
  subscribers: [],
});
