import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as departmentController from '../controllers/departmentController';

const router = Router();

router.use(authenticate);
router.get('/', departmentController.listDepartments);
router.get('/:id', departmentController.getDepartment);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

export default router;
