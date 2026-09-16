import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as roleController from '../controllers/roleController';

const router = Router();

router.use(authenticate);
router.get('/', roleController.listRoles);
router.get('/:id', roleController.getRole);
router.post('/', roleController.createRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

export default router;
