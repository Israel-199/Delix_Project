import { prisma } from '../lib/prisma';

export interface ActivePricing {
  baseFare: number;
  perKmRate: number;
  waitingRatePerHour: number;
}

const DEFAULT_PRICING: ActivePricing = {
  baseFare: 300,
  perKmRate: 90,
  waitingRatePerHour: 50,
};

let cachedPricing: ActivePricing = { ...DEFAULT_PRICING };

export const getCachedPricing = (): ActivePricing => cachedPricing;

export const formatPricingFormula = (pricing: ActivePricing) =>
  `${pricing.baseFare} + (distanceKm × ${pricing.perKmRate}) + (waitingHours × ${pricing.waitingRatePerHour})`;

export const refreshPricingCache = async (): Promise<ActivePricing> => {
  try {
    const row = await prisma.pricingSettings.findUnique({ where: { id: 'default' } });
    if (row) {
      cachedPricing = {
        baseFare: row.baseFare,
        perKmRate: row.distanceRatePerKm,
        waitingRatePerHour: row.waitingRatePerHour,
      };
    }
  } catch {
    cachedPricing = { ...DEFAULT_PRICING };
  }

  return cachedPricing;
};

export const updatePricingSettings = async (payload: {
  baseFare: number;
  perKmRate: number;
  waitingRatePerHour: number;
}): Promise<ActivePricing> => {
  const baseFare = Number(payload.baseFare);
  const perKmRate = Number(payload.perKmRate);
  const waitingRatePerHour = Number(payload.waitingRatePerHour);

  if (![baseFare, perKmRate, waitingRatePerHour].every((n) => Number.isFinite(n) && n >= 0)) {
    throw new Error('Pricing values must be non-negative numbers');
  }

  try {
    const row = await prisma.pricingSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        baseFare,
        distanceRatePerKm: perKmRate,
        waitingRatePerHour,
      },
      update: {
        baseFare,
        distanceRatePerKm: perKmRate,
        waitingRatePerHour,
      },
    });

    cachedPricing = {
      baseFare: row.baseFare,
      perKmRate: row.distanceRatePerKm,
      waitingRatePerHour: row.waitingRatePerHour,
    };
  } catch {
    cachedPricing = { baseFare, perKmRate, waitingRatePerHour };
  }

  return cachedPricing;
};
