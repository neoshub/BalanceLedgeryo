import type {
  AccountMetrics,
  BalanceSummary,
  BankAccount,
  CurrencyCode,
  TransferSuggestion,
  UncoveredShortfall,
} from '../types/account';

export const CURRENCIES: Record<
  CurrencyCode,
  { code: CurrencyCode; symbol: string; label: string; locale: string }
> = {
  INR: { code: 'INR', symbol: '₹', label: 'INR (₹)', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', label: 'USD ($)', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', label: 'EUR (€)', locale: 'en-IE' },
  GBP: { code: 'GBP', symbol: '£', label: 'GBP (£)', locale: 'en-GB' },
};

export const DEFAULT_SAMPLE_ACCOUNTS: BankAccount[] = [
  {
    id: 'acc-hdfc',
    bankName: 'HDFC',
    minBalance: 25000,
    currentBalance: 50000,
  },
  {
    id: 'acc-icici',
    bankName: 'ICICI',
    minBalance: 50000,
    currentBalance: 40000,
  },
  {
    id: 'acc-kotak',
    bankName: 'Kotak Mahindra',
    minBalance: 20000,
    currentBalance: 12500,
  },
  {
    id: 'acc-axis',
    bankName: 'Axis Bank',
    minBalance: 15000,
    currentBalance: 19000,
  },
];

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function formatCurrency(amount: number, currencyCode: CurrencyCode): string {
  const { symbol, locale } = CURRENCIES[currencyCode];
  const safeAmount = Number.isFinite(amount) ? roundMoney(amount) : 0;
  const hasDecimals = Math.abs(safeAmount % 1) > 0.001;

  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(safeAmount));

  return safeAmount < 0 ? `-${symbol}${formattedNumber}` : `${symbol}${formattedNumber}`;
}

export function computeAccountMetrics(account: BankAccount): AccountMetrics {
  const current = Math.max(0, roundMoney(account.currentBalance));
  const min = Math.max(0, roundMoney(account.minBalance));
  const surplus = Math.max(0, roundMoney(current - min));
  const deficit = Math.max(0, roundMoney(min - current));

  return {
    account: {
      ...account,
      currentBalance: current,
      minBalance: min,
    },
    surplus,
    deficit,
    status: current >= min ? 'covered' : 'shortfall',
  };
}

export function computeBalanceSummary(accounts: BankAccount[]): BalanceSummary {
  const metrics = accounts.map(computeAccountMetrics);

  let totalCurrent = 0;
  let totalMinimum = 0;
  let totalShortfall = 0;
  let totalSurplus = 0;
  let coveredCount = 0;
  let shortfallCount = 0;

  for (const m of metrics) {
    totalCurrent = roundMoney(totalCurrent + m.account.currentBalance);
    totalMinimum = roundMoney(totalMinimum + m.account.minBalance);
    totalShortfall = roundMoney(totalShortfall + m.deficit);
    totalSurplus = roundMoney(totalSurplus + m.surplus);
    if (m.status === 'covered') {
      coveredCount += 1;
    } else {
      shortfallCount += 1;
    }
  }

  const netExternalNeeded = Math.max(0, roundMoney(totalShortfall - totalSurplus));

  // Greedy matching:
  // 1. Sort surplus accounts descending by surplus amount
  const surplusPool = metrics
    .filter((m) => m.surplus > 0)
    .map((m) => ({
      id: m.account.id,
      bankName: m.account.bankName,
      remaining: m.surplus,
    }))
    .sort((a, b) => b.remaining - a.remaining || a.bankName.localeCompare(b.bankName));

  // 2. Sort deficit accounts descending by deficit amount
  const deficitPool = metrics
    .filter((m) => m.deficit > 0)
    .map((m) => ({
      id: m.account.id,
      bankName: m.account.bankName,
      initialDeficit: m.deficit,
      remaining: m.deficit,
      coveredByTransfers: 0,
    }))
    .sort((a, b) => b.remaining - a.remaining || a.bankName.localeCompare(b.bankName));

  const transfers: TransferSuggestion[] = [];
  let sIdx = 0;
  let dIdx = 0;

  while (sIdx < surplusPool.length && dIdx < deficitPool.length) {
    const giver = surplusPool[sIdx];
    const receiver = deficitPool[dIdx];

    if (giver.remaining <= 0) {
      sIdx += 1;
      continue;
    }
    if (receiver.remaining <= 0) {
      dIdx += 1;
      continue;
    }

    const transferAmount = roundMoney(Math.min(giver.remaining, receiver.remaining));

    if (transferAmount > 0) {
      transfers.push({
        id: `${giver.id}->${receiver.id}`,
        fromAccountId: giver.id,
        fromBankName: giver.bankName,
        toAccountId: receiver.id,
        toBankName: receiver.bankName,
        amount: transferAmount,
      });

      giver.remaining = roundMoney(giver.remaining - transferAmount);
      receiver.remaining = roundMoney(receiver.remaining - transferAmount);
      receiver.coveredByTransfers = roundMoney(receiver.coveredByTransfers + transferAmount);
    }

    if (giver.remaining <= 0) {
      sIdx += 1;
    }
    if (receiver.remaining <= 0) {
      dIdx += 1;
    }
  }

  const uncoveredShortfalls: UncoveredShortfall[] = deficitPool
    .filter((d) => d.remaining > 0)
    .map((d) => ({
      accountId: d.id,
      bankName: d.bankName,
      initialDeficit: d.initialDeficit,
      coveredByTransfers: d.coveredByTransfers,
      remainingDeficit: d.remaining,
    }));

  return {
    totalCurrent,
    totalMinimum,
    totalShortfall,
    totalSurplus,
    netExternalNeeded,
    coveredCount,
    shortfallCount,
    transfers,
    uncoveredShortfalls,
  };
}
