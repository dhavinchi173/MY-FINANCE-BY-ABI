import React, { useState, useEffect } from 'react';
import { Currency, TransactionType, CategoryItem, Transaction, ExchangeRates } from '../../types/finance';
import {
  DEFAULT_CATEGORIES,
  INCOME_CATEGORIES,
  DEFAULT_ACCOUNTS,
} from '../../constants/categories';
import { getExchangeRate } from '../../services/currencyService';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  editingTransaction?: Transaction | null;
  customCategories: CategoryItem[];
  rates: ExchangeRates;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  customCategories,
  rates,
}) => {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('IDR');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('Makanan & Sembako');
  const [account, setAccount] = useState<string>(DEFAULT_ACCOUNTS[0]);
  const [destinationAccount, setDestinationAccount] = useState<string>(DEFAULT_ACCOUNTS[1]);
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountStr(editingTransaction.amount.toString());
      setCurrency(editingTransaction.currency);
      setDate(editingTransaction.date);
      setCategory(editingTransaction.category);
      setAccount(editingTransaction.account);
      setDestinationAccount(editingTransaction.destinationAccount || DEFAULT_ACCOUNTS[1]);
      setNote(editingTransaction.note || '');
    } else {
      setType('EXPENSE');
      setAmountStr('');
      setCurrency('IDR');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('Makanan & Sembako');
      setAccount(DEFAULT_ACCOUNTS[0]);
      setDestinationAccount(DEFAULT_ACCOUNTS[1]);
      setNote('');
    }
    setErrorMsg('');
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const allExpenseCategories = [...customCategories, ...DEFAULT_CATEGORIES];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setErrorMsg('Nominal harus berupa angka valid dan lebih besar dari 0.');
      return;
    }

    const rateToIDR =
      currency === 'IDR'
        ? 1
        : getExchangeRate(currency, 'IDR', rates);

    const nowIso = new Date().toISOString();
    const transaction: Transaction = {
      id: editingTransaction ? editingTransaction.id : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date,
      type,
      amount: cleanAmount,
      currency,
      category: type === 'TRANSFER' ? 'Transfer Saldo' : category,
      account,
      destinationAccount: type === 'TRANSFER' ? destinationAccount : undefined,
      note: note.trim(),
      createdAt: editingTransaction ? editingTransaction.createdAt : nowIso,
      updatedAt: nowIso,
      exchangeRateToIDR: editingTransaction && editingTransaction.exchangeRateToIDR ? editingTransaction.exchangeRateToIDR : rateToIDR,
    };

    onSave(transaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#12161f] border border-[#262c3b] rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#242b38]">
          <h3 className="text-base font-bold text-[#f3efe6]">
            {editingTransaction ? 'Edit Catatan Transaksi' : 'Catat Transaksi Baru'}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 text-lg font-mono"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded bg-red-950/60 border border-red-800 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Transaction Type Segmented Control */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#0a0d12] rounded-lg border border-[#202531]">
              <button
                type="button"
                onClick={() => {
                  setType('EXPENSE');
                  setCategory('Makanan & Sembako');
                }}
                className={`py-2 px-2 text-xs font-semibold rounded transition-colors ${
                  type === 'EXPENSE'
                    ? 'bg-red-950/80 text-red-300 border border-red-700/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('INCOME');
                  setCategory(INCOME_CATEGORIES[0]);
                }}
                className={`py-2 px-2 text-xs font-semibold rounded transition-colors ${
                  type === 'INCOME'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setType('TRANSFER')}
                className={`py-2 px-2 text-xs font-semibold rounded transition-colors ${
                  type === 'TRANSFER'
                    ? 'bg-blue-950/80 text-blue-300 border border-blue-700/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Transfer
              </button>
            </div>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Nominal</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full bg-[#181d27] border border-[#2c3444] rounded-lg px-3 py-2 text-base font-mono text-[#f3efe6] focus:outline-none focus:border-orange-500 tabular-nums"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Valuta</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full bg-[#181d27] border border-[#2c3444] rounded-lg px-3 py-2 text-sm font-semibold text-[#f3efe6] focus:outline-none focus:border-orange-500"
              >
                <option value="IDR">IDR</option>
                <option value="JPY">JPY</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

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

          {/* Category */}
          {type !== 'TRANSFER' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#181d27] border border-[#2c3444] rounded-lg px-3 py-2 text-sm text-[#f3efe6] focus:outline-none focus:border-orange-500"
              >
                {type === 'INCOME' ? (
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

          {/* Accounts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {type === 'TRANSFER' ? 'Dari Akun Asal' : 'Akun / Dompet'}
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

            {type === 'TRANSFER' && (
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

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Catatan / Deskripsi
            </label>
            <input
              type="text"
              placeholder="Contoh: Tiket kereta / Belanja kebutuhan dapur"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#181d27] border border-[#2c3444] rounded-lg px-3 py-2 text-sm text-[#f3efe6] focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#242b38]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-transparent border border-zinc-700 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-md transition-colors cursor-pointer"
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
