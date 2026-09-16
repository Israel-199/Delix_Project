import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { getDashboardSummary } from '../services/reportService';

export const getSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await getDashboardSummary();
  sendSuccess(res, summary);
});
