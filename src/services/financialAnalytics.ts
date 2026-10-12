import {
  Transaction,
  TimeframePeriod,
  DateRange,
  FinancialSummary,
  CategoryItem,
  AllocationPlan,
  AllocationGroup,
} from '../types/finance';
import { DEFAULT_CATEGORIES } from '../constants/categories';

/**
 * Format local date as YYYY-MM-DD
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date range for chosen timeframe period
 */
export function getDateRangeForPeriod(period: TimeframePeriod, customRange?: DateRange): DateRange {
  const now = new Date();
  const todayStr = formatLocalDate(now);

  switch (period) {
    case 'TODAY':
      return { startDate: todayStr, endDate: todayStr };

    case 'LAST_7_DAYS': {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { startDate: formatLocalDate(start), endDate: todayStr };
    }

    case 'LAST_30_DAYS': {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return { startDate: formatLocalDate(start), endDate: todayStr };
    }

    case 'THIS_MONTH': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: formatLocalDate(start), endDate: formatLocalDate(end) };
    }

    case 'LAST_MONTH': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: formatLocalDate(start), endDate: formatLocalDate(end) };
    }

    case 'THIS_YEAR': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { startDate: formatLocalDate(start), endDate: formatLocalDate(end) };
    }

    case 'LAST_YEAR': {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      return { startDate: formatLocalDate(start), endDate: formatLocalDate(end) };
    }

    case 'CUSTOM':
      return customRange && customRange.startDate && customRange.endDate
        ? customRange
        : { startDate: todayStr, endDate: todayStr };

    case 'ALL_TIME':
    default:
      return { startDate: '1970-01-01', endDate: '2099-12-31' };
  }
}

/**
 * Filter transactions falling inside the inclusive date range
 */
export function filterTransactionsByDate(
  transactions: Transaction[],
  range: DateRange
): Transaction[] {
  return transactions.filter((t) => t.date >= range.startDate && t.date <= range.endDate);
}

/**
 * Helper to get equivalent IDR amount for a transaction
 */
export function getTransactionIDREquivalent(transaction: Transaction): number {
  if (transaction.currency === 'IDR') {
    return transaction.amount;
  }
  const rate = transaction.exchangeRateToIDR > 0 ? transaction.exchangeRateToIDR : 1;
  return transaction.amount * rate;
}

/**
 * Resolve which allocation group a category belongs to
 */
export function resolveCategoryGroup(
  categoryName: string,
  customCategories: CategoryItem[]
): AllocationGroup {
  const allCategories = [...customCategories, ...DEFAULT_CATEGORIES];
  const found = allCategories.find(
    (c) => c.name.toLowerCase().trim() === categoryName.toLowerCase().trim()
  );
  if (found) {
    return found.group;
  }
  // Heuristic fallbacks if user typed custom category without registration
  const lower = categoryName.toLowerCase();
  if (lower.includes('makan') || lower.includes('sembako') || lower.includes('listrik') || lower.includes('sewa') || lower.includes('transport') || lower.includes('obat')) {
    return 'PRIMARY';
  }
  if (lower.includes('pulsa') || lower.includes('kuota') || lower.includes('baju') || lower.includes('kursus') || lower.includes('servis')) {
    return 'SECONDARY';
  }
  if (lower.includes('tabung') || lower.includes('invest') || lower.includes('darurat')) {
    return 'SAVINGS';
  }
  return 'TERTIARY';
}

/**
 * Calculate deterministic financial summary for any transaction set
 */
export function calculateFinancialSummary(
  transactions: Transaction[],
  customCategories: CategoryItem[] = []
): FinancialSummary {
  if (!transactions || transactions.length === 0) {
    return {
      totalIncomeIDR: 0,
      totalExpensesIDR: 0,
      netCashFlowIDR: 0,
      totalTransfersIDR: 0,
      savingsRecordedIDR: 0,
      transactionCount: 0,
      expenseToIncomeRatio: null,
      savingsRate: null,
      primaryExpensesIDR: 0,
      secondaryExpensesIDR: 0,
      tertiaryExpensesIDR: 0,
    };
  }

  let totalIncomeIDR = 0;
  let totalExpensesIDR = 0;
  let totalTransfersIDR = 0;
  let savingsRecordedIDR = 0;
  let primaryExpensesIDR = 0;
  let secondaryExpensesIDR = 0;
  let tertiaryExpensesIDR = 0;

  for (const t of transactions) {
    const amountIDR = getTransactionIDREquivalent(t);

    if (t.type === 'INCOME') {
      totalIncomeIDR += amountIDR;
    } else if (t.type === 'EXPENSE') {
      totalExpensesIDR += amountIDR;
      const group = resolveCategoryGroup(t.category, customCategories);
      if (group === 'PRIMARY') primaryExpensesIDR += amountIDR;
      else if (group === 'SECONDARY') secondaryExpensesIDR += amountIDR;
      else if (group === 'TERTIARY') tertiaryExpensesIDR += amountIDR;
      else if (group === 'SAVINGS') savingsRecordedIDR += amountIDR;
    } else if (t.type === 'TRANSFER') {
      totalTransfersIDR += amountIDR;
      // If transfer notes/category explicitly point to savings/investment account, track as savings transfer
      const isSavingsTransfer = t.destinationAccount?.toLowerCase().includes('valas') ||
        t.destinationAccount?.toLowerCase().includes('investasi') ||
        t.category?.toLowerCase().includes('tabung');
      if (isSavingsTransfer) {
        savingsRecordedIDR += amountIDR;
      }
    }
  }

  const netCashFlowIDR = totalIncomeIDR - totalExpensesIDR;
  const expenseToIncomeRatio =
    totalIncomeIDR > 0 ? (totalExpensesIDR / totalIncomeIDR) * 100 : null;

  // Realized Savings Rate based on remaining net surplus plus explicitly recorded savings
  const totalRealizedSavings = Math.max(0, netCashFlowIDR);
  const savingsRate =
    totalIncomeIDR > 0 ? (totalRealizedSavings / totalIncomeIDR) * 100 : null;

  return {
    totalIncomeIDR,
    totalExpensesIDR,
    netCashFlowIDR,
    totalTransfersIDR,
    savingsRecordedIDR,
    transactionCount: transactions.length,
    expenseToIncomeRatio,
    savingsRate,
    primaryExpensesIDR,
    secondaryExpensesIDR,
    tertiaryExpensesIDR,
  };
}

/**
 * Period comparison helper (avoids divide by zero or Infinity)
 */
export function calculateComparison(
  currentVal: number,
  previousVal: number
): { percent: number | null; label: string; difference: number } {
  const difference = currentVal - previousVal;

  if (previousVal === 0) {
    if (currentVal === 0) {
      return { percent: 0, label: 'Sama dengan periode sebelumnya (keduanya Rp 0)', difference: 0 };
    }
    return {
      percent: null,
      label: 'Nilai sebelumnya Rp 0 (Belum ada data pembanding)',
      difference,
    };
  }

  const percent = ((currentVal - previousVal) / Math.abs(previousVal)) * 100;
  const isUp = percent > 0;
  const label = `${isUp ? '+' : ''}${percent.toFixed(1)}% vs periode lalu`;

  return { percent, label, difference };
}

/**
 * Daily chart points aggregation
 */
export interface TimeChartPoint {
  key: string;
  label: string;
  income: number;
  expense: number;
  netFlow: number;
  count: number;
}

export function aggregateDailyTrend(
  transactions: Transaction[],
  daysCount: number = 7
): TimeChartPoint[] {
  const points: TimeChartPoint[] = [];
  const now = new Date();

  // Create date buckets for last N days
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = formatLocalDate(d);
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    points.push({
      key: dateStr,
      label: dayLabel,
      income: 0,
      expense: 0,
      netFlow: 0,
      count: 0,
    });
  }

  const pointMap = new Map(points.map((p) => [p.key, p]));

  for (const t of transactions) {
    const target = pointMap.get(t.date);
    if (target) {
      const amountIDR = getTransactionIDREquivalent(t);
      if (t.type === 'INCOME') target.income += amountIDR;
      else if (t.type === 'EXPENSE') target.expense += amountIDR;
      target.netFlow = target.income - target.expense;
      target.count += 1;
    }
  }

  return points;
}

/**
 * Monthly aggregation for historical overview
 */
export function aggregateMonthlyTrend(
  transactions: Transaction[],
  monthsCount: number = 12
): TimeChartPoint[] {
  const points: TimeChartPoint[] = [];
  const now = new Date();

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    points.push({
      key: monthKey,
      label,
      income: 0,
      expense: 0,
      netFlow: 0,
      count: 0,
    });
  }

  const pointMap = new Map(points.map((p) => [p.key, p]));

  for (const t of transactions) {
    const monthKey = t.date.substring(0, 7);
    const target = pointMap.get(monthKey);
    if (target) {
      const amountIDR = getTransactionIDREquivalent(t);
      if (t.type === 'INCOME') target.income += amountIDR;
      else if (t.type === 'EXPENSE') target.expense += amountIDR;
      target.netFlow = target.income - target.expense;
      target.count += 1;
    }
  }

  return points;
}

/**
 * Multi-year aggregation
 */
export function aggregateYearlyTrend(transactions: Transaction[]): TimeChartPoint[] {
  if (transactions.length === 0) {
    const currentYear = new Date().getFullYear().toString();
    return [{ key: currentYear, label: currentYear, income: 0, expense: 0, netFlow: 0, count: 0 }];
  }

  const yearMap = new Map<string, TimeChartPoint>();

  for (const t of transactions) {
    const year = t.date.substring(0, 4);
    if (!yearMap.has(year)) {
      yearMap.set(year, {
        key: year,
        label: year,
        income: 0,
        expense: 0,
        netFlow: 0,
        count: 0,
      });
    }
    const target = yearMap.get(year)!;
    const amountIDR = getTransactionIDREquivalent(t);
    if (t.type === 'INCOME') target.income += amountIDR;
    else if (t.type === 'EXPENSE') target.expense += amountIDR;
    target.netFlow = target.income - target.expense;
    target.count += 1;
  }

  return Array.from(yearMap.values()).sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Category-based distribution of expenses
 */
export interface CategoryDistributionItem {
  category: string;
  group: AllocationGroup;
  totalIDR: number;
  percentage: number;
  transactionCount: number;
}

export function aggregateExpenseCategories(
  transactions: Transaction[],
  customCategories: CategoryItem[] = []
): CategoryDistributionItem[] {
  const expenseTransactions = transactions.filter((t) => t.type === 'EXPENSE');
  const totalExpenseIDR = expenseTransactions.reduce(
    (sum, t) => sum + getTransactionIDREquivalent(t),
    0
  );

  if (totalExpenseIDR === 0) return [];

  const map = new Map<string, { group: AllocationGroup; totalIDR: number; count: number }>();

  for (const t of expenseTransactions) {
    const key = t.category || 'Lainnya';
    const amountIDR = getTransactionIDREquivalent(t);
    const existing = map.get(key);
    if (existing) {
      existing.totalIDR += amountIDR;
      existing.count += 1;
    } else {
      map.set(key, {
        group: resolveCategoryGroup(key, customCategories),
        totalIDR: amountIDR,
        count: 1,
      });
    }
  }

  const results: CategoryDistributionItem[] = [];
  for (const [category, data] of map.entries()) {
    results.push({
      category,
      group: data.group,
      totalIDR: data.totalIDR,
      percentage: (data.totalIDR / totalExpenseIDR) * 100,
      transactionCount: data.count,
    });
  }

  return results.sort((a, b) => b.totalIDR - a.totalIDR);
}

/**
 * Compare actual spending against user's configured allocation plan
 */
export interface AllocationComparisonItem {
  group: AllocationGroup;
  label: string;
  configuredPercent: number;
  plannedAmountIDR: number;
  actualSpentIDR: number;
  remainingAllowanceIDR: number;
  utilizationPercent: number; // actual / planned * 100
  isOverBudget: boolean;
}

export function computeAllocationComparison(
  summary: FinancialSummary,
  plan: AllocationPlan
): AllocationComparisonItem[] {
  const eligibleIncome = summary.totalIncomeIDR;

  const groups: { group: AllocationGroup; label: string; percent: number; actual: number }[] = [
    {
      group: 'PRIMARY',
      label: 'Kebutuhan Primer',
      percent: plan.primaryPercent,
      actual: summary.primaryExpensesIDR,
    },
    {
      group: 'SECONDARY',
      label: 'Kebutuhan Sekunder',
      percent: plan.secondaryPercent,
      actual: summary.secondaryExpensesIDR,
    },
    {
      group: 'TERTIARY',
      label: 'Kebutuhan Tersier',
      percent: plan.tertiaryPercent,
      actual: summary.tertiaryExpensesIDR,
    },
    {
      group: 'SAVINGS',
      label: 'Tabungan & Investasi',
      percent: plan.savingsPercent,
      actual: summary.savingsRecordedIDR,
    },
  ];

  return groups.map((g) => {
    const plannedAmountIDR = Math.round((eligibleIncome * g.percent) / 100);
    const remainingAllowanceIDR = plannedAmountIDR - g.actual;
    const utilizationPercent =
      plannedAmountIDR > 0 ? (g.actual / plannedAmountIDR) * 100 : 0;
    const isOverBudget = plannedAmountIDR > 0 && g.actual > plannedAmountIDR;

    return {
      group: g.group,
      label: g.label,
      configuredPercent: g.percent,
      plannedAmountIDR,
      actualSpentIDR: g.actual,
      remainingAllowanceIDR,
      utilizationPercent,
      isOverBudget,
    };
  });
}
