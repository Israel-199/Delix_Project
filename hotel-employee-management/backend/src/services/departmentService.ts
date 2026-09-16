import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export async function listDepartments() {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true } } },
  });

  return departments.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    employeeCount: d._count.employees,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
}

export async function getDepartmentById(id: string) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { employees: true } } },
  });

  if (!department) throw new AppError('Department not found.', 404);

  return {
    id: department.id,
    name: department.name,
    description: department.description,
    employeeCount: department._count.employees,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
  };
}

export async function createDepartment(data: { name: string; description?: string | null }) {
  return prisma.department.create({ data });
}

export async function updateDepartment(
  id: string,
  data: { name?: string; description?: string | null }
) {
  await getDepartmentById(id);
  return prisma.department.update({ where: { id }, data });
}

export async function deleteDepartment(id: string) {
  await getDepartmentById(id);

  const employeeCount = await prisma.employee.count({ where: { departmentId: id } });
  if (employeeCount > 0) {
    throw new AppError('Cannot delete department with assigned employees.', 409);
  }

  await prisma.department.delete({ where: { id } });
}
