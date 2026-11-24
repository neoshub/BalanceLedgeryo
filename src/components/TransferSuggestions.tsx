import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import type { BalanceSummary, CurrencyCode, TransferSuggestion } from '../types/account';
import { formatCurrency } from '../utils/balanceEngine';

interface TransferSuggestionsProps {
  summary: BalanceSummary;
  currency: CurrencyCode;
  accountCount: number;
  canUndo: boolean;
  onApplyTransfer: (transfer: TransferSuggestion) => void;
  onApplyAllTransfers: () => void;
  onUndoLastApply: () => void;
}

export function TransferSuggestions({
  summary,
  currency,
  accountCount,
  canUndo,
  onApplyTransfer,
  onApplyAllTransfers,
  onUndoLastApply,
}: TransferSuggestionsProps) {
  const {
    transfers,
    uncoveredShortfalls,
    totalShortfall,
    totalSurplus,
    netExternalNeeded,
  } = summary;

  const allBalanced = accountCount > 0 && totalShortfall === 0;
  const hasUncovered = totalShortfall > totalSurplus && uncoveredShortfalls.length > 0;

  return (
    <section
      id="recommended-transfers"
      aria-label="Recommended internal transfers"
      className="bg-white border border-slate-200 rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 sm:px-5 sm:py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Recommended Transfers</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Greedy surplus-to-deficit matching updates live as balances change.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canUndo && (
            <button
              type="button"
              onClick={onUndoLastApply}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo Apply</span>
            </button>
          )}
          {transfers.length > 0 && (
            <button
              type="button"
              onClick={onApplyAllTransfers}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Apply All ({transfers.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {accountCount === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            Add at least two bank accounts to see internal rebalancing recommendations.
          </p>
        ) : allBalanced ? (
          <div className="flex items-start gap-3 p-4 rounded-md bg-emerald-50/70 border border-emerald-200 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">
                All accounts meet minimum balance requirements
              </p>
              <p className="text-xs text-emerald-800/80 mt-0.5">
                No internal transfers or external deposits are needed right now.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Transfer Action List */}
            {transfers.length > 0 ? (
              <ul className="divide-y divide-slate-200 border border-slate-200 rounded-md">
                {transfers.map((transfer, index) => (
                  <li
                    key={transfer.id}
                    className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-slate-400 tabular-nums shrink-0 mt-0.5 sm:mt-0">
                        {String(index + 1).padStart(2, '0')}.
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-800">
                          Transfer{' '}
                          <span className="font-mono font-semibold text-slate-900 tabular-nums">
                            {formatCurrency(transfer.amount, currency)}
                          </span>{' '}
                          from{' '}
                          <span className="font-semibold text-slate-900">
                            {transfer.fromBankName}
                          </span>{' '}
                          to{' '}
                          <span className="font-semibold text-slate-900">
                            {transfer.toBankName}
                          </span>
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="truncate max-w-[140px]">{transfer.fromBankName}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                          <span className="truncate max-w-[140px]">{transfer.toBankName}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onApplyTransfer(transfer)}
                      className="self-start sm:self-center inline-flex items-center justify-center min-h-[34px] px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors whitespace-nowrap shrink-0"
                    >
                      Apply Transfer
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
                No internal transfers are possible because no tracked accounts currently have a surplus.
              </div>
            )}

            {/* Uncovered Shortfall Alert when Total Shortfall > Total Available Surplus */}
            {hasUncovered && (
              <div
                role="alert"
                className="p-4 rounded-md bg-red-50/60 border border-red-200 space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle
                    className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      Internal surplus is insufficient —{' '}
                      <span className="font-mono tabular-nums">
                        {formatCurrency(netExternalNeeded, currency)}
                      </span>{' '}
                      external funding required
                    </p>
                    <p className="text-xs text-red-800/80 mt-0.5">
                      After applying all internal transfers above, these accounts still remain below
                      their minimum balance:
                    </p>
                  </div>
                </div>

                <ul className="divide-y divide-red-200/70 border border-red-200 rounded-md bg-white">
                  {uncoveredShortfalls.map((item) => (
                    <li
                      key={item.accountId}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900">{item.bankName}</span>
                        {item.coveredByTransfers > 0 && (
                          <span className="text-slate-500 ml-2">
                            (covered {formatCurrency(item.coveredByTransfers, currency)} internally)
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-semibold text-red-600 tabular-nums whitespace-nowrap shrink-0">
                        Short by {formatCurrency(item.remainingDeficit, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
