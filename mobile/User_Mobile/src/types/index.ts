export type VehicleCategoryId = 'lada' | 'pickup' | 'mini_truck' | 'large_truck';

export type ServiceModelId = 'economy' | 'standard' | 'cargo_plus' | 'heavy_duty';

export interface VehicleCategory {
  id: VehicleCategoryId;
  name: string;
  icon: string;
  eta?: string;
  description?: string;
}

export interface ServiceModel {
  id: ServiceModelId;
  name: string;
  categoryId: VehicleCategoryId;
  price?: number;
  priceLabel?: string;
  eta?: string;
  capacity?: number;
  description?: string;
  recommendedCargo?: string[];
}

export interface VehicleCardData {
  id: string;
  name: string;
  icon?: string;
  imageUri?: string;
  eta?: string;
  price?: number;
  priceLabel?: string;
  capacity?: number;
  description?: string;
  unavailable?: boolean;
}

export type PaymentMethodId = 'cash' | 'telebirr' | 'cbe';

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  icon: string;
}

export type AppBookingState =
  | 'idle'
  | 'selecting_route'
  | 'map_view'
  | 'vehicle_details'
  | 'cargo_info'
  | 'payment'
  | 'searching'
  | 'driver_found'
  | 'in_transit'
  | 'completed';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  address?: string;
  label?: string;
  accuracy?: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapMarkerData {
  id: string;
  coordinate: { latitude: number; longitude: number };
  label?: string;
  type?: 'user' | 'pickup' | 'destination' | 'driver';
  vehicleCategory?: VehicleCategoryId;
}

export interface NearbyDriver {
  id: string;
  coordinate: { latitude: number; longitude: number };
  vehicleCategory: VehicleCategoryId;
  etaMinutes?: number;
}
