import { AttendanceStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const attendanceInclude = {
  employee: {
    select: {
      id: true,
      employeeNumber: true,
      firstName: true,
      lastName: true,
      department: { select: { id: true, name: true } },
    },
  },
};

export async function listAttendance(params: {
  page: number;
  limit: number;
  skip: number;
  date?: string;
  employeeId?: string;
  status?: AttendanceStatus;
}) {
  const where: Record<string, unknown> = {};

  if (params.date) {
    const date = new Date(params.date);
    date.setUTCHours(0, 0, 0, 0);
    where.date = date;
  }

  if (params.employeeId) where.employeeId = params.employeeId;
  if (params.status) where.status = params.status;

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: attendanceInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: params.skip,
      take: params.limit,
    }),
    prisma.attendance.count({ where }),
  ]);

  return { records, total };
}

export async function getAttendanceById(id: string) {
  const record = await prisma.attendance.findUnique({
    where: { id },
    include: attendanceInclude,
  });

  if (!record) throw new AppError('Attendance record not found.', 404);
  return record;
}

export async function createAttendance(data: {
  employeeId: string;
  date: Date;
  status: AttendanceStatus;
  checkIn?: string | null;
  checkOut?: string | null;
  notes?: string | null;
}) {
  const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
  if (!employee) throw new AppError('Employee not found.', 404);

  return prisma.attendance.create({
    data,
    include: attendanceInclude,
  });
}

export async function updateAttendance(
  id: string,
  data: Partial<{
    employeeId: string;
    date: Date;
    status: AttendanceStatus;
    checkIn: string | null;
    checkOut: string | null;
    notes: string | null;
  }>
) {
  await getAttendanceById(id);

  if (data.employeeId) {
    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new AppError('Employee not found.', 404);
  }

  return prisma.attendance.update({
    where: { id },
    data,
    include: attendanceInclude,
  });
}

export async function deleteAttendance(id: string) {
  await getAttendanceById(id);
  await prisma.attendance.delete({ where: { id } });
}
