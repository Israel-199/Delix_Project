import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as reportController from '../controllers/reportController';

const router = Router();

router.use(authenticate);
router.get('/attendance-summary', reportController.attendanceSummary);
router.get('/department-attendance', reportController.departmentAttendance);

export default router;
