import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const employeeInclude = {
  department: { select: { id: true, name: true } },
  role: { select: { id: true, name: true } },
  shift: { select: { id: true, name: true, startTime: true, endTime: true } },
};

export async function validateEmployeeRefs(departmentId: string, roleId: string, shiftId: string) {
  const [department, role, shift] = await Promise.all([
    prisma.department.findUnique({ where: { id: departmentId } }),
    prisma.role.findUnique({ where: { id: roleId } }),
    prisma.shift.findUnique({ where: { id: shiftId } }),
  ]);

  if (!department) throw new AppError('Department not found.', 404);
  if (!role) throw new AppError('Role not found.', 404);
  if (!shift) throw new AppError('Shift not found.', 404);
}

export async function listEmployees(params: {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  departmentId?: string;
  status?: string;
}) {
  const where: Record<string, unknown> = {};

  if (params.search) {
    where.OR = [
      { firstName: { contains: params.search, mode: 'insensitive' } },
      { lastName: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
      { employeeNumber: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  if (params.departmentId) where.departmentId = params.departmentId;
  if (params.status) where.status = params.status;

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: employeeInclude,
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.limit,
    }),
    prisma.employee.count({ where }),
  ]);

  return { employees, total };
}

export async function getEmployeeById(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: employeeInclude,
  });

  if (!employee) throw new AppError('Employee not found.', 404);
  return employee;
}

export async function createEmployee(data: {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  hireDate: Date;
  departmentId: string;
  roleId: string;
  shiftId: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
}) {
  await validateEmployeeRefs(data.departmentId, data.roleId, data.shiftId);

  return prisma.employee.create({
    data,
    include: employeeInclude,
  });
}

export async function updateEmployee(
  id: string,
  data: Partial<{
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    hireDate: Date;
    departmentId: string;
    roleId: string;
    shiftId: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  }>
) {
  await getEmployeeById(id);

  if (data.departmentId || data.roleId || data.shiftId) {
    const current = await prisma.employee.findUnique({ where: { id } });
    await validateEmployeeRefs(
      data.departmentId || current!.departmentId,
      data.roleId || current!.roleId,
      data.shiftId || current!.shiftId
    );
  }

  return prisma.employee.update({
    where: { id },
    data,
    include: employeeInclude,
  });
}

export async function deleteEmployee(id: string) {
  await getEmployeeById(id);
  await prisma.employee.delete({ where: { id } });
}
