import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { departmentSchema } from '../utils/validation';
import * as departmentService from '../services/departmentService';

export const listDepartments = asyncHandler(async (_req: Request, res: Response) => {
  const departments = await departmentService.listDepartments();
  sendSuccess(res, departments);
});

export const getDepartment = asyncHandler(async (req: Request, res: Response) => {
  const department = await departmentService.getDepartmentById(req.params.id);
  sendSuccess(res, department);
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const data = departmentSchema.parse(req.body);
  const department = await departmentService.createDepartment(data);
  sendSuccess(res, department, 201);
});

export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const data = departmentSchema.partial().parse(req.body);
  const department = await departmentService.updateDepartment(req.params.id, data);
  sendSuccess(res, department);
});

export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  await departmentService.deleteDepartment(req.params.id);
  sendSuccess(res, { message: 'Department deleted successfully.' });
});
