'use client';

import { useState } from 'react';

export type DateRange = 'today' | '7d' | '30d' | 'all';

interface FilterToggleProps {
  onChange: (range: DateRange) => void;
}

const options: { label: string; value: DateRange }[] = [
  { label: 'Today', value: 'today' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: 'All', value: 'all' },
];

export function FilterToggle({ onChange }: FilterToggleProps) {
  const [active, setActive] = useState<DateRange>('all');

  return (
    <div className="flex gap-1">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => {
            setActive(opt.value);
            onChange(opt.value);
          }}
          className={`px-3 py-1 text-xs rounded-full transition-all duration-150 cursor-pointer ${
            active === opt.value
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
              : 'text-text-secondary hover:text-text-primary border border-transparent hover:border-border'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
