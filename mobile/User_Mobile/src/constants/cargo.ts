export type CargoCategoryId =
  | 'furniture'
  | 'construction'
  | 'business_goods'
  | 'documents'
  | 'electronics'
  | 'appliances'
  | 'general';

export interface CargoCategory {
  id: CargoCategoryId;
  label: string;
  icon: string;
}

export const CARGO_CATEGORIES: CargoCategory[] = [
  { id: 'furniture', label: 'Furniture', icon: '🪑' },
  { id: 'construction', label: 'Construction', icon: '🧱' },
  { id: 'business_goods', label: 'Business Goods', icon: '📦' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'electronics', label: 'Electronics', icon: '💻' },
  { id: 'appliances', label: 'Appliances', icon: '📺' },
  { id: 'general', label: 'General Cargo', icon: '📦' },
];

import { CargoTypeCategory } from '../types';

export const CARGO_TYPE_CATEGORIES: CargoTypeCategory[] = [
  {
    id: 'small',
    title: 'Small Cargo',
    subtitle: 'Lada, Pickup, Mini Van',
    image: require('../../assets/images/small_cargo.png'),
    vehicles: [
      { id: 'lada', name: 'Lada', icon: '🚕', eta: '2 min', description: 'Small parcel & quick transport', cargoType: 'small', capacity: 4 },
      { id: 'pickup', name: 'Pickup', icon: '🛻', eta: '3 min', description: 'Light cargo & appliances', cargoType: 'small', capacity: 4 },
      { id: 'mini_van', name: 'Mini Van', icon: '🚐', eta: '4 min', description: 'Enclosed small cargo transport', cargoType: 'small', capacity: 6 },
    ],
  },
  {
    id: 'medium',
    title: 'Medium Cargo',
    subtitle: 'Large Pickup, 3 Ton Truck, Light Truck',
    image: require('../../assets/images/medium_cargo.png'),
    vehicles: [
      { id: 'large_pickup', name: 'Large Pickup', icon: '🛻', eta: '4 min', description: 'Extended bed pickup for bulk items', cargoType: 'medium', capacity: 6 },
      { id: '3_ton_truck', name: '3 Ton Truck', icon: '🚚', eta: '5 min', description: 'Medium capacity commercial truck', cargoType: 'medium', capacity: 10 },
      { id: 'light_truck', name: 'Light Truck', icon: '🚚', eta: '6 min', description: 'Box light cargo truck', cargoType: 'medium', capacity: 12 },
    ],
  },
  {
    id: 'large',
    title: 'Large Cargo',
    subtitle: '5 Ton Truck, 10 Ton Truck, Trailer, Container Truck',
    image: require('../../assets/images/large_cargo.png'),
    vehicles: [
      { id: '5_ton_truck', name: '5 Ton Truck', icon: '🚛', eta: '7 min', description: 'Heavy industrial truck', cargoType: 'large', capacity: 15 },
      { id: '10_ton_truck', name: '10 Ton Truck', icon: '🚛', eta: '8 min', description: 'Bulk warehouse truck', cargoType: 'large', capacity: 25 },
      { id: 'trailer', name: 'Trailer', icon: '🚛', eta: '10 min', description: 'Heavy equipment trailer', cargoType: 'large', capacity: 30 },
      { id: 'container_truck', name: 'Container Truck', icon: '📦', eta: '12 min', description: 'Full freight container truck', cargoType: 'large', capacity: 40 },
    ],
  },
];

