import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CurrencyCode } from '../types/account';
import { CURRENCIES, roundMoney } from '../utils/balanceEngine';

interface AccountFormBarProps {
  isOpen: boolean;
  currency: CurrencyCode;
  onAdd: (bankName: string, minBalance: number, currentBalance: number) => void;
  onClose: () => void;
}

export function AccountFormBar({ isOpen, currency, onAdd, onClose }: AccountFormBarProps) {
  const [bankName, setBankName] = useState('');
  const [minBalance, setMinBalance] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [error, setError] = useState<string | null>(null);
  const bankInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      requestAnimationFrame(() => {
        bankInputRef.current?.focus();
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const symbol = CURRENCIES[currency].symbol;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = bankName.trim();
    if (!trimmedName) {
      setError('Enter a bank or account name.');
      bankInputRef.current?.focus();
      return;
    }

    const parsedMin = minBalance.trim() === '' ? 0 : Number.parseFloat(minBalance);
    const parsedCur = currentBalance.trim() === '' ? 0 : Number.parseFloat(currentBalance);

    if (!Number.isFinite(parsedMin) || parsedMin < 0) {
      setError('Minimum balance must be 0 or higher.');
      return;
    }
    if (!Number.isFinite(parsedCur) || parsedCur < 0) {
      setError('Current balance must be 0 or higher.');
      return;
    }

    onAdd(trimmedName, roundMoney(parsedMin), roundMoney(parsedCur));
    setBankName('');
    setMinBalance('');
    setCurrentBalance('');
    setError(null);
    onClose();
  };

  return (
    <section
      aria-label="Add new bank account"
      className="bg-white border border-slate-300 rounded-lg p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-sm font-semibold text-slate-900">Add Bank Account</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close add account form"
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-5">
          <label htmlFor="new-bank-name" className="block text-xs font-medium text-slate-600 mb-1.5">
            Bank Name
          </label>
          <input
            ref={bankInputRef}
            id="new-bank-name"
            type="text"
            placeholder="e.g., SBI, Federal Bank, Chase"
            value={bankName}
            onChange={(e) => {
              setBankName(e.target.value);
              if (error) setError(null);
            }}
            className="w-full min-h-[40px] px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="new-min-balance" className="block text-xs font-medium text-slate-600 mb-1.5">
            Minimum Required
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 text-xs font-mono text-slate-400">
              {symbol}
            </span>
            <input
              id="new-min-balance"
              type="number"
              min="0"
              step="any"
              placeholder="25000"
              value={minBalance}
              onChange={(e) => {
                setMinBalance(e.target.value);
                if (error) setError(null);
              }}
              className="w-full min-h-[40px] pl-7 pr-3 py-2 text-right font-mono text-sm tabular-nums text-slate-900 bg-white border border-slate-300 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="new-cur-balance" className="block text-xs font-medium text-slate-600 mb-1.5">
            Current Balance
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 text-xs font-mono text-slate-400">
              {symbol}
            </span>
            <input
              id="new-cur-balance"
              type="number"
              min="0"
              step="any"
              placeholder="30000"
              value={currentBalance}
              onChange={(e) => {
                setCurrentBalance(e.target.value);
                if (error) setError(null);
              }}
              className="w-full min-h-[40px] pl-7 pr-3 py-2 text-right font-mono text-sm tabular-nums text-slate-900 bg-white border border-slate-300 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        </div>

        <div className="sm:col-span-2 flex items-center gap-2">
          <button
            type="submit"
            className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-2.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
