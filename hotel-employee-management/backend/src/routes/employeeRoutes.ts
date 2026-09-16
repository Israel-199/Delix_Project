import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as employeeController from '../controllers/employeeController';

const router = Router();

router.use(authenticate);
router.get('/', employeeController.listEmployees);
router.get('/:id', employeeController.getEmployee);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

export default router;
