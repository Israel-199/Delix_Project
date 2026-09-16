import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as shiftController from '../controllers/shiftController';

const router = Router();

router.use(authenticate);
router.get('/', shiftController.listShifts);
router.get('/:id', shiftController.getShift);
router.post('/', shiftController.createShift);
router.put('/:id', shiftController.updateShift);
router.delete('/:id', shiftController.deleteShift);

export default router;
