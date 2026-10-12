import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Currency,
  Transaction,
  CalculationRecord,
  AllocationPlan,
  CategoryItem,
  ExchangeRates,
} from './types/finance';
import {
  getStoredExchangeRates,
  fetchLiveExchangeRates,
  saveStoredExchangeRates,
} from './services/currencyService';
import {
  getStoredTransactions,
  saveTransaction,
  deleteTransaction,
  getCalculationHistory,
  saveCalculationRecord,
  clearCalculationHistory,
  getStoredAllocationPlan,
  saveStoredAllocationPlan,
  getStoredCustomCategories,
  saveStoredCustomCategories,
} from './services/storageService';
import { calculateFinancialSummary } from './services/financialAnalytics';
import { Header, ActiveTab } from './components/layout/Header';
import { CurrencyCalculator } from './components/calculator/CurrencyCalculator';
import { TransactionManager } from './components/transactions/TransactionManager';
import { TransactionFormModal } from './components/transactions/TransactionFormModal';
import { FinancialCharts } from './components/charts/FinancialCharts';
import { AllocationManager } from './components/allocation/AllocationManager';
import { FinancialIntelligence } from './components/intelligence/FinancialIntelligence';
import { DataManagementModal } from './components/settings/DataManagementModal';
import { Toast, ToastMessage } from './components/common/Toast';
import { SwipeableContentWrapper } from './components/layout/SwipeableContentWrapper';

const TABS: ActiveTab[] = ['calculator', 'ledger', 'charts', 'allocation', 'intelligence'];

const TAB_NAMES: Record<ActiveTab, string> = {
  calculator: 'Kalkulator',
  ledger: 'Ledger Transaksi',
  charts: 'Grafik & Analitik',
  allocation: 'Alokasi Anggaran',
  intelligence: 'Rekomendasi Cerdas',
};

export default function App() {
  // Navigation: CALCULATOR IS THE INITIAL ENTRY POINT
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');

  // Rates State
  const [rates, setRates] = useState<ExchangeRates>(() => getStoredExchangeRates());
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);

  // Financial Data State (Starts at 0 on fresh launch)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [calculationHistory, setCalculationHistory] = useState<CalculationRecord[]>([]);
  const [allocationPlan, setAllocationPlan] = useState<AllocationPlan>(() =>
    getStoredAllocationPlan()
  );
  const [customCategories, setCustomCategories] = useState<CategoryItem[]>(() =>
    getStoredCustomCategories()
  );

  // Modals & Feedback
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState<boolean>(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initial Data Load from Storage
  const loadInitialData = useCallback(async () => {
    try {
      const storedTx = await getStoredTransactions();
      setTransactions(storedTx);

      const storedCalcs = await getCalculationHistory();
      setCalculationHistory(storedCalcs);

      const storedPlan = getStoredAllocationPlan();
      setAllocationPlan(storedPlan);

      const storedCats = getStoredCustomCategories();
      setCustomCategories(storedCats);
    } catch (err) {
      console.warn('Gagal memuat data awal dari penyimpanan:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    // Fetch latest verified rates in background
    fetchLiveExchangeRates()
      .then((updated) => setRates(updated))
      .catch((err) => console.info('Gunakan rates cache awal:', err));
  }, [loadInitialData]);

  // Refresh Exchange Rates manually
  const handleRefreshRates = async () => {
    setIsLoadingRates(true);
    try {
      const updated = await fetchLiveExchangeRates();
      setRates(updated);
      showToast('Kurs acuan berhasil diperbarui.', 'success');
    } catch (err) {
      showToast('Menggunakan kurs cadangan terverifikasi.', 'info');
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Transaction Actions
  const handleSaveTransaction = async (tx: Transaction) => {
    try {
      await saveTransaction(tx);
      setTransactions((prev) => {
        const idx = prev.findIndex((t) => t.id === tx.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = tx;
          return updated;
        }
        return [tx, ...prev];
      });
      showToast(
        tx.type === 'INCOME'
          ? 'Pemasukan berhasil dicatat ke ledger.'
          : tx.type === 'EXPENSE'
          ? 'Pengeluaran berhasil dicatat ke ledger.'
          : 'Transfer saldo berhasil dicatat.',
        'success'
      );
    } catch (err) {
      showToast('Gagal menyimpan transaksi ke penyimpanan.', 'error');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      showToast('Transaksi berhasil dihapus dari ledger.', 'info');
    } catch (err) {
      showToast('Gagal menghapus transaksi.', 'error');
    }
  };

  // Calculation History Actions
  const handleSaveCalculationRecord = async (record: CalculationRecord) => {
    try {
      await saveCalculationRecord(record);
      setCalculationHistory((prev) => [record, ...prev].slice(0, 50));
      showToast('Catatan kalkulasi valuta tersimpan.', 'success');
    } catch (err) {
      showToast('Gagal menyimpan catatan kalkulasi.', 'error');
    }
  };

  const handleClearCalculationHistory = async () => {
    try {
      await clearCalculationHistory();
      setCalculationHistory([]);
      showToast('Riwayat kalkulasi telah dibersihkan.', 'info');
    } catch (err) {
      showToast('Gagal menghapus riwayat kalkulasi.', 'error');
    }
  };

  // Allocation Plan Actions
  const handleSaveAllocationPlan = (newPlan: AllocationPlan) => {
    saveStoredAllocationPlan(newPlan);
    setAllocationPlan(newPlan);
    showToast('Rencana alokasi persentase berhasil disimpan.', 'success');
  };

  // Custom Categories Actions
  const handleSaveCustomCategories = (cats: CategoryItem[]) => {
    saveStoredCustomCategories(cats);
    setCustomCategories(cats);
    showToast('Daftar kategori berhasil diperbarui.', 'success');
  };

  // Active Global Summary for Month
  const currentMonthSummary = useMemo(() => {
    return calculateFinancialSummary(transactions, customCategories);
  }, [transactions, customCategories]);

  return (
    <div className="min-h-screen bg-[#0c0e12] text-[#f3efe6] flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        rates={rates}
        onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
      />

      {/* Main Content Area with Momentum-Based Physics Gesture Detection Wrapper */}
      <main className="flex-1 pb-16 relative select-text">
        <SwipeableContentWrapper
          activeTab={activeTab}
          tabs={TABS}
          onTabChange={(newTab) => {
            setActiveTab(newTab);
            showToast(`Beralih ke: ${TAB_NAMES[newTab]}`, 'info');
          }}
        >
          {activeTab === 'calculator' && (
            <CurrencyCalculator
              rates={rates}
              onRefreshRates={handleRefreshRates}
              isLoadingRates={isLoadingRates}
              customCategories={customCategories}
              onSaveTransaction={handleSaveTransaction}
              onSaveCalculationRecord={handleSaveCalculationRecord}
              calculationHistory={calculationHistory}
              onClearCalculationHistory={handleClearCalculationHistory}
              onNavigateToLedger={() => setActiveTab('ledger')}
              onNavigateToCharts={() => setActiveTab('charts')}
            />
          )}

          {activeTab === 'ledger' && (
            <TransactionManager
              transactions={transactions}
              onSaveTransaction={handleSaveTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              customCategories={customCategories}
              rates={rates}
              onOpenNewTransactionModal={() => setIsNewTxModalOpen(true)}
            />
          )}

          {activeTab === 'charts' && (
            <FinancialCharts
              transactions={transactions}
              customCategories={customCategories}
              allocationPlan={allocationPlan}
            />
          )}

          {activeTab === 'allocation' && (
            <AllocationManager
              plan={allocationPlan}
              onSavePlan={handleSaveAllocationPlan}
              customCategories={customCategories}
              onSaveCustomCategories={handleSaveCustomCategories}
              activeSummary={currentMonthSummary}
            />
          )}

          {activeTab === 'intelligence' && (
            <FinancialIntelligence
              transactions={transactions}
              customCategories={customCategories}
              allocationPlan={allocationPlan}
            />
          )}
        </SwipeableContentWrapper>

        {/* Swipe Navigation Dots Indicator (Touch & Gesture Feedback) */}
        <div className="flex flex-col items-center justify-center gap-1.5 mt-8 pb-2 text-center pointer-events-auto">
          <div className="flex items-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`transition-all rounded-full cursor-pointer ${
                  activeTab === tab
                    ? 'w-6 h-1.5 bg-orange-500'
                    : 'w-1.5 h-1.5 bg-zinc-700 hover:bg-zinc-500'
                }`}
                aria-label={`Beralih ke tab ${TAB_NAMES[tab]}`}
                title={TAB_NAMES[tab]}
              />
            ))}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            Geser layar ⇄ untuk beralih halaman
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e232e] bg-[#090b0e] py-6 px-4 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400">RUPIAH FINANCE OS</span>
            <span>·</span>
            <span>Kalkulator & Ledger Multi-Valuta (IDR / JPY / USD)</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500 tabular-nums">
            Penyimpanan Offline-First · Tanpa Asumsi Saldo Palsu
          </div>
        </div>
      </footer>

      {/* Global New Transaction Modal */}
      <TransactionFormModal
        isOpen={isNewTxModalOpen}
        onClose={() => setIsNewTxModalOpen(false)}
        onSave={handleSaveTransaction}
        customCategories={customCategories}
        rates={rates}
      />

      {/* Data Management & Backup Modal */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        transactions={transactions}
        onDataReload={loadInitialData}
        onShowToast={showToast}
      />

      {/* Global Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
