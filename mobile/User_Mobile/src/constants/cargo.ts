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
