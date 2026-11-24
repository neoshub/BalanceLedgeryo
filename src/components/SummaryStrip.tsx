import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { BalanceSummary, CurrencyCode } from '../types/account';
import { formatCurrency } from '../utils/balanceEngine';

interface SummaryStripProps {
  summary: BalanceSummary;
  currency: CurrencyCode;
  accountCount: number;
}

export function SummaryStrip({ summary, currency, accountCount }: SummaryStripProps) {
  const hasExternalNeed = summary.netExternalNeeded > 0;
  const allCovered = accountCount > 0 && summary.totalShortfall === 0;

  return (
    <section aria-label="Global balance summary" className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        {/* 1. Total Current Balance */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Total Current Balance</span>
            <span className="text-xs text-slate-400 tabular-nums">
              {accountCount} {accountCount === 1 ? 'account' : 'accounts'}
            </span>
          </div>
          <div className="font-mono text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatCurrency(summary.totalCurrent, currency)}
          </div>
        </div>

        {/* 2. Total Minimum Required */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2 border-t sm:border-t-0 border-slate-200">
          <span className="text-xs font-medium text-slate-500">Total Minimum Required</span>
          <div className="font-mono text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatCurrency(summary.totalMinimum, currency)}
          </div>
        </div>

        {/* 3. Total Shortfall (Deficit) */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2 border-t lg:border-t-0 border-slate-200">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Total Shortfall</span>
            <span className="text-xs text-slate-500 tabular-nums">
              {summary.shortfallCount} under
            </span>
          </div>
          <div
            className={`font-mono text-2xl font-semibold tracking-tight tabular-nums ${
              summary.totalShortfall > 0 ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {formatCurrency(summary.totalShortfall, currency)}
          </div>
        </div>

        {/* 4. Total Available Surplus */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2 border-t lg:border-t-0 border-slate-200">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Total Available Surplus</span>
            <span className="text-xs text-slate-500 tabular-nums">
              {summary.coveredCount} covered
            </span>
          </div>
          <div
            className={`font-mono text-2xl font-semibold tracking-tight tabular-nums ${
              summary.totalSurplus > 0 ? 'text-emerald-600' : 'text-slate-900'
            }`}
          >
            {formatCurrency(summary.totalSurplus, currency)}
          </div>
        </div>

        {/* 5. Net External Funds Needed */}
        <div className="p-4 sm:p-5 sm:col-span-2 lg:col-span-1 flex flex-col justify-between gap-2 border-t lg:border-t-0 border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600">Net External Funds Needed</span>
            {hasExternalNeed ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
            ) : allCovered ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
            ) : null}
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`font-mono text-2xl font-semibold tracking-tight tabular-nums ${
                hasExternalNeed
                  ? 'text-amber-700'
                  : accountCount > 0
                    ? 'text-emerald-600'
                    : 'text-slate-900'
              }`}
            >
              {formatCurrency(summary.netExternalNeeded, currency)}
            </span>
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
              {accountCount === 0
                ? 'No accounts'
                : hasExternalNeed
                  ? 'Deposit required'
                  : 'Self-balanced'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
