import React, { useRef, useState, useCallback } from 'react';
import { hapticFeedback } from '../../services/haptics';

interface InteractiveAllocationSliderProps {
  label: string;
  description: string;
  value: number; // 0 - 100
  onChange: (val: number) => void;
  colorClass: string; // e.g. "bg-blue-500", "bg-amber-500"
  textColorClass: string;
  borderColorClass: string;
}

export const InteractiveAllocationSlider: React.FC<InteractiveAllocationSliderProps> = ({
  label,
  description,
  value,
  onChange,
  colorClass,
  textColorClass,
  borderColorClass,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculatePercentFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return value;
      const rect = track.getBoundingClientRect();
      const rawPercent = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(0, Math.min(100, Math.round(rawPercent)));
      return clamped;
    },
    [value]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Enable pointer capture so moving outside element still tracks smoothly
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    hapticFeedback.light();
    const newPercent = calculatePercentFromPointer(e.clientX);
    onChange(newPercent);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newPercent = calculatePercentFromPointer(e.clientX);
    onChange(newPercent);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(false);
  };

  const adjustBy = (delta: number) => {
    hapticFeedback.light();
    const next = Math.max(0, Math.min(100, value + delta));
    onChange(next);
  };

  return (
    <div
      data-no-swipe="true"
      className="p-3.5 bg-[#0f1218] border border-[#222835] rounded-xl space-y-2.5 transition-colors"
    >
      {/* Label & Value Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-xs font-bold ${textColorClass}`}>{label}</span>
          <p className="text-[11px] text-zinc-400 mt-0.5">{description}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) => {
              const num = parseInt(e.target.value, 10);
              onChange(isNaN(num) ? 0 : Math.max(0, Math.min(100, num)));
            }}
            className="w-14 bg-[#181d27] border border-[#2b3344] rounded px-1.5 py-0.5 text-right font-mono font-bold text-xs text-[#f3efe6] tabular-nums focus:outline-none focus:border-orange-500"
          />
          <span className="text-xs font-mono font-bold text-zinc-400">%</span>
        </div>
      </div>

      {/* Sleek Interactive Touch & Mouse Track (NO NATIVE BROWSER SLIDE BAR) */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-7 w-full bg-[#181d27] rounded-lg cursor-pointer touch-none select-none overflow-hidden border border-[#262e3d] flex items-center group"
      >
        {/* Filled active bar */}
        <div
          style={{ width: `${value}%` }}
          className={`h-full ${colorClass} opacity-85 transition-all duration-75`}
        />

        {/* Center label inside track */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-mono font-bold text-zinc-200 tabular-nums drop-shadow-md">
            {value}%
          </span>
        </div>

        {/* Touch/Mouse Handle indicator */}
        <div
          style={{ left: `calc(${value}% - 6px)` }}
          className={`absolute top-0.5 bottom-0.5 w-3 rounded-full bg-white shadow-md border ${borderColorClass} pointer-events-none transition-transform ${
            isDragging ? 'scale-125' : 'group-hover:scale-110'
          }`}
        />
      </div>

      {/* Touch & Mouse Quick Increment/Decrement Steppers */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => adjustBy(-5)}
            className="px-2 py-1 bg-[#181d27] hover:bg-[#202735] active:bg-[#283244] text-zinc-300 font-mono text-[10px] rounded border border-[#262e3d] cursor-pointer transition-colors"
            title="Kurang 5%"
          >
            -5%
          </button>
          <button
            type="button"
            onClick={() => adjustBy(-1)}
            className="px-2 py-1 bg-[#181d27] hover:bg-[#202735] active:bg-[#283244] text-zinc-300 font-mono text-[10px] rounded border border-[#262e3d] cursor-pointer transition-colors"
            title="Kurang 1%"
          >
            -1%
          </button>
        </div>

        <span className="text-[10px] text-zinc-500">Geser atau sentuh bar</span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => adjustBy(+1)}
            className="px-2 py-1 bg-[#181d27] hover:bg-[#202735] active:bg-[#283244] text-zinc-300 font-mono text-[10px] rounded border border-[#262e3d] cursor-pointer transition-colors"
            title="Tambah 1%"
          >
            +1%
          </button>
          <button
            type="button"
            onClick={() => adjustBy(+5)}
            className="px-2 py-1 bg-[#181d27] hover:bg-[#202735] active:bg-[#283244] text-zinc-300 font-mono text-[10px] rounded border border-[#262e3d] cursor-pointer transition-colors"
            title="Tambah 5%"
          >
            +5%
          </button>
        </div>
      </div>
    </div>
  );
};
