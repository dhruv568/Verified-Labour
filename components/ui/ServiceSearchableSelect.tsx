'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check, Tag } from 'lucide-react';
import { getServiceHindiName } from '@/lib/service-translations';

export interface ServiceItem {
  id: string;
  name: string;
  nameHi?: string | null;
  slug: string;
  basePrice?: number;
  priceUnit?: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    nameHi?: string | null;
    slug: string;
  };
}

export interface ServiceSearchableSelectProps {
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  services: ServiceItem[];
  value: string; // selectedServiceId
  onChange: (serviceId: string, service: ServiceItem) => void;
  error?: string | null;
  helperText?: string;
  className?: string;
}

const normalize = (str: string) => (str || '').trim().toLowerCase();

export default function ServiceSearchableSelect({
  label = 'विशिष्ट कार्य / सेवा / Select Specific Work / Service',
  required = true,
  disabled = false,
  placeholder = 'सेवा चुनें / Select Service...',
  services,
  value,
  onChange,
  error,
  helperText,
  className = '',
}: ServiceSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Deduplicate & prepare formatted list of active services
  const formattedServices = useMemo(() => {
    const seenIds = new Set<string>();
    const list: Array<{
      service: ServiceItem;
      indexNumber: number;
      hindiName: string;
      englishName: string;
      displayLabel: string;
      formattedOptionText: string;
      priceText: string;
    }> = [];

    let count = 0;
    for (const svc of services) {
      if (!svc || !svc.id || seenIds.has(svc.id)) continue;
      seenIds.add(svc.id);
      count++;

      const hindiName = getServiceHindiName(svc);
      const englishName = svc.name;
      const formattedOptionText = `${count}. ${hindiName} / ${englishName}`;

      list.push({
        service: svc,
        indexNumber: count,
        hindiName,
        englishName,
        displayLabel: formattedOptionText,
        formattedOptionText,
        priceText: svc.basePrice ? `₹${svc.basePrice} (${svc.priceUnit || 'per job'})` : '',
      });
    }

    return list;
  }, [services]);

  // Selected item
  const selectedItem = useMemo(() => {
    return formattedServices.find((item) => item.service.id === value);
  }, [formattedServices, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter services based on search query (Hindi name, English name, index number, category)
  const filteredServices = useMemo(() => {
    const q = normalize(searchQuery);
    if (!q) return formattedServices;

    return formattedServices.filter((item) => {
      const idxStr = String(item.indexNumber);
      const hName = normalize(item.hindiName);
      const eName = normalize(item.englishName);
      const combined = normalize(item.formattedOptionText);
      const catName = item.service.category ? normalize(item.service.category.name) : '';
      const catNameHi = item.service.category?.nameHi ? normalize(item.service.category.nameHi) : '';

      return (
        idxStr === q ||
        idxStr.startsWith(q) ||
        hName.includes(q) ||
        eName.includes(q) ||
        combined.includes(q) ||
        catName.includes(q) ||
        catNameHi.includes(q)
      );
    });
  }, [formattedServices, searchQuery]);

  const handleSelect = (item: typeof formattedServices[0]) => {
    onChange(item.service.id, item.service);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`w-full text-left relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-3 sm:py-2.5 rounded-xl border text-left transition-all bg-white text-slate-900 shadow-xs min-h-[44px] ${
          error
            ? 'border-red-300 ring-1 ring-red-400 bg-red-50/20'
            : isOpen
            ? 'border-brand-600 ring-2 ring-brand-500/20'
            : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'bg-slate-100 opacity-60 cursor-not-allowed text-slate-400' : 'cursor-pointer'}`}
      >
        <div className="truncate pr-2 flex-1">
          {selectedItem ? (
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-xs truncate font-devanagari">
                {selectedItem.formattedOptionText}
              </span>
              {selectedItem.priceText && (
                <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200 shrink-0 hidden min-[400px]:inline-block">
                  {selectedItem.priceText}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 text-sm sm:text-xs font-medium font-devanagari">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Searchable Dropdown Popover */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 left-0 right-0 max-w-full">
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/90 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="हिंदी या English नाम से खोजें / Search service by Hindi or English name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm sm:text-xs py-1 text-slate-900 outline-none placeholder:text-slate-400 font-medium font-devanagari"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Counter Banner */}
          <div className="px-3.5 py-1.5 bg-brand-50/60 border-b border-brand-100/60 flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>
              कुल {formattedServices.length} सेवाएं उपलब्ध हैं / Total {formattedServices.length} Services
            </span>
            {searchQuery && (
              <span className="font-bold text-brand-700">
                {filteredServices.length} परिणाम मिले
              </span>
            )}
          </div>

          {/* Options Scrollable Container */}
          <div className="max-h-60 sm:max-h-72 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            {filteredServices.length > 0 ? (
              filteredServices.map((item) => {
                const isSelected = item.service.id === value;

                return (
                  <button
                    key={item.service.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm sm:text-xs flex items-center justify-between transition-all select-none active:scale-[0.99] cursor-pointer gap-2 ${
                      isSelected
                        ? 'bg-brand-50 text-brand-900 font-bold border border-brand-200'
                        : 'text-slate-800 hover:bg-slate-100 font-medium border border-transparent'
                    }`}
                  >
                    <div className="flex-1 truncate">
                      <div className="font-bold text-slate-900 text-sm sm:text-xs truncate font-devanagari flex items-center gap-1.5">
                        <span className="text-brand-600 font-mono font-bold shrink-0">
                          {item.indexNumber}.
                        </span>
                        <span className="truncate">
                          {item.hindiName}{' '}
                          <span className="text-slate-500 font-normal">/ {item.englishName}</span>
                        </span>
                      </div>
                      {item.service.category && (
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate pl-4">
                          {item.service.category.nameHi || item.service.category.name}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.priceText && (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.priceText}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 font-medium font-devanagari">
                कोई मिलान सेवा नहीं मिली / No matching service found for &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      )}

      {error ? (
        <p className="text-[11px] text-red-600 mt-1 font-medium font-devanagari">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 mt-1 font-devanagari">{helperText}</p>
      ) : null}
    </div>
  );
}
