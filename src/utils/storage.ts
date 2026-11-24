import type { BankAccount, CurrencyCode } from '../types/account';
import { CURRENCIES, DEFAULT_SAMPLE_ACCOUNTS, roundMoney } from './balanceEngine';

const STORAGE_KEY = 'balance_ledger_state_v1';

export interface PersistedLedgerState {
  accounts: BankAccount[];
  currency: CurrencyCode;
}

function isValidAccount(item: unknown): item is BankAccount {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.trim().length > 0 &&
    typeof candidate.bankName === 'string' &&
    typeof candidate.minBalance === 'number' &&
    Number.isFinite(candidate.minBalance) &&
    typeof candidate.currentBalance === 'number' &&
    Number.isFinite(candidate.currentBalance)
  );
}

export function loadLedgerState(): PersistedLedgerState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initialState: PersistedLedgerState = {
        accounts: DEFAULT_SAMPLE_ACCOUNTS.map((acc) => ({ ...acc })),
        currency: 'INR',
      };
      saveLedgerState(initialState);
      return initialState;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedLedgerState>;
    const currency: CurrencyCode =
      parsed.currency && parsed.currency in CURRENCIES ? parsed.currency : 'INR';

    const accounts = Array.isArray(parsed.accounts)
      ? parsed.accounts.filter(isValidAccount).map((acc) => ({
          id: acc.id,
          bankName: acc.bankName.trim() || 'Unnamed Bank',
          minBalance: Math.max(0, roundMoney(acc.minBalance)),
          currentBalance: Math.max(0, roundMoney(acc.currentBalance)),
        }))
      : DEFAULT_SAMPLE_ACCOUNTS.map((acc) => ({ ...acc }));

    return { accounts, currency };
  } catch {
    return {
      accounts: DEFAULT_SAMPLE_ACCOUNTS.map((acc) => ({ ...acc })),
      currency: 'INR',
    };
  }
}

export function saveLedgerState(state: PersistedLedgerState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or private-browsing errors silently
  }
}
