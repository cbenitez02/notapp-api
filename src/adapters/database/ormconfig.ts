import { DataSource } from 'typeorm';
import { CategoryEntity } from '../persistence/entities/CategoryEntity';
import { DailySummary } from '../persistence/entities/DailySummaryEntity';
import { EmailVerificationTokenEntity } from '../persistence/entities/EmailVerificationTokenEntity';
import { RoutineEntity } from '../persistence/entities/RoutineEntity';
import { RoutineTaskProgressEntity } from '../persistence/entities/RoutineTaskProgressEntity';
import { RoutineTemplateTaskEntity } from '../persistence/entities/RoutineTemplateTaskEntity';
import { UserEntity } from '../persistence/entities/UserEntity';
import { UserSessionEntity } from '../persistence/entities/UserSessionEntity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  logging: false,
  entities: [
    UserEntity,
    UserSessionEntity,
    EmailVerificationTokenEntity,
    RoutineEntity,
    RoutineTemplateTaskEntity,
    RoutineTaskProgressEntity,
    CategoryEntity,
    DailySummary,
  ],
  migrations: [],
  subscribers: [],
});
