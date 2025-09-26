import { Router } from 'express';

export const router = Router();

// Function to load all routes dynamically and return a promise when all are loaded
export async function initializeRoutes(): Promise<void> {
  const routeConfigs = [
    { path: '/auth', module: './AuthRoute', export: 'router', name: 'auth' },
    { path: '/categories', module: './CategoryRoute', export: 'router', name: 'category' },
    { path: '/email-security', module: './EmailSecurityRoute', export: 'router', name: 'emailsecurity' },
    { path: '/email-verification', module: './EmailVerificationRoute', export: 'router', name: 'emailverification' },
    { path: '/google-calendar', module: './GoogleCalendarRoute', export: 'router', name: 'googlecalendar' },
    { path: '/password-reset', module: './PasswordResetRoute', export: 'router', name: 'passwordreset' },
    { path: '/routines', module: './RoutineRoute', export: 'router', name: 'routine' },
    { path: '/user-sessions', module: './UserSessionRoute', export: 'router', name: 'usersession' },
    { path: '/users', module: './UsersRoute', export: 'router', name: 'users' },
  ];

  console.log('🔄 Loading routes dynamically...');

  // Load all routes in parallel
  const routePromises = routeConfigs.map(async (config) => {
    try {
      const module = await import(config.module);
      const routeHandler = module[config.export];

      if (routeHandler) {
        router.use(config.path, routeHandler);
        console.log(`✓ ${config.name} route loaded at ${config.path}`);
        return config.name;
      } else {
        console.warn(`⚠ Warning: ${config.export} not found in ${config.module}`);
        throw new Error(`Route export not found: ${config.export} in ${config.module}`);
      }
    } catch (error) {
      console.error(`✗ Error loading ${config.name} route:`, error);
      throw error; // Re-throw to fail fast if any route fails to load
    }
  });

  // Wait for all routes to load
  const loadedRoutes = await Promise.all(routePromises);
  console.log(`🎯 All ${loadedRoutes.length} routes loaded successfully`);
}
