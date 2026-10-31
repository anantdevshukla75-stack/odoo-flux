import { Router } from 'express';
import HealthController from './health.controller.js';

const router = Router();

router.get('/health', HealthController.check);

export default router;
