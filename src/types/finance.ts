export type Currency = 'IDR' | 'JPY' | 'USD';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type AllocationGroup = 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'SAVINGS';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number; // Raw positive numeric amount
  currency: Currency;
  category: string;
  account: string; // e.g. "Kas Tunai", "BCA", "Mandiri", "GoPay", "Valas"
  destinationAccount?: string; // used for TRANSFER
  note: string;
  tags?: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  exchangeRateToIDR: number; // Snapshot of rate to base currency IDR at transaction time
}

export interface CalculationRecord {
  id: string;
  timestamp: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: number;
  toAmount: number;
  rate: number;
  provider: string;
  note?: string;
}

export interface AllocationPlan {
  primaryPercent: number;    // e.g. 50%
  secondaryPercent: number;  // e.g. 20%
  tertiaryPercent: number;   // e.g. 10%
  savingsPercent: number;    // e.g. 20%
  unallocatedPercent?: number;
  updatedAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  group: AllocationGroup;
  icon?: string;
  isCustom?: boolean;
}

export interface ExchangeRates {
  base: Currency;
  rates: Record<Currency, number>; // e.g., if base is USD, USD: 1, IDR: 15850, JPY: 151.6
  provider: string;
  observationDate: string;
  lastUpdated: string;
  status: 'live' | 'cached' | 'manual';
}

export type TimeframePeriod =
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_YEAR'
  | 'LAST_YEAR'
  | 'ALL_TIME'
  | 'CUSTOM';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface FinancialSummary {
  totalIncomeIDR: number;
  totalExpensesIDR: number;
  netCashFlowIDR: number;
  totalTransfersIDR: number;
  savingsRecordedIDR: number;
  transactionCount: number;
  expenseToIncomeRatio: number | null; // null if income is 0
  savingsRate: number | null; // null if income is 0
  primaryExpensesIDR: number;
  secondaryExpensesIDR: number;
  tertiaryExpensesIDR: number;
}

export interface ComparisonMetrics {
  incomeChangePercent: number | null;
  expenseChangePercent: number | null;
  cashFlowChangePercent: number | null;
  incomeDifferenceIDR: number;
  expenseDifferenceIDR: number;
  explanation: string;
}

export interface SmartRecommendation {
  id: string;
  title: string;
  periodLabel: string;
  severity: 'nominal' | 'warning' | 'alert' | 'info';
  metricHeadline: string;
  actualAmountIDR: number;
  recommendedLimitIDR: number;
  calculationMethod: string;
  supportingEvidence: string;
  suggestedAction: string;
  assumptions: string;
}
