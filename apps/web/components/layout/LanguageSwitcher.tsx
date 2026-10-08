"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { LANGUAGES, type LanguageCode } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const current =
    LANGUAGES.find((l) => i18n.language.startsWith(l.code)) ?? LANGUAGES[0];

  const changeLanguage = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost p-2 gap-1.5"
        aria-label={t("nav.language")}
        aria-haspopup="listbox"
        aria-expanded={open}
        id="language-switcher-button"
        title={t("nav.language")}
      >
        <Globe size={18} />
        <span className="hidden lg:inline text-xs font-medium">{current.flag}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 w-44 card-glass py-1.5 shadow-2xl animate-scale-in z-50"
          role="listbox"
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {t("nav.language")}
          </p>
          {LANGUAGES.map((lang) => {
            const active = lang.code === current.code;
            return (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                role="option"
                aria-selected={active}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
                  active
                    ? "text-brand-700 bg-brand-500/10"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`}
                id={`language-option-${lang.code}`}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.native}</span>
                {active && <Check size={14} className="text-brand-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
