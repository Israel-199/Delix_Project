import { VehicleCategory, PaymentMethod } from '../types';

export const VEHICLE_CATEGORIES: VehicleCategory[] = [
  { id: 'lada', name: 'Lada', icon: '🚕', eta: '2 min', description: 'Taxi & small parcel transport' },
  { id: 'pickup', name: 'Pickup', icon: '🛻', eta: '3 min', description: 'Medium cargo & appliances' },
  { id: 'mini_truck', name: 'Mini truck', icon: '🚚', eta: '4 min', description: 'Heavy furniture & bulk goods' },
  { id: 'large_truck', name: 'Large truck', icon: '🚛', eta: '8 min', description: 'Industrial & warehouse cargo' },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'telebirr', label: 'Telebirr', icon: '📱' },
  { id: 'cbe', label: 'CBE', icon: '🏦' },
];

/** Default map region — Addis Ababa, Ethiopia */
export const DEFAULT_MAP_REGION = {
  latitude: 9.0205,
  longitude: 38.7469,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
} as const;

export const SOCKET_URL = 'http://10.0.2.2:5000';

export const BASE_RATE_ETB_PER_KM = 150;

export { RECENT_LOCATIONS } from './locations';
export type { RecentLocation } from './locations';
export { CARGO_CATEGORIES } from './cargo';
export type { CargoCategory, CargoCategoryId } from './cargo';
export {
  SERVICE_MODELS,
  getServiceModelsForCategory,
  calculatePrice,
  findServiceModel,
} from './serviceModels';
