import React, { useState, useEffect, useCallback } from 'react';
import { Currency, ExchangeRates, CalculationRecord, Transaction } from '../../types/finance';
import {
  convertCurrency,
  formatCurrency,
  parseRawNumericString,
} from '../../services/currencyService';
import { Keypad } from './Keypad';
import { SaveTransactionModal } from './SaveTransactionModal';
import { CategoryItem } from '../../types/finance';

interface CurrencyCalculatorProps {
  rates: ExchangeRates;
  onRefreshRates: () => Promise<void>;
  isLoadingRates: boolean;
  customCategories: CategoryItem[];
  onSaveTransaction: (transaction: Transaction) => void;
  onSaveCalculationRecord: (record: CalculationRecord) => void;
  calculationHistory: CalculationRecord[];
  onClearCalculationHistory: () => void;
  onNavigateToLedger: () => void;
  onNavigateToCharts: () => void;
}

export const CurrencyCalculator: React.FC<CurrencyCalculatorProps> = ({
  rates,
  onRefreshRates,
  isLoadingRates,
  customCategories,
  onSaveTransaction,
  onSaveCalculationRecord,
  calculationHistory,
  onClearCalculationHistory,
  onNavigateToLedger,
  onNavigateToCharts,
}) => {
  // Source & Target currencies
  const [sourceCurrency, setSourceCurrency] = useState<Currency>('IDR');
  const [targetCurrency, setTargetCurrency] = useState<Currency>('JPY');

  // Raw input buffer string (strict separation from formatted display)
  const [rawInput, setRawInput] = useState<string>('150000');

  // Save Modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);

  // Parse numeric amount
  const numericAmount = parseRawNumericString(rawInput);

  // Deterministic conversion calculation
  const { convertedAmount, rate } = convertCurrency(
    numericAmount,
    sourceCurrency,
    targetCurrency,
    rates
  );

  // Handle keypad digit input
  const handleDigit = useCallback((digit: string) => {
    setRawInput((prev) => {
      if (prev === '0') return digit;
      if (prev.length >= 14) return prev; // Limit maximum input length
      return prev + digit;
    });
  }, []);

  // Handle decimal input
  const handleDecimal = useCallback(() => {
    setRawInput((prev) => {
      if (prev.includes('.')) return prev; // Prevent duplicate decimal points
      if (!prev) return '0.';
      return prev + '.';
    });
  }, []);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    setRawInput((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  }, []);

  // Handle clear
  const handleClear = useCallback(() => {
    setRawInput('0');
  }, []);

  // Handle add thousand zeros (000)
  const handleAddZeros = useCallback(() => {
    setRawInput((prev) => {
      if (prev === '0' || !prev) return '0';
      if (prev.length >= 12) return prev;
      return prev + '000';
    });
  }, []);

  // Handle currency swap
  const handleSwap = useCallback(() => {
    setSourceCurrency((prevSource) => {
      const newSource = targetCurrency;
      setTargetCurrency(prevSource);
      return newSource;
    });
  }, [targetCurrency]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input or textarea modal is active
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDecimal, handleBackspace, handleClear]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Editorial Title & Intent Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242933]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f3efe6]">
            Kalkulator Konverter Valuta
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Konversi akurat IDR, JPY, dan USD dengan kalkulasi matematis seketika.
          </p>
        </div>

        {/* Rate Status Banner */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-[#13161c] border border-[#262c3b] rounded-lg px-3 py-1.5 text-xs">
          <div className="flex flex-col text-right">
            <span className="font-mono text-zinc-300 text-[11px] tabular-nums">
              Ref: {rates.observationDate}
            </span>
            <span className="text-[10px] text-zinc-500 truncate max-w-[140px]">
              {rates.provider}
            </span>
          </div>
          <button
            onClick={onRefreshRates}
            disabled={isLoadingRates}
            className="p-1 text-zinc-400 hover:text-orange-400 transition-colors disabled:opacity-50"
            title="Perbarui Kurs Terkini"
            aria-label="Refresh exchange rates"
          >
            {isLoadingRates ? '⏳' : '🔄'}
          </button>
        </div>
      </div>

      {/* Main Calculator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Display & Controls (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Amount Display & Currency Selector Card */}
          <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-5 sm:p-6 shadow-md">
            {/* Currency Selectors & Swap */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#1f2533]">
              {/* Source Currency */}
              <div className="flex-1">
                <span className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Mata Uang Asal
                </span>
                <select
                  value={sourceCurrency}
                  onChange={(e) => {
                    const newSource = e.target.value as Currency;
                    if (newSource === targetCurrency) {
                      setTargetCurrency(sourceCurrency);
                    }
                    setSourceCurrency(newSource);
                  }}
                  className="w-full bg-[#181d27] border border-[#2b3344] text-[#f3efe6] font-semibold text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                >
                  <option value="IDR">IDR (Rupiah Indonesia)</option>
                  <option value="JPY">JPY (Yen Jepang)</option>
                  <option value="USD">USD (Dolar AS)</option>
                </select>
              </div>

              {/* Swap Button */}
              <button
                type="button"
                onClick={handleSwap}
                className="mt-5 p-2.5 rounded-lg bg-[#1a1f2b] hover:bg-[#252c3d] border border-[#2e3748] text-orange-400 hover:text-orange-300 transition-colors cursor-pointer active:scale-95 shrink-0"
                title="Tukar Mata Uang"
                aria-label="Tukar mata uang sumber dan tujuan"
              >
                ⇄
              </button>

              {/* Target Currency */}
              <div className="flex-1">
                <span className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Mata Uang Tujuan
                </span>
                <select
                  value={targetCurrency}
                  onChange={(e) => {
                    const newTarget = e.target.value as Currency;
                    if (newTarget === sourceCurrency) {
                      setSourceCurrency(targetCurrency);
                    }
                    setTargetCurrency(newTarget);
                  }}
                  className="w-full bg-[#181d27] border border-[#2b3344] text-[#f3efe6] font-semibold text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                >
                  <option value="IDR">IDR (Rupiah Indonesia)</option>
                  <option value="JPY">JPY (Yen Jepang)</option>
                  <option value="USD">USD (Dolar AS)</option>
                </select>
              </div>
            </div>

            {/* Input Amount Display (Prominent Display) */}
            <div className="mt-4 pt-2">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
                Nominal Input ({sourceCurrency})
              </span>
              <div className="flex items-baseline justify-between mt-1 overflow-x-auto no-scrollbar">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#f3efe6] tabular-nums tracking-tight">
                  {formatCurrency(numericAmount, sourceCurrency)}
                </span>
                <span className="text-xs font-mono text-zinc-500 ml-2 shrink-0">
                  Buffer: {rawInput || '0'}
                </span>
              </div>
            </div>

            {/* Result Display Box */}
            <div className="mt-4 p-4 rounded-lg bg-[#0c0e14] border border-[#222836]">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Hasil Konversi ({targetCurrency})</span>
                <span className="font-mono text-[11px] text-zinc-500 tabular-nums">
                  1 {sourceCurrency} ={' '}
                  {rate < 0.01 ? rate.toFixed(6) : rate < 1 ? rate.toFixed(4) : rate.toFixed(2)}{' '}
                  {targetCurrency}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-orange-400 tabular-nums">
                  {formatCurrency(convertedAmount, targetCurrency)}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {targetCurrency}
                </span>
              </div>
            </div>

            {/* Primary Distinction Action Box */}
            <div className="mt-5 pt-4 border-t border-[#1f2533] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">
                <span className="text-zinc-300 font-medium">Kalkulasi Sementara:</span> Tidak
                mengubah saldo atau grafik keuangan sebelum disimpan.
              </div>

              <button
                type="button"
                disabled={numericAmount <= 0}
                onClick={() => setIsSaveModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold text-xs rounded-lg shadow-md transition-colors whitespace-nowrap cursor-pointer active:scale-95"
              >
                💾 Simpan Transaksi / Catatan
              </button>
            </div>
          </div>

          {/* Keypad */}
          <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-4 sm:p-5 shadow-sm">
            <Keypad
              onDigit={handleDigit}
              onDecimal={handleDecimal}
              onBackspace={handleBackspace}
              onClear={handleClear}
              onSwap={handleSwap}
              onAddZeros={handleAddZeros}
            />
          </div>
        </div>

        {/* Right Column: Quick Ledger Access & Calculation History (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Route Cards */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onNavigateToLedger}
              className="p-4 rounded-xl bg-[#12151c] hover:bg-[#181c25] border border-[#242b38] hover:border-zinc-700 transition-colors text-left group cursor-pointer"
            >
              <div className="text-lg mb-1">📖</div>
              <h3 className="text-sm font-bold text-[#f3efe6] group-hover:text-orange-400 transition-colors">
                Buka Ledger
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Kelola transaksi masuk, keluar, dan riwayat.
              </p>
            </button>

            <button
              onClick={onNavigateToCharts}
              className="p-4 rounded-xl bg-[#12151c] hover:bg-[#181c25] border border-[#242b38] hover:border-zinc-700 transition-colors text-left group cursor-pointer"
            >
              <div className="text-lg mb-1">📊</div>
              <h3 className="text-sm font-bold text-[#f3efe6] group-hover:text-orange-400 transition-colors">
                Grafik & Analisis
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Tren harian, mingguan, bulanan & multi-tahun.
              </p>
            </button>
          </div>

          {/* Calculation History Note Box */}
          <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#202735]">
              <div>
                <h3 className="text-sm font-bold text-[#f3efe6]">Riwayat Kalkulasi</h3>
                <p className="text-[11px] text-zinc-500">
                  Simpanan konversi nilai (tidak mempengaruhi saldo)
                </p>
              </div>
              {calculationHistory.length > 0 && (
                <button
                  onClick={onClearCalculationHistory}
                  className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
                >
                  Bersihkan
                </button>
              )}
            </div>

            {calculationHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                Belum ada riwayat kalkulasi yang disimpan.
                <p className="text-[11px] text-zinc-600 mt-1">
                  Pilih "Riwayat Saja" di menu Simpan jika Anda hanya ingin menyimpan catatan kurs.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#1e2430] max-h-80 overflow-y-auto mt-2">
                {calculationHistory.map((rec) => (
                  <div key={rec.id} className="py-2.5 text-xs">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono font-medium text-zinc-300 tabular-nums">
                        {formatCurrency(rec.fromAmount, rec.fromCurrency)}
                      </span>
                      <span className="text-zinc-500 font-mono text-[10px]">➔</span>
                      <span className="font-mono font-bold text-orange-400 tabular-nums">
                        {formatCurrency(rec.toAmount, rec.toCurrency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-500">
                      <span className="truncate max-w-[180px]">{rec.note || 'Konversi valuta'}</span>
                      <span className="text-[10px] tabular-nums">
                        {new Date(rec.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Currency Reference Rates Card */}
          <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-4 text-xs space-y-2">
            <h4 className="font-semibold text-zinc-300 text-xs uppercase tracking-wider">
              Kurs Acuan Saat Ini
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 tabular-nums">
              <div className="p-2 bg-[#0c0e14] rounded border border-[#1e2430]">
                1 USD = Rp {rates.rates.IDR?.toLocaleString('id-ID') || '15.850'}
              </div>
              <div className="p-2 bg-[#0c0e14] rounded border border-[#1e2430]">
                1 JPY = Rp {((rates.rates.IDR || 15850) / (rates.rates.JPY || 151.6)).toFixed(1)}
              </div>
              <div className="p-2 bg-[#0c0e14] rounded border border-[#1e2430]">
                1 USD = ¥{rates.rates.JPY?.toFixed(1) || '151.6'}
              </div>
              <div className="p-2 bg-[#0c0e14] rounded border border-[#1e2430]">
                100 JPY = Rp{' '}
                {(((rates.rates.IDR || 15850) / (rates.rates.JPY || 151.6)) * 100).toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Transaction Modal */}
      <SaveTransactionModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        sourceAmount={numericAmount}
        sourceCurrency={sourceCurrency}
        targetAmount={convertedAmount}
        targetCurrency={targetCurrency}
        exchangeRate={rate}
        rateProvider={rates.provider}
        customCategories={customCategories}
        onSaveTransaction={onSaveTransaction}
        onSaveCalculationRecord={onSaveCalculationRecord}
      />
    </div>
  );
};
