import React, { ReactNode } from 'react';
import { useProductStore } from '../store/useProductStore';
import type { Product, DashboardSummary } from '../types';

export function ProductProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useProducts() {
  const dashboards = useProductStore((state) => state.dashboards);
  const activeDashboardId = useProductStore((state) => state.activeDashboardId);
  const products = useProductStore((state) => state.products);
  const transactions = useProductStore((state) => state.transactions);
  const batchHistory = useProductStore((state) => state.batchHistory);
  const customTotalModal = useProductStore((state) => state.customTotalModal);
  const manualTotalSales = useProductStore((state) => state.manualTotalSales);
  const salesInputs = useProductStore((state) => state.salesInputs || []);
  const loading = useProductStore((state) => state.loading);
  const error = useProductStore((state) => state.error);

  const addDashboard = useProductStore((state) => state.addDashboard);
  const switchDashboard = useProductStore((state) => state.switchDashboard);
  const editDashboardTitle = useProductStore((state) => state.editDashboardTitle);
  const removeDashboard = useProductStore((state) => state.removeDashboard);

  const loadProducts = useProductStore((state) => state.loadProducts);
  const addProduct = useProductStore((state) => state.addProduct);
  const editProduct = useProductStore((state) => state.editProduct);
  const removeProduct = useProductStore((state) => state.removeProduct);
  const sellProduct = useProductStore((state) => state.sellProduct);
  const setCustomTotalModal = useProductStore((state) => state.setCustomTotalModal);
  const setManualTotalSales = useProductStore((state) => state.setManualTotalSales);
  const completeBatch = useProductStore((state) => state.completeBatch);
  const removeBatchHistory = useProductStore((state) => state.removeBatchHistory);
  const removeProducts = useProductStore((state) => state.removeProducts);
  const addSalesInput = useProductStore((state) => state.addSalesInput);
  const editSalesInput = useProductStore((state) => state.editSalesInput);
  const removeSalesInput = useProductStore((state) => state.removeSalesInput);

  const activeDashboard =
    dashboards.find((d) => d.id === activeDashboardId) || dashboards[0];

  return {
    state: {
      dashboards,
      activeDashboardId,
      activeDashboard,
      products,
      transactions,
      batchHistory,
      customTotalModal,
      manualTotalSales,
      salesInputs,
      loading,
      error,
    },
    addDashboard,
    switchDashboard,
    editDashboardTitle,
    removeDashboard,
    loadProducts: async () => loadProducts(),
    addProduct: async (product: Omit<Product, 'createdAt' | 'updatedAt'>) => addProduct(product),
    editProduct: async (product: Product) => editProduct(product),
    removeProduct: async (id: string) => removeProduct(id),
    sellProduct: async (productId: string, quantity: number) => sellProduct(productId, quantity),
    setCustomTotalModal: (amount: number | null) => setCustomTotalModal(amount),
    setManualTotalSales: (amount: number | null) => setManualTotalSales(amount),
    completeBatch: (summary: DashboardSummary, batchName?: string) => completeBatch(summary, batchName),
    removeBatchHistory: (id: string) => removeBatchHistory(id),
    removeProducts: (ids: string[]) => removeProducts(ids),
    addSalesInput: (amount: number) => addSalesInput(amount),
    editSalesInput: (id: string, amount: number) => editSalesInput(id, amount),
    removeSalesInput: (id: string) => removeSalesInput(id),
  };
}
