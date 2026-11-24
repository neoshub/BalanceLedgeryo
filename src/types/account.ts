export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface BankAccount {
  id: string;
  bankName: string;
  minBalance: number;
  currentBalance: number;
}

export interface AccountMetrics {
  account: BankAccount;
  surplus: number;
  deficit: number;
  status: 'covered' | 'shortfall';
}

export interface TransferSuggestion {
  id: string;
  fromAccountId: string;
  fromBankName: string;
  toAccountId: string;
  toBankName: string;
  amount: number;
}

export interface UncoveredShortfall {
  accountId: string;
  bankName: string;
  initialDeficit: number;
  coveredByTransfers: number;
  remainingDeficit: number;
}

export interface BalanceSummary {
  totalCurrent: number;
  totalMinimum: number;
  totalShortfall: number;
  totalSurplus: number;
  netExternalNeeded: number;
  coveredCount: number;
  shortfallCount: number;
  transfers: TransferSuggestion[];
  uncoveredShortfalls: UncoveredShortfall[];
}
