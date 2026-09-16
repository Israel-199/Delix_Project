import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { roleSchema } from '../utils/validation';
import * as roleService from '../services/roleService';

export const listRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await roleService.listRoles();
  sendSuccess(res, roles);
});

export const getRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await roleService.getRoleById(req.params.id);
  sendSuccess(res, role);
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const data = roleSchema.parse(req.body);
  const role = await roleService.createRole(data);
  sendSuccess(res, role, 201);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const data = roleSchema.partial().parse(req.body);
  const role = await roleService.updateRole(req.params.id, data);
  sendSuccess(res, role);
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  await roleService.deleteRole(req.params.id);
  sendSuccess(res, { message: 'Role deleted successfully.' });
});
