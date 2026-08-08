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
import { reportsStyles as s, C } from '../styles/globalStyles';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useProducts} from '../context/ProductContext';
import {
  calculateProduct,
  calculateDashboard,
  formatRupiah,
} from '../utils/calculations';
import {Product, BatchHistory} from '../types';



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


