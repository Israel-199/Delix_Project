import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { normalizeEmail } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

export async function loginAdmin(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const admin = await prisma.admin.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
  });

  if (!admin) {
    throw new AppError('Invalid email or password.', 401);
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password.', 401);
  }

  return { id: admin.id, email: admin.email };
}

export async function getAdminById(id: string) {
  const admin = await prisma.admin.findUnique({
    where: { id },
    select: { id: true, email: true },
  });

  if (!admin) {
    throw new AppError('Admin not found.', 404);
  }

  return admin;
}

export async function ensureAdminExists() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment.');
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = await prisma.admin.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
  });

  if (existing) return existing;

  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.admin.create({
    data: { email: normalizedEmail, passwordHash },
  });
}
