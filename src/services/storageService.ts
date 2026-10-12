import {
  Transaction,
  CalculationRecord,
  AllocationPlan,
  CategoryItem,
} from '../types/finance';
import { DEFAULT_ALLOCATION_PLAN } from '../constants/categories';

const DB_NAME = 'RupiahFinanceOS_DB';
const DB_VERSION = 1;
const STORE_TRANSACTIONS = 'transactions';
const STORE_CALCULATIONS = 'calculations';
const STORE_PREFERENCES = 'preferences';

// LocalStorage Fallback keys
const LS_PREFIX = 'rfos_';
const LS_TRANSACTIONS = `${LS_PREFIX}transactions`;
const LS_CALCULATIONS = `${LS_PREFIX}calculations`;
const LS_ALLOCATION = `${LS_PREFIX}allocation`;
const LS_CATEGORIES = `${LS_PREFIX}custom_categories`;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
        db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CALCULATIONS)) {
        db.createObjectStore(STORE_CALCULATIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PREFERENCES)) {
        db.createObjectStore(STORE_PREFERENCES, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ----------------- TRANSACTIONS STORAGE -----------------

export async function getStoredTransactions(): Promise<Transaction[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_TRANSACTIONS, 'readonly');
      const store = tx.objectStore(STORE_TRANSACTIONS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve(getTransactionsFromLocalStorage());
    });
  } catch {
    return getTransactionsFromLocalStorage();
  }
}

function getTransactionsFromLocalStorage(): Transaction[] {
  try {
    const raw = localStorage.getItem(LS_TRANSACTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTransaction(transaction: Transaction): Promise<void> {
  // Sync to localStorage as duplicate durability
  try {
    const current = getTransactionsFromLocalStorage();
    const existingIdx = current.findIndex((t) => t.id === transaction.id);
    if (existingIdx >= 0) {
      current[existingIdx] = transaction;
    } else {
      current.unshift(transaction);
    }
    localStorage.setItem(LS_TRANSACTIONS, JSON.stringify(current));
  } catch (err) {
    console.warn('LocalStorage save warning:', err);
  }

  // Primary: IndexedDB
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORE_TRANSACTIONS);
      const req = store.put(transaction);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save fallback to localStorage only:', err);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  // LocalStorage
  try {
    const current = getTransactionsFromLocalStorage();
    const filtered = current.filter((t) => t.id !== id);
    localStorage.setItem(LS_TRANSACTIONS, JSON.stringify(filtered));
  } catch (err) {
    console.warn('LocalStorage delete error:', err);
  }

  // IndexedDB
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORE_TRANSACTIONS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete error:', err);
  }
}

export async function bulkSaveTransactions(transactions: Transaction[]): Promise<void> {
  try {
    localStorage.setItem(LS_TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.warn('LocalStorage bulk error:', err);
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORE_TRANSACTIONS);
      store.clear().onsuccess = () => {
        for (const t of transactions) {
          store.put(t);
        }
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB bulk save error:', err);
  }
}

// ----------------- CALCULATION HISTORY -----------------

export async function getCalculationHistory(): Promise<CalculationRecord[]> {
  try {
    const raw = localStorage.getItem(LS_CALCULATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCalculationRecord(record: CalculationRecord): Promise<void> {
  try {
    const current = await getCalculationHistory();
    const updated = [record, ...current].slice(0, 50); // Keep last 50
    localStorage.setItem(LS_CALCULATIONS, JSON.stringify(updated));
  } catch (err) {
    console.warn('Gagal menyimpan riwayat kalkulasi:', err);
  }
}

export async function clearCalculationHistory(): Promise<void> {
  try {
    localStorage.removeItem(LS_CALCULATIONS);
  } catch (err) {
    console.warn('Gagal menghapus riwayat kalkulasi:', err);
  }
}

// ----------------- ALLOCATION PLAN -----------------

export function getStoredAllocationPlan(): AllocationPlan {
  try {
    const raw = localStorage.getItem(LS_ALLOCATION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed.primaryPercent === 'number' &&
        typeof parsed.secondaryPercent === 'number' &&
        typeof parsed.tertiaryPercent === 'number' &&
        typeof parsed.savingsPercent === 'number'
      ) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading allocation plan:', err);
  }
  return DEFAULT_ALLOCATION_PLAN;
}

export function saveStoredAllocationPlan(plan: AllocationPlan): void {
  try {
    localStorage.setItem(LS_ALLOCATION, JSON.stringify(plan));
  } catch (err) {
    console.warn('Error saving allocation plan:', err);
  }
}

// ----------------- CUSTOM CATEGORIES -----------------

export function getStoredCustomCategories(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(LS_CATEGORIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredCustomCategories(categories: CategoryItem[]): void {
  try {
    localStorage.setItem(LS_CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.warn('Error saving custom categories:', err);
  }
}

// ----------------- BACKUP & EXPORT / IMPORT -----------------

export interface BackupData {
  version: string;
  exportedAt: string;
  appName: string;
  transactions: Transaction[];
  calculations: CalculationRecord[];
  allocationPlan: AllocationPlan;
  customCategories: CategoryItem[];
}

export async function createFullBackupJSON(): Promise<string> {
  const transactions = await getStoredTransactions();
  const calculations = await getCalculationHistory();
  const allocationPlan = getStoredAllocationPlan();
  const customCategories = getStoredCustomCategories();

  const backup: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    appName: 'RUPIAH_FINANCE_OS',
    transactions,
    calculations,
    allocationPlan,
    customCategories,
  };

  return JSON.stringify(backup, null, 2);
}

export async function restoreFromBackupJSON(jsonStr: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.transactions)) {
      return { success: false, count: 0, error: 'Format berkas backup tidak valid (struktur data tidak sesuai).' };
    }

    const validTransactions: Transaction[] = parsed.transactions.filter(
      (t: unknown): t is Transaction =>
        typeof t === 'object' &&
        t !== null &&
        typeof (t as Transaction).id === 'string' &&
        typeof (t as Transaction).amount === 'number' &&
        typeof (t as Transaction).date === 'string' &&
        ['INCOME', 'EXPENSE', 'TRANSFER'].includes((t as Transaction).type)
    );

    await bulkSaveTransactions(validTransactions);

    if (Array.isArray(parsed.calculations)) {
      localStorage.setItem(LS_CALCULATIONS, JSON.stringify(parsed.calculations));
    }
    if (parsed.allocationPlan) {
      saveStoredAllocationPlan(parsed.allocationPlan);
    }
    if (Array.isArray(parsed.customCategories)) {
      saveStoredCustomCategories(parsed.customCategories);
    }

    return { success: true, count: validTransactions.length };
  } catch (err) {
    return { success: false, count: 0, error: `Gagal memulihkan data: ${(err as Error).message}` };
  }
}

export function generateTransactionsCSV(transactions: Transaction[]): string {
  const headers = [
    'ID',
    'Tanggal',
    'Tipe',
    'Nominal',
    'Mata Uang',
    'Kurs Ke IDR',
    'Setara IDR',
    'Kategori',
    'Akun Sumber',
    'Akun Tujuan',
    'Catatan',
  ];

  const rows = transactions.map((t) => {
    const idrEquivalent = t.currency === 'IDR' ? t.amount : t.amount * (t.exchangeRateToIDR || 1);
    return [
      t.id,
      t.date,
      t.type,
      t.amount,
      t.currency,
      t.exchangeRateToIDR || 1,
      Math.round(idrEquivalent),
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.account || '').replace(/"/g, '""')}"`,
      `"${(t.destinationAccount || '').replace(/"/g, '""')}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export async function clearAllFinancialData(): Promise<void> {
  try {
    localStorage.removeItem(LS_TRANSACTIONS);
    localStorage.removeItem(LS_CALCULATIONS);
    localStorage.removeItem(LS_CATEGORIES);
    localStorage.removeItem(LS_ALLOCATION);

    const db = await openDatabase();
    const tx = db.transaction([STORE_TRANSACTIONS, STORE_CALCULATIONS], 'readwrite');
    tx.objectStore(STORE_TRANSACTIONS).clear();
    tx.objectStore(STORE_CALCULATIONS).clear();
  } catch (err) {
    console.warn('Error clearing data:', err);
  }
}
