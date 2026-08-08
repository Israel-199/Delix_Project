import { prisma } from '../lib/prisma';

export const resolveCustomerUserId = async (customerRef: string): Promise<string> => {
  const normalizedPhone = customerRef.startsWith('+')
    ? customerRef
    : `+${customerRef.replace(/\D/g, '')}`;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ id: customerRef }, { phone: normalizedPhone }, { phone: customerRef }],
    },
  });

  if (existing) return existing.id;

  const created = await prisma.user.create({
    data: { phone: normalizedPhone },
  });

  return created.id;
};
