import dotenv from 'dotenv';
import 'reflect-metadata';

// Load environment variables first
dotenv.config();

import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppDataSource } from './adapters/database/ormconfig';
import { router } from './adapters/routes';
import { initializeTaskScheduler } from './adapters/scheduler/TaskSchedulerInitializer';
import { errorHandler, handleUncaughtException, handleUnhandledRejection } from './middlewares/ErrorHandler.middleware';

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

const PORT = process.env.PORT || 3000;
const app = express();

// Dynamic CORS configuration for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:4200',
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Needed for some frontend frameworks
  }),
);

// Compression middleware
app.use(compression());

// Logging middleware (only in production)
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Middleware para analizar el cuerpo de las solicitudes como JSON
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');

    // Initialize task scheduler after database connection
    initializeTaskScheduler();

    app.use(router);

    // Global error handler (must be last middleware)
    app.use(errorHandler);
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
    process.exit(1);
  });

app.get('/health', (_, res) => res.send('NotApp backend is running'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
