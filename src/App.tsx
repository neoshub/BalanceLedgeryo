import { Plus, RotateCcw, Trash } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AccountFormBar } from './components/AccountFormBar';
import { AccountsLedger } from './components/AccountsLedger';
import { SummaryStrip } from './components/SummaryStrip';
import { TransferSuggestions } from './components/TransferSuggestions';
import type { BankAccount, CurrencyCode, TransferSuggestion } from './types/account';
import {
  CURRENCIES,
  DEFAULT_SAMPLE_ACCOUNTS,
  computeBalanceSummary,
  roundMoney,
} from './utils/balanceEngine';
import { loadLedgerState, saveLedgerState } from './utils/storage';

function createAccountId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `acc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [initialState] = useState(() => loadLedgerState());
  const [accounts, setAccounts] = useState<BankAccount[]>(initialState.accounts);
  const [currency, setCurrency] = useState<CurrencyCode>(initialState.currency);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [previousAccountsSnapshot, setPreviousAccountsSnapshot] = useState<BankAccount[] | null>(
    null,
  );

  useEffect(() => {
    saveLedgerState({ accounts, currency });
  }, [accounts, currency]);

  const summary = useMemo(() => computeBalanceSummary(accounts), [accounts]);

  const handleAddAccount = (bankName: string, minBalance: number, currentBalance: number) => {
    const newAccount: BankAccount = {
      id: createAccountId(),
      bankName,
      minBalance,
      currentBalance,
    };
    setAccounts((prev) => [...prev, newAccount]);
    setPreviousAccountsSnapshot(null);
  };

  const handleUpdateAccount = (id: string, patch: Partial<Omit<BankAccount, 'id'>>) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== id) return acc;
        return {
          ...acc,
          ...patch,
        };
      }),
    );
    setPreviousAccountsSnapshot(null);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    setPreviousAccountsSnapshot(null);
  };

  const handleResetSample = () => {
    setAccounts(DEFAULT_SAMPLE_ACCOUNTS.map((acc) => ({ ...acc })));
    setPreviousAccountsSnapshot(null);
    setIsAddFormOpen(false);
  };

  const handleClearAll = () => {
    if (accounts.length === 0) return;
    setPreviousAccountsSnapshot(accounts.map((acc) => ({ ...acc })));
    setAccounts([]);
    setIsAddFormOpen(false);
  };

  const handleApplyTransfer = (transfer: TransferSuggestion) => {
    setPreviousAccountsSnapshot(accounts.map((acc) => ({ ...acc })));
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === transfer.fromAccountId) {
          return {
            ...acc,
            currentBalance: Math.max(0, roundMoney(acc.currentBalance - transfer.amount)),
          };
        }
        if (acc.id === transfer.toAccountId) {
          return {
            ...acc,
            currentBalance: roundMoney(acc.currentBalance + transfer.amount),
          };
        }
        return acc;
      }),
    );
  };

  const handleApplyAllTransfers = () => {
    if (summary.transfers.length === 0) return;
    setPreviousAccountsSnapshot(accounts.map((acc) => ({ ...acc })));

    const deltas = new Map<string, number>();
    for (const transfer of summary.transfers) {
      deltas.set(
        transfer.fromAccountId,
        roundMoney((deltas.get(transfer.fromAccountId) ?? 0) - transfer.amount),
      );
      deltas.set(
        transfer.toAccountId,
        roundMoney((deltas.get(transfer.toAccountId) ?? 0) + transfer.amount),
      );
    }

    setAccounts((prev) =>
      prev.map((acc) => {
        const delta = deltas.get(acc.id);
        if (!delta) return acc;
        return {
          ...acc,
          currentBalance: Math.max(0, roundMoney(acc.currentBalance + delta)),
        };
      }),
    );
  };

  const handleUndoSnapshot = () => {
    if (!previousAccountsSnapshot) return;
    setAccounts(previousAccountsSnapshot);
    setPreviousAccountsSnapshot(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#overview"
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            BalanceLedger
          </a>

          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#overview"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Overview
            </a>
            <a
              href="#accounts-ledger"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Accounts
            </a>
            <a
              href="#recommended-transfers"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Transfers
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsAddFormOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Account</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Workspace Toolbar */}
        <div
          id="overview"
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              Minimum Balance Rebalancer
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Track account minimums and rebalance surpluses to eliminate shortfalls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Configurable Currency Selector */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="currency-select" className="text-xs font-medium text-slate-500">
                Currency
              </label>
              <select
                id="currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="min-h-[36px] px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
              >
                {Object.values(CURRENCIES).map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleResetSample}
              className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sample</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              disabled={accounts.length === 0}
              className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-red-50 hover:text-red-700 hover:border-red-200 disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 transition-colors whitespace-nowrap shrink-0"
            >
              <Trash className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* 1-View Summary Metrics */}
        <SummaryStrip
          summary={summary}
          currency={currency}
          accountCount={accounts.length}
        />

        {/* Collapsible Add Account Form */}
        <AccountFormBar
          isOpen={isAddFormOpen}
          currency={currency}
          onAdd={handleAddAccount}
          onClose={() => setIsAddFormOpen(false)}
        />

        {/* Accounts & Transfers Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-7 min-w-0">
            <AccountsLedger
              accounts={accounts}
              currency={currency}
              onUpdateAccount={handleUpdateAccount}
              onDeleteAccount={handleDeleteAccount}
              onOpenAddForm={() => setIsAddFormOpen(true)}
              onResetSample={handleResetSample}
            />
          </div>

          <div className="xl:col-span-5 min-w-0">
            <TransferSuggestions
              summary={summary}
              currency={currency}
              accountCount={accounts.length}
              canUndo={previousAccountsSnapshot !== null}
              onApplyTransfer={handleApplyTransfer}
              onApplyAllTransfers={handleApplyAllTransfers}
              onUndoLastApply={handleUndoSnapshot}
            />
          </div>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
          <span>BalanceLedger — Stored locally in your browser via localStorage.</span>
          <span className="tabular-nums">
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} ·{' '}
            {CURRENCIES[currency].label}
          </span>
        </div>
      </footer>
    </div>
  );
}
