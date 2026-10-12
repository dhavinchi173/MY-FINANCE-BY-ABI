import React, { useState, useMemo } from 'react';
import {
  Transaction,
  TimeframePeriod,
  DateRange,
  Currency,
  TransactionType,
  CategoryItem,
  ExchangeRates,
} from '../../types/finance';
import {
  getDateRangeForPeriod,
  filterTransactionsByDate,
  calculateFinancialSummary,
  getTransactionIDREquivalent,
} from '../../services/financialAnalytics';
import { formatCurrency } from '../../services/currencyService';
import { generateTransactionsCSV } from '../../services/storageService';
import { useDragScroll } from '../../hooks/useDragScroll';
import { TransactionFormModal } from './TransactionFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface TransactionManagerProps {
  transactions: Transaction[];
  onSaveTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  customCategories: CategoryItem[];
  rates: ExchangeRates;
  onOpenNewTransactionModal: () => void;
}

export const TransactionManager: React.FC<TransactionManagerProps> = ({
  transactions,
  onSaveTransaction,
  onDeleteTransaction,
  customCategories,
  rates,
}) => {
  // Period filter
  const [selectedPeriod, setSelectedPeriod] = useState<TimeframePeriod>('THIS_MONTH');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Type & Currency Filters
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterCurrency, setFilterCurrency] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  // Drag-to-scroll refs for touch screens & mouse sensors
  const tabsScrollRef = useDragScroll<HTMLDivElement>();
  const tableScrollRef = useDragScroll<HTMLDivElement>();

  // Compute active date range
  const activeDateRange = useMemo(
    () => getDateRangeForPeriod(selectedPeriod, customRange),
    [selectedPeriod, customRange]
  );

  // Filter by date first
  const dateFiltered = useMemo(
    () => filterTransactionsByDate(transactions, activeDateRange),
    [transactions, activeDateRange]
  );

  // Calculate deterministic financial summary for the period
  const summary = useMemo(
    () => calculateFinancialSummary(dateFiltered, customCategories),
    [dateFiltered, customCategories]
  );

  // Secondary filters (Type, Currency, Search, Sort)
  const displayedTransactions = useMemo(() => {
    let result = [...dateFiltered];

    if (filterType !== 'ALL') {
      result = result.filter((t) => t.type === filterType);
    }

    if (filterCurrency !== 'ALL') {
      result = result.filter((t) => t.currency === filterCurrency);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.category.toLowerCase().includes(q) ||
          t.note.toLowerCase().includes(q) ||
          t.account.toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortField === 'date') {
        const diff = a.date.localeCompare(b.date);
        return sortOrder === 'desc' ? -diff : diff;
      } else {
        const valA = getTransactionIDREquivalent(a);
        const valB = getTransactionIDREquivalent(b);
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      }
    });

    return result;
  }, [dateFiltered, filterType, filterCurrency, searchQuery, sortField, sortOrder]);

  const handleDownloadCSV = () => {
    const csv = generateTransactionsCSV(displayedTransactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rupiah-finance-ledger-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Editorial Title & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242933]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f3efe6]">
            Ledger & Riwayat Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Manajemen pencatatan uang masuk, keluar, dan transfer multi-valuta.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCSV}
            disabled={displayedTransactions.length === 0}
            className="px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-[#151922] hover:bg-[#1e2430] border border-[#2b3345] rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            Unduh CSV ({displayedTransactions.length})
          </button>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            + Catat Baru
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Income */}
        <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-4">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
            Total Uang Masuk
          </span>
          <div className="mt-1 text-lg sm:text-xl font-bold font-mono text-emerald-400 tabular-nums">
            {formatCurrency(summary.totalIncomeIDR, 'IDR')}
          </div>
          <span className="text-[11px] text-zinc-500">
            {summary.transactionCount === 0 ? 'Belum ada catatan' : 'Periode terpilih'}
          </span>
        </div>

        {/* Total Expense */}
        <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-4">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
            Total Uang Keluar
          </span>
          <div className="mt-1 text-lg sm:text-xl font-bold font-mono text-red-400 tabular-nums">
            {formatCurrency(summary.totalExpensesIDR, 'IDR')}
          </div>
          <span className="text-[11px] text-zinc-500">
            {summary.expenseToIncomeRatio !== null
              ? `Rasio: ${summary.expenseToIncomeRatio.toFixed(1)}%`
              : 'Belum ada pemasukan'}
          </span>
        </div>

        {/* Net Cash Flow */}
        <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-4">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
            Arus Kas Bersih
          </span>
          <div
            className={`mt-1 text-lg sm:text-xl font-bold font-mono tabular-nums ${
              summary.netCashFlowIDR >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(summary.netCashFlowIDR, 'IDR')}
          </div>
          <span className="text-[11px] text-zinc-500">
            {summary.netCashFlowIDR >= 0 ? 'Surplus operasional' : 'Defisit operasional'}
          </span>
        </div>

        {/* Total Savings Recorded */}
        <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-4">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
            Tabungan & Surplus
          </span>
          <div className="mt-1 text-lg sm:text-xl font-bold font-mono text-orange-400 tabular-nums">
            {formatCurrency(summary.savingsRecordedIDR + Math.max(0, summary.netCashFlowIDR), 'IDR')}
          </div>
          <span className="text-[11px] text-zinc-500">
            {summary.savingsRate !== null
              ? `Tingkat Tabungan: ${summary.savingsRate.toFixed(1)}%`
              : '0% (Belum ada pemasukan)'}
          </span>
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-4 space-y-3">
        {/* Period Selector Tabs */}
        <div
          ref={tabsScrollRef}
          className="flex items-center justify-start overflow-x-auto no-scrollbar gap-1 pb-1 touch-pan-x cursor-grab"
        >
          {[
            { id: 'TODAY', label: 'Hari Ini' },
            { id: 'LAST_7_DAYS', label: '7 Hari' },
            { id: 'LAST_30_DAYS', label: '30 Hari' },
            { id: 'THIS_MONTH', label: 'Bulan Ini' },
            { id: 'LAST_MONTH', label: 'Bulan Lalu' },
            { id: 'THIS_YEAR', label: 'Tahun Ini' },
            { id: 'ALL_TIME', label: 'Semua Riwayat' },
            { id: 'CUSTOM', label: 'Kustom' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedPeriod(item.id as TimeframePeriod)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedPeriod === item.id
                  ? 'bg-orange-600 text-white font-semibold shadow-sm'
                  : 'bg-[#181d27] text-zinc-400 hover:text-zinc-200 hover:bg-[#202735]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers if CUSTOM selected */}
        {selectedPeriod === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Dari:</span>
              <input
                type="date"
                value={customRange.startDate}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="bg-[#181d27] border border-[#2c3444] rounded px-2.5 py-1 text-xs text-[#f3efe6] font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Sampai:</span>
              <input
                type="date"
                value={customRange.endDate}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="bg-[#181d27] border border-[#2c3444] rounded px-2.5 py-1 text-xs text-[#f3efe6] font-mono"
              />
            </div>
          </div>
        )}

        {/* Search, Type Filter, Currency Filter, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-[#1f2533]">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Cari keterangan, kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181d27] border border-[#2c3444] rounded-lg px-3 py-1.5 text-xs text-[#f3efe6] focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-[#181d27] border border-[#2c3444] rounded-lg px-3 py-1.5 text-xs text-[#f3efe6] focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Jenis Transaksi</option>
              <option value="EXPENSE">Pengeluaran Saja</option>
              <option value="INCOME">Pemasukan Saja</option>
              <option value="TRANSFER">Transfer Saja</option>
            </select>
          </div>

          {/* Currency Filter */}
          <div>
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              className="w-full bg-[#181d27] border border-[#2c3444] rounded-lg px-3 py-1.5 text-xs text-[#f3efe6] focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Valuta (IDR / JPY / USD)</option>
              <option value="IDR">IDR (Rupiah)</option>
              <option value="JPY">JPY (Yen)</option>
              <option value="USD">USD (Dollar)</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as 'date' | 'amount')}
              className="w-2/3 bg-[#181d27] border border-[#2c3444] rounded-lg px-2 py-1.5 text-xs text-[#f3efe6] focus:outline-none focus:border-orange-500"
            >
              <option value="date">Urut: Tanggal</option>
              <option value="amount">Urut: Nominal</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="w-1/3 bg-[#181d27] hover:bg-[#202735] border border-[#2c3444] rounded-lg py-1.5 text-xs text-zinc-300 font-mono"
              title="Balik Urutan"
            >
              {sortOrder === 'desc' ? '⬇ Terbesar' : '⬆ Terkecil'}
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table & Empty State */}
      <div className="bg-[#12151c] border border-[#242b38] rounded-xl overflow-hidden shadow-sm">
        {displayedTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-3xl text-zinc-600">📝</div>
            <h3 className="text-sm font-bold text-[#f3efe6]">
              {transactions.length === 0
                ? 'Belum Ada Transaksi Keuangan'
                : 'Tidak Ada Transaksi Yang Sesuai Filter'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {transactions.length === 0
                ? 'Sistem RUPIAH FINANCE OS dimulai dari saldo Rp 0. Tidak ada transaksi palsu. Simpan transaksi pertama Anda untuk melihat perkembangan.'
                : 'Coba ubah filter rentang tanggal, jenis transaksi, atau kata kunci pencarian.'}
            </p>
            {transactions.length === 0 && (
              <button
                onClick={() => {
                  setEditingTransaction(null);
                  setIsFormOpen(true);
                }}
                className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors cursor-pointer"
              >
                + Tambah Transaksi Pertama
              </button>
            )}
          </div>
        ) : (
          <div
            ref={tableScrollRef}
            className="overflow-x-auto no-scrollbar touch-pan-x cursor-grab"
          >
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e1117] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#242b38]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Jenis</th>
                  <th className="py-3 px-4 font-semibold">Kategori / Akun</th>
                  <th className="py-3 px-4 font-semibold">Catatan</th>
                  <th className="py-3 px-4 font-semibold text-right">Nominal Asli</th>
                  <th className="py-3 px-4 font-semibold text-right">Setara IDR</th>
                  <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2430]">
                {displayedTransactions.map((tx) => {
                  const idrEquivalent = getTransactionIDREquivalent(tx);
                  const isIncome = tx.type === 'INCOME';
                  const isExpense = tx.type === 'EXPENSE';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#161a23] transition-colors group text-zinc-300"
                    >
                      <td className="py-3 px-4 font-mono tabular-nums text-zinc-400 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-semibold text-[11px] ${
                            isIncome
                              ? 'text-emerald-400'
                              : isExpense
                              ? 'text-red-400'
                              : 'text-blue-400'
                          }`}
                        >
                          {isIncome ? 'Masuk' : isExpense ? 'Keluar' : 'Transfer'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#f3efe6]">{tx.category}</div>
                        <div className="text-[10px] text-zinc-500">
                          {tx.account}
                          {tx.destinationAccount && ` ➔ ${tx.destinationAccount}`}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-zinc-400">
                        {tx.note || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-[#f3efe6] tabular-nums whitespace-nowrap">
                        {formatCurrency(tx.amount, tx.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-300 tabular-nums whitespace-nowrap">
                        {formatCurrency(idrEquivalent, 'IDR')}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => {
                              setEditingTransaction(tx);
                              setIsFormOpen(true);
                            }}
                            className="p-1 text-zinc-400 hover:text-orange-400 transition-colors"
                            title="Edit Transaksi"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => setDeletingTransaction(tx)}
                            className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Hapus Transaksi"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Modal (Add/Edit) */}
      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
        onSave={onSaveTransaction}
        editingTransaction={editingTransaction}
        customCategories={customCategories}
        rates={rates}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={() => {
          if (deletingTransaction) {
            onDeleteTransaction(deletingTransaction.id);
            setDeletingTransaction(null);
          }
        }}
        transaction={deletingTransaction}
      />
    </div>
  );
};
