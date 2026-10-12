import React, { useState, useMemo } from 'react';
import {
  Transaction,
  TimeframePeriod,
  DateRange,
  CategoryItem,
  AllocationPlan,
} from '../../types/finance';
import {
  getDateRangeForPeriod,
  filterTransactionsByDate,
  calculateFinancialSummary,
  aggregateDailyTrend,
  aggregateMonthlyTrend,
  aggregateYearlyTrend,
  aggregateExpenseCategories,
  computeAllocationComparison,
  TimeChartPoint,
} from '../../services/financialAnalytics';
import { formatCurrency } from '../../services/currencyService';
import { useDragScroll } from '../../hooks/useDragScroll';
import { DualBarChart, NetFlowChart, DonutChart } from './SvgChartPrimitives';

interface FinancialChartsProps {
  transactions: Transaction[];
  customCategories: CategoryItem[];
  allocationPlan: AllocationPlan;
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  transactions,
  customCategories,
  allocationPlan,
}) => {
  const periodTabsRef = useDragScroll<HTMLDivElement>();
  const [selectedPeriod, setSelectedPeriod] = useState<TimeframePeriod>('LAST_30_DAYS');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const activeRange = useMemo(
    () => getDateRangeForPeriod(selectedPeriod, customRange),
    [selectedPeriod, customRange]
  );

  const periodTransactions = useMemo(
    () => filterTransactionsByDate(transactions, activeRange),
    [transactions, activeRange]
  );

  const summary = useMemo(
    () => calculateFinancialSummary(periodTransactions, customCategories),
    [periodTransactions, customCategories]
  );

  // Time trend data depending on period
  const trendPoints: TimeChartPoint[] = useMemo(() => {
    if (selectedPeriod === 'TODAY' || selectedPeriod === 'LAST_7_DAYS') {
      return aggregateDailyTrend(periodTransactions, 7);
    } else if (selectedPeriod === 'LAST_30_DAYS' || selectedPeriod === 'THIS_MONTH' || selectedPeriod === 'LAST_MONTH') {
      return aggregateDailyTrend(periodTransactions, 14);
    } else if (selectedPeriod === 'THIS_YEAR' || selectedPeriod === 'LAST_YEAR') {
      return aggregateMonthlyTrend(periodTransactions, 12);
    } else {
      // ALL_TIME or multi-year
      return aggregateYearlyTrend(transactions);
    }
  }, [selectedPeriod, periodTransactions, transactions]);

  // Dual bar chart data
  const dualBarData = useMemo(() => {
    return trendPoints.map((p) => ({
      label: p.label,
      val1: p.income,
      val2: p.expense,
    }));
  }, [trendPoints]);

  // Net flow chart data
  const netFlowData = useMemo(() => {
    return trendPoints.map((p) => ({
      label: p.label,
      netFlow: p.netFlow,
    }));
  }, [trendPoints]);

  // Category distribution
  const categoryDistribution = useMemo(
    () => aggregateExpenseCategories(periodTransactions, customCategories),
    [periodTransactions, customCategories]
  );

  // Donut chart slices for the 3 groups + savings
  const donutSlices = useMemo(() => {
    return [
      {
        label: 'Primer',
        value: summary.primaryExpensesIDR,
        color: '#3b82f6', // Blue
      },
      {
        label: 'Sekunder',
        value: summary.secondaryExpensesIDR,
        color: '#f59e0b', // Amber
      },
      {
        label: 'Tersier',
        value: summary.tertiaryExpensesIDR,
        color: '#ef4444', // Red
      },
      {
        label: 'Tabungan/Investasi',
        value: summary.savingsRecordedIDR,
        color: '#10b981', // Emerald
      },
    ].filter((s) => s.value > 0);
  }, [summary]);

  // Allocation plan comparison
  const allocationComparisons = useMemo(
    () => computeAllocationComparison(summary, allocationPlan),
    [summary, allocationPlan]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242933]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f3efe6]">
            Grafik & Analitik Finansial
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Visualisasi historis arus kas dari hari pertama pencatatan hingga multi-tahun.
          </p>
        </div>

        {/* Timeframe selector tabs */}
        <div
          ref={periodTabsRef}
          className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-[#12151c] p-1 rounded-lg border border-[#242b38] touch-pan-x cursor-grab"
        >
          {[
            { id: 'LAST_7_DAYS', label: '7 Hari' },
            { id: 'LAST_30_DAYS', label: '30 Hari' },
            { id: 'THIS_MONTH', label: 'Bulan Ini' },
            { id: 'THIS_YEAR', label: 'Tahun Ini' },
            { id: 'ALL_TIME', label: 'Multi-Tahun' },
            { id: 'CUSTOM', label: 'Kustom' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedPeriod(item.id as TimeframePeriod)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                selectedPeriod === item.id
                  ? 'bg-orange-600 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Range Picker */}
      {selectedPeriod === 'CUSTOM' && (
        <div className="p-3 bg-[#12151c] rounded-lg border border-[#242b38] flex flex-wrap items-center gap-3 text-xs">
          <span className="text-zinc-400">Rentang Tanggal Kustom:</span>
          <input
            type="date"
            value={customRange.startDate}
            onChange={(e) =>
              setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="bg-[#181d27] border border-[#2c3444] rounded px-2.5 py-1 text-xs text-[#f3efe6] font-mono"
          />
          <span className="text-zinc-400">sampai</span>
          <input
            type="date"
            value={customRange.endDate}
            onChange={(e) =>
              setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="bg-[#181d27] border border-[#2c3444] rounded px-2.5 py-1 text-xs text-[#f3efe6] font-mono"
          />
        </div>
      )}

      {/* Zero State Alert If Empty */}
      {transactions.length === 0 ? (
        <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-10 text-center space-y-3">
          <div className="text-3xl text-zinc-600">📊</div>
          <h3 className="text-base font-bold text-[#f3efe6]">
            Grafik Belum Memiliki Catatan Transaksi
          </h3>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto">
            Sesuai prinsip transparansi, grafik tidak menampilkan data simulasi atau garis tren palsu.
            Grafik akan segera terbangun begitu Anda mencatat transaksi pemasukan atau pengeluaran pertama.
          </p>
        </div>
      ) : (
        <>
          {/* Main Charts Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Income vs Expense */}
            <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-5 shadow-sm space-y-3">
              <div>
                <h3 className="text-sm font-bold text-[#f3efe6]">
                  1. Perbandingan Pemasukan vs Pengeluaran
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Agregasi nominal arus masuk dan keluar dalam periode terpilih.
                </p>
              </div>

              <DualBarChart
                data={dualBarData}
                val1Label="Pemasukan"
                val2Label="Pengeluaran"
                height={220}
              />
            </div>

            {/* Chart 2: Net Cash Flow */}
            <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-5 shadow-sm space-y-3">
              <div>
                <h3 className="text-sm font-bold text-[#f3efe6]">2. Tren Arus Kas Bersih</h3>
                <p className="text-[11px] text-zinc-500">
                  Posisi surplus (di atas garis nol) atau defisit (di bawah garis nol).
                </p>
              </div>

              <NetFlowChart data={netFlowData} height={220} />
            </div>
          </div>

          {/* Allocation & Category Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Category Donut & Breakdown (5 cols) */}
            <div className="lg:col-span-5 bg-[#12151c] border border-[#242b38] rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#f3efe6]">
                  3. Distribusi Kelompok Pengeluaran
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Primer, Sekunder, Tersier, dan Tabungan
                </p>
              </div>

              <DonutChart slices={donutSlices} size={170} />

              {/* Top Categories Ranked List */}
              <div className="pt-3 border-t border-[#1f2533]">
                <h4 className="text-xs font-semibold text-zinc-400 mb-2">
                  Rincian Kategori Terbesar
                </h4>
                {categoryDistribution.length === 0 ? (
                  <div className="text-xs text-zinc-500 py-3 text-center">
                    Belum ada pengeluaran pada periode ini.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {categoryDistribution.slice(0, 5).map((cat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-300 font-medium">{cat.category}</span>
                          <span className="font-mono text-zinc-400 tabular-nums">
                            {formatCurrency(cat.totalIDR, 'IDR')} ({cat.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#1c212c] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-orange-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, cat.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Allocation Utilization vs Plan (7 cols) */}
            <div className="lg:col-span-7 bg-[#12151c] border border-[#242b38] rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#f3efe6]">
                  4. Pemanfaatan Anggaran vs Rencana Alokasi
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Target alokasi dihitung otomatis berdasarkan pemasukan tercatat:{' '}
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {formatCurrency(summary.totalIncomeIDR, 'IDR')}
                  </span>
                </p>
              </div>

              {summary.totalIncomeIDR === 0 ? (
                <div className="p-6 rounded-lg bg-[#0c0e14] border border-[#222836] text-xs text-zinc-400 text-center">
                  Belum ada pemasukan yang tercatat dalam periode ini.
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Batas nominal anggaran rencana (Rp) memerlukan nilai pemasukan sebagai basis.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allocationComparisons.map((item) => {
                    const over = item.isOverBudget;
                    const percent = item.utilizationPercent;

                    return (
                      <div
                        key={item.group}
                        className="p-3.5 bg-[#0e1117] rounded-lg border border-[#222836] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-[#f3efe6]">
                              {item.label}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              ({item.configuredPercent}% rencana)
                            </span>
                          </div>

                          <div className="text-right font-mono text-xs tabular-nums">
                            <span
                              className={`font-bold ${
                                over ? 'text-red-400' : 'text-zinc-200'
                              }`}
                            >
                              {formatCurrency(item.actualSpentIDR, 'IDR')}
                            </span>
                            <span className="text-zinc-500"> / {formatCurrency(item.plannedAmountIDR, 'IDR')}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#1a1f2b] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              over
                                ? 'bg-red-500'
                                : percent >= 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>

                        {/* Remaining note */}
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                          <span>
                            {over
                              ? `⚠️ Melebihi batas rencana sebesar ${formatCurrency(
                                  Math.abs(item.remainingAllowanceIDR),
                                  'IDR'
                                )}`
                              : `Sisa anggaran rencana: ${formatCurrency(
                                  item.remainingAllowanceIDR,
                                  'IDR'
                                )}`}
                          </span>
                          <span className={over ? 'text-red-400 font-bold' : ''}>
                            {percent.toFixed(1)}% terpakai
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
