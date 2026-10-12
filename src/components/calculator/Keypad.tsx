import React from 'react';
import { hapticFeedback } from '../../services/haptics';

interface KeypadProps {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onBackspace: () => void;
  onClear: () => void;
  onSwap: () => void;
  onAddZeros: () => void;
  disabled?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({
  onDigit,
  onDecimal,
  onBackspace,
  onClear,
  onSwap,
  onAddZeros,
  disabled = false,
}) => {
  const baseKeyStyle =
    'h-14 sm:h-16 flex items-center justify-center text-lg sm:text-xl font-semibold select-none rounded-lg border transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const numberKeyStyle = `${baseKeyStyle} bg-[#181c24] hover:bg-[#202632] border-[#29303e] text-[#f3efe6] font-mono`;
  const actionKeyStyle = `${baseKeyStyle} bg-[#1e232e] hover:bg-[#282f3d] border-[#364053] text-orange-400 font-mono`;
  const clearKeyStyle = `${baseKeyStyle} bg-[#251717] hover:bg-[#331c1c] border-[#4d2626] text-red-400 font-mono`;

  const pressDigit = (digit: string) => {
    hapticFeedback.light();
    onDigit(digit);
  };

  const pressDecimal = () => {
    hapticFeedback.light();
    onDecimal();
  };

  const pressBackspace = () => {
    hapticFeedback.light();
    onBackspace();
  };

  const pressClear = () => {
    hapticFeedback.medium();
    onClear();
  };

  const pressSwap = () => {
    hapticFeedback.medium();
    onSwap();
  };

  const pressAddZeros = () => {
    hapticFeedback.light();
    onAddZeros();
  };

  return (
    <div
      data-no-swipe="true"
      className="grid grid-cols-4 gap-2 sm:gap-2.5 w-full max-w-md mx-auto select-none"
    >
      {/* Row 1 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => pressDigit('7')}
        className={numberKeyStyle}
        aria-label="Angka 7"
      >
        7
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => pressDigit('8')}
        className={numberKeyStyle}
        aria-label="Angka 8"
      >
        8
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => pressDigit('9')}
        className={numberKeyStyle}
        aria-label="Angka 9"
      >
        9
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={pressBackspace}
        className={actionKeyStyle}
        aria-label="Hapus satu angka"
        title="Backspace"
      >
        ⌫
      </button>

      {/* Row 2 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => pressDigit('4')}
        className={numberKeyStyle}
        aria-label="Angka 4"
      >
        4
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => pressDigit('5')}
        className={numberKeyStyle}
        aria-label="Angka 5"
      >
        5
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => pressDigit('6')}
        className={numberKeyStyle}
        aria-label="Angka 6"
      >
        6
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={pressClear}
        className={clearKeyStyle}
        aria-label="Hapus semua"
        title="Clear All"
      >
        C
      </button>

      {/* Row 3 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => pressDigit('1')}
        className={numberKeyStyle}
        aria-label="Angka 1"
      >
        1
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => pressDigit('2')}
        className={numberKeyStyle}
        aria-label="Angka 2"
      >
        2
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => pressDigit('3')}
        className={numberKeyStyle}
        aria-label="Angka 3"
      >
        3
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={pressSwap}
        className={actionKeyStyle}
        aria-label="Tukar mata uang sumber dan tujuan"
        title="Tukar Mata Uang"
      >
        ⇄
      </button>

      {/* Row 4 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => pressDigit('0')}
        className={numberKeyStyle}
        aria-label="Angka 0"
      >
        0
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={pressAddZeros}
        className={`${numberKeyStyle} text-sm sm:text-base font-bold`}
        aria-label="Tambah 000 (Ribu)"
        title="Ribuan"
      >
        000
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={pressDecimal}
        className={numberKeyStyle}
        aria-label="Titik desimal"
      >
        .
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={pressClear}
        className="h-14 sm:h-16 flex items-center justify-center text-xs font-semibold rounded-lg border bg-[#181c24] hover:bg-[#202632] border-[#29303e] text-zinc-400 cursor-pointer"
        aria-label="Reset input"
      >
        Reset
      </button>
    </div>
  );
};
