import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as attendanceController from '../controllers/attendanceController';

const router = Router();

router.use(authenticate);
router.get('/', attendanceController.listAttendance);
router.get('/:id', attendanceController.getAttendance);
router.post('/', attendanceController.createAttendance);
router.put('/:id', attendanceController.updateAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

export default router;
