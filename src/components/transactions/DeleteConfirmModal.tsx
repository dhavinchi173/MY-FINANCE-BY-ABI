import React from 'react';
import { Transaction } from '../../types/finance';
import { formatCurrency } from '../../services/currencyService';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transaction: Transaction | null;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  transaction,
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#141822] border border-[#2b3345] rounded-xl max-w-md w-full p-6 shadow-2xl">
        <h3 className="text-base font-bold text-[#f3efe6]">Konfirmasi Hapus Transaksi</h3>
        <p className="text-xs text-zinc-400 mt-2">
          Apakah Anda yakin ingin menghapus catatan transaksi ini dari ledger?
        </p>

        <div className="mt-4 p-3 bg-[#0c0e14] rounded-lg border border-[#222836] text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-500">Tanggal:</span>
            <span className="font-mono text-zinc-300">{transaction.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Tipe:</span>
            <span
              className={`font-semibold ${
                transaction.type === 'INCOME'
                  ? 'text-emerald-400'
                  : transaction.type === 'EXPENSE'
                  ? 'text-red-400'
                  : 'text-blue-400'
              }`}
            >
              {transaction.type === 'INCOME'
                ? 'Pemasukan'
                : transaction.type === 'EXPENSE'
                ? 'Pengeluaran'
                : 'Transfer'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Nominal:</span>
            <span className="font-mono font-bold text-[#f3efe6]">
              {formatCurrency(transaction.amount, transaction.currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Kategori:</span>
            <span className="text-zinc-300">{transaction.category}</span>
          </div>
          {transaction.note && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Catatan:</span>
              <span className="text-zinc-300 truncate max-w-[200px]">{transaction.note}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-transparent border border-zinc-700 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md transition-colors cursor-pointer"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
};
