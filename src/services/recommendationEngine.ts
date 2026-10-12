import {
  FinancialSummary,
  AllocationPlan,
  SmartRecommendation,
  Transaction,
  TimeframePeriod,
} from '../types/finance';
import { formatCurrency } from './currencyService';
import { computeAllocationComparison, calculateComparison } from './financialAnalytics';

export function generateSmartRecommendations(
  summary: FinancialSummary,
  previousSummary: FinancialSummary | null,
  plan: AllocationPlan,
  periodLabel: string,
  transactions: Transaction[]
): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];

  // 1. INSUFFICIENT DATA / ZERO BASELINE CHECK
  if (transactions.length === 0 || summary.transactionCount === 0) {
    recommendations.push({
      id: 'rec-no-data',
      title: 'Belum Ada Transaksi Tercatat',
      periodLabel,
      severity: 'info',
      metricHeadline: 'Total Transaksi: 0',
      actualAmountIDR: 0,
      recommendedLimitIDR: 0,
      calculationMethod: 'Deteksi Ledger Kosong',
      supportingEvidence:
        'Sistem mendeteksi belum ada transaksi pemasukan, pengeluaran, atau transfer yang disimpan pada periode ini.',
      suggestedAction:
        'Gunakan Kalkulator Konverter di halaman depan untuk menghitung nilai dan simpan transaksi pertama Anda via tombol "Simpan Transaksi".',
      assumptions:
        'Sistem tidak membuat data palsu atau asumsi saldo awal sebelum Anda menyimpannya secara nyata.',
    });
    return recommendations;
  }

  // 2. CHECK IF INCOME IS ZERO (EXPENSES ONLY)
  if (summary.totalIncomeIDR === 0 && summary.totalExpensesIDR > 0) {
    recommendations.push({
      id: 'rec-no-income',
      title: 'Pemasukan Belum Dicatat Pada Periode Ini',
      periodLabel,
      severity: 'warning',
      metricHeadline: `Pengeluaran ${formatCurrency(summary.totalExpensesIDR, 'IDR')} tanpa Pemasukan`,
      actualAmountIDR: summary.totalExpensesIDR,
      recommendedLimitIDR: 0,
      calculationMethod: 'Defisit Kas Murni = Total Pengeluaran - Rp 0',
      supportingEvidence: `Terdapat ${summary.transactionCount} transaksi pengeluaran senilai ${formatCurrency(
        summary.totalExpensesIDR,
        'IDR'
      )}, namun belum ada catatan pemasukan/gaji.`,
      suggestedAction:
        'Catat pemasukan bulanan atau saldo masuk agar sistem dapat menghitung persentase alokasi kebutuhan primer, sekunder, dan tabungan secara akurat.',
      assumptions:
        'Persentase alokasi anggaran (50/20/10/20) membutuhkan nominal pemasukan riil sebagai basis perhitungan nominal batas.',
    });
  }

  // 3. ALLOCATION COMPLIANCE EVALUATION (If Income > 0)
  if (summary.totalIncomeIDR > 0) {
    const comparisons = computeAllocationComparison(summary, plan);

    for (const comp of comparisons) {
      if (comp.isOverBudget) {
        const overspent = comp.actualSpentIDR - comp.plannedAmountIDR;
        recommendations.push({
          id: `rec-overbudget-${comp.group.toLowerCase()}`,
          title: `Peringatan Anggaran: ${comp.label} Melampaui Rencana`,
          periodLabel,
          severity: 'alert',
          metricHeadline: `Realisasi ${comp.utilizationPercent.toFixed(1)}% dari batas rencana`,
          actualAmountIDR: comp.actualSpentIDR,
          recommendedLimitIDR: comp.plannedAmountIDR,
          calculationMethod: `${comp.label} Terpakai (${formatCurrency(
            comp.actualSpentIDR,
            'IDR'
          )}) - Rencana (${formatCurrency(comp.plannedAmountIDR, 'IDR')} [${comp.configuredPercent}% dari pemasukan])`,
          supportingEvidence: `Pengeluaran kelompok ${comp.label} melebihi alokasi rencana sebesar ${formatCurrency(
            overspent,
            'IDR'
          )}.`,
          suggestedAction:
            comp.group === 'TERTIARY'
              ? 'Hentikan belanja kebutuhan tersier (hiburan/hobi) hingga periode berikutnya.'
              : comp.group === 'SECONDARY'
              ? 'Tinjau kembali langganan dan pengeluaran sekunder yang bisa ditunda.'
              : 'Evaluasi biaya primer mendesak atau sesuaikan persentase alokasi di Pengaturan Anggaran.',
          assumptions: `Berdasarkan total pemasukan tercatat ${formatCurrency(
            summary.totalIncomeIDR,
            'IDR'
          )} dan alokasi rencana ${comp.configuredPercent}%.`,
        });
      } else if (comp.plannedAmountIDR > 0 && comp.utilizationPercent >= 80) {
        recommendations.push({
          id: `rec-nearlimit-${comp.group.toLowerCase()}`,
          title: `Mendekati Batas: ${comp.label}`,
          periodLabel,
          severity: 'warning',
          metricHeadline: `Sisa Kuota: ${formatCurrency(comp.remainingAllowanceIDR, 'IDR')}`,
          actualAmountIDR: comp.actualSpentIDR,
          recommendedLimitIDR: comp.plannedAmountIDR,
          calculationMethod: `Sisa Kuota = Rencana ${formatCurrency(
            comp.plannedAmountIDR,
            'IDR'
          )} - Realisasi ${formatCurrency(comp.actualSpentIDR, 'IDR')}`,
          supportingEvidence: `Telah terpakai ${comp.utilizationPercent.toFixed(1)}% dari alokasi yang ditetapkan.`,
          suggestedAction: `Jaga pengeluaran pada pos ini agar tidak melampaui sisa kuota ${formatCurrency(
            comp.remainingAllowanceIDR,
            'IDR'
          )}.`,
          assumptions: 'Mempertimbangkan sisa hari dalam periode aktif.',
        });
      } else if (comp.plannedAmountIDR > 0) {
        recommendations.push({
          id: `rec-safe-${comp.group.toLowerCase()}`,
          title: `Status Aman: ${comp.label}`,
          periodLabel,
          severity: 'nominal',
          metricHeadline: `Terserap ${comp.utilizationPercent.toFixed(1)}% (Sisa: ${formatCurrency(
            comp.remainingAllowanceIDR,
            'IDR'
          )})`,
          actualAmountIDR: comp.actualSpentIDR,
          recommendedLimitIDR: comp.plannedAmountIDR,
          calculationMethod: `Batas Maksimal = ${comp.configuredPercent}% × Pemasukan ${formatCurrency(
            summary.totalIncomeIDR,
            'IDR'
          )}`,
          supportingEvidence: `Pengeluaran riil masih dalam koridor rencana anggaran yang sehat.`,
          suggestedAction: 'Pertahankan disiplin pencatatan transaksi secara berkala.',
          assumptions: 'Tidak ada komitmen pembayaran tertunda yang belum tercatat.',
        });
      }
    }

    // 4. SAVINGS HEALTH EVALUATION
    const netSavings = Math.max(0, summary.netCashFlowIDR);
    const plannedSavingsAmount = Math.round((summary.totalIncomeIDR * plan.savingsPercent) / 100);

    if (summary.netCashFlowIDR < 0) {
      recommendations.push({
        id: 'rec-cashflow-deficit',
        title: 'Arus Kas Bersih Negatif (Defisit)',
        periodLabel,
        severity: 'alert',
        metricHeadline: `Defisit: ${formatCurrency(Math.abs(summary.netCashFlowIDR), 'IDR')}`,
        actualAmountIDR: summary.totalExpensesIDR,
        recommendedLimitIDR: summary.totalIncomeIDR,
        calculationMethod: `Arus Kas = Pemasukan (${formatCurrency(
          summary.totalIncomeIDR,
          'IDR'
        )}) - Pengeluaran (${formatCurrency(summary.totalExpensesIDR, 'IDR')})`,
        supportingEvidence: `Total pengeluaran melebihi total pemasukan riil sebesar ${formatCurrency(
          Math.abs(summary.netCashFlowIDR),
          'IDR'
        )}.`,
        suggestedAction:
          'Audit segera pengeluaran kategori tersier dan sekunder untuk mencegah penarikan tabungan pokok.',
        assumptions: 'Semua transaksi pengeluaran adalah riil dan telah selesai.',
      });
    } else {
      recommendations.push({
        id: 'rec-savings-healthy',
        title: 'Pencapaian Tabungan & Surplus Kas',
        periodLabel,
        severity: 'nominal',
        metricHeadline: `Surplus Kas: ${formatCurrency(netSavings, 'IDR')} (${(
          (netSavings / summary.totalIncomeIDR) *
          100
        ).toFixed(1)}% dari pemasukan)`,
        actualAmountIDR: netSavings,
        recommendedLimitIDR: plannedSavingsAmount,
        calculationMethod: `Surplus Kas = Pemasukan - Pengeluaran; Target Rencana = ${plan.savingsPercent}% × Pemasukan`,
        supportingEvidence:
          netSavings >= plannedSavingsAmount
            ? `Surplus melampaui target tabungan rencana (${formatCurrency(
                plannedSavingsAmount,
                'IDR'
              )}).`
            : `Surplus kas tercatat ${formatCurrency(
                netSavings,
                'IDR'
              )}, mendekati target rencana ${formatCurrency(plannedSavingsAmount, 'IDR')}.`,
        suggestedAction:
          'Pindahkan surplus ini ke rekening tabungan terpisah atau instrumen dana darurat via menu Catat Transfer.',
        assumptions: 'Tidak memperhitungkan fluktuasi valuta asing non-rupiah.',
      });
    }
  }

  // 5. PERIOD-OVER-PERIOD TREND COMPARISON
  if (previousSummary && previousSummary.transactionCount > 0) {
    const expenseComp = calculateComparison(summary.totalExpensesIDR, previousSummary.totalExpensesIDR);
    if (expenseComp.percent !== null && Math.abs(expenseComp.percent) > 10) {
      const isIncrease = expenseComp.percent > 0;
      recommendations.push({
        id: 'rec-period-trend',
        title: isIncrease ? 'Kenaikan Pengeluaran vs Periode Lalu' : 'Penghematan vs Periode Lalu',
        periodLabel,
        severity: isIncrease ? 'warning' : 'nominal',
        metricHeadline: expenseComp.label,
        actualAmountIDR: summary.totalExpensesIDR,
        recommendedLimitIDR: previousSummary.totalExpensesIDR,
        calculationMethod: `((Pengeluaran Sekarang - Pengeluaran Lalu) / Pengeluaran Lalu) × 100`,
        supportingEvidence: `Pengeluaran berubah sebesar ${formatCurrency(
          Math.abs(expenseComp.difference),
          'IDR'
        )} dibanding periode pembanding sebelumnya.`,
        suggestedAction: isIncrease
          ? 'Periksa apakah ada pos pengeluaran darurat atau belanja sekunder yang melonjak.'
          : 'Pola pengeluaran Anda lebih hemat dibanding periode sebelumnya. Terus jaga ritme ini!',
        assumptions: 'Kedua periode memiliki rentang durasi waktu yang setara.',
      });
    }
  }

  return recommendations;
}
