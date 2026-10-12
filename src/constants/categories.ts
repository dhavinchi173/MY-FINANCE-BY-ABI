import { CategoryItem, AllocationPlan } from '../types/finance';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  // PRIMARY (Kebutuhan Primer)
  { id: 'cat-food', name: 'Makanan & Sembako', group: 'PRIMARY' },
  { id: 'cat-housing', name: 'Tempat Tinggal & Sewa', group: 'PRIMARY' },
  { id: 'cat-utilities', name: 'Listrik, Air & Gas', group: 'PRIMARY' },
  { id: 'cat-transport', name: 'Transportasi Pokok & BBM', group: 'PRIMARY' },
  { id: 'cat-health', name: 'Kesehatan & Obat', group: 'PRIMARY' },
  { id: 'cat-education-primary', name: 'Pendidikan Wajib / Sekolah', group: 'PRIMARY' },

  // SECONDARY (Kebutuhan Sekunder)
  { id: 'cat-comm', name: 'Paket Data & Komunikasi', group: 'SECONDARY' },
  { id: 'cat-skills', name: 'Kursus & Pengembangan Diri', group: 'SECONDARY' },
  { id: 'cat-home', name: 'Perlengkapan Rumah Tangga', group: 'SECONDARY' },
  { id: 'cat-gadget', name: 'Peralatan Kerja & Servis', group: 'SECONDARY' },
  { id: 'cat-clothing', name: 'Pakaian & Kebutuhan Sandang', group: 'SECONDARY' },

  // TERTIARY (Kebutuhan Tersier)
  { id: 'cat-entertainment', name: 'Hiburan & Rekreasi', group: 'TERTIARY' },
  { id: 'cat-lifestyle', name: 'Belanja Gaya Hidup & Hobi', group: 'TERTIARY' },
  { id: 'cat-dining-out', name: 'Kafe & Makan Mewah', group: 'TERTIARY' },
  { id: 'cat-subscription', name: 'Langganan Streaming & Game', group: 'TERTIARY' },
  { id: 'cat-vacation', name: 'Liburan & Staycation', group: 'TERTIARY' },

  // SAVINGS (Tabungan & Investasi)
  { id: 'cat-emergency', name: 'Dana Darurat', group: 'SAVINGS' },
  { id: 'cat-investment', name: 'Investasi & Reksadana', group: 'SAVINGS' },
  { id: 'cat-target-savings', name: 'Tabungan Target / Rumah', group: 'SAVINGS' },
];

export const INCOME_CATEGORIES = [
  'Gaji Pokok',
  'Bonus & THR',
  'Penjualan & Bisnis',
  'Freelance / Proyek',
  'Dividen & Imbal Hasil',
  'Hadiah / Hibah',
  'Pemasukan Lainnya',
];

export const DEFAULT_ACCOUNTS = [
  'Kas Tunai (Cash)',
  'Bank BCA',
  'Bank Mandiri',
  'Bank BRI / BNI',
  'GoPay / OVO / Dana',
  'Rekening Valas (USD/JPY)',
];

export const DEFAULT_ALLOCATION_PLAN: AllocationPlan = {
  primaryPercent: 50,
  secondaryPercent: 20,
  tertiaryPercent: 10,
  savingsPercent: 20,
  unallocatedPercent: 0,
  updatedAt: new Date().toISOString(),
};

export const ALLOCATION_PRESETS = [
  {
    name: 'Aturan 50/20/10/20 (Standar Seimbang)',
    description: '50% Primer, 20% Sekunder, 10% Tersier, 20% Tabungan',
    primary: 50,
    secondary: 20,
    tertiary: 10,
    savings: 20,
  },
  {
    name: 'Aturan 40/15/5/40 (Hemat & Investasi Agresif)',
    description: 'Prioritas membangun aset dan dana darurat cepat',
    primary: 40,
    secondary: 15,
    tertiary: 5,
    savings: 40,
  },
  {
    name: 'Aturan 65/15/10/10 (Mahasiswa / Perantau)',
    description: 'Fokus bertahan hidup di kota dengan biaya hidup tinggi',
    primary: 65,
    secondary: 15,
    tertiary: 10,
    savings: 10,
  },
  {
    name: 'Aturan 50/30/20 (Klasik Elizabeth Warren)',
    description: '50% Kebutuhan, 30% Keinginan (Sekunder+Tersier), 20% Tabungan',
    primary: 50,
    secondary: 20,
    tertiary: 10,
    savings: 20,
  },
];
