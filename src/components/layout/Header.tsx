import React from 'react';
import { ExchangeRates } from '../../types/finance';
import { useDragScroll } from '../../hooks/useDragScroll';

export type ActiveTab = 'calculator' | 'ledger' | 'charts' | 'allocation' | 'intelligence';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  rates: ExchangeRates;
  onOpenNewTransaction: () => void;
  onOpenDataModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  rates,
  onOpenNewTransaction,
  onOpenDataModal,
}) => {
  const mobileNavRef = useDragScroll<HTMLDivElement>();
  return (
    <header className="sticky top-0 z-40 bg-[#0d0f12]/95 backdrop-blur-md border-b border-[#242933]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar 3-Zone Contract */}
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Text Element Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('calculator')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold tracking-tight text-[#f3efe6] uppercase group-hover:text-orange-500 transition-colors">
                  Rupiah Finance OS
                </span>
                <span className="hidden sm:inline text-xs font-mono text-zinc-500 tabular-nums">
                  IDR · JPY · USD
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-5 Clean Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeTab === 'calculator'
                  ? 'text-[#f3efe6] font-semibold border-b-2 border-orange-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Kalkulator Converter
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeTab === 'ledger'
                  ? 'text-[#f3efe6] font-semibold border-b-2 border-orange-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Ledger Transaksi
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeTab === 'charts'
                  ? 'text-[#f3efe6] font-semibold border-b-2 border-orange-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Grafik & Analitik
            </button>
            <button
              onClick={() => setActiveTab('allocation')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeTab === 'allocation'
                  ? 'text-[#f3efe6] font-semibold border-b-2 border-orange-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Alokasi Anggaran
            </button>
            <button
              onClick={() => setActiveTab('intelligence')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                activeTab === 'intelligence'
                  ? 'text-[#f3efe6] font-semibold border-b-2 border-orange-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Rekomendasi Cerdas
            </button>
          </nav>

          {/* Zone 3: Primary Action & Data Settings */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenDataModal}
              title="Cadangan & Pemulihan Data"
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-[#1a1e26] hover:bg-[#232834] border border-[#2e3544] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Cadangan & Impor
            </button>

            <button
              onClick={onOpenNewTransaction}
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-md shadow-sm transition-colors whitespace-nowrap shrink-0 active:scale-[0.98]"
            >
              + Catat Transaksi
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Navigation Tabs */}
      <div
        ref={mobileNavRef}
        className="md:hidden flex items-center justify-start overflow-x-auto no-scrollbar px-4 border-t border-[#242933] bg-[#0c0e12] gap-1 py-1.5 touch-pan-x cursor-grab"
      >
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-3 py-1.5 text-xs whitespace-nowrap rounded ${
            activeTab === 'calculator'
              ? 'bg-orange-600/20 text-orange-400 font-semibold'
              : 'text-zinc-400'
          }`}
        >
          Kalkulator
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-3 py-1.5 text-xs whitespace-nowrap rounded ${
            activeTab === 'ledger'
              ? 'bg-orange-600/20 text-orange-400 font-semibold'
              : 'text-zinc-400'
          }`}
        >
          Ledger
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`px-3 py-1.5 text-xs whitespace-nowrap rounded ${
            activeTab === 'charts'
              ? 'bg-orange-600/20 text-orange-400 font-semibold'
              : 'text-zinc-400'
          }`}
        >
          Grafik
        </button>
        <button
          onClick={() => setActiveTab('allocation')}
          className={`px-3 py-1.5 text-xs whitespace-nowrap rounded ${
            activeTab === 'allocation'
              ? 'bg-orange-600/20 text-orange-400 font-semibold'
              : 'text-zinc-400'
          }`}
        >
          Alokasi
        </button>
        <button
          onClick={() => setActiveTab('intelligence')}
          className={`px-3 py-1.5 text-xs whitespace-nowrap rounded ${
            activeTab === 'intelligence'
              ? 'bg-orange-600/20 text-orange-400 font-semibold'
              : 'text-zinc-400'
          }`}
        >
          Rekomendasi
        </button>
      </div>
    </header>
  );
};
