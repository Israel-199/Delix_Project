import { create } from 'zustand';
import { calculatePrice } from '../constants/serviceModels';
import {
  PaymentMethodId,
  ServiceModelId,
  VehicleCategoryId,
} from '../types';
import { CargoCategoryId } from '../constants/cargo';

interface BookingState {
  pickupLocation: string;
  destination: string;
  vehicleCategoryId: VehicleCategoryId;
  serviceModelId: ServiceModelId | null;
  distanceKm: number;
  travelEta: string;
  paymentMethod: PaymentMethodId;
  cargoCategory: CargoCategoryId | null;
  cargoDescription: string;
  specialInstructions: string;
  loadingAssistance: boolean;
  unloadingAssistance: boolean;
  estimatedPrice: number;
  currency: string;
  orderId: string | null;
  bookingStatus: 'idle' | 'searching' | 'driver_assigned' | 'in_transit' | 'completed';

  setRoute: (pickup: string, destination: string) => void;
  setVehicleCategory: (id: VehicleCategoryId) => void;
  setServiceModel: (id: ServiceModelId) => void;
  setPaymentMethod: (id: PaymentMethodId) => void;
  setCargoInfo: (info: Partial<Pick<BookingState,
    'cargoCategory' | 'cargoDescription' | 'specialInstructions' |
    'loadingAssistance' | 'unloadingAssistance'
  >>) => void;
  recalculatePrice: () => void;
  setOrderId: (id: string) => void;
  setBookingStatus: (status: BookingState['bookingStatus']) => void;
  reset: () => void;
}

const DEFAULT_PICKUP = 'BL-03-505 Street, Bole';

const initialState = {
  pickupLocation: DEFAULT_PICKUP,
  destination: '',
  vehicleCategoryId: 'pickup' as VehicleCategoryId,
  serviceModelId: null as ServiceModelId | null,
  distanceKm: 5.2,
  travelEta: '14 min',
  paymentMethod: 'cash' as PaymentMethodId,
  cargoCategory: null as CargoCategoryId | null,
  cargoDescription: '',
  specialInstructions: '',
  loadingAssistance: false,
  unloadingAssistance: false,
  estimatedPrice: 0,
  currency: 'Br',
  orderId: null as string | null,
  bookingStatus: 'idle' as BookingState['bookingStatus'],
};

export const useBookingStore = create<BookingState>((set, get) => ({
  ...initialState,

  setRoute: (pickup, destination) =>
    set({ pickupLocation: pickup, destination, serviceModelId: null }),

  setVehicleCategory: (id) =>
    set({ vehicleCategoryId: id, serviceModelId: null }),

  setServiceModel: (id) => {
    set({ serviceModelId: id });
    get().recalculatePrice();
  },

  setPaymentMethod: (id) => set({ paymentMethod: id }),

  setCargoInfo: (info) => set(info),

  recalculatePrice: () => {
    const { distanceKm, serviceModelId, pickupLocation } = get();
    if (!serviceModelId) return;
    const isDjibouti = pickupLocation.toLowerCase().includes('djibouti');
    const { price, currency } = calculatePrice(distanceKm, serviceModelId, isDjibouti);
    set({ estimatedPrice: price, currency });
  },

  setOrderId: (id) => set({ orderId: id }),

  setBookingStatus: (status) => set({ bookingStatus: status }),

  reset: () => set({ ...initialState }),
}));
