import { create } from 'zustand';
import { estimateOrderPrice } from '../services/orderService';
import { getAuthToken } from '../services/apiClient';
import { calculatePrice } from '../constants/serviceModels';
import { CargoCategoryId } from '../constants/cargo';
import {
  NearbyDriver,
  PaymentMethodId,
  ServiceModelId,
  VehicleCategoryId,
  LocationPoint,
} from '../types';

interface BookingState {
  pickupLocation: string;
  destination: string;
  pickupCoordinate: LocationPoint | null;
  destinationCoordinate: LocationPoint | null;
  userCoordinate: LocationPoint | null;
  routeCoordinates: Array<{ latitude: number; longitude: number }>;
  nearbyDrivers: NearbyDriver[];
  vehicleCategoryId: VehicleCategoryId;
  serviceModelId: ServiceModelId | null;
  distanceKm: number;
  travelEta: string;
  arrivalLabel: string;
  arrivalTime: string;
  paymentMethod: PaymentMethodId;
  cargoCategory: CargoCategoryId | null;
  cargoDescription: string;
  specialInstructions: string;
  loadingAssistance: boolean;
  unloadingAssistance: boolean;
  estimatedPrice: number;
  currency: string;
  orderId: string | null;
  isEstimating: boolean;
  estimateError: string | null;
  bookingStatus: 'idle' | 'searching' | 'driver_assigned' | 'in_transit' | 'completed';

  setRoute: (
    pickup: string,
    destination: string,
    options?: { destinationCoordinate?: LocationPoint | null }
  ) => void;
  setPickupLabel: (pickup: string) => void;
  setRouteGeometry: (payload: {
    pickupCoordinate: LocationPoint | null;
    destinationCoordinate: LocationPoint | null;
    userCoordinate?: LocationPoint | null;
    routeCoordinates: Array<{ latitude: number; longitude: number }>;
    distanceKm: number;
    travelEta: string;
    arrivalLabel: string;
    arrivalTime?: string;
    nearbyDrivers?: NearbyDriver[];
  }) => void;
  setVehicleCategory: (id: VehicleCategoryId) => void;
  setServiceModel: (id: ServiceModelId) => void;
  setPaymentMethod: (id: PaymentMethodId) => void;
  setCargoInfo: (info: Partial<Pick<BookingState,
    'cargoCategory' | 'cargoDescription' | 'specialInstructions' |
    'loadingAssistance' | 'unloadingAssistance'
  >>) => void;
  fetchEstimate: (serviceModelId?: ServiceModelId | null) => Promise<void>;
  fetchEstimatesForModels: (
    modelIds: ServiceModelId[]
  ) => Promise<Record<string, { price: number; currency: string }>>;
  setOrderId: (id: string) => void;
  setBookingStatus: (status: BookingState['bookingStatus']) => void;
  reset: () => void;
}

const DEFAULT_PICKUP = 'BL-03-505 Street, Bole';

const initialState = {
  pickupLocation: DEFAULT_PICKUP,
  destination: '',
  pickupCoordinate: null as LocationPoint | null,
  destinationCoordinate: null as LocationPoint | null,
  userCoordinate: null as LocationPoint | null,
  routeCoordinates: [] as Array<{ latitude: number; longitude: number }>,
  nearbyDrivers: [] as NearbyDriver[],
  vehicleCategoryId: 'pickup' as VehicleCategoryId,
  serviceModelId: null as ServiceModelId | null,
  distanceKm: 5.2,
  travelEta: '14 min',
  arrivalLabel: '',
  arrivalTime: '',
  paymentMethod: 'cash' as PaymentMethodId,
  cargoCategory: null as CargoCategoryId | null,
  cargoDescription: '',
  specialInstructions: '',
  loadingAssistance: false,
  unloadingAssistance: false,
  estimatedPrice: 0,
  currency: 'Br',
  orderId: null as string | null,
  isEstimating: false,
  estimateError: null as string | null,
  bookingStatus: 'idle' as BookingState['bookingStatus'],
};

export const useBookingStore = create<BookingState>((set, get) => ({
  ...initialState,

  setRoute: (pickup, destination, options) =>
    set({
      pickupLocation: pickup,
      destination,
      serviceModelId: null,
      estimateError: null,
      routeCoordinates: [],
      pickupCoordinate: null,
      destinationCoordinate: options?.destinationCoordinate ?? null,
      arrivalLabel: '',
      arrivalTime: '',
    }),

  setPickupLabel: (pickup) => set({ pickupLocation: pickup }),

  setRouteGeometry: (payload) => set(payload),

  setVehicleCategory: (id) =>
    set({ vehicleCategoryId: id, serviceModelId: null, estimateError: null }),

  setServiceModel: (id) => {
    set({ serviceModelId: id });
    get().fetchEstimate(id);
  },

  setPaymentMethod: (id) => set({ paymentMethod: id }),

  setCargoInfo: (info) => {
    set(info);
    const { serviceModelId } = get();
    if (serviceModelId) {
      get().fetchEstimate(serviceModelId);
    }
  },

  fetchEstimate: async (serviceModelId) => {
    const state = get();
    const modelId = serviceModelId ?? state.serviceModelId;
    if (!modelId) return;

    set({ isEstimating: true, estimateError: null });

    try {
      const { price, currency } = await estimateOrderPrice(
        {
          vehicleCategoryId: state.vehicleCategoryId,
          distanceKm: state.distanceKm,
          pickupAddress: state.pickupLocation,
          loadingAssistance: state.loadingAssistance,
          unloadingAssistance: state.unloadingAssistance,
          serviceModelId: modelId,
        },
        getAuthToken()
      );
      set({ estimatedPrice: price, currency, isEstimating: false });
    } catch (error) {
      const fallback = calculatePrice(state.distanceKm, modelId);
      set({
        estimatedPrice: fallback.price,
        currency: fallback.currency,
        isEstimating: false,
        estimateError: null,
      });
    }
  },

  fetchEstimatesForModels: async (modelIds) => {
    const state = get();
    const token = getAuthToken();
    const results: Record<string, { price: number; currency: string }> = {};

    await Promise.all(
      modelIds.map(async (modelId) => {
        try {
          const estimate = await estimateOrderPrice(
            {
              vehicleCategoryId: state.vehicleCategoryId,
              distanceKm: state.distanceKm,
              pickupAddress: state.pickupLocation,
              loadingAssistance: state.loadingAssistance,
              unloadingAssistance: state.unloadingAssistance,
              serviceModelId: modelId,
            },
            token
          );
          results[modelId] = estimate;
        } catch {
          results[modelId] = calculatePrice(state.distanceKm, modelId);
        }
      })
    );

    return results;
  },

  setOrderId: (id) => set({ orderId: id }),

  setBookingStatus: (status) => set({ bookingStatus: status }),

  reset: () => set({ ...initialState }),
}));
