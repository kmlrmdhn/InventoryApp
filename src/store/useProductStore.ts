import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type {
  Product,
  Transaction,
  BatchHistory,
  DashboardSummary,
  DashboardItem,
  SalesInput,
} from '../types';

export const storage = createMMKV();

const mmkvStorage = {
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name: string) => {
    storage.remove(name);
  },
};

const DEFAULT_DASHBOARD_ID = 'dashboard-default';

interface ProductState {
  dashboards: DashboardItem[];
  activeDashboardId: string;
  products: Product[];
  transactions: Transaction[];
  batchHistory: BatchHistory[];
  customTotalModal: number | null;
  manualTotalSales?: number | null;
  salesInputs: SalesInput[];
  loading: boolean;
  error: string | null;

  // Dashboard Management Actions
  addDashboard: (title: string, mode?: 'batch' | 'satuan') => { success: boolean; error?: string };
  switchDashboard: (id: string) => void;
  editDashboardTitle: (id: string, newTitle: string) => { success: boolean; error?: string };
  removeDashboard: (id: string) => { success: boolean; error?: string };

  // Active Dashboard Product/Transaction Actions
  loadProducts: () => void;
  addProduct: (productData: Omit<Product, 'createdAt' | 'updatedAt'>) => void;
  editProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  sellProduct: (productId: string, quantity: number) => void;
  undoSellProduct: (productId: string, quantity: number) => void;
  addTransaction: (transaction: Transaction) => void;
  getProductByBarcode: (barcode: string) => Product | null;
  setCustomTotalModal: (amount: number | null) => void;
  setManualTotalSales: (amount: number | null) => void;
  completeBatch: (summary: DashboardSummary, batchName?: string) => void;
  removeBatchHistory: (id: string) => void;
  removeProducts: (ids: string[]) => void;
  addSalesInput: (amount: number) => void;
  editSalesInput: (id: string, amount: number) => void;
  removeSalesInput: (id: string) => void;
}

const createInitialDashboard = (): DashboardItem => ({
  id: DEFAULT_DASHBOARD_ID,
  title: 'ZamToys 🧸',
  mode: 'batch',
  manualTotalSales: null,
  salesInputs: [],
  products: [],
  transactions: [],
  batchHistory: [],
  customTotalModal: null,
  createdAt: new Date().toISOString(),
});

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => {
      const syncActiveDashboard = (
        state: ProductState,
        updater: (dash: DashboardItem) => Partial<DashboardItem>,
      ) => {
        const activeId = state.activeDashboardId || DEFAULT_DASHBOARD_ID;
        const currentDashboards =
          state.dashboards && state.dashboards.length > 0
            ? state.dashboards
            : [createInitialDashboard()];

        const updatedDashboards = currentDashboards.map((d) =>
          d.id === activeId ? { ...d, ...updater(d) } : d,
        );

        const active =
          updatedDashboards.find((d) => d.id === activeId) || updatedDashboards[0];

        return {
          dashboards: updatedDashboards,
          activeDashboardId: active.id,
          products: active.products,
          transactions: active.transactions,
          batchHistory: active.batchHistory,
          customTotalModal: active.customTotalModal,
          manualTotalSales: active.manualTotalSales ?? null,
          salesInputs: active.salesInputs || [],
          error: null,
        };
      };

      const initialDash = createInitialDashboard();

      return {
        dashboards: [initialDash],
        activeDashboardId: DEFAULT_DASHBOARD_ID,
        products: initialDash.products,
        transactions: initialDash.transactions,
        batchHistory: initialDash.batchHistory,
        customTotalModal: initialDash.customTotalModal,
        manualTotalSales: initialDash.manualTotalSales ?? null,
        salesInputs: initialDash.salesInputs || [],
        loading: false,
        error: null,

        loadProducts: () => {
          set({ loading: false });
        },

        addDashboard: (title: string, mode: 'batch' | 'satuan' = 'batch') => {
          const cleanTitle = title.trim();
          if (!cleanTitle) {
            return { success: false, error: 'Title dashboard tidak boleh kosong.' };
          }
          const currentDashboards = get().dashboards || [];
          const isDuplicate = currentDashboards.some(
            (d) => d.title.trim().toLowerCase() === cleanTitle.toLowerCase(),
          );
          if (isDuplicate) {
            return {
              success: false,
              error: `Title dashboard "${cleanTitle}" sudah digunakan. Gunakan title lain.`,
            };
          }

          const newDash: DashboardItem = {
            id: `dash-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: cleanTitle,
            mode,
            manualTotalSales: null,
            salesInputs: [],
            products: [],
            transactions: [],
            batchHistory: [],
            customTotalModal: null,
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            dashboards: [...(state.dashboards || []), newDash],
            activeDashboardId: newDash.id,
            products: [],
            transactions: [],
            batchHistory: [],
            customTotalModal: null,
            manualTotalSales: null,
            salesInputs: [],
            error: null,
          }));

          return { success: true };
        },

        switchDashboard: (id: string) => {
          const currentDashboards = get().dashboards || [];
          const target = currentDashboards.find((d) => d.id === id);
          if (!target) return;

          set({
            activeDashboardId: target.id,
            products: target.products,
            transactions: target.transactions,
            batchHistory: target.batchHistory,
            customTotalModal: target.customTotalModal,
            manualTotalSales: target.manualTotalSales ?? null,
            salesInputs: target.salesInputs || [],
            error: null,
          });
        },

        editDashboardTitle: (id: string, newTitle: string) => {
          const cleanTitle = newTitle.trim();
          if (!cleanTitle) {
            return { success: false, error: 'Title dashboard tidak boleh kosong.' };
          }
          const currentDashboards = get().dashboards || [];
          const isDuplicate = currentDashboards.some(
            (d) => d.id !== id && d.title.trim().toLowerCase() === cleanTitle.toLowerCase(),
          );
          if (isDuplicate) {
            return {
              success: false,
              error: `Title dashboard "${cleanTitle}" sudah digunakan. Gunakan title lain.`,
            };
          }

          set((state) => ({
            dashboards: (state.dashboards || []).map((d) =>
              d.id === id ? { ...d, title: cleanTitle } : d,
            ),
            error: null,
          }));

          return { success: true };
        },

        removeDashboard: (id: string) => {
          const currentDashboards = get().dashboards || [];
          if (currentDashboards.length <= 1) {
            return {
              success: false,
              error: 'Tidak dapat menghapus dashboard terakhir.',
            };
          }

          const filtered = currentDashboards.filter((d) => d.id !== id);
          let activeId = get().activeDashboardId;
          if (activeId === id) {
            activeId = filtered[0].id;
          }

          const active = filtered.find((d) => d.id === activeId) || filtered[0];

          set({
            dashboards: filtered,
            activeDashboardId: active.id,
            products: active.products,
            transactions: active.transactions,
            batchHistory: active.batchHistory,
            customTotalModal: active.customTotalModal,
            manualTotalSales: active.manualTotalSales ?? null,
            salesInputs: active.salesInputs || [],
            error: null,
          });

          return { success: true };
        },

        setCustomTotalModal: (amount) => {
          set((state) =>
            syncActiveDashboard(state, () => ({
              customTotalModal: amount,
            })),
          );
        },

        setManualTotalSales: (amount) => {
          set((state) =>
            syncActiveDashboard(state, () => ({
              manualTotalSales: amount,
            })),
          );
        },

        completeBatch: (summary, batchName) => {
          const now = new Date().toISOString();
          const dateStr = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
          const count = (get().batchHistory || []).length + 1;

          const soldItems = get()
            .products.filter((p) => p.soldStock > 0)
            .map((p) => ({
              id: p.id,
              name: p.name,
              soldStock: p.soldStock,
              unit: p.unit || 'pcs',
              sellPrice: p.sellPrice,
              subtotalRevenue: p.sellPrice * p.soldStock,
            }));

          const newHistoryItem: BatchHistory = {
            id: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
            batchName: batchName || `Batch #${count} (${dateStr})`,
            totalModal: summary.totalModal,
            totalRevenue: summary.totalRevenue,
            netPnl: summary.netPnl,
            totalSoldItems: summary.totalSoldItems,
            isBEP: summary.isBEP,
            bepPercent: summary.bepPercent,
            completedAt: now,
            soldItems,
          };

          set((state) =>
            syncActiveDashboard(state, (dash) => ({
              batchHistory: [newHistoryItem, ...(dash.batchHistory || [])],
              customTotalModal: null,
              products: [],
            })),
          );
        },

        removeBatchHistory: (id) => {
          set((state) =>
            syncActiveDashboard(state, (dash) => ({
              batchHistory: (dash.batchHistory || []).filter((b) => b.id !== id),
            })),
          );
        },

        removeProducts: (ids) => {
          set((state) =>
            syncActiveDashboard(state, (dash) => ({
              products: dash.products.filter((p) => !ids.includes(p.id)),
            })),
          );
        },

        addSalesInput: (amount) => {
          const now = new Date().toISOString();
          const newInput = {
            id: `si-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            amount,
            date: now,
          };
          set((state) =>
            syncActiveDashboard(state, (dash) => ({
              salesInputs: [newInput, ...(dash.salesInputs || [])],
            })),
          );
        },

        editSalesInput: (id, amount) => {
          set((state) =>
            syncActiveDashboard(state, (dash) => ({
              salesInputs: (dash.salesInputs || []).map(si => si.id === id ? { ...si, amount } : si),
            })),
          );
        },

        removeSalesInput: (id) => {
          set((state) =>
            syncActiveDashboard(state, (dash) => ({
              salesInputs: (dash.salesInputs || []).filter(si => si.id !== id),
            })),
          );
        },

        addProduct: (productData) => {
          const now = new Date().toISOString();
          const newProduct: Product = {
            ...productData,
            createdAt: now,
            updatedAt: now,
          };
          set((state) =>
            syncActiveDashboard(state, (dash) => ({
              products: [newProduct, ...dash.products],
            })),
          );
        },

        editProduct: (updatedProduct) => {
          const now = new Date().toISOString();
          set((state) =>
            syncActiveDashboard(state, (dash) => ({
              products: dash.products.map((p) =>
                p.id === updatedProduct.id ? { ...updatedProduct, updatedAt: now } : p,
              ),
            })),
          );
        },

        removeProduct: (id) => {
          set((state) =>
            syncActiveDashboard(state, (dash) => ({
              products: dash.products.filter((p) => p.id !== id),
            })),
          );
        },

        sellProduct: (productId, quantity) => {
          const now = new Date().toISOString();
          set((state) =>
            syncActiveDashboard(state, (dash) => {
              const product = dash.products.find(p => p.id === productId);
              if (!product) return {};
              
              const unitBuyPrice = product.initialStock > 0 ? product.buyPrice / product.initialStock : product.buyPrice;
              const transaction: Transaction = {
                id: `trx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                productId: product.id,
                productName: product.name,
                quantity,
                buyPrice: unitBuyPrice,
                sellPrice: product.sellPrice,
                profit: (product.sellPrice - unitBuyPrice) * quantity,
                type: 'sale',
                date: now,
              };

              return {
                products: dash.products.map((p) =>
                  p.id === productId
                    ? { ...p, soldStock: p.soldStock + quantity, updatedAt: now }
                    : p,
                ),
                transactions: [transaction, ...(dash.transactions || [])],
              };
            }),
          );
        },

        undoSellProduct: (productId, quantity) => {
          const now = new Date().toISOString();
          set((state) =>
            syncActiveDashboard(state, (dash) => {
              const product = dash.products.find(p => p.id === productId);
              if (!product) return {};
              
              const actualQuantityToUndo = Math.min(product.soldStock, quantity);
              if (actualQuantityToUndo <= 0) return {};

              let remainingToUndo = actualQuantityToUndo;
              let newTransactions = [...(dash.transactions || [])];
              
              for (let i = 0; i < newTransactions.length; i++) {
                if (newTransactions[i].productId === productId && newTransactions[i].type === 'sale') {
                  if (newTransactions[i].quantity <= remainingToUndo) {
                     remainingToUndo -= newTransactions[i].quantity;
                     newTransactions.splice(i, 1);
                     i--; 
                  } else {
                     newTransactions[i] = {
                       ...newTransactions[i],
                       quantity: newTransactions[i].quantity - remainingToUndo,
                       profit: (newTransactions[i].sellPrice - newTransactions[i].buyPrice) * (newTransactions[i].quantity - remainingToUndo)
                     };
                     remainingToUndo = 0;
                  }
                }
                if (remainingToUndo <= 0) break;
              }

              return {
                products: dash.products.map((p) =>
                  p.id === productId
                    ? { ...p, soldStock: p.soldStock - actualQuantityToUndo, updatedAt: now }
                    : p,
                ),
                transactions: newTransactions,
              };
            }),
          );
        },

        addTransaction: (transaction) => {
          set((state) =>
            syncActiveDashboard(state, (dash) => ({
              transactions: [transaction, ...dash.transactions],
            })),
          );
        },

        getProductByBarcode: (barcode) => {
          const { products } = get();
          return products.find((p) => p.barcode === barcode) || null;
        },
      };
    },
    {
      name: 'inventory-storage-v2',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (!persistedState || version < 2 || !persistedState.dashboards) {
          const defaultDash: DashboardItem = {
            id: DEFAULT_DASHBOARD_ID,
            title: 'ZamToys 🧸',
            products: persistedState?.products || [],
            transactions: persistedState?.transactions || [],
            batchHistory: persistedState?.batchHistory || [],
            customTotalModal: persistedState?.customTotalModal ?? null,
            salesInputs: persistedState?.salesInputs || [],
            createdAt: new Date().toISOString(),
          };
          return {
            ...persistedState,
            dashboards: [defaultDash],
            activeDashboardId: DEFAULT_DASHBOARD_ID,
            products: defaultDash.products,
            transactions: defaultDash.transactions,
            batchHistory: defaultDash.batchHistory,
            customTotalModal: defaultDash.customTotalModal,
            salesInputs: defaultDash.salesInputs,
          };
        }
        return persistedState;
      },
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
