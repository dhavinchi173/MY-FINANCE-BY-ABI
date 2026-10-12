import React, { useState } from 'react';
import { formatCurrency } from '../../services/currencyService';
import { useDragScroll } from '../../hooks/useDragScroll';

export interface DualBarPoint {
  label: string;
  subLabel?: string;
  val1: number; // Income
  val2: number; // Expense
}

interface DualBarChartProps {
  data: DualBarPoint[];
  val1Label?: string;
  val2Label?: string;
  height?: number;
}

export const DualBarChart: React.FC<DualBarChartProps> = ({
  data,
  val1Label = 'Pemasukan',
  val2Label = 'Pengeluaran',
  height = 240,
}) => {
  const scrollRef = useDragScroll<HTMLDivElement>();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-zinc-500 font-mono"
        style={{ height }}
      >
        Belum ada data untuk ditampilkan.
      </div>
    );
  }

  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.val1, d.val2)));
  const barWidth = Math.max(10, Math.min(24, Math.floor(600 / (data.length * 2.8))));

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span className="text-[11px] font-medium">{val1Label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
            <span className="text-[11px] font-medium">{val2Label}</span>
          </div>
        </div>
        <div className="text-[11px] font-mono text-zinc-500 tabular-nums">
          Maks: {formatCurrency(maxVal, 'IDR')}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="relative w-full overflow-x-auto no-scrollbar flex items-end border-b border-[#242b38] pt-8 touch-pan-x cursor-grab"
        style={{ height }}
      >
        {/* Background Grid Lines */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between opacity-15">
          <div className="border-b border-zinc-500 w-full" />
          <div className="border-b border-zinc-500 w-full" />
          <div className="border-b border-zinc-500 w-full" />
          <div className="border-b border-zinc-500 w-full" />
        </div>

        {/* Bars Container */}
        <div className="w-full min-w-full flex justify-between items-end gap-1 px-2 h-full z-10 pb-1">
          {data.map((item, idx) => {
            const h1 = (item.val1 / maxVal) * (height - 40);
            const h2 = (item.val2 / maxVal) * (height - 40);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
              >
                {/* Tooltip on Hover */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 z-30 bg-[#090b0f] border border-[#2e3748] rounded-md p-2 shadow-xl text-[10px] whitespace-nowrap pointer-events-none">
                    <div className="font-semibold text-zinc-200">{item.label}</div>
                    <div className="text-emerald-400 font-mono">
                      {val1Label}: {formatCurrency(item.val1, 'IDR')}
                    </div>
                    <div className="text-red-400 font-mono">
                      {val2Label}: {formatCurrency(item.val2, 'IDR')}
                    </div>
                  </div>
                )}

                <div className="flex items-end justify-center gap-0.5 sm:gap-1 w-full">
                  {/* Bar 1 (Income) */}
                  <div
                    style={{ height: `${Math.max(2, h1)}px`, width: `${barWidth}px` }}
                    className={`rounded-t-sm transition-all ${
                      item.val1 > 0 ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-emerald-950/20'
                    }`}
                  />
                  {/* Bar 2 (Expense) */}
                  <div
                    style={{ height: `${Math.max(2, h2)}px`, width: `${barWidth}px` }}
                    className={`rounded-t-sm transition-all ${
                      item.val2 > 0 ? 'bg-red-500 hover:bg-red-400' : 'bg-red-950/20'
                    }`}
                  />
                </div>

                {/* X Axis Label */}
                <div className="text-[10px] text-zinc-500 font-mono mt-1 text-center truncate max-w-[45px] sm:max-w-none">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export interface NetFlowPoint {
  label: string;
  netFlow: number;
}

interface NetFlowChartProps {
  data: NetFlowPoint[];
  height?: number;
}

export const NetFlowChart: React.FC<NetFlowChartProps> = ({ data, height = 220 }) => {
  const scrollRef = useDragScroll<HTMLDivElement>();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-zinc-500 font-mono"
        style={{ height }}
      >
        Belum ada data untuk ditampilkan.
      </div>
    );
  }

  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.netFlow)));
  const midY = height / 2;

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 px-1">
        <span className="text-[11px] font-medium">Tren Arus Kas Bersih (Surplus / Defisit)</span>
        <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
          Amplitudo: ±{formatCurrency(maxAbs, 'IDR')}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="relative w-full overflow-x-auto no-scrollbar border-b border-[#242b38] flex items-center touch-pan-x cursor-grab"
        style={{ height }}
      >
        {/* Zero Baseline Line */}
        <div
          className="absolute left-0 right-0 border-b border-dashed border-zinc-600/70 z-0 pointer-events-none"
          style={{ top: `${midY}px` }}
        />
        <div className="absolute right-2 text-[9px] font-mono text-zinc-500" style={{ top: `${midY - 14}px` }}>
          Baseline Rp 0
        </div>

        {/* Data Columns */}
        <div className="w-full min-w-full flex justify-between items-center h-full z-10 px-2">
          {data.map((item, idx) => {
            const isPositive = item.netFlow >= 0;
            const barHeight = (Math.abs(item.netFlow) / maxAbs) * (midY - 24);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex-1 flex flex-col items-center justify-center h-full relative cursor-pointer"
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 z-30 bg-[#090b0f] border border-[#2e3748] rounded-md p-2 shadow-xl text-[10px] whitespace-nowrap pointer-events-none">
                    <div className="font-semibold text-zinc-200">{item.label}</div>
                    <div
                      className={`font-mono font-bold ${
                        isPositive ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {formatCurrency(item.netFlow, 'IDR')}
                    </div>
                  </div>
                )}

                {/* Upper Half (Positive Net Flow) */}
                <div className="flex-1 flex items-end justify-center w-full">
                  {isPositive && item.netFlow > 0 && (
                    <div
                      style={{ height: `${Math.max(3, barHeight)}px` }}
                      className="w-3 sm:w-5 bg-emerald-500 hover:bg-emerald-400 rounded-t-sm transition-all"
                    />
                  )}
                </div>

                {/* Lower Half (Negative Net Flow) */}
                <div className="flex-1 flex items-start justify-center w-full">
                  {!isPositive && item.netFlow < 0 && (
                    <div
                      style={{ height: `${Math.max(3, barHeight)}px` }}
                      className="w-3 sm:w-5 bg-red-500 hover:bg-red-400 rounded-b-sm transition-all"
                    />
                  )}
                </div>

                {/* X Axis Label */}
                <div className="absolute bottom-1 text-[9px] text-zinc-500 font-mono truncate max-w-[45px]">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ slices, size = 180 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = slices.reduce((acc, s) => acc + s.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center p-6 text-xs text-zinc-500 font-mono text-center">
        Belum ada pengeluaran pada kategori ini.
      </div>
    );
  }

  let accumulatedAngle = 0;
  const radius = 70;
  const strokeWidth = 24;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#1a1f2b"
            strokeWidth={strokeWidth}
          />
          {slices.map((slice, idx) => {
            if (slice.value <= 0) return null;
            const ratio = slice.value / total;
            const strokeDasharray = `${circumference * ratio} ${circumference * (1 - ratio)}`;
            const strokeDashoffset = -accumulatedAngle * (circumference / 360);
            accumulatedAngle += ratio * 360;

            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="transition-all cursor-pointer opacity-90 hover:opacity-100"
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Total</span>
          <span className="text-xs font-bold font-mono text-[#f3efe6] tabular-nums">
            {formatCurrency(total, 'IDR')}
          </span>
        </div>
      </div>

      {/* Slices Legend */}
      <div className="space-y-1.5 w-full sm:w-auto max-w-xs text-xs">
        {slices.map((slice, idx) => {
          const percent = ((slice.value / total) * 100).toFixed(1);
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between gap-4 p-1.5 rounded transition-colors ${
                hoveredIdx === idx ? 'bg-[#1e2430]' : ''
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                <span className="text-zinc-300 truncate">{slice.label}</span>
              </div>
              <div className="text-right shrink-0 font-mono tabular-nums">
                <span className="text-zinc-400 font-bold mr-1.5">{percent}%</span>
                <span className="text-zinc-500 text-[11px]">{formatCurrency(slice.value, 'IDR')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
