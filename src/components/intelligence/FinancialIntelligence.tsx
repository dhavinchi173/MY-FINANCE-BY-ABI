import React, { useState, useMemo } from 'react';
import {
  Transaction,
  FinancialSummary,
  AllocationPlan,
  CategoryItem,
  TimeframePeriod,
  DateRange,
} from '../../types/finance';
import {
  getDateRangeForPeriod,
  filterTransactionsByDate,
  calculateFinancialSummary,
} from '../../services/financialAnalytics';
import { generateSmartRecommendations } from '../../services/recommendationEngine';
import { formatCurrency } from '../../services/currencyService';

interface FinancialIntelligenceProps {
  transactions: Transaction[];
  customCategories: CategoryItem[];
  allocationPlan: AllocationPlan;
}

export const FinancialIntelligence: React.FC<FinancialIntelligenceProps> = ({
  transactions,
  customCategories,
  allocationPlan,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimeframePeriod>('THIS_MONTH');

  const currentRange = useMemo(
    () => getDateRangeForPeriod(selectedPeriod),
    [selectedPeriod]
  );

  const previousRange = useMemo(() => {
    if (selectedPeriod === 'THIS_MONTH') return getDateRangeForPeriod('LAST_MONTH');
    if (selectedPeriod === 'THIS_YEAR') return getDateRangeForPeriod('LAST_YEAR');
    return null;
  }, [selectedPeriod]);

  const currentPeriodTransactions = useMemo(
    () => filterTransactionsByDate(transactions, currentRange),
    [transactions, currentRange]
  );

  const previousPeriodTransactions = useMemo(
    () => (previousRange ? filterTransactionsByDate(transactions, previousRange) : []),
    [transactions, previousRange]
  );

  const currentSummary = useMemo(
    () => calculateFinancialSummary(currentPeriodTransactions, customCategories),
    [currentPeriodTransactions, customCategories]
  );

  const previousSummary = useMemo(
    () =>
      previousPeriodTransactions.length > 0
        ? calculateFinancialSummary(previousPeriodTransactions, customCategories)
        : null,
    [previousPeriodTransactions, customCategories]
  );

  const periodLabel =
    selectedPeriod === 'THIS_MONTH'
      ? 'Bulan Ini'
      : selectedPeriod === 'THIS_YEAR'
      ? 'Tahun Ini'
      : selectedPeriod === 'LAST_30_DAYS'
      ? '30 Hari Terakhir'
      : 'Periode Terpilih';

  // Generate evidence-based recommendations
  const recommendations = useMemo(
    () =>
      generateSmartRecommendations(
        currentSummary,
        previousSummary,
        allocationPlan,
        periodLabel,
        currentPeriodTransactions
      ),
    [currentSummary, previousSummary, allocationPlan, periodLabel, currentPeriodTransactions]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242933]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f3efe6]">
            Rekomendasi Keuangan & Financial Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Analisis kepatuhan anggaran dan rekomendasi tindakan berdasarkan data riil yang
            tersimpan.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#12151c] p-1 rounded-lg border border-[#242b38]">
          {[
            { id: 'THIS_MONTH', label: 'Bulan Ini' },
            { id: 'LAST_30_DAYS', label: '30 Hari' },
            { id: 'THIS_YEAR', label: 'Tahun Ini' },
            { id: 'ALL_TIME', label: 'Semua Riwayat' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedPeriod(item.id as TimeframePeriod)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                selectedPeriod === item.id
                  ? 'bg-orange-600 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Direct Q&A Quick Summary Grid */}
      <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Jawaban Ringkas Parameter Keuangan ({periodLabel})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-[#0d1016] rounded-lg border border-[#202735]">
            <div className="text-zinc-500 text-[11px]">1. Pemasukan Tercatat</div>
            <div className="font-mono font-bold text-base text-emerald-400 mt-0.5 tabular-nums">
              {formatCurrency(currentSummary.totalIncomeIDR, 'IDR')}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">Basis perencanaan anggaran</div>
          </div>

          <div className="p-3 bg-[#0d1016] rounded-lg border border-[#202735]">
            <div className="text-zinc-500 text-[11px]">2. Pengeluaran Terjadi</div>
            <div className="font-mono font-bold text-base text-red-400 mt-0.5 tabular-nums">
              {formatCurrency(currentSummary.totalExpensesIDR, 'IDR')}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Rasio:{' '}
              {currentSummary.expenseToIncomeRatio !== null
                ? `${currentSummary.expenseToIncomeRatio.toFixed(1)}%`
                : 'Belum ada pemasukan'}
            </div>
          </div>

          <div className="p-3 bg-[#0d1016] rounded-lg border border-[#202735]">
            <div className="text-zinc-500 text-[11px]">3. Alokasi Primer Disarankan</div>
            <div className="font-mono font-bold text-base text-blue-400 mt-0.5 tabular-nums">
              {formatCurrency(
                Math.round((currentSummary.totalIncomeIDR * allocationPlan.primaryPercent) / 100),
                'IDR'
              )}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              {allocationPlan.primaryPercent}% dari pemasukan
            </div>
          </div>

          <div className="p-3 bg-[#0d1016] rounded-lg border border-[#202735]">
            <div className="text-zinc-500 text-[11px]">4. Rencana Tabungan & Surplus</div>
            <div className="font-mono font-bold text-base text-emerald-400 mt-0.5 tabular-nums">
              {formatCurrency(
                Math.round((currentSummary.totalIncomeIDR * allocationPlan.savingsPercent) / 100),
                'IDR'
              )}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Target {allocationPlan.savingsPercent}% simpanan
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Transparent Recommendations Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[#f3efe6]">
          Rincian Rekomendasi & Transparansi Kalkulasi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => {
            const isAlert = rec.severity === 'alert';
            const isWarn = rec.severity === 'warning';
            const isNominal = rec.severity === 'nominal';

            return (
              <div
                key={rec.id}
                className="bg-[#12151c] border border-[#242b38] rounded-xl p-5 shadow-sm space-y-3.5 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                        {rec.periodLabel}
                      </span>
                      <h4 className="text-sm font-bold text-[#f3efe6] mt-0.5">{rec.title}</h4>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isAlert
                          ? 'bg-red-950/60 text-red-300 border-red-800'
                          : isWarn
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                          : isNominal
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {rec.metricHeadline}
                    </span>
                  </div>

                  {/* Supporting Evidence */}
                  <div className="mt-3 text-xs text-zinc-300">
                    <p>{rec.supportingEvidence}</p>
                  </div>

                  {/* Transparent Calculation Method Box */}
                  <div className="mt-3 p-3 rounded-lg bg-[#0c0e14] border border-[#1f2533] space-y-1 text-[11px]">
                    <div className="text-zinc-500 font-semibold uppercase text-[9px] tracking-wider">
                      Metode & Bukti Perhitungan
                    </div>
                    <div className="font-mono text-zinc-400 break-words">
                      {rec.calculationMethod}
                    </div>
                    {rec.assumptions && (
                      <div className="text-[10px] text-zinc-500 italic mt-1">
                        Asumsi: {rec.assumptions}
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggested Action */}
                <div className="pt-3 border-t border-[#1f2533] text-xs">
                  <span className="text-orange-400 font-semibold block mb-0.5">
                    💡 Tindakan Disarankan:
                  </span>
                  <p className="text-zinc-300 text-[11px]">{rec.suggestedAction}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
