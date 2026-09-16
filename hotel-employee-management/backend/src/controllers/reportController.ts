import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import {
  getAttendanceSummaryReport,
  getDepartmentAttendanceReport,
} from '../services/reportService';

export const attendanceSummary = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  const report = await getAttendanceSummaryReport(startDate, endDate);
  sendSuccess(res, report);
});

export const departmentAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  const report = await getDepartmentAttendanceReport(startDate, endDate);
  sendSuccess(res, report);
});
