import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useProducts} from '../context/ProductContext';
import {calculateProduct, formatRupiah, formatPercent} from '../utils/calculations';
import {Product} from '../types';

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

function DetailModal({
  product,
  visible,
  onClose,
  onSell,
  onDelete,
  isSatuanMode,
}: {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onSell: (p: Product, qty: number) => void;
  onDelete: (id: string) => void;
  isSatuanMode?: boolean;
}) {
  const [qty, setQty] = useState('1');
  if (!product) {return null;}
  const calc = calculateProduct(product);

  const handleSell = () => {
    const q = parseInt(qty, 10);
    if (isNaN(q) || q <= 0) {
      Alert.alert('Error', 'Masukkan jumlah yang valid');
      return;
    }
    if (q > calc.remainingStock) {
      Alert.alert('Error', `Stok tidak cukup. Sisa: ${calc.remainingStock}`);
      return;
    }
    Alert.alert(
      'Konfirmasi Penjualan',
      `Jual ${q} ${product.unit} "${product.name}"?\nTotal: ${formatRupiah(q * product.sellPrice)}`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Jual ✓',
          onPress: () => {
            onSell(product, q);
            setQty('1');
            onClose();
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Hapus Barang',
      `Yakin hapus "${product.name}"?`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            onDelete(product.id);
            onClose();
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity
        style={ms.overlay}
        activeOpacity={1}
        onPress={onClose}>
        <ScrollView
          style={{width: '100%'}}
          contentContainerStyle={{flexGrow: 1, justifyContent: 'flex-end'}}>
          <TouchableOpacity activeOpacity={1} style={ms.container}>
            {/* Header */}
            <View style={ms.head}>
              <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
                <Text style={ms.closeTxt}>✕</Text>
              </TouchableOpacity>
              <Text style={ms.headTitle}>Detail Barang ({isSatuanMode ? 'Mode Satuan' : 'Mode Batch'})</Text>
              <TouchableOpacity onPress={handleDelete} style={ms.delBtn}>
                <Text style={ms.delTxt}>🗑</Text>
              </TouchableOpacity>
            </View>

            {/* Foto */}
            {product.photoUri ? (
              <Image source={{uri: product.photoUri}} style={ms.photo} />
            ) : (
              <View style={ms.photoPlaceholder}>
                <Text style={{fontSize: 50}}>📦</Text>
              </View>
            )}

            <Text style={ms.name}>{product.name}</Text>
            <View style={ms.badges}>
              <View style={ms.catBadge}>
                <Text style={ms.catTxt}>{product.category}</Text>
              </View>
              {product.barcode && (
                <View style={ms.barBadge}>
                  <Text style={ms.barTxt}>📊 {product.barcode}</Text>
                </View>
              )}
            </View>

            {/* Kalkulasi Grid */}
            <View style={ms.grid}>
              {isSatuanMode ? (
                [
                  {label: 'Harga Beli / Modal Barang', val: formatRupiah(product.buyPrice || calc.totalModal), color: C.warning},
                  {label: 'Harga Jual / Unit', val: product.sellPrice > 0 ? formatRupiah(product.sellPrice) : '-', color: C.primary},
                ].map((item, i) => (
                  <View key={i} style={[ms.gridItem, {width: '48%'}]}>
                    <Text style={ms.gridLabel}>{item.label}</Text>
                    <Text style={[ms.gridVal, {color: item.color}]}>{item.val}</Text>
                  </View>
                ))
              ) : (
                [
                  {label: 'Total Modal Keseluruhan', val: formatRupiah(calc.totalModal), color: C.warning},
                  {label: 'Est. Modal / Unit', val: formatRupiah(calc.unitBuyPrice), color: C.text},
                  {label: 'Harga Jual / Unit', val: formatRupiah(product.sellPrice), color: C.primary},
                  {label: 'Pendapatan Terkumpul', val: formatRupiah(calc.totalRevenue), color: C.success},
                  {label: 'Stok Awal', val: `${product.initialStock} unit`, color: C.text},
                  {label: 'Terjual', val: `${product.soldStock} unit`, color: C.warning},
                  {
                    label: 'Sisa Stok',
                    val: `${calc.remainingStock} unit`,
                    color: calc.remainingStock > 0 ? C.success : C.danger,
                  },
                  {
                    label: 'Margin / Unit',
                    val: formatPercent(calc.marginPercent),
                    color: calc.profitPerUnit >= 0 ? C.success : C.danger,
                  },
                ].map((item, i) => (
                  <View key={i} style={ms.gridItem}>
                    <Text style={ms.gridLabel}>{item.label}</Text>
                    <Text style={[ms.gridVal, {color: item.color}]}>{item.val}</Text>
                  </View>
                ))
              )}

              {true && (
                <View
                  style={[
                    ms.gridItem,
                    {
                      width: '100%',
                      borderColor: calc.isBEP ? C.success : C.warning,
                      backgroundColor: calc.isBEP ? C.success + '1A' : C.warning + '1A',
                    },
                  ]}>
                  <Text style={ms.gridLabel}>
                    {calc.isBEP ? '🎉 STATUS BALIK MODAL' : '🎯 TARGET BALIK MODAL (BEP)'}
                  </Text>
                  <Text
                    style={[
                      ms.gridVal,
                      {color: calc.isBEP ? C.success : C.warning, fontSize: 15},
                    ]}>
                    {calc.isBEP
                      ? `✓ Sudah Balik Modal (Laba: +${formatRupiah(calc.netPnl)})`
                      : `Sisa ${formatRupiah(calc.remainingToBEP)} lagi (Jual ± ${calc.itemsToBEP} barang lagi)`}
                  </Text>
                </View>
              )}
            </View>

            {calc.remainingStock > 0 && (
              <View style={ms.sellBox}>
                <Text style={ms.sellLabel}>Catat Penjualan</Text>
                <View style={ms.sellRow}>
                  <TextInput
                    style={ms.sellInput}
                    value={qty}
                    onChangeText={setQty}
                    keyboardType="numeric"
                    placeholder="Jumlah"
                    placeholderTextColor={C.muted}
                  />
                  <TouchableOpacity style={ms.sellBtn} onPress={handleSell}>
                    <Text style={ms.sellBtnTxt}>💸 Jual</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity style={ms.bottomCloseBtn} onPress={onClose}>
              <Text style={ms.bottomCloseTxt}>✕ Tutup Detail</Text>
            </TouchableOpacity>
            <View style={{height: 16}} />
          </TouchableOpacity>
        </ScrollView>
      </TouchableOpacity>
    </Modal>
  );
}

export default function ProductsScreen() {
  const {state, removeProduct, removeProducts, sellProduct} = useProducts();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isSatuanMode = state.activeDashboard?.mode === 'satuan';

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) {return state.products;}
    return state.products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.barcode?.includes(q),
    );
  }, [state.products, search]);

  const renderItem = ({item}: {item: Product}) => {
    const calc = calculateProduct(item);
    return (
      <TouchableOpacity
        style={[ps.card, isSelectMode && selectedIds.includes(item.id) && ps.cardSelected]}
        onPress={() => {
          if (isSelectMode) {
            setSelectedIds(prev =>
              prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
            );
          } else {
            setSelected(item);
            setModalOpen(true);
          }
        }}
        onLongPress={() => {
          if (isSatuanMode && !isSelectMode) {
            setIsSelectMode(true);
            setSelectedIds([item.id]);
          }
        }}
        activeOpacity={0.75}>
        {isSelectMode && (
          <View style={ps.checkboxContainer}>
            <View style={[ps.checkbox, selectedIds.includes(item.id) && ps.checkboxChecked]}>
              {selectedIds.includes(item.id) && <Text style={ps.checkboxIcon}>✓</Text>}
            </View>
          </View>
        )}
        <View style={ps.imgBox}>
          {item.photoUri ? (
            <Image source={{uri: item.photoUri}} style={ps.img} />
          ) : (
            <View style={ps.imgPlaceholder}>
              <Text style={{fontSize: 28}}>📦</Text>
            </View>
          )}
        </View>
        <View style={ps.info}>
          <View style={ps.titleRow}>
            <Text style={ps.name} numberOfLines={1}>{item.name}</Text>
            {true && (
              item.soldStock > 0 ? (
                <View style={[ps.statusTag, calc.remainingStock === 0 ? ps.tagLunas : ps.tagSold]}>
                  <Text style={[ps.statusTagTxt, calc.remainingStock === 0 ? ps.tagLunasTxt : ps.tagSoldTxt]}>
                    {calc.remainingStock === 0
                      ? `🎉 LUNAS (${item.soldStock} ${item.unit})`
                      : `🔥 Terjual ${item.soldStock} ${item.unit}`}
                  </Text>
                </View>
              ) : (
                <View style={ps.tagUnsold}>
                  <Text style={ps.tagUnsoldTxt}>⏳ Belum Terjual</Text>
                </View>
              )
            )}
          </View>

          <Text style={ps.cat}>
            {isSatuanMode ? 'Modal / Harga Beli:' : 'Modal Total:'} {formatRupiah(item.buyPrice || calc.totalModal)}
          </Text>

          {item.sellPrice > 0 && (
            <View style={ps.priceRow}>
              <Text style={ps.sellPrice}>Harga Jual: {formatRupiah(item.sellPrice)} / {item.unit}</Text>
              {item.soldStock > 0 && (
                <Text style={ps.soldRevenueTxt}>
                  Terkumpul: {formatRupiah(calc.totalRevenue)}
                </Text>
              )}
            </View>
          )}

          {true && (
            <View style={ps.stockRow}>
              <View style={[ps.stockBadge, calc.remainingStock === 0 && {backgroundColor: C.danger + '22'}]}>
                <Text style={[ps.stockTxt, calc.remainingStock === 0 && {color: C.danger}]}>
                  Sisa Stok: {calc.remainingStock}
                </Text>
              </View>
              <Text style={[ps.profit, {color: calc.isBEP ? C.success : C.warning}]}>
                {calc.isBEP ? '✓ BEP' : `Kurang ${formatRupiah(calc.remainingToBEP)}`}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={ps.container}>
      <View style={ps.headerRow}>
        <View style={ps.header}>
          <Text style={ps.title}>📦 Daftar Produk</Text>
          <Text style={ps.sub}>
            {state.activeDashboard?.title ? `Dashboard: ${state.activeDashboard.title} • ` : ''}
            {state.products.length} barang terdaftar
          </Text>
        </View>
        {isSatuanMode && (
          <TouchableOpacity
            style={ps.selectModeBtn}
            onPress={() => {
              if (isSelectMode) {
                setIsSelectMode(false);
                setSelectedIds([]);
              } else {
                setIsSelectMode(true);
              }
            }}>
            <Text style={ps.selectModeTxt}>{isSelectMode ? 'Batal' : 'Pilih Multiple'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {isSelectMode && (
        <View style={ps.selectionBar}>
          <TouchableOpacity style={ps.selBtn} onPress={() => setSelectedIds(filtered.map(p => p.id))}>
            <Text style={ps.selTxt}>Pilih Semua</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ps.selBtn} onPress={() => setSelectedIds([])}>
            <Text style={ps.selTxt}>Clear All</Text>
          </TouchableOpacity>
          <View style={{flex: 1}} />
          <TouchableOpacity
            style={[ps.deleteSelectedBtn, selectedIds.length === 0 && {opacity: 0.5}]}
            disabled={selectedIds.length === 0}
            onPress={() => {
              if (selectedIds.length === 0) return;
              Alert.alert('Hapus Produk', `Yakin hapus ${selectedIds.length} produk terpilih?`, [
                {text: 'Batal', style: 'cancel'},
                {
                  text: 'Hapus',
                  style: 'destructive',
                  onPress: () => {
                    removeProducts(selectedIds);
                    setIsSelectMode(false);
                    setSelectedIds([]);
                  }
                }
              ]);
            }}>
            <Text style={ps.deleteSelectedTxt}>🗑 Hapus ({selectedIds.length})</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={ps.searchBox}>
        <Text style={ps.searchIcon}>🔍</Text>
        <TextInput
          style={ps.searchInput}
          placeholder="Cari nama, barcode, kategori..."
          placeholderTextColor={C.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={ps.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 20}}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={ps.empty}>
            <Text style={ps.emptyIcon}>{search ? '🔍' : '📦'}</Text>
            <Text style={ps.emptyTxt}>
              {search
                ? `Tidak ada produk "${search}"`
                : 'Belum ada produk. Tambah sekarang!'}
            </Text>
          </View>
        }
      />

      <DetailModal
        product={selected}
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSell={(p, q) => sellProduct(p.id, q)}
        onDelete={id => removeProduct(id)}
        isSatuanMode={isSatuanMode}
      />
    </SafeAreaView>
  );
}

const ps = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  headerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12},
  header: {flex: 1},
  title: {color: C.text, fontSize: 24, fontWeight: '800'},
  sub: {color: C.muted, fontSize: 13, marginTop: 2},
  selectModeBtn: {
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  selectModeTxt: {color: C.primary, fontSize: 13, fontWeight: '700'},
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  selBtn: {
    backgroundColor: C.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  selTxt: {color: C.text, fontSize: 12, fontWeight: '600'},
  deleteSelectedBtn: {
    backgroundColor: C.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteSelectedTxt: {color: '#FFF', fontSize: 12, fontWeight: '700'},
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchIcon: {fontSize: 16, marginRight: 8},
  searchInput: {flex: 1, color: C.text, height: 46, fontSize: 14},
  clearBtn: {color: C.muted, fontSize: 16, padding: 4},
  card: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  cardSelected: {
    borderColor: C.primary,
    backgroundColor: C.primary + '1A',
  },
  checkboxContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: C.border + '55',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  checkboxIcon: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  imgBox: {width: 90, height: 90},
  img: {width: 90, height: 90},
  imgPlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {flex: 1, padding: 12},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  name: {color: C.text, fontSize: 14, fontWeight: '700', flex: 1},
  statusTag: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusTagTxt: {fontSize: 10, fontWeight: '700'},
  tagSold: {
    backgroundColor: C.success + '22',
    borderWidth: 1,
    borderColor: C.success + '55',
  },
  tagSoldTxt: {color: C.success},
  tagLunas: {
    backgroundColor: '#FFE66D25',
    borderWidth: 1,
    borderColor: '#FFE66D88',
  },
  tagLunasTxt: {color: '#FFE66D'},
  tagUnsold: {
    backgroundColor: C.card,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.border,
  },
  tagUnsoldTxt: {color: C.muted, fontSize: 10, fontWeight: '600'},
  cat: {color: C.muted, fontSize: 11, marginTop: 2},
  priceRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 8},
  sellPrice: {color: C.primary, fontSize: 14, fontWeight: '700'},
  soldRevenueTxt: {color: C.success, fontSize: 11, fontWeight: '700'},
  buyPrice: {color: C.muted, fontSize: 11},
  stockRow: {flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8},
  stockBadge: {
    backgroundColor: C.primary + '22',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stockTxt: {color: C.primary, fontSize: 11, fontWeight: '600'},
  profit: {fontSize: 11, fontWeight: '600'},
  empty: {alignItems: 'center', paddingVertical: 60},
  emptyIcon: {fontSize: 50, marginBottom: 12},
  emptyTxt: {color: C.muted, fontSize: 14, textAlign: 'center'},
});

const ms = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end'},
  container: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.border, alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: {color: C.text, fontSize: 16},
  headTitle: {color: C.text, fontSize: 18, fontWeight: '700'},
  delBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.danger + '33', alignItems: 'center', justifyContent: 'center',
  },
  delTxt: {fontSize: 16},
  photo: {width: '100%', height: 180, borderRadius: 14, marginBottom: 12},
  photoPlaceholder: {
    width: '100%', height: 140, borderRadius: 14,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  name: {color: C.text, fontSize: 20, fontWeight: '800', marginBottom: 8},
  badges: {flexDirection: 'row', gap: 8, marginBottom: 16},
  catBadge: {
    backgroundColor: C.primary + '33', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  catTxt: {color: C.primary, fontSize: 12, fontWeight: '600'},
  barBadge: {backgroundColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4},
  barTxt: {color: C.muted, fontSize: 12},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16},
  gridItem: {
    width: '47%', backgroundColor: C.card,
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: C.border,
  },
  gridLabel: {color: C.muted, fontSize: 11, marginBottom: 4},
  gridVal: {color: C.text, fontSize: 14, fontWeight: '700'},
  sellBox: {
    backgroundColor: C.card, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: C.border,
  },
  sellLabel: {color: C.text, fontSize: 13, fontWeight: '600', marginBottom: 10},
  sellRow: {flexDirection: 'row', gap: 10},
  sellInput: {
    flex: 1, backgroundColor: C.surface, borderRadius: 10,
    paddingHorizontal: 14, color: C.text, fontSize: 16,
    borderWidth: 1, borderColor: C.border, height: 46,
  },
  sellBtn: {
    backgroundColor: C.success, borderRadius: 10,
    paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', height: 46,
  },
  sellBtnTxt: {color: '#FFF', fontWeight: '700', fontSize: 14},
  bottomCloseBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  bottomCloseTxt: {color: C.secondary, fontSize: 14, fontWeight: '700'},
});
