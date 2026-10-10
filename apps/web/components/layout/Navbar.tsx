"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, X, Search, Bookmark, User, LogOut, PlusCircle, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/hooks/useAuth";
import { clsx } from "clsx";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { LocationIndicator } from "@/components/layout/LocationIndicator";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const logout = useLogout();
  const { t } = useTranslation();

  const navLinks = [
    { href: "/events", label: t("nav.events") },
    { href: "/categories", label: t("nav.categories") },
    { href: "/organizers", label: t("nav.organizers") },
    { href: "/dastarkhwan", label: t("nav.dastarkhwan") },
    { href: "/imambargahs", label: t("nav.imambargahs") },
    { href: "/places", label: t("nav.places") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-slate-200">
      <div className="container-page">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-gold-500 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-sm">CE</span>
            </div>
            <span className="font-bold text-slate-900 hidden sm:block">
              Community<span className="text-brand-600">Events</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="btn-ghost text-sm">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <LocationIndicator variant="compact" />
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            <Link href="/events?search=" className="btn-ghost p-2" aria-label={t("nav.search")}>
              <Search size={18} />
            </Link>

            <NotificationBell />

            {isAuthenticated ? (
              <>
                <Link href="/events/create" className="btn-primary hidden sm:inline-flex py-2 px-4 text-xs">
                  <PlusCircle size={15} />
                  {t("nav.addEvent")}
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
                    aria-label="User menu"
                    id="user-menu-button"
                  >
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-11 w-52 card-glass py-2 shadow-2xl animate-scale-in">
                      <div className="px-4 py-2 border-b border-slate-200">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>

                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <User size={15} /> {t("nav.profile")}
                      </Link>

                      <Link href="/saved" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <Bookmark size={15} /> {t("nav.savedEvents")}
                      </Link>

                      <Link href="/profile/events" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard size={15} /> {t("nav.myEvents")}
                      </Link>

                      {user?.role === "ADMIN" && (
                        <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-brand-700 hover:text-brand-800 hover:bg-slate-100 transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <LayoutDashboard size={15} /> {t("nav.adminPanel")}
                        </Link>
                      )}

                      <div className="border-t border-slate-200 mt-1 pt-1">
                        <button
                          onClick={() => { logout.mutate(); setUserMenuOpen(false); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-slate-100 transition-colors"
                          id="logout-button"
                        >
                          <LogOut size={15} /> {t("nav.signOut")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-ghost text-sm hidden sm:inline-flex">{t("nav.signIn")}</Link>
                <Link href="/register" className="btn-primary py-2 px-4 text-sm">{t("nav.getStarted")}</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="btn-ghost p-2 md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle mobile menu"
              id="mobile-menu-button"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 py-3 space-y-1 animate-slide-up">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="block px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link href="/events/create" className="block px-3 py-2 text-sm text-brand-600 font-medium hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setMobileOpen(false)}>
                + {t("nav.addEvent")}
              </Link>
            )}
            {isAuthenticated && (
              <Link href="/saved" className="block px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setMobileOpen(false)}>
                {t("nav.savedEvents")}
              </Link>
            )}
            <div className="pt-2 border-t border-slate-200 mt-2 flex items-center justify-between gap-2">
              <span className="text-xs">
                <LocationIndicator variant="full" />
              </span>
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
