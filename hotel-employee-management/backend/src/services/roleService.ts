import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export async function listRoles() {
  const roles = await prisma.role.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true } } },
  });

  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    employeeCount: r._count.employees,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function getRoleById(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { employees: true } } },
  });

  if (!role) throw new AppError('Role not found.', 404);

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    employeeCount: role._count.employees,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

export async function createRole(data: { name: string; description?: string | null }) {
  return prisma.role.create({ data });
}

export async function updateRole(id: string, data: { name?: string; description?: string | null }) {
  await getRoleById(id);
  return prisma.role.update({ where: { id }, data });
}

export async function deleteRole(id: string) {
  await getRoleById(id);

  const employeeCount = await prisma.employee.count({ where: { roleId: id } });
  if (employeeCount > 0) {
    throw new AppError('Cannot delete role with assigned employees.', 409);
  }

  await prisma.role.delete({ where: { id } });
}
