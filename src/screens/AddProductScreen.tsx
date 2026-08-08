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
import { addProductStyles as s, C } from '../styles/globalStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '../context/ProductContext';
import {
  formatRupiah,
  formatCurrencyInput,
  parseCurrencyInput,
} from '../utils/calculations';



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
      if (!parsedSellPrice) { Alert.alert('Error', 'Harga jual / unit harus diisi!'); return; }
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

          {/* Modal / Harga Beli (Hanya di Mode Batch) */}
          {!isSatuanMode && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>💸 MODAL / HARGA BELI</Text>
              <Text style={s.label}>Total Modal Beli (Opsional)</Text>
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
          )}

          {/* Harga Jual */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>💰 HARGA JUAL</Text>
            <Text style={s.label}>Harga Jual / Unit *</Text>
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


