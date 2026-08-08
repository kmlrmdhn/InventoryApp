export interface Product {
  id: string;
  name: string;
  barcode?: string;
  photoUri?: string;
  category: string;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  initialStock: number;
  soldStock: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  type: 'sale' | 'restock';
  date: string;
  notes?: string;
}

export interface SoldItemDetail {
  id: string;
  name: string;
  soldStock: number;
  unit: string;
  sellPrice: number;
  subtotalRevenue: number;
}

export interface SalesInput {
  id: string;
  amount: number;
  date: string;
}

export interface BatchHistory {
  id: string;
  batchName: string;
  totalModal: number;
  totalRevenue: number;
  netPnl: number;
  totalSoldItems: number;
  isBEP: boolean;
  bepPercent: number;
  completedAt: string;
  soldItems?: SoldItemDetail[];
}

export interface ProductCalculation {
  unitBuyPrice: number;
  totalModal: number;
  totalRevenue: number;
  targetRevenue: number;
  netPnl: number;
  isBEP: boolean;
  remainingToBEP: number;
  itemsToBEP: number;
  bepPercent: number;
  remainingStock: number;
  expectedTotalProfit: number;
  profitPerUnit: number;
  marginPercent: number;
}

export interface DashboardSummary {
  totalProducts: number;
  totalModal: number;
  totalRevenue: number;
  netPnl: number;
  isBEP: boolean;
  remainingToBEP: number;
  bepPercent: number;
  totalSoldItems: number;
  totalRemainingStock: number;
  topProducts: Product[];
}

export interface DashboardItem {
  id: string;
  title: string;
  mode?: 'batch' | 'satuan';
  manualTotalSales?: number | null;
  salesInputs?: SalesInput[];
  products: Product[];
  transactions: Transaction[];
  batchHistory: BatchHistory[];
  customTotalModal: number | null;
  createdAt: string;
}

export const CATEGORIES = [
  'Makanan & Minuman',
  'Elektronik',
  'Pakaian',
  'Kosmetik',
  'Kesehatan',
  'Rumah Tangga',
  'Otomotif',
  'Olahraga',
  'Mainan',
  'Lainnya',
];

export const UNITS = [
  'pcs', 'kg', 'gram', 'liter', 'ml',
  'lusin', 'box', 'pack', 'meter', 'lainnya',
];
