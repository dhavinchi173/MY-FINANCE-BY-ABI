import React, { useState, useEffect } from 'react';
import {
  createFullBackupJSON,
  restoreFromBackupJSON,
  generateTransactionsCSV,
  clearAllFinancialData,
} from '../../services/storageService';
import { Transaction } from '../../types/finance';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onDataReload: () => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onDataReload,
  onShowToast,
}) => {
  const [activeJsonTab, setActiveJsonTab] = useState<'export' | 'editor'>('export');
  const [currentJsonText, setCurrentJsonText] = useState<string>('');
  const [pasteJsonText, setPasteJsonText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string>('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      createFullBackupJSON().then((txt) => {
        setCurrentJsonText(txt);
      });
      setImportStatus('');
      setCopied(false);
    }
  }, [isOpen, transactions]);

  if (!isOpen) return null;

  const handleDownloadBackupJSON = async () => {
    try {
      const json = await createFullBackupJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `rupiah-finance-os-backup-${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('Cadangan data berhasil diunduh (JSON).', 'success');
    } catch {
      onShowToast('Gagal membuat cadangan data.', 'error');
    }
  };

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(currentJsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShowToast('Data JSON berhasil disalin ke clipboard!', 'success');
    } catch {
      onShowToast('Gagal menyalin ke clipboard.', 'error');
    }
  };

  const handleDownloadCSV = () => {
    try {
      const csv = generateTransactionsCSV(transactions);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `rupiah-finance-transactions-${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('Berkas CSV transaksi berhasil diunduh.', 'success');
    } catch {
      onShowToast('Gagal mengekspor CSV.', 'error');
    }
  };

  const handleRestoreFromText = async () => {
    if (!pasteJsonText.trim()) {
      setImportStatus('Silakan tempel teks JSON terlebih dahulu.');
      return;
    }

    try {
      const result = await restoreFromBackupJSON(pasteJsonText.trim());
      if (result.success) {
        await onDataReload();
        setImportStatus(`Berhasil memulihkan ${result.count} data transaksi.`);
        onShowToast(`Berhasil memulihkan ${result.count} transaksi!`, 'success');
        setPasteJsonText('');
      } else {
        setImportStatus(result.error || 'Format JSON tidak valid.');
        onShowToast(result.error || 'Gagal memulihkan cadangan data.', 'error');
      }
    } catch (err) {
      setImportStatus(`Galat: ${(err as Error).message}`);
      onShowToast('Format data JSON salah.', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const result = await restoreFromBackupJSON(text);
      if (result.success) {
        await onDataReload();
        setImportStatus(`Berhasil memulihkan ${result.count} data transaksi.`);
        onShowToast(`Berhasil memulihkan ${result.count} transaksi.`, 'success');
      } else {
        setImportStatus(result.error || 'Format berkas tidak valid.');
        onShowToast(result.error || 'Gagal memulihkan cadangan data.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    await clearAllFinancialData();
    await onDataReload();
    setIsResetConfirmOpen(false);
    onShowToast('Semua data keuangan telah direset ke nol.', 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#12161f] border border-[#262c3b] rounded-xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-[#242b38]">
          <div>
            <h3 className="text-base font-bold text-[#f3efe6]">
              Cadangan & Manajemen Data JSON
            </h3>
            <p className="text-xs text-zinc-400">
              Penyimpanan lokal aman, ekspor CSV, dan transfer data JSON tanpa galat.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 text-lg font-mono cursor-pointer"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* JSON Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#090b0e] rounded-lg border border-[#202531]">
          <button
            type="button"
            onClick={() => setActiveJsonTab('export')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
              activeJsonTab === 'export'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Unduh / Cadangan
          </button>
          <button
            type="button"
            onClick={() => setActiveJsonTab('editor')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
              activeJsonTab === 'editor'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Editor & Tempel JSON Langsung
          </button>
        </div>

        {activeJsonTab === 'export' ? (
          <>
            {/* Quick Export Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleDownloadBackupJSON}
                className="p-3 bg-[#181d27] hover:bg-[#202735] active:bg-[#262f3f] border border-[#2c3444] rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="text-xs font-bold text-[#f3efe6] group-hover:text-orange-400">
                  📁 Unduh Berkas JSON
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Simpan cadangan lengkap ke memori perangkat.
                </div>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="p-3 bg-[#181d27] hover:bg-[#202735] active:bg-[#262f3f] border border-[#2c3444] rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="text-xs font-bold text-[#f3efe6] group-hover:text-orange-400">
                  📊 Unduh Berkas CSV
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Format tabel untuk Microsoft Excel / Sheets.
                </div>
              </button>
            </div>

            {/* Quick Copy JSON Preview */}
            <div className="p-3 bg-[#0c0e14] border border-[#222836] rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Pratinjau Data JSON Saat Ini:</span>
                <button
                  type="button"
                  onClick={handleCopyJSON}
                  className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white font-medium text-[11px] rounded transition-colors cursor-pointer"
                >
                  {copied ? '✓ Berhasil Disalin' : '📋 Salin JSON'}
                </button>
              </div>
              <textarea
                readOnly
                value={currentJsonText}
                rows={5}
                className="w-full bg-[#141822] border border-[#262f40] rounded p-2 text-[10px] font-mono text-zinc-300 select-all focus:outline-none no-scrollbar resize-none"
              />
            </div>

            {/* File Upload Option */}
            <div className="p-3 bg-[#0c0e14] border border-dashed border-[#2c3444] rounded-lg space-y-1.5 text-center">
              <span className="text-[11px] text-zinc-400 block font-medium">
                Atau unggah berkas .json cadangan:
              </span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 cursor-pointer"
              />
              {importStatus && (
                <p className="text-xs text-emerald-400 font-mono mt-1">{importStatus}</p>
              )}
            </div>
          </>
        ) : (
          /* Direct JSON Editor & Paste Box */
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label className="text-zinc-300 font-medium">
                  Tempel atau Edit Teks Cadangan JSON:
                </label>
                <button
                  type="button"
                  onClick={() => setPasteJsonText(currentJsonText)}
                  className="text-orange-400 hover:text-orange-300 text-[11px] underline cursor-pointer"
                >
                  Muat Dari Data Aktif
                </button>
              </div>
              <textarea
                placeholder='Tempel format JSON di sini: {"version": "1.0.0", "transactions": [...]}'
                value={pasteJsonText}
                onChange={(e) => setPasteJsonText(e.target.value)}
                rows={9}
                className="w-full bg-[#0a0d12] border border-[#2b3345] rounded-lg p-2.5 text-xs font-mono text-[#f3efe6] focus:outline-none focus:border-orange-500 no-scrollbar"
              />
            </div>

            {importStatus && (
              <div
                className={`p-2.5 rounded text-xs font-mono ${
                  importStatus.includes('Berhasil')
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : 'bg-red-950/60 border border-red-800 text-red-300'
                }`}
              >
                {importStatus}
              </div>
            )}

            <button
              type="button"
              onClick={handleRestoreFromText}
              disabled={!pasteJsonText.trim()}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold text-xs rounded-lg shadow transition-colors cursor-pointer"
            >
              ✓ Verifikasi & Terapkan Data JSON
            </button>
          </div>
        )}

        {/* Danger Zone: Reset */}
        <div className="pt-2 border-t border-[#202735]">
          {!isResetConfirmOpen ? (
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="w-full py-2 px-3 text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/60 rounded-lg transition-colors cursor-pointer text-left flex justify-between items-center"
            >
              <span>Hapus semua catatan dan kembalikan ke baseline Rp 0</span>
              <span>⚠️ Reset Database</span>
            </button>
          ) : (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg space-y-2 text-xs">
              <p className="text-red-200">
                Tindakan ini akan menghapus permanen semua catatan transaksi di browser ini. Apakah
                Anda yakin?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleResetData}
                  className="px-3 py-1 bg-red-600 text-white font-bold rounded cursor-pointer"
                >
                  Ya, Bersihkan Semua
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-[#202735]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-transparent border border-zinc-700 rounded-lg cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
