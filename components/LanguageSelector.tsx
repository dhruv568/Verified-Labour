'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Locale } from '@/lib/translations';

interface LanguageSelectorProps {
  className?: string;
  isMobile?: boolean;
}

export default function LanguageSelector({
  className = '',
  isMobile = false,
}: LanguageSelectorProps) {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const languages: { code: Locale; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  ];

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  if (isMobile) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-between min-h-[44px] px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#1264D6] shrink-0" />
            <span className="text-xs font-bold text-slate-700">Language / भाषा:</span>
          </div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            {languages.map((lang) => {
              const isSelected = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLocale(lang.code)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#1264D6] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{lang.nativeName}</span>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Header Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-xs transition-colors cursor-pointer select-none"
        title="Change Language / भाषा बदलें"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-[#1264D6] shrink-0" />
        <span className="font-semibold text-slate-800">
          {currentLang.code === 'hi' ? 'हिन्दी' : 'English'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 text-xs z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
          <div className="px-3 py-1.5 mb-1 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Select Language</span>
            <Globe className="w-3 h-3 text-slate-400" />
          </div>

          {languages.map((lang) => {
            const isSelected = locale === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLocale(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                  isSelected
                    ? 'bg-emerald-50 text-[#0B9B5A] font-bold border border-emerald-100'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{lang.name}</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({lang.nativeName})
                  </span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#0B9B5A] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
