import { Request, Response } from 'express';
import { EmployeeStatus } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import {
  buildPaginationMeta,
  getPagination,
  parseDateOnly,
  sendPaginated,
  sendSuccess,
} from '../utils/response';
import { employeeSchema } from '../utils/validation';
import * as employeeService from '../services/employeeService';

export const listEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query as { page?: string; limit?: string });
  const { search, departmentId, status } = req.query as {
    search?: string;
    departmentId?: string;
    status?: string;
  };

  const { employees, total } = await employeeService.listEmployees({
    page,
    limit,
    skip,
    search,
    departmentId,
    status,
  });

  sendPaginated(res, employees, buildPaginationMeta(page, limit, total));
});

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await employeeService.getEmployeeById(req.params.id);
  sendSuccess(res, employee);
});

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const data = employeeSchema.parse(req.body);
  const employee = await employeeService.createEmployee({
    ...data,
    hireDate: parseDateOnly(data.hireDate),
    status: (data.status as EmployeeStatus) || EmployeeStatus.ACTIVE,
  });
  sendSuccess(res, employee, 201);
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const data = employeeSchema.partial().parse(req.body);
  const updateData: Record<string, unknown> = { ...data };
  if (data.hireDate) updateData.hireDate = parseDateOnly(data.hireDate);

  const employee = await employeeService.updateEmployee(req.params.id, updateData);
  sendSuccess(res, employee);
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  await employeeService.deleteEmployee(req.params.id);
  sendSuccess(res, { message: 'Employee deleted successfully.' });
});
