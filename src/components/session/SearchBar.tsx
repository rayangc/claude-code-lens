'use client';

import { useState, useCallback } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  matchCount?: number;
}

export function SearchBar({ onSearch, matchCount }: SearchBarProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(value);
    },
    [value, onSearch]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onSearch(newValue);
    },
    [onSearch]
  );

  return (
    <form onSubmit={handleSubmit} className="px-3 py-2">
      <div className="relative">
        <svg
          className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Search messages..."
          className="w-full bg-background border border-border rounded pl-7 pr-14 py-1.5
            text-[12px] text-foreground placeholder:text-text-tertiary
            focus:outline-none focus:border-accent-blue transition-colors duration-150"
        />
        {value && matchCount !== undefined && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary">
            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
          </span>
        )}
      </div>
    </form>
  );
}
