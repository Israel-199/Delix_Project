import apiClient from './apiClient';
import {
  CARGO_TO_BACKEND,
  PAYMENT_TO_BACKEND,
  SERVICE_MODEL_MULTIPLIER,
  VEHICLE_TO_BACKEND,
} from '../utils/mappers';
import { CargoCategoryId } from '../constants/cargo';
import { PaymentMethodId, ServiceModelId, VehicleCategoryId } from '../types';

export interface EstimateOrderRequest {
  vehicleCategoryId: VehicleCategoryId;
  distanceKm: number;
  pickupAddress: string;
  loadingAssistance?: boolean;
  unloadingAssistance?: boolean;
  serviceModelId?: ServiceModelId | null;
}

export interface EstimateOrderResponse {
  success: boolean;
  vehicleType: string;
  distanceKm: number;
  estimatedPrice: number;
  currency: string;
}

export interface CreateOrderRequest {
  customerId?: string;
  cargoCategory: CargoCategoryId;
  vehicleCategoryId: VehicleCategoryId;
  serviceModelId?: ServiceModelId | null;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  destinationAddress: string;
  destinationLat?: number;
  destinationLng?: number;
  distanceKm: number;
  loadingAssistance: boolean;
  unloadingAssistance: boolean;
  paymentMethod: PaymentMethodId;
  cargoDescription?: string;
  specialInstructions?: string;
}

export interface OrderRecord {
  id: string;
  customerId: string;
  cargoCategory: string;
  vehicleRequested: string;
  pickupAddress: string;
  destinationAddress: string;
  estimatedPrice: number;
  currency: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order: OrderRecord;
}

export const estimateOrderPrice = async (
  params: EstimateOrderRequest,
  token?: string | null
): Promise<{ price: number; currency: string }> => {
  const vehicleType = VEHICLE_TO_BACKEND[params.vehicleCategoryId];

  const response = await apiClient.post<EstimateOrderResponse>(
    '/orders/estimate',
    {
      vehicleType,
      distanceKm: params.distanceKm,
      pickupAddress: params.pickupAddress,
      loadingAssistance: params.loadingAssistance ?? false,
      unloadingAssistance: params.unloadingAssistance ?? false,
    },
    token
  );

  let price = response.estimatedPrice;
  if (params.serviceModelId) {
    const multiplier = SERVICE_MODEL_MULTIPLIER[params.serviceModelId] ?? 1;
    price = Math.round(price * multiplier);
  }

  const currency = response.currency === 'ETB' ? 'Br' : response.currency;
  return { price, currency };
};

export const createOrder = async (
  params: CreateOrderRequest,
  token?: string | null
): Promise<CreateOrderResponse> => {
  return apiClient.post<CreateOrderResponse>(
    '/orders/create',
    {
      customerId: params.customerId,
      cargoCategory: CARGO_TO_BACKEND[params.cargoCategory],
      vehicleRequested: VEHICLE_TO_BACKEND[params.vehicleCategoryId],
      pickupAddress: params.pickupAddress,
      pickupLat: params.pickupLat ?? 9.0205,
      pickupLng: params.pickupLng ?? 38.7469,
      destinationAddress: params.destinationAddress,
      destinationLat: params.destinationLat ?? 9.0305,
      destinationLng: params.destinationLng ?? 38.7669,
      distanceKm: params.distanceKm,
      loadingAssistance: params.loadingAssistance,
      unloadingAssistance: params.unloadingAssistance,
      paymentMethod: PAYMENT_TO_BACKEND[params.paymentMethod],
      cargoDescription: params.cargoDescription,
      specialInstructions: params.specialInstructions,
      serviceModel: params.serviceModelId,
    },
    token
  );
};
