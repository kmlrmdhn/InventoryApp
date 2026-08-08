import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '../context/ProductContext';
import {
  formatRupiah,
  formatCurrencyInput,
  parseCurrencyInput,
} from '../utils/calculations';

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

type FormData = {
  name: string;
  barcode: string;
  buyPrice: string;
  sellPrice: string;
  initialStock: string;
};

const defaultForm: FormData = {
  name: '',
  barcode: '',
  buyPrice: '',
  sellPrice: '',
  initialStock: '',
};

export default function AddProductScreen() {
  const { state, addProduct } = useProducts();

  const isSatuanMode = state.activeDashboard?.mode === 'satuan';

  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  const sellPrice = parseCurrencyInput(form.sellPrice);
  const buyPrice = parseCurrencyInput(form.buyPrice);
  const initialStock = parseInt(form.initialStock, 10) || 0;
  const targetRevenue = sellPrice * initialStock;

  const set = (field: keyof FormData, val: string) =>
    setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    const parsedSellPrice = parseCurrencyInput(form.sellPrice);
    const parsedBuyPrice = parseCurrencyInput(form.buyPrice);

    if (!form.name.trim()) { Alert.alert('Error', 'Nama barang harus diisi!'); return; }

    if (isSatuanMode) {
      if (!parsedBuyPrice) { Alert.alert('Error', 'Harga beli / modal barang harus diisi!'); return; }
    } else {
      if (!parsedSellPrice) { Alert.alert('Error', 'Harga jual per unit harus diisi!'); return; }
      if (!form.initialStock) { Alert.alert('Error', 'Stok awal harus diisi!'); return; }
    }

    setSaving(true);
    try {
      const newId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
      await addProduct({
        id: newId,
        name: form.name.trim(),
        barcode: form.barcode.trim() || undefined,
        category: 'Lainnya',
        unit: 'pcs',
        buyPrice: parsedBuyPrice,
        sellPrice: parsedSellPrice,
        initialStock: isSatuanMode ? 1 : (parseInt(form.initialStock, 10) || 1),
        soldStock: 0,
      });
      setForm(defaultForm);
      Alert.alert('✅ Berhasil!', `"${form.name}" berhasil ditambahkan.`);
    } catch (err: any) {
      console.error('Error adding product:', err);
      Alert.alert('Error', `Gagal menyimpan produk: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>➕ Tambah Barang ({isSatuanMode ? 'Mode Satuan' : 'Mode Batch'})</Text>
            <Text style={s.sub}>
              {isSatuanMode
                ? 'Tambahkan barang untuk menjumlahkan modal tanpa stok'
                : 'Lengkapi data barang di bawah ini'}
            </Text>
          </View>

          {/* Barcode (Ketik Manual / Opsional) */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🔍 KODE / BARCODE PRODUK (OPSIONAL)</Text>
            <TextInput
              style={s.input}
              placeholder="Ketik kode barcode / SKU (opsional)..."
              placeholderTextColor={C.muted}
              value={form.barcode}
              onChangeText={v => set('barcode', v)}
            />
          </View>

          {/* Info Produk */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📋 INFO PRODUK</Text>
            <Text style={s.label}>Nama Barang *</Text>
            <TextInput
              style={s.input}
              placeholder="Contoh: Indomie Goreng"
              placeholderTextColor={C.muted}
              value={form.name}
              onChangeText={v => set('name', v)}
            />
          </View>

          {/* Modal / Harga Beli */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>💸 MODAL / HARGA BELI</Text>
            <Text style={s.label}>
              {isSatuanMode ? 'Harga Beli / Modal Barang *' : 'Total Modal Beli (Opsional)'}
            </Text>
            <View style={s.currencyBox}>
              <Text style={s.currencyPrefix}>Rp</Text>
              <TextInput
                style={s.currencyInput}
                placeholder="Masukkan Harga Beli Modal"
                placeholderTextColor={C.muted}
                value={form.buyPrice}
                onChangeText={v => set('buyPrice', formatCurrencyInput(v))}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Harga Jual */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>💰 HARGA JUAL</Text>
            <Text style={s.label}>
              {isSatuanMode ? 'Harga Jual / Unit (Opsional)' : 'Harga Jual / Unit *'}
            </Text>
            <View style={s.currencyBox}>
              <Text style={s.currencyPrefix}>Rp</Text>
              <TextInput
                style={s.currencyInput}
                placeholder="Masukkan Harga Jual"
                placeholderTextColor={C.muted}
                value={form.sellPrice}
                onChangeText={v => set('sellPrice', formatCurrencyInput(v))}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Stok (Hanya di Mode Batch) */}
          {!isSatuanMode && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>📦 JUMLAH STOK</Text>
              <Text style={s.label}>Stok Awal *</Text>
              <TextInput
                style={s.input}
                placeholder="Jumlah Stock Barang"
                placeholderTextColor={C.muted}
                value={form.initialStock}
                onChangeText={v => set('initialStock', v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />

              {targetRevenue > 0 && (
                <View style={s.calcBox}>
                  <Text style={s.calcTitle}>📊 Target Pendapatan</Text>
                  <View style={s.calcRow}>
                    <Text style={s.calcLabel}>Estimasi Pendapatan Total:</Text>
                    <Text style={[s.calcVal, { color: C.primary }]}>{formatRupiah(targetRevenue)}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.saveBtnTxt}>💾 Simpan Produk</Text>
            )}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { color: C.text, fontSize: 24, fontWeight: '800' },
  sub: { color: C.muted, fontSize: 13, marginTop: 2 },
  methodContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginVertical: 12,
  },
  methodCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
  },
  methodCardActive: {
    borderColor: C.primary,
    backgroundColor: C.primary + '1F',
  },
  methodEmoji: { fontSize: 26, marginBottom: 4 },
  methodTitle: { color: C.secondary, fontSize: 13, fontWeight: '700' },
  methodTitleActive: { color: C.primary },
  methodSub: { color: C.muted, fontSize: 11, marginTop: 2, textAlign: 'center' },
  photoSection: { paddingHorizontal: 20, marginBottom: 8, alignItems: 'center' },
  photoPreview: {
    width: 140, height: 140, borderRadius: 16, marginBottom: 12,
    borderWidth: 2, borderColor: C.primary,
  },
  photoPlaceholder: {
    width: 140, height: 140, borderRadius: 16,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, borderWidth: 2, borderColor: C.border, borderStyle: 'dashed',
  },
  photoPlaceholderTxt: { color: C.muted, fontSize: 12, marginTop: 6 },
  photoBtns: { flexDirection: 'row', gap: 12 },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10, gap: 6,
    borderWidth: 1, borderColor: C.border,
  },
  photoBtnIcon: { fontSize: 18 },
  photoBtnTxt: { color: C.text, fontSize: 13, fontWeight: '600' },
  section: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
    borderTopWidth: 1, borderTopColor: C.border + '44',
  },
  sectionTitle: {
    color: C.muted, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 12,
  },
  label: { color: C.secondary, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: C.surface, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    color: C.text, fontSize: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 8,
  },
  currencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  currencyPrefix: {
    color: C.primary,
    fontWeight: '800',
    fontSize: 14,
    marginRight: 4,
  },
  currencyInput: {
    flex: 1,
    paddingVertical: 12,
    color: C.text,
    fontSize: 14,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  barcodeRow: { flexDirection: 'row', gap: 10 },
  scanBtn: {
    backgroundColor: C.primary, borderRadius: 10,
    paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', height: 46,
  },
  scanBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  chip: {
    backgroundColor: C.surface, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    marginRight: 8, borderWidth: 1, borderColor: C.border, marginBottom: 4,
  },
  chipOn: { backgroundColor: C.primary + '33', borderColor: C.primary },
  chipTxt: { color: C.muted, fontSize: 12, fontWeight: '500' },
  chipTxtOn: { color: C.primary, fontWeight: '700' },
  calcBox: { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 4, marginBottom: 8, backgroundColor: C.card },
  calcTitle: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  calcLabel: { color: C.muted, fontSize: 13 },
  calcVal: { fontSize: 13, fontWeight: '700' },
  modalInfo: {
    backgroundColor: C.warning + '22', borderRadius: 10,
    padding: 10, marginTop: 4,
    borderWidth: 1, borderColor: C.warning + '55',
  },
  modalInfoTxt: { color: C.warning, fontSize: 13, fontWeight: '600' },
  saveBtn: {
    backgroundColor: C.primary, marginHorizontal: 20, marginTop: 20,
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  saveBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
