import type { Product, Transaction } from '../types';
import { useProductStore } from '../store/useProductStore';

// ============ PRODUCTS ============

export async function getAllProducts(): Promise<Product[]> {
  return useProductStore.getState().products;
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  return useProductStore.getState().getProductByBarcode(barcode);
}

export async function createProduct(
  product: Omit<Product, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  useProductStore.getState().addProduct(product);
}

export async function updateProduct(product: Product): Promise<void> {
  useProductStore.getState().editProduct(product);
}

export async function deleteProduct(id: string): Promise<void> {
  useProductStore.getState().removeProduct(id);
}

export async function updateSoldStock(
  productId: string,
  quantity: number,
): Promise<void> {
  useProductStore.getState().sellProduct(productId, quantity);
}

// ============ TRANSACTIONS ============

export async function getAllTransactions(): Promise<Transaction[]> {
  return useProductStore.getState().transactions;
}

export async function createTransaction(transaction: Transaction): Promise<void> {
  useProductStore.getState().addTransaction(transaction);
}
