import React, { useState } from 'react';
import { AllocationPlan, CategoryItem, FinancialSummary } from '../../types/finance';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_ALLOCATION_PLAN,
  ALLOCATION_PRESETS,
} from '../../constants/categories';
import { formatCurrency } from '../../services/currencyService';
import { InteractiveAllocationSlider } from './InteractiveAllocationSlider';

interface AllocationManagerProps {
  plan: AllocationPlan;
  onSavePlan: (newPlan: AllocationPlan) => void;
  customCategories: CategoryItem[];
  onSaveCustomCategories: (categories: CategoryItem[]) => void;
  activeSummary: FinancialSummary;
}

export const AllocationManager: React.FC<AllocationManagerProps> = ({
  plan,
  onSavePlan,
  customCategories,
  onSaveCustomCategories,
  activeSummary,
}) => {
  // Local editable percentages
  const [primary, setPrimary] = useState<number>(plan.primaryPercent);
  const [secondary, setSecondary] = useState<number>(plan.secondaryPercent);
  const [tertiary, setTertiary] = useState<number>(plan.tertiaryPercent);
  const [savings, setSavings] = useState<number>(plan.savingsPercent);

  // Simulation income (defaults to actual active income, or 5,000,000 IDR for simulation if 0)
  const baseIncome = activeSummary.totalIncomeIDR > 0 ? activeSummary.totalIncomeIDR : 5000000;
  const [simulationIncome, setSimulationIncome] = useState<number>(baseIncome);

  // New Category form state
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatGroup, setNewCatGroup] = useState<'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'SAVINGS'>(
    'PRIMARY'
  );

  const totalPercent = primary + secondary + tertiary + savings;
  const isValidTotal = totalPercent === 100;
  const unallocated = 100 - totalPercent;

  const handleApplyPreset = (preset: (typeof ALLOCATION_PRESETS)[0]) => {
    setPrimary(preset.primary);
    setSecondary(preset.secondary);
    setTertiary(preset.tertiary);
    setSavings(preset.savings);
  };

  const handleSave = () => {
    const updated: AllocationPlan = {
      primaryPercent: primary,
      secondaryPercent: secondary,
      tertiaryPercent: tertiary,
      savingsPercent: savings,
      unallocatedPercent: Math.max(0, unallocated),
      updatedAt: new Date().toISOString(),
    };
    onSavePlan(updated);
  };

  const handleReset = () => {
    setPrimary(DEFAULT_ALLOCATION_PLAN.primaryPercent);
    setSecondary(DEFAULT_ALLOCATION_PLAN.secondaryPercent);
    setTertiary(DEFAULT_ALLOCATION_PLAN.tertiaryPercent);
    setSavings(DEFAULT_ALLOCATION_PLAN.savingsPercent);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newItem: CategoryItem = {
      id: `custom-cat-${Date.now()}`,
      name: newCatName.trim(),
      group: newCatGroup,
      isCustom: true,
    };

    onSaveCustomCategories([...customCategories, newItem]);
    setNewCatName('');
  };

  const handleDeleteCustomCategory = (id: string) => {
    onSaveCustomCategories(customCategories.filter((c) => c.id !== id));
  };

  // Preview amounts
  const primaryAmount = Math.round((simulationIncome * primary) / 100);
  const secondaryAmount = Math.round((simulationIncome * secondary) / 100);
  const tertiaryAmount = Math.round((simulationIncome * tertiary) / 100);
  const savingsAmount = Math.round((simulationIncome * savings) / 100);

  const allCategories = [...customCategories, ...DEFAULT_CATEGORIES];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#242933]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f3efe6]">
            Alokasi Anggaran Finansial
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Sesuaikan persentase distribusi pendapatan ke Kebutuhan Primer, Sekunder, Tersier, dan
            Tabungan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white bg-[#151922] hover:bg-[#1e2430] border border-[#2b3345] rounded-lg transition-colors cursor-pointer"
          >
            Reset Default
          </button>
          <button
            onClick={handleSave}
            disabled={!isValidTotal}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Simpan Rencana
          </button>
        </div>
      </div>

      {/* Main Grid: Percentage Sliders + Simulation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Percentage Sliders & Presets (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Preset Buttons */}
          <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-4 space-y-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Pilihan Preset Cepat
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALLOCATION_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(p)}
                  className="p-2.5 rounded-lg bg-[#181d27] hover:bg-[#202735] border border-[#2b3344] text-left transition-colors cursor-pointer group"
                >
                  <div className="text-xs font-bold text-[#f3efe6] group-hover:text-orange-400 transition-colors">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{p.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Allocation Sliders Card */}
          <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-5 shadow-sm space-y-5">
            {/* Total Indicator */}
            <div className="flex items-center justify-between pb-3 border-b border-[#202735]">
              <span className="text-xs font-bold text-[#f3efe6]">Total Alokasi Rencana</span>
              <span
                className={`font-mono font-bold text-sm tabular-nums ${
                  isValidTotal ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {totalPercent}% {isValidTotal ? '(100% Pas)' : `(Selisih: ${unallocated}%)`}
              </span>
            </div>

            {/* Master Proportional Visual Bar (No ugly slide bars, touch & mouse friendly) */}
            <div className="space-y-1.5">
              <div className="h-4 w-full bg-[#181d27] rounded-lg overflow-hidden flex border border-[#262e3d]">
                {primary > 0 && (
                  <div
                    style={{ width: `${(primary / Math.max(100, totalPercent)) * 100}%` }}
                    className="h-full bg-blue-500 transition-all duration-150"
                    title={`Primer: ${primary}%`}
                  />
                )}
                {secondary > 0 && (
                  <div
                    style={{ width: `${(secondary / Math.max(100, totalPercent)) * 100}%` }}
                    className="h-full bg-amber-500 transition-all duration-150"
                    title={`Sekunder: ${secondary}%`}
                  />
                )}
                {tertiary > 0 && (
                  <div
                    style={{ width: `${(tertiary / Math.max(100, totalPercent)) * 100}%` }}
                    className="h-full bg-red-500 transition-all duration-150"
                    title={`Tersier: ${tertiary}%`}
                  />
                )}
                {savings > 0 && (
                  <div
                    style={{ width: `${(savings / Math.max(100, totalPercent)) * 100}%` }}
                    className="h-full bg-emerald-500 transition-all duration-150"
                    title={`Tabungan: ${savings}%`}
                  />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span className="text-blue-400">Primer {primary}%</span>
                <span className="text-amber-400">Sekunder {secondary}%</span>
                <span className="text-red-400">Tersier {tertiary}%</span>
                <span className="text-emerald-400">Tabungan {savings}%</span>
              </div>
            </div>

            {!isValidTotal && (
              <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300">
                Total persentase harus tepat 100%. Saat ini total adalah {totalPercent}%.
                {unallocated > 0
                  ? ` Masih ada ${unallocated}% yang belum teralokasi.`
                  : ` Kelebihan alokasi sebesar ${Math.abs(unallocated)}%.`}
              </div>
            )}

            {/* Custom Interactive Sliders - Responsive Touch & Mouse Draggable */}
            <div className="space-y-3.5">
              <InteractiveAllocationSlider
                label="1. Kebutuhan Primer (Essential)"
                description="Makanan pokok, tempat tinggal, listrik/air, kesehatan, transportasi dasar."
                value={primary}
                onChange={setPrimary}
                colorClass="bg-blue-500"
                textColorClass="text-blue-400"
                borderColorClass="border-blue-400"
              />

              <InteractiveAllocationSlider
                label="2. Kebutuhan Sekunder (Adjustable)"
                description="Paket data/kuota, kursus pengembangan keahlian, perlengkapan rumah, servis."
                value={secondary}
                onChange={setSecondary}
                colorClass="bg-amber-500"
                textColorClass="text-amber-400"
                borderColorClass="border-amber-400"
              />

              <InteractiveAllocationSlider
                label="3. Kebutuhan Tersier (Discretionary)"
                description="Hiburan, belanja hobi & gaya hidup, langganan streaming, kafe non-pokok."
                value={tertiary}
                onChange={setTertiary}
                colorClass="bg-red-500"
                textColorClass="text-red-400"
                borderColorClass="border-red-400"
              />

              <InteractiveAllocationSlider
                label="4. Tabungan & Investasi (Wealth)"
                description="Dana darurat terpisah, tabungan berjangka, reksadana, investasi masa depan."
                value={savings}
                onChange={setSavings}
                colorClass="bg-emerald-500"
                textColorClass="text-emerald-400"
                borderColorClass="border-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Income Projection & Category Manager (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Nominal Projection Card */}
          <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#f3efe6]">Simulasi Distribusi Rupiah</h3>
              <span className="text-[10px] text-zinc-500">
                {activeSummary.totalIncomeIDR > 0 ? 'Data Pemasukan Riil' : 'Nominal Simulasi'}
              </span>
            </div>

            {/* Simulation Income Input */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">Dasar Pemasukan (IDR):</label>
              <input
                type="number"
                step="50000"
                value={simulationIncome}
                onChange={(e) => setSimulationIncome(Math.max(0, Number(e.target.value)))}
                className="w-full bg-[#181d27] border border-[#2c3444] rounded-lg px-3 py-1.5 text-xs font-mono text-[#f3efe6] tabular-nums focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Breakdown Cards */}
            <div className="space-y-2 pt-2">
              <div className="p-3 bg-[#0d1016] rounded-lg border border-[#202735] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-blue-400">Primer ({primary}%)</div>
                  <div className="text-[10px] text-zinc-500">Batas maks kebutuhan pokok</div>
                </div>
                <div className="font-mono font-bold text-sm text-[#f3efe6] tabular-nums">
                  {formatCurrency(primaryAmount, 'IDR')}
                </div>
              </div>

              <div className="p-3 bg-[#0d1016] rounded-lg border border-[#202735] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-amber-400">Sekunder ({secondary}%)</div>
                  <div className="text-[10px] text-zinc-500">Plafon kebutuhan penunjang</div>
                </div>
                <div className="font-mono font-bold text-sm text-[#f3efe6] tabular-nums">
                  {formatCurrency(secondaryAmount, 'IDR')}
                </div>
              </div>

              <div className="p-3 bg-[#0d1016] rounded-lg border border-[#202735] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-red-400">Tersier ({tertiary}%)</div>
                  <div className="text-[10px] text-zinc-500">Batas maksimal pengeluaran hobi</div>
                </div>
                <div className="font-mono font-bold text-sm text-[#f3efe6] tabular-nums">
                  {formatCurrency(tertiaryAmount, 'IDR')}
                </div>
              </div>

              <div className="p-3 bg-[#0d1016] rounded-lg border border-[#202735] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-emerald-400">Tabungan ({savings}%)</div>
                  <div className="text-[10px] text-zinc-500">Target simpanan wajib</div>
                </div>
                <div className="font-mono font-bold text-sm text-[#f3efe6] tabular-nums">
                  {formatCurrency(savingsAmount, 'IDR')}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Category Creator */}
          <div className="bg-[#12151c] border border-[#242b38] rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-[#f3efe6]">Kategori Kustom</h3>
              <p className="text-[11px] text-zinc-500">
                Buat kategori baru dan tentukan kelompok alokasinya.
              </p>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-2">
              <input
                type="text"
                placeholder="Nama kategori baru..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full bg-[#181d27] border border-[#2c3444] rounded-lg px-3 py-1.5 text-xs text-[#f3efe6] focus:outline-none focus:border-orange-500"
              />

              <div className="flex gap-2">
                <select
                  value={newCatGroup}
                  onChange={(e) =>
                    setNewCatGroup(
                      e.target.value as 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'SAVINGS'
                    )
                  }
                  className="flex-1 bg-[#181d27] border border-[#2c3444] rounded-lg px-2.5 py-1.5 text-xs text-[#f3efe6] focus:outline-none focus:border-orange-500"
                >
                  <option value="PRIMARY">Primer (Pokok)</option>
                  <option value="SECONDARY">Sekunder (Penunjang)</option>
                  <option value="TERTIARY">Tersier (Gaya Hidup)</option>
                  <option value="SAVINGS">Tabungan / Investasi</option>
                </select>

                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors cursor-pointer"
                >
                  + Tambah
                </button>
              </div>
            </form>

            {/* List of Custom Categories */}
            {customCategories.length > 0 && (
              <div className="pt-2 border-t border-[#1f2533] space-y-1.5 max-h-40 overflow-y-auto">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide block">
                  Kategori Buatan Anda
                </span>
                {customCategories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-1.5 px-2 bg-[#181d27] rounded text-xs"
                  >
                    <span className="text-zinc-200">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">{c.group}</span>
                      <button
                        onClick={() => handleDeleteCustomCategory(c.id)}
                        className="text-zinc-500 hover:text-red-400"
                        title="Hapus Kategori"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
