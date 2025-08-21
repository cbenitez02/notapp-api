import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import 'reflect-metadata';
import { AppDataSource } from './adapters/database/ormconfig';
import { router } from './adapters/routes';

dotenv.config({ quiet: true });
const PORT = process.env.PORT || 3000;
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  }),
);

// Middleware para analizar el cuerpo de las solicitudes como JSON
app.use(express.json());
app.use(cookieParser());

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');

    app.use(router);
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });

app.get('/health', (_, res) => res.send('NotApp backend is running'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
