import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { clearAuthCookie, optionalAuth, setAuthCookie, signToken } from '../middleware/auth';
import { loginSchema } from '../utils/validation';
import { sendSuccess } from '../utils/response';
import * as authService from '../services/authService';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const admin = await authService.loginAdmin(email, password);
  const token = signToken({ id: admin.id, email: admin.email });
  setAuthCookie(res, token);
  sendSuccess(res, { id: admin.id, email: admin.email });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.admin) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  const admin = await authService.getAdminById(req.admin.id);
  sendSuccess(res, admin);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  sendSuccess(res, { message: 'Logged out successfully.' });
});

export const meMiddleware = optionalAuth;
