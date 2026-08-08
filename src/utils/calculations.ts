import { ProductCalculation, Product, DashboardSummary } from '../types';

export function calculateProduct(product: Product): ProductCalculation {
  // product.buyPrice is now Total Modal Keseluruhan for this product batch
  const totalModal = product.buyPrice;
  const unitBuyPrice = product.initialStock > 0 ? totalModal / product.initialStock : 0;
  const totalRevenue = product.sellPrice * product.soldStock;
  const targetRevenue = product.sellPrice * product.initialStock;
  const netPnl = totalRevenue - totalModal;
  const isBEP = totalRevenue >= totalModal;
  const remainingToBEP = Math.max(0, totalModal - totalRevenue);
  const itemsToBEP = product.sellPrice > 0 ? Math.ceil(remainingToBEP / product.sellPrice) : 0;
  const bepPercent = totalModal > 0 ? Math.min(100, (totalRevenue / totalModal) * 100) : 0;
  const remainingStock = Math.max(0, product.initialStock - product.soldStock);
  const expectedTotalProfit = targetRevenue - totalModal;
  const profitPerUnit = product.sellPrice - unitBuyPrice;
  const marginPercent = product.sellPrice > 0 ? (profitPerUnit / product.sellPrice) * 100 : 0;

  return {
    unitBuyPrice,
    totalModal,
    totalRevenue,
    targetRevenue,
    netPnl,
    isBEP,
    remainingToBEP,
    itemsToBEP,
    bepPercent,
    remainingStock,
    expectedTotalProfit,
    profitPerUnit,
    marginPercent,
  };
}

export function calculateDashboard(
  products: Product[],
  customTotalModal?: number | null,
  mode: 'batch' | 'satuan' = 'batch',
  manualTotalSales?: number | null,
  salesInputs?: { amount: number }[],
): DashboardSummary {
  let calculatedModal = 0;
  let totalRevenue = 0;
  let totalSoldItems = 0;
  let totalRemainingStock = 0;

  if (mode === 'satuan') {
    products.forEach(product => {
      calculatedModal += product.buyPrice;
    });
    const inputsTotal = salesInputs ? salesInputs.reduce((sum, item) => sum + item.amount, 0) : 0;
    totalRevenue = (manualTotalSales ?? 0) + inputsTotal;
  } else {
    products.forEach(product => {
      const calc = calculateProduct(product);
      calculatedModal += calc.totalModal;
      totalRevenue += calc.totalRevenue;
      totalSoldItems += product.soldStock;
      totalRemainingStock += calc.remainingStock;
    });
  }

  const totalModal =
    customTotalModal !== undefined && customTotalModal !== null
      ? customTotalModal
      : calculatedModal;

  const netPnl = totalRevenue - totalModal;
  const isBEP = totalRevenue >= totalModal;
  const remainingToBEP = Math.max(0, totalModal - totalRevenue);
  const bepPercent =
    totalModal > 0 ? Math.min(100, (totalRevenue / totalModal) * 100) : 0;

  const topProducts = [...products]
    .sort((a, b) => {
      if (mode === 'satuan') {
        return b.buyPrice - a.buyPrice;
      }
      const cA = calculateProduct(a);
      const cB = calculateProduct(b);
      return cB.netPnl - cA.netPnl;
    })
    .slice(0, 5);

  return {
    totalProducts: products.length,
    totalModal,
    totalRevenue,
    netPnl,
    isBEP,
    remainingToBEP,
    bepPercent,
    totalSoldItems,
    totalRemainingStock,
    topProducts,
  };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatCurrencyInput(val: string | number): string {
  const digits =
    typeof val === 'number'
      ? Math.round(val).toString()
      : val.replace(/[^0-9]/g, '');
  if (!digits) {return '';}
  const num = parseInt(digits, 10);
  if (isNaN(num)) {return '';}
  return new Intl.NumberFormat('id-ID').format(num);
}

export function parseCurrencyInput(val: string): number {
  const digits = val.replace(/[^0-9]/g, '');
  return parseInt(digits, 10) || 0;
}
