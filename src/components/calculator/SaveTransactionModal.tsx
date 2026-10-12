import React, { useState } from 'react';
import {
  Currency,
  TransactionType,
  CategoryItem,
  Transaction,
  CalculationRecord,
} from '../../types/finance';
import {
  DEFAULT_CATEGORIES,
  INCOME_CATEGORIES,
  DEFAULT_ACCOUNTS,
} from '../../constants/categories';
import { formatCurrency } from '../../services/currencyService';

interface SaveTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceAmount: number;
  sourceCurrency: Currency;
  targetAmount: number;
  targetCurrency: Currency;
  exchangeRate: number;
  rateProvider: string;
  customCategories: CategoryItem[];
  onSaveTransaction: (transaction: Transaction) => void;
  onSaveCalculationRecord: (record: CalculationRecord) => void;
}

type SavePurpose = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'HISTORY_ONLY';

export const SaveTransactionModal: React.FC<SaveTransactionModalProps> = ({
  isOpen,
  onClose,
  sourceAmount,
  sourceCurrency,
  targetAmount,
  targetCurrency,
  exchangeRate,
  rateProvider,
  customCategories,
  onSaveTransaction,
  onSaveCalculationRecord,
}) => {
  const [purpose, setPurpose] = useState<SavePurpose>('EXPENSE');
  // User can choose whether to record the source currency/amount or the converted target currency/amount
  const [useConverted, setUseConverted] = useState<boolean>(false);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [account, setAccount] = useState<string>(DEFAULT_ACCOUNTS[0]);
  const [destinationAccount, setDestinationAccount] = useState<string>(DEFAULT_ACCOUNTS[1]);
  const [category, setCategory] = useState<string>('Makanan & Sembako');
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  const activeAmount = useConverted ? targetAmount : sourceAmount;
  const activeCurrency = useConverted ? targetCurrency : sourceCurrency;

  // Rate to IDR snapshot
  const rateToIDR =
    activeCurrency === 'IDR'
      ? 1
      : activeCurrency === 'USD'
      ? 15850
      : 104.5; // Snapshot rate

  const allExpenseCategories = [...customCategories, ...DEFAULT_CATEGORIES];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (purpose === 'HISTORY_ONLY') {
      const record: CalculationRecord = {
        id: `calc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        fromCurrency: sourceCurrency,
        toCurrency: targetCurrency,
        fromAmount: sourceAmount,
        toAmount: targetAmount,
        rate: exchangeRate,
        provider: rateProvider,
        note: note.trim() || `Konversi ${sourceCurrency} ke ${targetCurrency}`,
      };
      onSaveCalculationRecord(record);
      onClose();
      return;
    }

    const txType: TransactionType = purpose;
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date,
      type: txType,
      amount: activeAmount,
      currency: activeCurrency,
      category: txType === 'TRANSFER' ? 'Transfer Saldo' : category,
      account,
      destinationAccount: txType === 'TRANSFER' ? destinationAccount : undefined,
      note: note.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      exchangeRateToIDR: rateToIDR,
    };

    onSaveTransaction(newTransaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#12161f] border border-[#262c3b] rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#242b38]">
          <div>
            <h3 className="text-base font-bold text-[#f3efe6]">Simpan Transaksi Keuangan</h3>
            <p className="text-xs text-zinc-400">
              Pilih tujuan pencatatan agar saldo dan grafik tetap valid.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 text-lg font-mono"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Purpose Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Tujuan Pencatatan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#0a0d12] rounded-lg border border-[#202531]">
              <button
                type="button"
                onClick={() => {
                  setPurpose('EXPENSE');
                  setCategory('Makanan & Sembako');
                }}
                className={`py-2 px-2 text-xs font-semibold rounded transition-colors ${
                  purpose === 'EXPENSE'
                    ? 'bg-red-950/80 text-red-300 border border-red-700/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => {
                  setPurpose('INCOME');
                  setCategory(INCOME_CATEGORIES[0]);
                }}
                className={`py-2 px-2 text-xs font-semibold rounded transition-colors ${
                  purpose === 'INCOME'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setPurpose('TRANSFER')}
                className={`py-2 px-2 text-xs font-semibold rounded transition-colors ${
                  purpose === 'TRANSFER'
                    ? 'bg-blue-950/80 text-blue-300 border border-blue-700/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Transfer
              </button>
              <button
                type="button"
                onClick={() => setPurpose('HISTORY_ONLY')}
                className={`py-2 px-2 text-xs font-semibold rounded transition-colors ${
                  purpose === 'HISTORY_ONLY'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Riwayat Saja
              </button>
            </div>
            {purpose === 'HISTORY_ONLY' && (
              <p className="text-[11px] text-amber-400/90 mt-1.5">
                * Hanya disimpan sebagai catatan kalkulasi. Tidak memengaruhi saldo, pemasukan, atau
                pengeluaran.
              </p>
            )}
          </div>

          {/* Amount & Currency Choice */}
          <div className="bg-[#0b0e14] p-3 rounded-lg border border-[#202735]">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span>Pilih Nominal Yang Dicatat:</span>
              <button
                type="button"
                onClick={() => setUseConverted(!useConverted)}
                className="text-orange-400 hover:text-orange-300 font-semibold underline"
              >
                Ganti ke {useConverted ? sourceCurrency : targetCurrency}
              </button>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-[#f3efe6] tabular-nums">
                {formatCurrency(activeAmount, activeCurrency)}
              </span>
              <span className="text-xs font-semibold text-zinc-400 font-mono">
                {activeCurrency}
              </span>
            </div>
          </div>

          {purpose !== 'HISTORY_ONLY' && (
            <>
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#181d27] border border-[#2c3444] rounded-lg px-3 py-2 text-sm text-[#f3efe6] font-mono focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Category (if not transfer) */}
              {purpose !== 'TRANSFER' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Kategori Transaksi
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#181d27] border border-[#2c3444] rounded-lg px-3 py-2 text-sm text-[#f3efe6] focus:outline-none focus:border-orange-500"
                  >
                    {purpose === 'INCOME' ? (
                      INCOME_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))
                    ) : (
                      <>
                        <optgroup label="Kebutuhan Primer">
                          {allExpenseCategories
                            .filter((c) => c.group === 'PRIMARY')
                            .map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="Kebutuhan Sekunder">
                          {allExpenseCategories
                            .filter((c) => c.group === 'SECONDARY')
                            .map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="Kebutuhan Tersier">
                          {allExpenseCategories
                            .filter((c) => c.group === 'TERTIARY')
                            .map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="Tabungan & Investasi">
                          {allExpenseCategories
                            .filter((c) => c.group === 'SAVINGS')
                            .map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                        </optgroup>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Account Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {purpose === 'TRANSFER' ? 'Dari Akun Asal' : 'Sumber Akun / Dompet'}
                  </label>
                  <select
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="w-full bg-[#181d27] border border-[#2c3444] rounded-lg px-3 py-2 text-sm text-[#f3efe6] focus:outline-none focus:border-orange-500"
                  >
                    {DEFAULT_ACCOUNTS.map((acc) => (
                      <option key={acc} value={acc}>
                        {acc}
                      </option>
                    ))}
                  </select>
                </div>

                {purpose === 'TRANSFER' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Ke Akun Tujuan
                    </label>
                    <select
                      value={destinationAccount}
                      onChange={(e) => setDestinationAccount(e.target.value)}
                      className="w-full bg-[#181d27] border border-[#2c3444] rounded-lg px-3 py-2 text-sm text-[#f3efe6] focus:outline-none focus:border-orange-500"
                    >
                      {DEFAULT_ACCOUNTS.map((acc) => (
                        <option key={acc} value={acc}>
                          {acc}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Catatan / Keterangan
            </label>
            <input
              type="text"
              placeholder={
                purpose === 'HISTORY_ONLY'
                  ? 'Contoh: Simulasi kurs belanja liburan Tokyo'
                  : 'Contoh: Belanja bulanan di supermarket'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#181d27] border border-[#2c3444] rounded-lg px-3 py-2 text-sm text-[#f3efe6] focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#242b38]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-transparent border border-zinc-700 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-md transition-colors"
            >
              {purpose === 'HISTORY_ONLY' ? 'Simpan ke Riwayat Kalkulasi' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
