import { ServiceModel, VehicleCategoryId } from '../types';
import { BASE_RATE_ETB_PER_KM } from './index';

const MODEL_MULTIPLIERS = {
  economy: 1,
  standard: 1.12,
  cargo_plus: 1.25,
  heavy_duty: 1.4,
} as const;

export const SERVICE_MODELS: ServiceModel[] = [
  {
    id: 'economy',
    name: 'Economy',
    categoryId: 'lada',
    eta: '2 min',
    capacity: 4,
    description: 'Affordable city ride',
    recommendedCargo: ['Small parcels', 'Luggage'],
  },
  {
    id: 'standard',
    name: 'Standard',
    categoryId: 'lada',
    eta: '3 min',
    capacity: 4,
    description: 'Comfortable ride',
    recommendedCargo: ['Boxes', 'Personal items'],
  },
  {
    id: 'economy',
    name: 'Economy',
    categoryId: 'pickup',
    eta: '3 min',
    capacity: 4,
    description: 'The most affordable class',
    recommendedCargo: ['Documents', 'Small packages'],
  },
  {
    id: 'standard',
    name: 'Standard',
    categoryId: 'pickup',
    eta: '4 min',
    capacity: 4,
    description: 'Balanced price and capacity',
    recommendedCargo: ['Appliances', 'Furniture'],
  },
  {
    id: 'cargo_plus',
    name: 'Cargo Plus',
    categoryId: 'pickup',
    eta: '5 min',
    capacity: 6,
    description: 'Extra loading space',
    recommendedCargo: ['Bulk goods', 'Office equipment'],
  },
  {
    id: 'economy',
    name: 'Economy',
    categoryId: 'mini_truck',
    eta: '4 min',
    capacity: 8,
    description: 'Affordable medium loads',
    recommendedCargo: ['Furniture', 'Building tools'],
  },
  {
    id: 'standard',
    name: 'Standard',
    categoryId: 'mini_truck',
    eta: '5 min',
    capacity: 10,
    description: 'Reliable for heavy items',
    recommendedCargo: ['Construction materials', 'Appliances'],
  },
  {
    id: 'heavy_duty',
    name: 'Heavy Duty',
    categoryId: 'mini_truck',
    eta: '6 min',
    capacity: 12,
    description: 'Maximum mini-truck capacity',
    recommendedCargo: ['Bulk furniture', 'Warehouse goods'],
  },
  {
    id: 'economy',
    name: 'Economy',
    categoryId: 'large_truck',
    eta: '8 min',
    capacity: 20,
    description: 'Cost-effective large loads',
    recommendedCargo: ['Industrial cargo', 'Pallets'],
  },
  {
    id: 'standard',
    name: 'Standard',
    categoryId: 'large_truck',
    eta: '9 min',
    capacity: 24,
    description: 'Commercial-grade transport',
    recommendedCargo: ['Warehouse transport', 'Heavy materials'],
  },
  {
    id: 'heavy_duty',
    name: 'Heavy Duty',
    categoryId: 'large_truck',
    eta: '10 min',
    capacity: 30,
    description: 'Maximum large-truck capacity',
    recommendedCargo: ['Industrial equipment', 'Full truck loads'],
  },
];

export const getServiceModelsForCategory = (categoryId: VehicleCategoryId): ServiceModel[] => {
  const direct = SERVICE_MODELS.filter((m) => m.categoryId === categoryId);
  if (direct.length > 0) return direct;

  return [
    {
      id: 'economy',
      name: 'Economy',
      categoryId,
      eta: '3 min',
      capacity: 4,
      description: 'Standard affordable option',
      recommendedCargo: ['General cargo', 'Boxes'],
    },
    {
      id: 'standard',
      name: 'Standard',
      categoryId,
      eta: '4 min',
      capacity: 6,
      description: 'Reliable express option',
      recommendedCargo: ['Commercial goods', 'Heavy items'],
    },
    {
      id: 'cargo_plus',
      name: 'Cargo Plus',
      categoryId,
      eta: '5 min',
      capacity: 10,
      description: 'Extra capacity option',
      recommendedCargo: ['Bulk cargo', 'Equipment'],
    },
  ];
};

/** Client-side fallback when backend estimate is unavailable. Matches 300 + 90×km. */
export const calculatePrice = (
  distanceKm: number,
  serviceModelId: ServiceModel['id'],
  _isDjibouti = false
): { price: number; currency: string } => {
  const multiplier = MODEL_MULTIPLIERS[serviceModelId as keyof typeof MODEL_MULTIPLIERS] ?? 1;
  const price = Math.round((300 + distanceKm * 90) * multiplier);
  return { price, currency: 'Br' };
};

export const getServiceModelKey = (categoryId: VehicleCategoryId, modelId: ServiceModel['id']) =>
  `${categoryId}-${modelId}`;

export const findServiceModel = (
  categoryId: VehicleCategoryId,
  modelId: ServiceModel['id']
): ServiceModel | undefined => {
  const found = SERVICE_MODELS.find((m) => m.categoryId === categoryId && m.id === modelId);
  if (found) return found;
  const defaults = getServiceModelsForCategory(categoryId);
  return defaults.find((m) => m.id === modelId) ?? defaults[0];
};

