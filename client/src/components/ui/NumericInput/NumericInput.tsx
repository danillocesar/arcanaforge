import { useState, useEffect, useRef } from 'react';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  fallback?: number;
}

export default function NumericInput({ value, onChange, min, max, fallback = 0, ...rest }: NumericInputProps) {
  const [draft, setDraft] = useState<string>(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setDraft(String(value));
    }
  }, [value]);

  const normalize = (raw: string): number => {
    const n = Number(raw);
    if (raw === '' || isNaN(n)) return fallback;
    let result = n;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    return result;
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        const n = Number(raw);
        if (raw !== '' && !isNaN(n)) {
          onChange(normalize(raw));
        }
      }}
      onFocus={(e) => {
        focused.current = true;
        e.target.select();
      }}
      onBlur={(e) => {
        focused.current = false;
        const final = normalize(e.target.value);
        setDraft(String(final));
        onChange(final);
      }}
      {...rest}
    />
  );
}
