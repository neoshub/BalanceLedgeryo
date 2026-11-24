import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { BankAccount, CurrencyCode } from '../types/account';
import { computeAccountMetrics, formatCurrency } from '../utils/balanceEngine';
import { InlineCurrencyInput } from './InlineCurrencyInput';

type StatusFilter = 'all' | 'shortfall' | 'covered';
type SortMode = 'order' | 'shortfall-desc' | 'surplus-desc' | 'name-asc';

interface AccountsLedgerProps {
  accounts: BankAccount[];
  currency: CurrencyCode;
  onUpdateAccount: (id: string, patch: Partial<Omit<BankAccount, 'id'>>) => void;
  onDeleteAccount: (id: string) => void;
  onOpenAddForm: () => void;
  onResetSample: () => void;
}

export function AccountsLedger({
  accounts,
  currency,
  onUpdateAccount,
  onDeleteAccount,
  onOpenAddForm,
  onResetSample,
}: AccountsLedgerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('order');

  const computedRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const rows = accounts.map((acc) => computeAccountMetrics(acc)).filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (query && !item.account.bankName.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });

    if (sortMode === 'shortfall-desc') {
      return [...rows].sort(
        (a, b) => b.deficit - a.deficit || a.surplus - b.surplus || a.account.bankName.localeCompare(b.account.bankName),
      );
    }
    if (sortMode === 'surplus-desc') {
      return [...rows].sort(
        (a, b) => b.surplus - a.surplus || a.deficit - b.deficit || a.account.bankName.localeCompare(b.account.bankName),
      );
    }
    if (sortMode === 'name-asc') {
      return [...rows].sort((a, b) => a.account.bankName.localeCompare(b.account.bankName));
    }

    return rows;
  }, [accounts, searchQuery, statusFilter, sortMode]);

  const counts = useMemo(() => {
    let covered = 0;
    let shortfall = 0;
    for (const acc of accounts) {
      if (acc.currentBalance >= acc.minBalance) covered += 1;
      else shortfall += 1;
    }
    return { all: accounts.length, covered, shortfall };
  }, [accounts]);

  return (
    <section
      id="accounts-ledger"
      aria-label="Bank accounts ledger"
      className="bg-white border border-slate-200 rounded-lg overflow-hidden"
    >
      {/* Header & Filter Bar */}
      <div className="p-4 sm:px-5 sm:py-4 border-b border-slate-200 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Bank Accounts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any bank name or balance to edit inline. Totals recalculate immediately.
          </p>
        </div>

        {accounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial sm:w-48">
              <Search
                className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Filter bank accounts by name"
                placeholder="Filter banks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[36px] pl-8 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900"
              />
            </div>

            {/* Segmented Filter */}
            <div
              role="group"
              aria-label="Filter by account status"
              className="inline-flex items-center p-0.5 bg-slate-100 rounded-md border border-slate-200/80"
            >
              {(
                [
                  { id: 'all', label: `All (${counts.all})` },
                  { id: 'shortfall', label: `Shortfall (${counts.shortfall})` },
                  { id: 'covered', label: `Covered (${counts.covered})` },
                ] as const
              ).map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-[5px] transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Sort */}
            <select
              aria-label="Sort accounts"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="min-h-[36px] px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900"
            >
              <option value="order">Added Order</option>
              <option value="shortfall-desc">Highest Shortfall</option>
              <option value="surplus-desc">Highest Surplus</option>
              <option value="name-asc">Bank Name (A–Z)</option>
            </select>
          </div>
        )}
      </div>

      {/* Empty State: No accounts */}
      {accounts.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-semibold text-slate-900">No bank accounts tracked</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Add your bank accounts with their minimum balance requirements to calculate surpluses,
            shortfalls, and optimal internal transfers.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenAddForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Account</span>
            </button>
            <button
              type="button"
              onClick={onResetSample}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load Sample Data</span>
            </button>
          </div>
        </div>
      ) : computedRows.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-900">No matching bank accounts</p>
          <p className="text-xs text-slate-500 mt-1">
            Adjust your filter or search query to view all tracked accounts.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="mt-4 inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop High-Density Ledger Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-2.5 px-5 font-medium">Bank Account</th>
                  <th className="py-2.5 px-3 font-medium text-right w-44">Current Balance</th>
                  <th className="py-2.5 px-3 font-medium text-right w-44">Minimum Required</th>
                  <th className="py-2.5 px-4 font-medium text-right w-40">Surplus / Deficit</th>
                  <th className="py-2.5 px-4 font-medium w-32">Status</th>
                  <th className="py-2.5 pr-4 pl-2 font-medium text-right w-14">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {computedRows.map(({ account, surplus, deficit, status }) => {
                  const isShortfall = status === 'shortfall';
                  const deltaText = isShortfall
                    ? `-${formatCurrency(deficit, currency)}`
                    : surplus > 0
                      ? `+${formatCurrency(surplus, currency)}`
                      : formatCurrency(0, currency);

                  return (
                    <tr
                      key={account.id}
                      className="group hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Bank Name (Inline Editable) */}
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          aria-label={`Bank name for ${account.bankName}`}
                          value={account.bankName}
                          onChange={(e) =>
                            onUpdateAccount(account.id, { bankName: e.target.value })
                          }
                          onBlur={(e) => {
                            if (!e.target.value.trim()) {
                              onUpdateAccount(account.id, { bankName: 'Unnamed Bank' });
                            }
                          }}
                          className="w-full min-h-[38px] px-2 py-1.5 text-sm font-medium text-slate-900 bg-transparent border border-transparent rounded-md hover:border-slate-300 hover:bg-white focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-colors"
                        />
                      </td>

                      {/* Current Balance (Inline Editable) */}
                      <td className="py-2 px-2">
                        <InlineCurrencyInput
                          value={account.currentBalance}
                          currency={currency}
                          ariaLabel={`Current balance for ${account.bankName}`}
                          onChange={(nextVal) =>
                            onUpdateAccount(account.id, { currentBalance: nextVal })
                          }
                        />
                      </td>

                      {/* Minimum Required (Inline Editable) */}
                      <td className="py-2 px-2">
                        <InlineCurrencyInput
                          value={account.minBalance}
                          currency={currency}
                          ariaLabel={`Minimum balance for ${account.bankName}`}
                          onChange={(nextVal) =>
                            onUpdateAccount(account.id, { minBalance: nextVal })
                          }
                        />
                      </td>

                      {/* Surplus / Deficit */}
                      <td className="py-2 px-4 text-right">
                        <span
                          className={`font-mono text-sm font-medium tabular-nums ${
                            isShortfall
                              ? 'text-red-600'
                              : surplus > 0
                                ? 'text-emerald-600'
                                : 'text-slate-500'
                          }`}
                        >
                          {deltaText}
                        </span>
                      </td>

                      {/* Status Indicator (Unboxed semantic icon + text, zero pills) */}
                      <td className="py-2 px-4">
                        {isShortfall ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 whitespace-nowrap">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>Shortfall</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>Covered</span>
                          </span>
                        )}
                      </td>

                      {/* Delete */}
                      <td className="py-2 pr-4 pl-2 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteAccount(account.id)}
                          aria-label={`Delete ${account.bankName}`}
                          title={`Delete ${account.bankName}`}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Ledger List */}
          <div className="md:hidden divide-y divide-slate-200">
            {computedRows.map(({ account, surplus, deficit, status }) => {
              const isShortfall = status === 'shortfall';
              const deltaText = isShortfall
                ? `Shortfall ${formatCurrency(deficit, currency)}`
                : surplus > 0
                  ? `Surplus +${formatCurrency(surplus, currency)}`
                  : 'Exact match';

              return (
                <div key={account.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      aria-label={`Bank name for ${account.bankName}`}
                      value={account.bankName}
                      onChange={(e) =>
                        onUpdateAccount(account.id, { bankName: e.target.value })
                      }
                      onBlur={(e) => {
                        if (!e.target.value.trim()) {
                          onUpdateAccount(account.id, { bankName: 'Unnamed Bank' });
                        }
                      }}
                      className="flex-1 min-w-0 min-h-[40px] px-2 py-1 text-sm font-semibold text-slate-900 bg-transparent border border-transparent rounded-md focus:bg-white focus:border-slate-900 focus:outline-none"
                    />

                    <div className="flex items-center gap-2 shrink-0">
                      {isShortfall ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 whitespace-nowrap">
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Shortfall</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Covered</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteAccount(account.id)}
                        aria-label={`Delete ${account.bankName}`}
                        className="inline-flex items-center justify-center w-11 h-11 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-xs text-slate-500 mb-1">Current Balance</span>
                      <div className="border border-slate-200 rounded-md bg-slate-50/50">
                        <InlineCurrencyInput
                          value={account.currentBalance}
                          currency={currency}
                          ariaLabel={`Current balance for ${account.bankName}`}
                          onChange={(nextVal) =>
                            onUpdateAccount(account.id, { currentBalance: nextVal })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500 mb-1">Minimum Required</span>
                      <div className="border border-slate-200 rounded-md bg-slate-50/50">
                        <InlineCurrencyInput
                          value={account.minBalance}
                          currency={currency}
                          ariaLabel={`Minimum balance for ${account.bankName}`}
                          onChange={(nextVal) =>
                            onUpdateAccount(account.id, { minBalance: nextVal })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-500">Net Position</span>
                    <span
                      className={`font-mono font-medium tabular-nums ${
                        isShortfall
                          ? 'text-red-600'
                          : surplus > 0
                            ? 'text-emerald-600'
                            : 'text-slate-600'
                      }`}
                    >
                      {deltaText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
