import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useProducts} from '../context/ProductContext';
import {
  calculateProduct,
  calculateDashboard,
  formatRupiah,
} from '../utils/calculations';
import {Product, BatchHistory} from '../types';

const C = {
  primary: '#6C63FF',
  success: '#4ECDC4',
  warning: '#FFE66D',
  danger: '#FF4757',
  bg: '#0F0F1A',
  surface: '#1A1A2E',
  card: '#16213E',
  border: '#2A2A40',
  text: '#FFFFFF',
  muted: '#7A7A9D',
  secondary: '#A0A0C0',
};

function Row({label, value, color, bold}: {
  label: string; value: string; color?: string; bold?: boolean;
}) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowVal, color ? {color} : {}, bold ? {fontSize: 16} : {}]}>
        {value}
      </Text>
    </View>
  );
}

export default function ReportsScreen() {
  const {state} = useProducts();
  const [sortBy, setSortBy] = useState<'profit' | 'revenue' | 'stock'>('profit');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('active');

  const {products, batchHistory = [], customTotalModal} = state;
  const activeSummary = useMemo(
    () => calculateDashboard(products, customTotalModal),
    [products, customTotalModal],
  );

  // Compute selected report data (Active batch vs Specific batch from history)
  const reportData = useMemo(() => {
    if (selectedBatchId === 'active') {
      return {
        name: '🟢 Siklus / Batch Aktif Saat Ini',
        totalProducts: activeSummary.totalProducts,
        totalSoldItems: activeSummary.totalSoldItems,
        totalModal: activeSummary.totalModal,
        totalRevenue: activeSummary.totalRevenue,
        netPnl: activeSummary.netPnl,
        remainingToBEP: activeSummary.remainingToBEP,
        bepPercent: activeSummary.bepPercent,
        isBEP: activeSummary.isBEP,
        soldItems: products.filter(p => p.soldStock > 0).map(p => ({
          name: p.name,
          soldStock: p.soldStock,
          unit: p.unit || 'pcs',
          sellPrice: p.sellPrice,
          subtotalRevenue: p.sellPrice * p.soldStock,
        })),
      };
    }
    const found = batchHistory.find(b => b.id === selectedBatchId);
    if (found) {
      return {
        name: `📜 ${found.batchName}`,
        totalProducts: found.soldItems?.length || 0,
        totalSoldItems: found.totalSoldItems,
        totalModal: found.totalModal,
        totalRevenue: found.totalRevenue,
        netPnl: found.netPnl,
        remainingToBEP: Math.max(0, found.totalModal - found.totalRevenue),
        bepPercent: found.bepPercent,
        isBEP: found.isBEP,
        soldItems: found.soldItems || [],
      };
    }
    return {
      name: '🟢 Siklus / Batch Aktif Saat Ini',
      totalProducts: activeSummary.totalProducts,
      totalSoldItems: activeSummary.totalSoldItems,
      totalModal: activeSummary.totalModal,
      totalRevenue: activeSummary.totalRevenue,
      netPnl: activeSummary.netPnl,
      remainingToBEP: activeSummary.remainingToBEP,
      bepPercent: activeSummary.bepPercent,
      isBEP: activeSummary.isBEP,
      soldItems: [],
    };
  }, [selectedBatchId, activeSummary, batchHistory, products]);

  const isProfit = reportData.netPnl >= 0;

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => {
      const cA = calculateProduct(a);
      const cB = calculateProduct(b);
      if (sortBy === 'profit') {return cB.netPnl - cA.netPnl;}
      if (sortBy === 'revenue') {return cB.totalRevenue - cA.totalRevenue;}
      return b.soldStock - a.soldStock;
    });
  }, [products, sortBy]);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>📊 Laporan Keuangan</Text>
          <Text style={s.sub}>
            {state.activeDashboard?.title
              ? `Dashboard: ${state.activeDashboard.title}`
              : 'Rekap keuangan & status balik modal'}
          </Text>
        </View>

        {/* Batch Selector Bar */}
        <View style={{marginHorizontal: 20, marginTop: 8}}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8}}>
            <TouchableOpacity
              style={[s.batchTab, selectedBatchId === 'active' && s.batchTabActive]}
              onPress={() => setSelectedBatchId('active')}>
              <Text style={[s.batchTabTxt, selectedBatchId === 'active' && s.batchTabTxtActive]}>
                🟢 Batch Aktif Saat Ini
              </Text>
            </TouchableOpacity>
            {batchHistory.map(b => (
              <TouchableOpacity
                key={b.id}
                style={[s.batchTab, selectedBatchId === b.id && s.batchTabActive]}
                onPress={() => setSelectedBatchId(b.id)}>
                <Text style={[s.batchTabTxt, selectedBatchId === b.id && s.batchTabTxtActive]}>
                  📜 {b.batchName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Net Profit Banner */}
        <View style={[s.netCard, {borderColor: isProfit ? C.success : C.danger}]}>
          <Text style={s.reportNameTag}>{reportData.name}</Text>
          <Text style={s.netLabel}>
            {isProfit ? '📈 Laba Bersih (BEP Terlampaui)' : '📉 Sisa Modal Belum Tercover'}
          </Text>
          <Text style={[s.netVal, {color: isProfit ? C.success : C.danger}]}>
            {isProfit ? '+' : ''}{formatRupiah(reportData.netPnl)}
          </Text>
          <Text style={s.netSub}>
            {reportData.totalSoldItems} unit terjual • {reportData.bepPercent.toFixed(0)}% BEP Tercover
          </Text>
        </View>

        {/* Rincian Keuangan & Perhitungan */}
        <View style={s.card}>
          <Text style={s.cardTitle}>💰 Sum Total Keuangan & Perhitungan</Text>
          <Row label="Sum Total Modal Dikeluarkan" value={formatRupiah(reportData.totalModal)} color={C.warning} bold />
          <View style={s.divider} />
          <Row label="Sum Total Penjualan (Pendapatan)" value={formatRupiah(reportData.totalRevenue)} color={C.primary} bold />
          <View style={s.divider} />
          <Row label="Sisa Modal Belum Tercover (BEP)" value={formatRupiah(reportData.remainingToBEP)} color={C.secondary} />
          <View style={[s.divider, {borderColor: C.border, borderWidth: 1}]} />
          <Row
            label={isProfit ? 'Net Laba Bersih Total' : 'Net Rugi Bersih Total'}
            value={`${isProfit ? '+' : ''}${formatRupiah(reportData.netPnl)}`}
            color={isProfit ? C.success : C.danger}
            bold
          />

          {/* Box Rumus Perhitungan Transparan */}
          <View style={s.formulaBox}>
            <Text style={s.formulaTitle}>🧮 Rincian Rumus & Perhitungan:</Text>
            <View style={s.formulaRow}>
              <Text style={s.formulaLabel}>Rumus Laba/Rugi:</Text>
              <Text style={s.formulaCode}>Total Penjualan - Total Modal</Text>
            </View>
            <View style={s.formulaCalcRow}>
              <Text style={{color: C.primary, fontWeight: '700'}}>{formatRupiah(reportData.totalRevenue)}</Text>
              <Text style={{color: C.muted}}> - </Text>
              <Text style={{color: C.warning, fontWeight: '700'}}>{formatRupiah(reportData.totalModal)}</Text>
              <Text style={{color: C.muted}}> = </Text>
              <Text style={{color: isProfit ? C.success : C.danger, fontWeight: '800'}}>
                {isProfit ? '+' : ''}{formatRupiah(reportData.netPnl)}
              </Text>
            </View>
            <View style={[s.formulaRow, {marginTop: 6}]}>
              <Text style={s.formulaLabel}>Persentase BEP:</Text>
              <Text style={s.formulaCode}>({formatRupiah(reportData.totalRevenue)} ÷ {formatRupiah(reportData.totalModal)}) × 100% = {reportData.bepPercent.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* Stok */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📦 Ringkasan Stok</Text>
          <Row label="Total Jenis Produk" value={`${reportData.totalProducts} produk`} />
          <View style={s.divider} />
          <Row label="Total Terjual" value={`${reportData.totalSoldItems} unit`} color={C.warning} />
          <View style={s.divider} />
          <Row
            label="Sisa Stok Aktif"
            value={`${activeSummary.totalRemainingStock} unit`}
            color={C.success}
          />
        </View>

        {/* Ranking */}
        {products.length > 0 && (
          <View style={[s.card, {paddingBottom: 0}]}>
            <Text style={s.cardTitle}>🏆 Ranking Produk</Text>
            <View style={s.sortTabs}>
              {[
                {k: 'profit', l: 'Laba/BEP'},
                {k: 'revenue', l: 'Pendapatan'},
                {k: 'stock', l: 'Terlaris'},
              ].map(tab => (
                <TouchableOpacity
                  key={tab.k}
                  style={[s.tab, sortBy === tab.k && s.tabOn]}
                  onPress={() => setSortBy(tab.k as any)}>
                  <Text style={[s.tabTxt, sortBy === tab.k && s.tabTxtOn]}>
                    {tab.l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {sorted.map((item: Product) => {
              const calc = calculateProduct(item);
              return (
                <View key={item.id} style={s.rankRow}>
                  <View style={s.rankLeft}>
                    <Text style={s.rankName} numberOfLines={1}>{item.name}</Text>
                    <Text style={s.rankSub}>{item.soldStock} terjual • Modal: {formatRupiah(calc.totalModal)}</Text>
                  </View>
                  <View style={s.rankRight}>
                    <Text style={[s.rankPnl, {color: calc.netPnl >= 0 ? C.success : C.danger}]}>
                      {calc.netPnl >= 0 ? '+' : ''}{formatRupiah(calc.netPnl)}
                    </Text>
                    <Text style={s.rankMargin}>{calc.isBEP ? '✓ BEP' : `BEP ${calc.bepPercent.toFixed(0)}%`}</Text>
                  </View>
                </View>
              );
            })}
            <View style={{height: 16}} />
          </View>
        )}

        {products.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📊</Text>
            <Text style={s.emptyTitle}>Belum Ada Data</Text>
            <Text style={s.emptyTxt}>Tambahkan produk untuk melihat laporan</Text>
          </View>
        )}
        <View style={{height: 30}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  header: {paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8},
  title: {color: C.text, fontSize: 24, fontWeight: '800'},
  sub: {color: C.muted, fontSize: 13, marginTop: 2},
  batchTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  batchTabActive: {
    backgroundColor: C.primary + '33',
    borderColor: C.primary,
  },
  batchTabTxt: {color: C.muted, fontSize: 11, fontWeight: '600'},
  batchTabTxtActive: {color: C.primary, fontWeight: '700'},
  reportNameTag: {
    color: C.primary,
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: C.primary + '22',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1E7E5E', marginHorizontal: 20, marginTop: 12,
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.success + '55',
  },
  exportIcon: {fontSize: 28},
  exportTxt: {color: '#FFF', fontSize: 16, fontWeight: '700'},
  exportSub: {color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2},
  netCard: {
    marginHorizontal: 20, marginTop: 16, borderRadius: 16, padding: 20,
    backgroundColor: C.surface, borderWidth: 1, alignItems: 'center',
  },
  netLabel: {color: C.secondary, fontSize: 13, marginBottom: 6},
  netVal: {fontSize: 34, fontWeight: '900', marginBottom: 4},
  netSub: {color: C.muted, fontSize: 12},
  card: {
    backgroundColor: C.surface, marginHorizontal: 20,
    marginTop: 16, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  cardTitle: {color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 14},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8},
  rowLabel: {color: C.muted, fontSize: 13},
  rowVal: {color: C.text, fontSize: 14, fontWeight: '700'},
  divider: {height: 1, backgroundColor: C.border, marginVertical: 2},
  formulaBox: {
    marginTop: 14,
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  formulaTitle: {color: C.text, fontSize: 12, fontWeight: '800', marginBottom: 8},
  formulaRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  formulaLabel: {color: C.muted, fontSize: 11, fontWeight: '600'},
  formulaCode: {color: C.secondary, fontSize: 11, fontWeight: '700'},
  formulaCalcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  sortTabs: {flexDirection: 'row', marginBottom: 8, gap: 8},
  tab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  tabOn: {backgroundColor: C.primary + '33', borderColor: C.primary},
  tabTxt: {color: C.muted, fontSize: 12, fontWeight: '600'},
  tabTxtOn: {color: C.primary},
  rankRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border,
  },
  rankLeft: {flex: 1},
  rankName: {color: C.text, fontSize: 13, fontWeight: '600'},
  rankSub: {color: C.muted, fontSize: 11, marginTop: 2},
  rankRight: {alignItems: 'flex-end'},
  rankPnl: {fontSize: 13, fontWeight: '700'},
  rankMargin: {color: C.muted, fontSize: 11, marginTop: 2},
  empty: {alignItems: 'center', paddingVertical: 60},
  emptyIcon: {fontSize: 56, marginBottom: 14},
  emptyTitle: {color: C.text, fontSize: 20, fontWeight: '700', marginBottom: 8},
  emptyTxt: {color: C.muted, fontSize: 13, textAlign: 'center'},

  // Modal Export Selection Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {color: C.text, fontSize: 18, fontWeight: '800'},
  modalCloseIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  modalCloseIconTxt: {color: C.muted, fontSize: 16, fontWeight: '700'},
  modalSub: {color: C.muted, fontSize: 12, lineHeight: 18, marginBottom: 16},
  exportOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  exportOptionIcon: {fontSize: 24},
  exportOptionTitle: {color: C.text, fontSize: 14, fontWeight: '700'},
  exportOptionSub: {color: C.muted, fontSize: 11, marginTop: 2},
  exportBatchSectionTitle: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  exportBatchItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  exportBatchItemIcon: {fontSize: 18},
  exportBatchItemName: {color: C.text, fontSize: 13, fontWeight: '700'},
  exportBatchItemSub: {color: C.muted, fontSize: 11, marginTop: 2},
  exportBatchItemArrow: {fontSize: 16},
  closeModalBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeModalBtnTxt: {color: C.danger, fontSize: 14, fontWeight: '700'},
});
