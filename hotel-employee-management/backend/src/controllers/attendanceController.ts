import { Request, Response } from 'express';
import { AttendanceStatus } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import {
  buildPaginationMeta,
  getPagination,
  parseDateOnly,
  sendPaginated,
  sendSuccess,
} from '../utils/response';
import { attendanceSchema } from '../utils/validation';
import * as attendanceService from '../services/attendanceService';

export const listAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query as { page?: string; limit?: string });
  const { date, employeeId, status } = req.query as {
    date?: string;
    employeeId?: string;
    status?: AttendanceStatus;
  };

  const { records, total } = await attendanceService.listAttendance({
    page,
    limit,
    skip,
    date,
    employeeId,
    status,
  });

  sendPaginated(res, records, buildPaginationMeta(page, limit, total));
});

export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const record = await attendanceService.getAttendanceById(req.params.id);
  sendSuccess(res, record);
});

export const createAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = attendanceSchema.parse(req.body);
  const record = await attendanceService.createAttendance({
    ...data,
    date: parseDateOnly(data.date),
    status: data.status as AttendanceStatus,
  });
  sendSuccess(res, record, 201);
});

export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = attendanceSchema.partial().parse(req.body);
  const updateData: Record<string, unknown> = { ...data };
  if (data.date) updateData.date = parseDateOnly(data.date);
  if (data.status) updateData.status = data.status as AttendanceStatus;

  const record = await attendanceService.updateAttendance(req.params.id, updateData);
  sendSuccess(res, record);
});

export const deleteAttendance = asyncHandler(async (req: Request, res: Response) => {
  await attendanceService.deleteAttendance(req.params.id);
  sendSuccess(res, { message: 'Attendance record deleted successfully.' });
});
