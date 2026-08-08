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
import { productsStyles as ps, productModalStyles as ms, C } from '../styles/globalStyles';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useProducts} from '../context/ProductContext';
import {calculateProduct, formatRupiah, formatPercent} from '../utils/calculations';
import {Product} from '../types';



function DetailModal({
  product,
  visible,
  onClose,
  onSell,
  onUndo,
  onDelete,
  isSatuanMode,
}: {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onSell: (p: Product, qty: number) => void;
  onUndo: (p: Product, qty: number) => void;
  onDelete: (id: string) => void;
  isSatuanMode?: boolean;
}) {
  const [qty, setQty] = useState('1');
  const [undoQty, setUndoQty] = useState('1');
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

  const handleUndo = () => {
    const q = parseInt(undoQty, 10);
    if (isNaN(q) || q <= 0) {
      Alert.alert('Error', 'Masukkan jumlah yang valid');
      return;
    }
    if (q > product.soldStock) {
      Alert.alert('Error', `Jumlah batal melebihi jumlah terjual (${product.soldStock})`);
      return;
    }
    Alert.alert(
      'Konfirmasi Batal Jual',
      `Batalkan penjualan ${q} ${product.unit} "${product.name}"?`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Batal Jual ↩️',
          style: 'destructive',
          onPress: () => {
            onUndo(product, q);
            setUndoQty('1');
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

            {product.soldStock > 0 && (
              <View style={[ms.sellBox, { borderColor: C.danger + '44', backgroundColor: C.danger + '11', marginTop: 12 }]}>
                <Text style={[ms.sellLabel, { color: C.danger }]}>Kembalikan Penjualan (Batal Jual)</Text>
                <View style={ms.sellRow}>
                  <TextInput
                    style={[ms.sellInput, { borderColor: C.danger + '44', color: C.text }]}
                    value={undoQty}
                    onChangeText={setUndoQty}
                    keyboardType="numeric"
                    placeholder="Jumlah Batal"
                    placeholderTextColor={C.muted}
                  />
                  <TouchableOpacity style={[ms.sellBtn, { backgroundColor: C.danger }]} onPress={handleUndo}>
                    <Text style={ms.sellBtnTxt}>↩️ Batal</Text>
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
  const {state, removeProduct, removeProducts, sellProduct, undoSellProduct} = useProducts();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isSatuanMode = state.activeDashboard?.mode === 'satuan';

  // State for filter tab: 'all' | 'unsold' | 'sold'
  const [filterTab, setFilterTab] = useState<'all' | 'unsold' | 'sold'>('all');

  const filtered = useMemo(() => {
    let result = state.products;
    
    if (filterTab === 'unsold') {
      result = result.filter(p => p.soldStock === 0);
    } else if (filterTab === 'sold') {
      result = result.filter(p => p.soldStock > 0);
    }

    const q = search.toLowerCase();
    if (!q) {return result;}
    return result.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.barcode?.includes(q),
    );
  }, [state.products, search, filterTab]);

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

          {!isSatuanMode && (
            <Text style={ps.cat}>
              Modal Total: {formatRupiah(calc.totalModal)}
            </Text>
          )}

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

      <View style={ps.filterTabsRow}>
        <TouchableOpacity 
          style={[ps.filterTab, filterTab === 'all' && ps.filterTabActive]} 
          onPress={() => setFilterTab('all')}>
          <Text style={[ps.filterTabTxt, filterTab === 'all' && ps.filterTabTxtActive]}>Semua</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[ps.filterTab, filterTab === 'unsold' && ps.filterTabActive]} 
          onPress={() => setFilterTab('unsold')}>
          <Text style={[ps.filterTabTxt, filterTab === 'unsold' && ps.filterTabTxtActive]}>Belum Terjual</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[ps.filterTab, filterTab === 'sold' && ps.filterTabActive]} 
          onPress={() => setFilterTab('sold')}>
          <Text style={[ps.filterTabTxt, filterTab === 'sold' && ps.filterTabTxtActive]}>Sudah Terjual</Text>
        </TouchableOpacity>
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
            <Text style={ps.emptyIcon}>{search || filterTab !== 'all' ? '🔍' : '📦'}</Text>
            <Text style={ps.emptyTxt}>
              {search || filterTab !== 'all'
                ? `Tidak ada produk yang sesuai dengan filter/pencarian`
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
        onUndo={(p, q) => undoSellProduct(p.id, q)}
        onDelete={id => removeProduct(id)}
        isSatuanMode={isSatuanMode}
      />
    </SafeAreaView>
  );
}




