import { VehicleCategoryId, PaymentMethodId, ServiceModelId } from '../types';
import { CargoCategoryId } from '../constants/cargo';

export const VEHICLE_TO_BACKEND: Record<VehicleCategoryId, string> = {
  lada: 'LADA_BED',
  pickup: 'PICKUP_TRUCK',
  mini_truck: 'MINI_TRUCK',
  large_truck: 'LARGE_TRUCK',
};

export const CARGO_TO_BACKEND: Record<CargoCategoryId, string> = {
  furniture: 'FURNITURE',
  construction: 'CONSTRUCTION_MATERIALS',
  business_goods: 'SHOP_GOODS',
  documents: 'DOCUMENTS',
  electronics: 'OTHER',
  appliances: 'OTHER',
  general: 'OTHER',
};

export const PAYMENT_TO_BACKEND: Record<PaymentMethodId, string> = {
  cash: 'Cash',
  telebirr: 'Telebirr',
  cbe: 'CBE',
};

/** Service model tier multiplier applied on top of backend estimate. */
export const SERVICE_MODEL_MULTIPLIER: Record<ServiceModelId, number> = {
  economy: 1,
  standard: 1.12,
  cargo_plus: 1.25,
  heavy_duty: 1.4,
};

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('251')) return `+${digits}`;
  if (digits.startsWith('0')) return `+251${digits.slice(1)}`;
  return `+251${digits}`;
}

export function formatCurrencyLabel(currency: string, amount: number): string {
  const symbol = currency === 'ETB' || currency === 'Br' ? 'Br' : currency;
  return `${symbol} ~${amount}`;
}

export function formatCurrencyDisplay(currency: string, amount: number): string {
  const symbol = currency === 'ETB' ? 'Br' : currency;
  return `${symbol} ${amount}`;
}
