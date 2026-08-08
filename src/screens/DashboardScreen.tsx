import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '../context/ProductContext';
import {
  calculateDashboard,
  formatRupiah,
  formatCurrencyInput,
  parseCurrencyInput,
} from '../utils/calculations';
import { SalesInput } from '../types';

const { width } = Dimensions.get('window');

const C = {
  primary: '#6C63FF',
  batch: '#6C63FF',
  satuan: '#FF9F43',
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

function SummaryCard({
  title,
  value,
  icon,
  color,
  sub,
  onEdit,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
  sub?: string;
  onEdit?: () => void;
}) {
  return (
    <View style={[s.card, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={s.cardHead}>
        <Text style={s.cardIcon}>{icon}</Text>
        {onEdit ? (
          <TouchableOpacity onPress={onEdit} style={s.editChip}>
            <Text style={s.editChipTxt}>✏️ Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={[s.dot, { backgroundColor: color + '33' }]}>
            <Text style={[s.dotText, { color }]}>●</Text>
          </View>
        )}
      </View>
      <Text style={[s.cardValue, { color }]}>{value}</Text>
      <Text style={s.cardTitle}>{title}</Text>
      {sub ? <Text style={s.cardSub}>{sub}</Text> : null}
    </View>
  );
}

export default function DashboardScreen() {
  const {
    state,
    addDashboard,
    switchDashboard,
    editDashboardTitle,
    removeDashboard,
    setCustomTotalModal,
    setManualTotalSales,
    completeBatch,
    removeBatchHistory,
    addSalesInput,
    editSalesInput,
    removeSalesInput,
  } = useProducts();

  const {
    dashboards = [],
    activeDashboardId,
    activeDashboard,
    products = [],
    customTotalModal,
    manualTotalSales,
    salesInputs = [],
    batchHistory = [],
  } = state;

  const activeMode = activeDashboard?.mode || 'batch';

  const summary = useMemo(
    () => calculateDashboard(products, customTotalModal, activeMode, manualTotalSales, salesInputs),
    [products, customTotalModal, activeMode, manualTotalSales, salesInputs],
  );

  // Modal State Total Modal Toko
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [modalInputVal, setModalInputVal] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Modal State Total Penjualan (Mode Satuan)
  const [editSalesModalOpen, setEditSalesModalOpen] = useState(false);
  const [salesInputVal, setSalesInputVal] = useState('');
  const [editingSalesInputId, setEditingSalesInputId] = useState<string | null>(null);

  // Modal State Tambah Dashboard Baru
  const [addDashModalOpen, setAddDashModalOpen] = useState(false);
  const [newDashTitleInput, setNewDashTitleInput] = useState('');
  const [newDashMode, setNewDashMode] = useState<'batch' | 'satuan'>('batch');
  const [addDashError, setAddDashError] = useState<string | null>(null);

  // Modal State Edit Title Dashboard
  const [editTitleModalOpen, setEditTitleModalOpen] = useState(false);
  const [editDashTitleInput, setEditDashTitleInput] = useState('');
  const [editDashError, setEditDashError] = useState<string | null>(null);

  const toggleExpandHistory = (id: string) => {
    setExpandedHistoryId((prev) => (prev === id ? null : id));
  };

  // Handlers for Total Modal
  const handleOpenEditModal = () => {
    setModalInputVal(summary.totalModal ? formatCurrencyInput(summary.totalModal) : '');
    setEditModalOpen(true);
  };

  const handleSaveModal = () => {
    const val = parseCurrencyInput(modalInputVal);
    if (!val || val < 0) {
      Alert.alert('Error', 'Masukkan angka total modal yang valid');
      return;
    }
    setCustomTotalModal(val);
    setEditModalOpen(false);
    Alert.alert(
      '✅ Modal Berhasil Disimpan!',
      `Total Modal Toko diperbarui menjadi ${formatRupiah(val)}.`,
    );
  };

  const handleResetModal = () => {
    setCustomTotalModal(null);
    setEditModalOpen(false);
    Alert.alert(
      '🔄 Reset Berhasil',
      'Total modal kembali menggunakan hitungan otomatis dari produk.',
    );
  };

  // Handlers for Direct Total Sales (Mode Satuan)
  const handleOpenEditSalesModal = (id?: string, amount?: number) => {
    if (id && amount !== undefined) {
      setEditingSalesInputId(id);
      setSalesInputVal(formatCurrencyInput(amount));
    } else {
      setEditingSalesInputId(null);
      setSalesInputVal('');
    }
    setEditSalesModalOpen(true);
  };

  const handleSaveSalesModal = () => {
    const val = parseCurrencyInput(salesInputVal);
    if (val <= 0) {
      Alert.alert('Error', 'Masukkan angka total penjualan yang valid');
      return;
    }
    if (editingSalesInputId) {
      editSalesInput(editingSalesInputId, val);
    } else {
      addSalesInput(val);
    }
    setEditSalesModalOpen(false);
    Alert.alert(
      '✅ Penjualan Disimpan!',
      `Input penjualan berhasil disimpan.`,
    );
  };

  const handleResetSalesModal = () => {
    setManualTotalSales(null); // Optional: if we want to reset legacy manual total
    setEditSalesModalOpen(false);
  };

  const handleDeleteSalesInput = (id: string) => {
    Alert.alert('Hapus Input', 'Yakin hapus input penjualan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => removeSalesInput(id),
      },
    ]);
  };

  // Handlers for Add Dashboard
  const handleOpenAddDashModal = () => {
    setNewDashTitleInput('');
    setNewDashMode('batch');
    setAddDashError(null);
    setAddDashModalOpen(true);
  };

  const handleSaveAddDash = () => {
    const clean = newDashTitleInput.trim();
    if (!clean) {
      setAddDashError('Title dashboard tidak boleh kosong.');
      return;
    }

    const isDuplicate = dashboards.some(
      (d) => d.title.trim().toLowerCase() === clean.toLowerCase(),
    );
    if (isDuplicate) {
      setAddDashError(`Title dashboard "${clean}" sudah ada. Gunakan title lain!`);
      return;
    }

    const res = addDashboard(clean, newDashMode);
    if (!res.success) {
      setAddDashError(res.error || 'Gagal menambahkan dashboard.');
      return;
    }

    setAddDashModalOpen(false);
    setNewDashTitleInput('');
    setAddDashError(null);
    Alert.alert(
      '🎉 Dashboard Dibuat!',
      `Dashboard "${clean}" (${newDashMode === 'satuan' ? 'Mode Satuan' : 'Mode Batch'}) berhasil ditambahkan.`,
    );
  };

  // Handlers for Edit Dashboard Title
  const handleOpenEditTitleModal = () => {
    if (!activeDashboard) return;
    setEditDashTitleInput(activeDashboard.title);
    setEditDashError(null);
    setEditTitleModalOpen(true);
  };

  const handleSaveEditTitle = () => {
    if (!activeDashboard) return;
    const clean = editDashTitleInput.trim();
    if (!clean) {
      setEditDashError('Title dashboard tidak boleh kosong.');
      return;
    }

    const isDuplicate = dashboards.some(
      (d) => d.id !== activeDashboard.id && d.title.trim().toLowerCase() === clean.toLowerCase(),
    );
    if (isDuplicate) {
      setEditDashError(`Title dashboard "${clean}" sudah digunakan. Gunakan title lain!`);
      return;
    }

    const res = editDashboardTitle(activeDashboard.id, clean);
    if (!res.success) {
      setEditDashError(res.error || 'Gagal memperbarui title.');
      return;
    }

    setEditTitleModalOpen(false);
    setEditDashTitleInput('');
    setEditDashError(null);
    Alert.alert(
      '✅ Title Diperbarui!',
      `Title dashboard diubah menjadi "${clean}".`,
    );
  };

  const handleDeleteDashboard = () => {
    if (!activeDashboard) return;
    if (dashboards.length <= 1) {
      Alert.alert('Peringatan', 'Tidak dapat menghapus dashboard terakhir.');
      return;
    }

    Alert.alert(
      'Hapus Dashboard',
      `Apakah Anda yakin ingin menghapus dashboard "${activeDashboard.title}" beserta seluruh produk & transaksinya?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            const res = removeDashboard(activeDashboard.id);
            if (!res.success) {
              Alert.alert('Error', res.error || 'Gagal menghapus dashboard.');
              return;
            }
            setEditTitleModalOpen(false);
            Alert.alert('🗑️ Terhapus', 'Dashboard berhasil dihapus.');
          },
        },
      ],
    );
  };

  const handleCompleteBatch = () => {
    if (summary.totalRevenue === 0 && summary.totalModal === 0) {
      Alert.alert(
        'Peringatan',
        'Belum ada transaksi atau modal yang dimasukkan untuk diselesaikan.',
      );
      return;
    }

    Alert.alert(
      '✅ Complete & Selesaikan Batch Transaksi',
      `Apakah Anda yakin ingin menyelesaikan periode transaksi saat ini untuk dashboard "${activeDashboard?.title || 'Aktif'}"?\n\n📊 Ringkasan Period:\n• Total Modal: ${formatRupiah(summary.totalModal)}\n• Total Pendapatan: ${formatRupiah(summary.totalRevenue)}\n• Laba/Rugi: ${summary.netPnl >= 0 ? '+' : ''}${formatRupiah(summary.netPnl)}\n\nData siklus ini akan diarsipkan ke Riwayat (History), dan daftar barang aktif akan dibersihkan untuk memulai batch transaksi & modal baru.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Selesaikan & Bersihkan ✓',
          onPress: () => {
            completeBatch(summary);
            Alert.alert(
              '🎉 Batch Berhasil Diselesaikan!',
              'Siklus transaksi berhasil diarsipkan ke History & daftar produk dibersihkan.\nSilakan masukkan Total Modal Baru dan tambahkan produk baru.',
            );
          },
        },
      ],
    );
  };

  const handleDeleteHistory = (id: string, name: string) => {
    Alert.alert('Hapus Riwayat', `Hapus riwayat "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => removeBatchHistory(id),
      },
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={s.greeting}>Dashboard Transaksi 👋</Text>
            <TouchableOpacity
              style={s.titleTouch}
              onPress={handleOpenEditTitleModal}
              activeOpacity={0.7}>
              <Text style={s.title} numberOfLines={1}>
                {activeDashboard?.title || 'ZamToys 🧸'}
              </Text>
              <View
                style={[
                  s.editTitleChip,
                  {
                    backgroundColor: (activeMode === 'satuan' ? C.satuan : C.batch) + '22',
                    borderColor: (activeMode === 'satuan' ? C.satuan : C.batch) + '66',
                    borderWidth: 1,
                  },
                ]}>
                <Text
                  style={[
                    s.editTitleChipTxt,
                    { color: activeMode === 'satuan' ? C.satuan : C.batch, fontWeight: '700' },
                  ]}>
                  {activeMode === 'satuan' ? '🏷️ Mode Satuan' : '📦 Mode Batch'} • ✏️ Edit
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Pojok Kanan Atas: Button Tambah Dashboard */}
          <TouchableOpacity
            style={s.addDashboardTopBtn}
            onPress={handleOpenAddDashModal}
            activeOpacity={0.8}>
            <Text style={s.addDashboardTopBtnPlus}>➕</Text>

          </TouchableOpacity>
        </View>

        {/* Dashboard Switcher Bar (Tabs) */}
        <View style={s.switcherContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.switcherScrollContent}>
            {dashboards.map((dash) => {
              const isActive = dash.id === activeDashboardId;
              const isSatuan = dash.mode === 'satuan';
              const modeColor = isSatuan ? C.satuan : C.batch;
              const modeLabel = isSatuan ? 'Satuan' : 'Batch';
              return (
                <TouchableOpacity
                  key={dash.id}
                  style={[
                    s.dashTab,
                    isActive && {
                      borderColor: modeColor,
                      backgroundColor: modeColor + '1F',
                    },
                  ]}
                  onPress={() => switchDashboard(dash.id)}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      s.dashTabTxt,
                      isActive && { color: modeColor, fontWeight: '700' },
                    ]}
                    numberOfLines={1}>
                    {isActive ? (isSatuan ? '🏷️ ' : '📦 ') : ''}{dash.title}
                  </Text>
                  <View
                    style={[
                      s.dashTabBadge,
                      isActive && { backgroundColor: modeColor + '33' },
                    ]}>
                    <Text
                      style={[
                        s.dashTabBadgeTxt,
                        isActive && { color: modeColor, fontWeight: '700' },
                      ]}>
                      {dash.products.length} barang ({modeLabel})
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={s.dashTabAdd}
              onPress={handleOpenAddDashModal}
              activeOpacity={0.8}>
              <Text style={s.dashTabAddTxt}>➕ Dashboard Baru</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Banner Status Balik Modal / Penjualan */}
        <View
          style={[
            s.bepBanner,
            {
              borderColor: activeMode === 'satuan' ? C.satuan : (summary.isBEP ? C.success : C.warning),
              borderWidth: activeMode === 'satuan' ? 2 : 1,
            },
          ]}>
          <View style={s.bepHeader}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  s.bepTag,
                  activeMode === 'satuan' && { color: C.satuan },
                ]}>
                {activeMode === 'satuan' ? '🏷️ RINGKASAN MODE SATUAN' : '🎯 STATUS BALIK MODAL (BEP)'}
              </Text>
              <Text style={s.bepTitle}>
                {activeMode === 'satuan'
                  ? '📊 HARI INI & PENDAPATAN SATUAN'
                  : (summary.isBEP
                    ? '🎉 SELAMAT! SUDAH BALIK MODAL'
                    : '⏳ PROSES MEMBALIKKAN MODAL')}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                s.editBannerBtn,
                activeMode === 'satuan' && { backgroundColor: C.satuan },
              ]}
              onPress={() => activeMode === 'satuan' ? handleOpenEditSalesModal() : handleOpenEditModal()}>
              <Text
                style={[
                  s.editBannerBtnTxt,
                  activeMode === 'satuan' && { color: '#0F0F1A', fontWeight: '800' },
                ]}>
                {activeMode === 'satuan' ? '✏️ Input Penjualan' : '✏️ Edit Modal'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={s.progressTrack}>
            <View
              style={[
                s.progressBar,
                {
                  width: `${Math.min(100, Math.max(4, summary.bepPercent))}%`,
                  backgroundColor: activeMode === 'satuan' ? C.satuan : (summary.isBEP ? C.success : C.warning),
                },
              ]}
            />
          </View>

          {/* Details */}
          <View style={s.bepDetails}>
            <View style={s.bepDetailCol}>
              <Text style={s.bepDetailLbl}>Total Modal Barang</Text>
              <Text style={[s.bepDetailVal, { color: C.warning }]}>
                {formatRupiah(summary.totalModal)}
              </Text>
            </View>
            <View style={[s.bepDetailCol, { alignItems: 'flex-end' }]}>
              <Text style={s.bepDetailLbl}>Total Penjualan Masuk</Text>
              <Text style={[s.bepDetailVal, { color: activeMode === 'satuan' ? C.satuan : C.primary }]}>
                {formatRupiah(summary.totalRevenue)}
              </Text>
            </View>
          </View>

          {/* Status Note */}
          <View
            style={[
              s.bepNote,
              {
                backgroundColor: activeMode === 'satuan'
                  ? C.satuan + '1F'
                  : (summary.isBEP ? C.success + '1F' : C.warning + '1F'),
              },
            ]}>
            <Text
              style={[
                s.bepNoteTxt,
                {
                  color: activeMode === 'satuan'
                    ? C.satuan
                    : (summary.isBEP ? C.success : C.warning),
                },
              ]}>
              {activeMode === 'satuan'
                ? `💡 Estimasi Net PnL: ${summary.netPnl >= 0 ? '+' : ''}${formatRupiah(summary.netPnl)} (${summary.bepPercent.toFixed(0)}% ter-cover)`
                : (summary.isBEP
                  ? `✓ Laba Bersih Terkumpul: +${formatRupiah(summary.netPnl)}`
                  : `⚠️ Sisa ${formatRupiah(summary.remainingToBEP)} lagi menuju Balik Modal (BEP)`)}
            </Text>
          </View>

          {/* Tombol Complete Batch (Hanya Mode Batch) */}
          {activeMode === 'batch' && (
            <TouchableOpacity
              style={s.completeBannerBtn}
              onPress={handleCompleteBatch}>
              <Text style={s.completeBannerBtnTxt}>
                ✅ Complete & Selesaikan Siklus Ini
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Summary Grid */}
        <Text style={[s.sectionTitle, { color: activeMode === 'satuan' ? C.satuan : C.primary }]}>
          RINGKASAN KEUANGAN ({activeMode === 'satuan' ? 'MODE SATUAN' : 'MODE BATCH'})
        </Text>
        <View style={s.grid}>
          <SummaryCard
            title="Total Modal"
            value={formatRupiah(summary.totalModal)}
            icon="💰"
            color={C.warning}
            sub={
              customTotalModal !== null
                ? 'Manual (Klik ✏️ Edit)'
                : (activeMode === 'satuan' ? 'Total Modal Barang' : 'Otomatis dari produk')
            }
            onEdit={handleOpenEditModal}
          />
          <SummaryCard
            title="Total Pendapatan"
            value={formatRupiah(summary.totalRevenue)}
            icon="💵"
            color={activeMode === 'satuan' ? C.satuan : C.primary}
            sub={activeMode === 'satuan' ? 'Klik ✏️ Input Penjualan' : 'Penjualan terkumpul'}
            onEdit={activeMode === 'satuan' ? () => handleOpenEditSalesModal() : undefined}
          />
          <SummaryCard
            title={summary.netPnl >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
            value={`${summary.netPnl >= 0 ? '+' : ''}${formatRupiah(summary.netPnl)}`}
            icon={summary.netPnl >= 0 ? '📈' : '📉'}
            color={summary.netPnl >= 0 ? C.success : C.danger}
            sub="Pendapatan - Modal"
          />
          <SummaryCard
            title="Sisa Menuju BEP"
            value={formatRupiah(summary.remainingToBEP)}
            icon="🎯"
            color={C.secondary}
            sub="Kekurangan modal"
          />
        </View>

        {/* Total Terjual & Stok Stats */}
        <View style={[s.statsRow, { marginTop: 16 }]}>
          <View style={s.stat}>
            <Text style={s.statNum}>{summary.totalProducts}</Text>
            <Text style={s.statLbl}>Total Produk</Text>
          </View>
          <View style={[s.stat, s.statMid]}>
            <Text style={s.statNum}>{summary.totalSoldItems}</Text>
            <Text style={s.statLbl}>Terjual Batch Ini</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>
              {products.reduce((t, p) => t + (p.initialStock - p.soldStock), 0)}
            </Text>
            <Text style={s.statLbl}>Sisa Stok</Text>
          </View>
        </View>

        {activeMode === 'satuan' && (
          <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
            <Text style={[s.sectionTitle, { color: C.satuan, paddingHorizontal: 0 }]}>📜 RIWAYAT INPUT PENJUALAN SATUAN</Text>
            {salesInputs && salesInputs.length > 0 ? (
              salesInputs.map((input: SalesInput) => (
                <View key={input.id} style={s.salesInputCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.salesInputDate}>
                      {new Date(input.date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </Text>
                    <Text style={s.salesInputVal}>{formatRupiah(input.amount)}</Text>
                  </View>
                  <TouchableOpacity style={s.salesInputEditBtn} onPress={() => handleOpenEditSalesModal(input.id, input.amount)}>
                    <Text style={s.salesInputEditTxt}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.salesInputDelBtn} onPress={() => handleDeleteSalesInput(input.id)}>
                    <Text style={s.salesInputDelTxt}>🗑</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={s.historyEmptyCard}>
                <Text style={s.historyEmptyIcon}>📝</Text>
                <Text style={s.historyEmptyTitle}>Belum Ada Input Penjualan</Text>
                <Text style={s.historyEmptyTxt}>Tambahkan input penjualan untuk melihat riwayatnya di sini.</Text>
              </View>
            )}
          </View>
        )}

        {/* Section History / Riwayat Batch */}
        <View style={s.historyHeaderRow}>
          <Text style={s.historySectionTitle}>📜 RIWAYAT BATCH (HISTORY)</Text>
          <TouchableOpacity
            style={s.completeHeaderBtn}
            onPress={handleCompleteBatch}>
            <Text style={s.completeHeaderBtnTxt}>✅ Complete Batch</Text>
          </TouchableOpacity>
        </View>

        {batchHistory.length > 0 ? (
          batchHistory.map((item) => (
            <View key={item.id} style={s.historyCard}>
              <View style={s.historyHead}>
                <View style={{ flex: 1 }}>
                  <Text style={s.historyName}>{item.batchName}</Text>
                  <Text style={s.historyDate}>
                    Selesai:{' '}
                    {new Date(item.completedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.historyDelBtn}
                  onPress={() => handleDeleteHistory(item.id, item.batchName)}>
                  <Text style={s.historyDelTxt}>🗑</Text>
                </TouchableOpacity>
              </View>

              <View style={s.historyGrid}>
                <View style={s.historyGridCol}>
                  <Text style={s.historyGridLbl}>Total Modal</Text>
                  <Text style={[s.historyGridVal, { color: C.warning }]}>
                    {formatRupiah(item.totalModal)}
                  </Text>
                </View>
                <View style={s.historyGridCol}>
                  <Text style={s.historyGridLbl}>Total Pendapatan</Text>
                  <Text style={[s.historyGridVal, { color: C.primary }]}>
                    {formatRupiah(item.totalRevenue)}
                  </Text>
                </View>
                <View style={s.historyGridCol}>
                  <Text style={s.historyGridLbl}>Laba/Rugi Bersih</Text>
                  <Text
                    style={[
                      s.historyGridVal,
                      { color: item.netPnl >= 0 ? C.success : C.danger },
                    ]}>
                    {item.netPnl >= 0 ? '+' : ''}
                    {formatRupiah(item.netPnl)}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  s.historyBadgeRow,
                  { backgroundColor: item.isBEP ? C.success + '1F' : C.warning + '1F' },
                ]}>
                <Text
                  style={[
                    s.historyBadgeTxt,
                    { color: item.isBEP ? C.success : C.warning },
                  ]}>
                  {item.isBEP
                    ? '🎉 BALIK MODAL (SUDAH BEP)'
                    : `⏳ TERCOVER ${item.bepPercent.toFixed(0)}%`}
                </Text>
                <Text style={s.historySoldTxt}>
                  {item.totalSoldItems} unit terjual
                </Text>
              </View>

              {/* Toggle Rincian Barang Terjual */}
              <TouchableOpacity
                style={s.expandToggleBtn}
                onPress={() => toggleExpandHistory(item.id)}>
                <Text style={s.expandToggleTxt}>
                  {expandedHistoryId === item.id
                    ? '▲ Sembunyikan Detail Barang'
                    : `▼ Lihat Barang Terjual (${item.soldItems?.length || 0} Jenis)`}
                </Text>
              </TouchableOpacity>

              {/* List Detail Barang Terjual */}
              {expandedHistoryId === item.id && (
                <View style={s.soldItemsContainer}>
                  <Text style={s.soldItemsTitle}>📦 RINCIAN BARANG TERJUAL BATCH INI:</Text>
                  {item.soldItems && item.soldItems.length > 0 ? (
                    item.soldItems.map((sold, idx) => (
                      <View key={sold.id || idx} style={s.soldItemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.soldItemName}>{sold.name}</Text>
                          <Text style={s.soldItemSub}>
                            {sold.soldStock} {sold.unit} × {formatRupiah(sold.sellPrice)}
                          </Text>
                        </View>
                        <Text style={s.soldItemSubtotal}>
                          {formatRupiah(sold.subtotalRevenue)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={s.noSoldItemsTxt}>
                      Tidak ada rincian barang terjual untuk batch ini.
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={s.historyEmptyCard}>
            <Text style={s.historyEmptyIcon}>📜</Text>
            <Text style={s.historyEmptyTitle}>Belum Ada Riwayat Batch</Text>
            <Text style={s.historyEmptyTxt}>
              Tekan tombol <Text style={{ fontWeight: '700', color: C.success }}>✅ Complete Batch</Text> di atas saat siklus penjualan Anda selesai untuk menyimpan riwayat & memulai modal baru.
            </Text>
          </View>
        )}

        {products.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📦</Text>
            <Text style={s.emptyTitle}>Belum Ada Produk</Text>
            <Text style={s.emptyTxt}>
              Mulai tambahkan barang dengan tombol ➕ di bawah untuk dashboard "{activeDashboard?.title}"
            </Text>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Modal Dialog Tambah Dashboard Baru */}
      <Modal
        visible={addDashModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddDashModalOpen(false)}>
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddDashModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={s.modalCard}>
            <View style={s.modalHeadRow}>
              <Text style={s.modalTitle}>➕ Tambah Dashboard Baru</Text>
              <TouchableOpacity
                style={s.modalCloseIconBtn}
                onPress={() => setAddDashModalOpen(false)}>
                <Text style={s.modalCloseIconTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.modalSub}>
              Buat workspace dashboard terpisah dengan daftar barang, transaksi, dan modal sendiri.
            </Text>

            <Text style={s.inputLabel}>Title Dashboard</Text>
            <View style={[s.inputBox, addDashError ? s.inputBoxError : null]}>
              <TextInput
                style={s.textInputModal}
                placeholder="Contoh: Toko Cabang Bandung"
                placeholderTextColor={C.muted}
                value={newDashTitleInput}
                onChangeText={(v) => {
                  setNewDashTitleInput(v);
                  if (addDashError) setAddDashError(null);
                }}
                autoFocus
              />
            </View>

            <Text style={[s.inputLabel, { marginTop: 12 }]}>Pilih Mode Perhitungan</Text>
            <View style={s.modeSelectorContainer}>
              <TouchableOpacity
                style={[
                  s.modeOptionCard,
                  newDashMode === 'batch' && { borderColor: C.batch, backgroundColor: C.batch + '1A' },
                ]}
                onPress={() => setNewDashMode('batch')}>
                <Text style={s.modeOptionEmoji}>📦</Text>
                <Text style={[s.modeOptionTitle, newDashMode === 'batch' && { color: C.batch }]}>
                  Mode Batch (BEP)
                </Text>
                <Text style={s.modeOptionDesc}>
                  Modal total batch + stok. Dilengkapi persentase balik modal (BEP).
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  s.modeOptionCard,
                  newDashMode === 'satuan' && { borderColor: C.satuan, backgroundColor: C.satuan + '1A' },
                ]}
                onPress={() => setNewDashMode('satuan')}>
                <Text style={s.modeOptionEmoji}>🏷️</Text>
                <Text style={[s.modeOptionTitle, newDashMode === 'satuan' && { color: C.satuan }]}>
                  Mode Satuan (Tanpa Stok)
                </Text>
                <Text style={s.modeOptionDesc}>
                  Hitung modal dari total harga barang tanpa stok. Input penjualan manual.
                </Text>
              </TouchableOpacity>
            </View>

            {addDashError ? (
              <Text style={s.errorTxt}>⚠️ {addDashError}</Text>
            ) : null}

            <TouchableOpacity style={s.saveModalBtn} onPress={handleSaveAddDash}>
              <Text style={s.saveModalBtnTxt}>➕ Buat Dashboard Baru</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.closeModalBtn} onPress={() => setAddDashModalOpen(false)}>
              <Text style={s.closeModalBtnTxt}>✕ Batal</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal Dialog Edit Title Dashboard */}
      <Modal
        visible={editTitleModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditTitleModalOpen(false)}>
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditTitleModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={s.modalCard}>
            <View style={s.modalHeadRow}>
              <Text style={s.modalTitle}>✏️ Edit Title Dashboard</Text>
              <TouchableOpacity
                style={s.modalCloseIconBtn}
                onPress={() => setEditTitleModalOpen(false)}>
                <Text style={s.modalCloseIconTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.modalSub}>
              Ubah nama/title untuk dashboard yang sedang aktif ini.
            </Text>

            <Text style={s.inputLabel}>Title Dashboard Baru</Text>
            <View style={[s.inputBox, editDashError ? s.inputBoxError : null]}>
              <TextInput
                style={s.textInputModal}
                placeholder="Title Dashboard"
                placeholderTextColor={C.muted}
                value={editDashTitleInput}
                onChangeText={(v) => {
                  setEditDashTitleInput(v);
                  if (editDashError) setEditDashError(null);
                }}
                autoFocus
              />
            </View>
            {editDashError ? (
              <Text style={s.errorTxt}>⚠️ {editDashError}</Text>
            ) : null}

            <TouchableOpacity style={s.saveModalBtn} onPress={handleSaveEditTitle}>
              <Text style={s.saveModalBtnTxt}>💾 Simpan Title</Text>
            </TouchableOpacity>

            {dashboards.length > 1 && (
              <TouchableOpacity style={s.deleteDashBtn} onPress={handleDeleteDashboard}>
                <Text style={s.deleteDashBtnTxt}>🗑️ Hapus Dashboard Ini</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={s.closeModalBtn} onPress={() => setEditTitleModalOpen(false)}>
              <Text style={s.closeModalBtnTxt}>✕ Batal</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal Dialog Edit Total Modal */}
      <Modal
        visible={editModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalOpen(false)}>
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={s.modalCard}>
            <View style={s.modalHeadRow}>
              <Text style={s.modalTitle}>✏️ Edit Total Modal Toko</Text>
              <TouchableOpacity
                style={s.modalCloseIconBtn}
                onPress={() => setEditModalOpen(false)}>
                <Text style={s.modalCloseIconTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.modalSub}>
              Setel modal keseluruhan untuk seluruh barang yang sedang Anda jual saat ini.
            </Text>

            <Text style={s.inputLabel}>Total Modal Toko</Text>
            <View style={s.currencyBox}>
              <Text style={s.currencyPrefix}>Rp</Text>
              <TextInput
                style={s.currencyInput}
                placeholder="5.000.000"
                placeholderTextColor={C.muted}
                value={modalInputVal}
                onChangeText={(v) => setModalInputVal(formatCurrencyInput(v))}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={s.saveModalBtn} onPress={handleSaveModal}>
              <Text style={s.saveModalBtnTxt}>💾 Simpan Total Modal</Text>
            </TouchableOpacity>

            {customTotalModal !== null && (
              <TouchableOpacity style={s.resetModalBtn} onPress={handleResetModal}>
                <Text style={s.resetModalBtnTxt}>🔄 Gunakan Hitungan Otomatis Dari Produk</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={s.closeModalBtn} onPress={() => setEditModalOpen(false)}>
              <Text style={s.closeModalBtnTxt}>✕ Batal</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal Dialog Edit Total Penjualan (Mode Satuan) */}
      <Modal
        visible={editSalesModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditSalesModalOpen(false)}>
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditSalesModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={s.modalCard}>
            <View style={s.modalHeadRow}>
              <Text style={s.modalTitle}>✏️ Input Total Penjualan</Text>
              <TouchableOpacity
                style={s.modalCloseIconBtn}
                onPress={() => setEditSalesModalOpen(false)}>
                <Text style={s.modalCloseIconTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.modalSub}>
              Masukkan total rupiah pendapatan hasil penjualan Anda untuk Mode Satuan ini.
            </Text>

            <Text style={s.inputLabel}>Total Penjualan (Rp)</Text>
            <View style={s.currencyBox}>
              <Text style={s.currencyPrefix}>Rp</Text>
              <TextInput
                style={s.currencyInput}
                placeholder="1.500.000"
                placeholderTextColor={C.muted}
                value={salesInputVal}
                onChangeText={(v) => setSalesInputVal(formatCurrencyInput(v))}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <TouchableOpacity style={s.saveModalBtn} onPress={handleSaveSalesModal}>
              <Text style={s.saveModalBtnTxt}>💾 Simpan Total Penjualan</Text>
            </TouchableOpacity>

            {manualTotalSales !== null && (
              <TouchableOpacity style={s.resetModalBtn} onPress={handleResetSalesModal}>
                <Text style={s.resetModalBtnTxt}>🔄 Reset Penjualan ke 0</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={s.closeModalBtn} onPress={() => setEditSalesModalOpen(false)}>
              <Text style={s.closeModalBtnTxt}>✕ Batal</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { color: C.muted, fontSize: 13, fontWeight: '600' },
  titleTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  title: { color: C.text, fontSize: 22, fontWeight: '800', flexShrink: 1 },
  editTitleChip: {
    backgroundColor: C.primary + '25',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.primary + '55',
    marginLeft: 8,
  },
  editTitleChipTxt: { color: C.primary, fontSize: 10, fontWeight: '700' },

  // Tombol Top Right Add Dashboard
  addDashboardTopBtn: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addDashboardTopBtnPlus: { fontSize: 14, color: '#FFF', marginRight: 4 },
  addDashboardTopBtnTxt: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  // Dashboard Switcher Tabs
  switcherContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  switcherScrollContent: {
    paddingHorizontal: 24,
    gap: 8,
    paddingVertical: 4,
  },
  dashTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  dashTabActive: {
    backgroundColor: C.primary + '22',
    borderColor: C.primary,
    borderWidth: 1.5,
  },
  dashTabTxt: { color: C.secondary, fontSize: 12, fontWeight: '700' },
  dashTabTxtActive: { color: C.text, fontWeight: '800' },
  dashTabBadge: {
    backgroundColor: C.card,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  dashTabBadgeActive: {
    backgroundColor: C.primary,
  },
  dashTabBadgeTxt: { color: C.muted, fontSize: 10, fontWeight: '700' },
  dashTabBadgeTxtActive: { color: '#FFF' },
  dashTabAdd: {
    backgroundColor: C.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.primary + '66',
    borderStyle: 'dashed',
  },
  dashTabAddTxt: { color: C.primary, fontSize: 12, fontWeight: '700' },

  editChip: {
    backgroundColor: C.warning + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.warning + '55',
  },
  editChipTxt: { color: C.warning, fontSize: 10, fontWeight: '700' },
  editBannerBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  editBannerBtnTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  bepBanner: {
    marginHorizontal: 24,
    marginTop: 6,
    borderRadius: 14,
    padding: 14,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  bepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bepTag: { color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  bepTitle: { color: C.text, fontSize: 13, fontWeight: '800', marginTop: 1 },
  progressTrack: {
    height: 8,
    backgroundColor: C.card,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: { height: '100%', borderRadius: 4 },
  bepDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bepDetailCol: {},
  bepDetailLbl: { color: C.muted, fontSize: 10 },
  bepDetailVal: { fontSize: 13, fontWeight: '800', marginTop: 1 },
  bepNote: {
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  bepNoteTxt: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  sectionTitle: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 10,
    width: (width - 56) / 2,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardIcon: { fontSize: 18 },
  dot: { borderRadius: 20, padding: 3 },
  dotText: { fontSize: 7 },
  cardValue: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  cardTitle: { color: C.text, fontSize: 11, fontWeight: '600' },
  cardSub: { color: C.muted, fontSize: 9, marginTop: 1 },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  statMid: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: C.border,
  },
  statNum: { color: C.primary, fontSize: 18, fontWeight: '800' },
  statLbl: { color: C.muted, fontSize: 10, marginTop: 1 },

  completeBannerBtn: {
    backgroundColor: C.success,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 8,
  },
  completeBannerBtnTxt: { color: '#0F0F1A', fontWeight: '800', fontSize: 12 },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginTop: 18,
    marginBottom: 8,
  },
  historySectionTitle: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  completeHeaderBtn: {
    backgroundColor: C.success + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.success + '55',
  },
  completeHeaderBtnTxt: { color: C.success, fontSize: 10, fontWeight: '700' },
  historyCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  historyHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  historyName: { color: C.text, fontSize: 13, fontWeight: '800' },
  historyDate: { color: C.muted, fontSize: 10, marginTop: 1 },
  historyDelBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.danger + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDelTxt: { fontSize: 12 },
  historyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  historyGridCol: { flex: 1, alignItems: 'center' },
  historyGridLbl: { color: C.muted, fontSize: 9, marginBottom: 1 },
  historyGridVal: { fontSize: 11, fontWeight: '700' },
  historyBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  historyBadgeTxt: { fontSize: 10, fontWeight: '800' },
  historySoldTxt: { color: C.secondary, fontSize: 10, fontWeight: '600' },

  salesInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  salesInputDate: { color: C.muted, fontSize: 11, marginBottom: 4 },
  salesInputVal: { color: C.primary, fontSize: 14, fontWeight: '700' },
  salesInputEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  salesInputEditTxt: { fontSize: 12 },
  salesInputDelBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.danger + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  salesInputDelTxt: { fontSize: 12 },


  expandToggleBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  expandToggleTxt: { color: C.primary, fontSize: 12, fontWeight: '700' },
  soldItemsContainer: {
    marginTop: 10,
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  soldItemsTitle: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  soldItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.border + '55',
  },
  soldItemName: { color: C.text, fontSize: 13, fontWeight: '700' },
  soldItemSub: { color: C.muted, fontSize: 11, marginTop: 2 },
  soldItemSubtotal: { color: C.success, fontSize: 13, fontWeight: '800' },
  noSoldItemsTxt: {
    color: C.muted,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 4,
  },
  historyEmptyCard: {
    backgroundColor: C.surface,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  historyEmptyIcon: { fontSize: 40, marginBottom: 8 },
  historyEmptyTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  historyEmptyTxt: { color: C.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { color: C.text, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyTxt: { color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // Modal Dialog Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
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
  modalTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
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
  modalCloseIconTxt: { color: C.muted, fontSize: 16, fontWeight: '700' },
  modalSub: { color: C.muted, fontSize: 12, lineHeight: 18, marginBottom: 16 },
  inputLabel: { color: C.secondary, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  inputBox: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  inputBoxError: {
    borderColor: C.danger,
  },
  textInputModal: {
    paddingVertical: 12,
    color: C.text,
    fontSize: 15,
  },
  errorTxt: {
    color: C.danger,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  currencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  currencyPrefix: {
    color: C.primary,
    fontWeight: '800',
    fontSize: 16,
    marginRight: 6,
  },
  currencyInput: {
    flex: 1,
    paddingVertical: 12,
    color: C.text,
    fontSize: 16,
  },
  saveModalBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  saveModalBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  deleteDashBtn: {
    backgroundColor: C.danger + '1A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.danger + '55',
  },
  deleteDashBtnTxt: { color: C.danger, fontSize: 13, fontWeight: '700' },
  resetModalBtn: {
    backgroundColor: C.card,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  resetModalBtnTxt: { color: C.secondary, fontSize: 12, fontWeight: '600' },
  closeModalBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeModalBtnTxt: { color: C.muted, fontSize: 14, fontWeight: '600' },
  modeSelectorContainer: {
    flexDirection: 'column',
    gap: 10,
    marginVertical: 10,
  },
  modeOptionCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  modeOptionCardActive: {
    borderColor: C.primary,
    backgroundColor: C.primary + '1F',
  },
  modeOptionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  modeOptionTitle: {
    color: C.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  modeOptionTitleActive: {
    color: C.primary,
  },
  modeOptionDesc: {
    color: C.muted,
    fontSize: 12,
    marginTop: 2,
  },
});
