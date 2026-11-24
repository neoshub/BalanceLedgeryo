import { useEffect, useState } from 'react';
import type { CurrencyCode } from '../types/account';
import { CURRENCIES, roundMoney } from '../utils/balanceEngine';

interface InlineCurrencyInputProps {
  value: number;
  currency: CurrencyCode;
  ariaLabel: string;
  onChange: (nextValue: number) => void;
  className?: string;
}

export function InlineCurrencyInput({
  value,
  currency,
  ariaLabel,
  onChange,
  className = '',
}: InlineCurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState(() => String(value));

  useEffect(() => {
    if (!isFocused) {
      setDraft(String(value));
    }
  }, [value, isFocused]);

  const symbol = CURRENCIES[currency].symbol;

  const handleChange = (raw: string) => {
    // Allow empty string or numeric characters with optional single decimal point
    const sanitized = raw.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    const normalized =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;

    setDraft(normalized);

    if (normalized === '' || normalized === '.') {
      onChange(0);
      return;
    }

    const parsed = Number.parseFloat(normalized);
    if (Number.isFinite(parsed) && parsed >= 0) {
      onChange(roundMoney(parsed));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = Number.parseFloat(draft);
    const cleanValue = Number.isFinite(parsed) && parsed >= 0 ? roundMoney(parsed) : 0;
    setDraft(String(cleanValue));
    onChange(cleanValue);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <span
        className="pointer-events-none absolute left-2.5 text-xs font-mono text-slate-400 select-none"
        aria-hidden="true"
      >
        {symbol}
      </span>
      <input
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        value={draft}
        onFocus={(e) => {
          setIsFocused(true);
          e.currentTarget.select();
        }}
        onBlur={handleBlur}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full min-h-[38px] pl-6 pr-2.5 py-1.5 text-right font-mono text-sm tabular-nums text-slate-900 bg-transparent border border-transparent rounded-md hover:border-slate-300 hover:bg-slate-50/70 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-colors"
      />
    </div>
  );
}
