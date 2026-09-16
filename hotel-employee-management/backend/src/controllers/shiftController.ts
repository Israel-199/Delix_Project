import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { shiftSchema } from '../utils/validation';
import * as shiftService from '../services/shiftService';

export const listShifts = asyncHandler(async (_req: Request, res: Response) => {
  const shifts = await shiftService.listShifts();
  sendSuccess(res, shifts);
});

export const getShift = asyncHandler(async (req: Request, res: Response) => {
  const shift = await shiftService.getShiftById(req.params.id);
  sendSuccess(res, shift);
});

export const createShift = asyncHandler(async (req: Request, res: Response) => {
  const data = shiftSchema.parse(req.body);
  const shift = await shiftService.createShift(data);
  sendSuccess(res, shift, 201);
});

export const updateShift = asyncHandler(async (req: Request, res: Response) => {
  const data = shiftSchema.partial().parse(req.body);
  const shift = await shiftService.updateShift(req.params.id, data);
  sendSuccess(res, shift);
});

export const deleteShift = asyncHandler(async (req: Request, res: Response) => {
  await shiftService.deleteShift(req.params.id);
  sendSuccess(res, { message: 'Shift deleted successfully.' });
});
