import { z } from 'zod';
import { EmployeeStatus } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().email('Valid email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required.').max(100),
  description: z.string().max(500).optional().nullable(),
});

export const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required.').max(100),
  description: z.string().max(500).optional().nullable(),
});

export const shiftSchema = z.object({
  name: z.string().min(1, 'Shift name is required.').max(100),
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().min(1, 'End time is required.'),
  description: z.string().max(500).optional().nullable(),
});

export const employeeSchema = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Valid email is required.'),
  phone: z.string().optional().nullable(),
  hireDate: z.string().min(1, 'Hire date is required.'),
  departmentId: z.string().min(1, 'Department is required.'),
  roleId: z.string().min(1, 'Role is required.'),
  shiftId: z.string().min(1, 'Shift is required.'),
  status: z.nativeEnum(EmployeeStatus).optional(),
});

export const attendanceSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required.'),
  date: z.string().min(1, 'Date is required.'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'LEAVE']),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});
