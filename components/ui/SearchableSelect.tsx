'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  subtext?: string;
}

export interface SearchableSelectProps {
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  className?: string;
}

const normalizeText = (str: string) =>
  (str || '').trim().replace(/\s+/g, ' ').toLowerCase();

export default function SearchableSelect({
  label,
  required,
  disabled,
  placeholder = 'Select an option...',
  options,
  value,
  onChange,
  error,
  helperText,
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(
    (opt) =>
      opt.value === value ||
      normalizeText(opt.value) === normalizeText(value) ||
      normalizeText(opt.label) === normalizeText(value)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const cleanQuery = normalizeText(searchQuery);

  const filteredOptions = options.filter((opt) => {
    if (!cleanQuery) return true;
    const normLabel = normalizeText(opt.label);
    const normValue = normalizeText(opt.value);
    const normSubtext = opt.subtext ? normalizeText(opt.subtext) : '';

    return (
      normLabel.includes(cleanQuery) ||
      normValue.includes(cleanQuery) ||
      normSubtext.includes(cleanQuery)
    );
  });

  const hasExactMatch = options.some(
    (opt) =>
      normalizeText(opt.label) === cleanQuery ||
      normalizeText(opt.value) === cleanQuery
  );

  const rawSearchTrimmed = searchQuery.trim().replace(/\s+/g, ' ');

  const displayOptions = [...filteredOptions];
  if (rawSearchTrimmed && !hasExactMatch) {
    displayOptions.unshift({
      value: rawSearchTrimmed,
      label: rawSearchTrimmed,
      subtext: 'Select searched city',
    });
  }

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`w-full text-left relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Main Select Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm sm:text-xs rounded-xl border transition-all bg-white text-slate-900 shadow-xs ${
          error
            ? 'border-red-300 ring-1 ring-red-400 bg-red-50/20'
            : isOpen
            ? 'border-[#1264D6] ring-2 ring-blue-500/20'
            : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'bg-slate-100 opacity-60 cursor-not-allowed text-slate-400' : 'cursor-pointer'}`}
      >
        <span className="truncate">
          {selectedOption ? (
            <span className="font-semibold text-slate-900">
              {selectedOption.label}{' '}
              {selectedOption.subtext && (
                <span className="text-slate-400 font-normal">({selectedOption.subtext})</span>
              )}
            </span>
          ) : value ? (
            <span className="font-semibold text-slate-900">{value}</span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Search & Options Dropdown Popover */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Bar */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs py-1.5 text-slate-900 outline-none placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
            {displayOptions.length > 0 ? (
              displayOptions.map((opt) => {
                const isSelected =
                  opt.value === value ||
                  normalizeText(opt.value) === normalizeText(value) ||
                  normalizeText(opt.label) === normalizeText(value);

                return (
                  <button
                    key={`${opt.value}-${opt.label}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(opt.value);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleSelect(opt.value);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelect(opt.value);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors select-none active:scale-[0.99] cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-[#1264D6] font-bold'
                        : 'text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <span className="truncate">
                      {opt.label}{' '}
                      {opt.subtext && (
                        <span className="text-slate-400 font-normal">({opt.subtext})</span>
                      )}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-[#1264D6] shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                No matching options found
              </div>
            )}
          </div>
        </div>
      )}

      {error ? (
        <p className="text-[11px] text-red-600 mt-1 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
