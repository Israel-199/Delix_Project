import { getCachedPricing } from '../services/pricingService';

export const BASE_FARE_ETB = 300;
export const DISTANCE_RATE_ETB_PER_KM = 90;
export const WAITING_RATE_ETB_PER_HOUR = 50;

export const calculateAuthoritativeFare = (
  distanceKm: number,
  waitingHours = 0
): { priceAmount: number; currency: string; breakdown: { base: number; distance: number; waiting: number } } => {
  const pricing = getCachedPricing();
  const base = pricing.baseFare;
  const distance = Math.round(distanceKm * pricing.perKmRate);
  const waiting = Math.round(waitingHours * pricing.waitingRatePerHour);
  return {
    priceAmount: base + distance + waiting,
    currency: 'ETB',
    breakdown: { base, distance, waiting },
  };
};
