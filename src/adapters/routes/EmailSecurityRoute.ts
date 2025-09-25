import { Request, Response, Router } from 'express';
import { AuthMiddleware } from '../../middlewares/Auth.middleware';
import { addEmailSecurityHeaders } from '../../middlewares/EmailQuota.middleware';
import { generalRateLimit } from '../../middlewares/RateLimit.middleware';
import { EmailSecurityController } from '../controllers/EmailSecurityController';

const router = Router();

// Controller
const emailSecurityController = new EmailSecurityController();

// Routes - Solo para usuarios autenticados
router.use(AuthMiddleware.authenticate);
router.use(addEmailSecurityHeaders);
router.use(generalRateLimit);

// Estadísticas de seguridad (solo admin)
router.get('/stats', (req: Request, res: Response) => emailSecurityController.getEmailStats(req, res));

// Estado de cuota del usuario actual
router.get('/quota', (req: Request, res: Response) => emailSecurityController.getUserQuotaStatus(req, res));

// Limpieza de datos antiguos (solo admin)
router.post('/cleanup', (req: Request, res: Response) => emailSecurityController.cleanupOldData(req, res));

export { router };
