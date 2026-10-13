"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Menu, X, Search, Bookmark, User, LogOut, PlusCircle, LayoutDashboard,
  ChevronDown, Soup, Landmark, MapPin, Star, Ticket, Sparkles, Compass
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/hooks/useAuth";
import { clsx } from "clsx";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { LocationIndicator } from "@/components/layout/LocationIndicator";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dirsOpen, setDirsOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const logout = useLogout();
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const dirsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const primaryLinks = [
    { href: "/events", label: t("nav.events") },
    { href: "/categories", label: t("nav.categories") },
    { href: "/cities", label: t("nav.cities") },
    { href: "/organizers", label: t("nav.organizers") },
  ];

  const directoryLinks = [
    {
      href: "/dastarkhwan",
      label: t("nav.dastarkhwan"),
      desc: "Free food points & langar",
      icon: Soup,
      badge: "Langar",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      href: "/darbars",
      label: t("nav.darbars"),
      desc: "Sufi shrines & Urs calendar",
      icon: Star,
      badge: "Urs",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      href: "/imambargahs",
      label: t("nav.imambargahs"),
      desc: "Karbalas & heritage centers",
      icon: Landmark,
      badge: "Heritage",
      badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
    },
    {
      href: "/places",
      label: t("nav.places"),
      desc: "Sacred & historical places",
      icon: MapPin,
      badge: "Places",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      href: "/melas",
      label: t("nav.melas"),
      desc: "Folk fairs & Auqaf urs dates",
      icon: Ticket,
      badge: "Auqaf",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const dirsActive = directoryLinks.some((l) => isActive(l.href));

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setDirsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!dirsOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (dirsRef.current && !dirsRef.current.contains(e.target as Node)) {
        setDirsOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDirsOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [dirsOpen]);

  // "/" focuses the navbar search pill (when visible on this viewport)
  useEffect(() => {
    const onSlash = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)
      )
        return;
      const input = searchInputRef.current;
      if (input && input.offsetParent !== null) {
        e.preventDefault();
        input.focus();
      }
    };
    document.addEventListener("keydown", onSlash);
    return () => document.removeEventListener("keydown", onSlash);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-950/10 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors">
      <div className="container-page">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand Emblem */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-800 via-brand-700 to-teal-800 p-0.5 shadow-sm group-hover:shadow-md transition-shadow">
              <div className="w-full h-full rounded-[10px] bg-emerald-950/40 flex items-center justify-center border border-amber-400/30">
                {/* Cultural Geometric Star Icon */}
                <svg
                  className="w-5 h-5 text-amber-300 drop-shadow-xs"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 tracking-tight text-base leading-none">
                Community<span className="text-brand-600">Events</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase mt-0.5">
                Pakistan & Global Hub
              </span>
            </div>
          </Link>

          {/* Desktop Nav: primary links + Directories dropdown */}
          <nav className="hidden xl:flex items-center gap-1.5" aria-label="Main Navigation">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  isActive(link.href)
                    ? "bg-emerald-50 text-brand-700 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                )}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}

            {/* Directories dropdown */}
            <div className="relative" ref={dirsRef}>
              <button
                onClick={() => setDirsOpen((v) => !v)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  (dirsOpen || dirsActive)
                    ? "bg-emerald-50 text-brand-700 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                )}
                aria-expanded={dirsOpen}
                aria-haspopup="menu"
                id="directories-menu-button"
              >
                <Compass size={15} className="text-slate-400" />
                <span>{t("nav.directories")}</span>
                <ChevronDown
                  size={14}
                  className={clsx("transition-transform duration-200 text-slate-400", dirsOpen && "rotate-180")}
                />
              </button>

              {dirsOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-80 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-2 shadow-2xl animate-scale-in z-50 divide-y divide-slate-100"
                  role="menu"
                >
                  <div className="px-3 py-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Sacred & Cultural Registers
                    </p>
                  </div>
                  <div className="pt-1.5 pb-1 space-y-1">
                    {directoryLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          role="menuitem"
                          onClick={() => setDirsOpen(false)}
                          className={clsx(
                            "flex items-start gap-3 p-2.5 rounded-xl text-sm transition-all group",
                            isActive(link.href)
                              ? "bg-emerald-50 text-brand-700 font-medium"
                              : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                          )}
                        >
                          <div className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                            isActive(link.href)
                              ? "bg-brand-600 text-white border-brand-600"
                              : "bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-brand-50 group-hover:text-brand-600 group-hover:border-brand-200"
                          )}>
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-medium text-slate-900 text-xs sm:text-sm">
                                {link.label}
                              </span>
                              <span className={clsx("text-[10px] px-1.5 py-0.2 rounded-full border", link.badgeColor)}>
                                {link.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {link.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
            {/* Quick search — real input; press "/" to focus, Enter to search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = searchInputRef.current?.value.trim() ?? "";
                router.push(q ? `/events?search=${encodeURIComponent(q)}` : "/events");
              }}
              className="hidden 2xl:flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/70 focus-within:border-brand-300 focus-within:bg-white text-slate-500 hover:text-slate-800 text-xs transition-colors"
            >
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search gatherings..."
                aria-label={t("nav.search")}
                className="w-44 bg-transparent border-none outline-none p-0 text-slate-800 placeholder:text-slate-400 text-xs"
              />
              <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
                /
              </kbd>
            </form>

            {/* Compact search icon button for lg/xl screens */}
            <Link
              href="/events?search="
              className="btn-ghost p-2 text-slate-600 hover:text-slate-900 2xl:hidden rounded-lg"
              aria-label={t("nav.search")}
              title={t("nav.search")}
            >
              <Search size={18} />
            </Link>

            <div className="hidden lg:block h-4 w-px bg-slate-200/80 my-auto" />

            <LocationIndicator variant="compact" />

            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            <NotificationBell />

            {isAuthenticated ? (
              <>
                <Link
                  href="/events/create"
                  className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-xs hover:shadow-sm transition-all whitespace-nowrap"
                >
                  <PlusCircle size={14} />
                  {t("nav.addEvent")}
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-700 to-emerald-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-emerald-500/30 hover:ring-emerald-500/60 transition-all"
                    aria-label="User menu"
                    id="user-menu-button"
                  >
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-11 w-56 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl py-2 shadow-2xl animate-scale-in z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <User size={15} className="text-slate-400" /> {t("nav.profile")}
                        </Link>

                        <Link href="/saved" className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <Bookmark size={15} className="text-slate-400" /> {t("nav.savedEvents")}
                        </Link>

                        <Link href="/profile/events" className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <LayoutDashboard size={15} className="text-slate-400" /> {t("nav.myEvents")}
                        </Link>

                        {user?.role === "ADMIN" && (
                          <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2 text-sm text-brand-700 font-medium hover:bg-emerald-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                            <Sparkles size={15} className="text-brand-600" /> {t("nav.adminPanel")}
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => { logout.mutate(); setUserMenuOpen(false); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50/70 transition-colors"
                          id="logout-button"
                        >
                          <LogOut size={15} className="text-red-500" /> {t("nav.signOut")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-ghost text-xs sm:text-sm py-1.5 px-3 hidden sm:inline-flex whitespace-nowrap">{t("nav.signIn")}</Link>
                <Link href="/register" className="btn-primary hidden sm:inline-flex py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap shadow-xs">{t("nav.getStarted")}</Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              className="btn-ghost p-2 xl:hidden text-slate-700"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle mobile menu"
              id="mobile-menu-button"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Drawer */}
        {mobileOpen && (
          <div className="xl:hidden border-t border-slate-200/80 py-4 space-y-4 animate-slide-up">
            <div>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Explore Events
              </p>
              <div className="grid grid-cols-2 gap-1 px-1">
                {primaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      "px-3 py-2 text-sm rounded-xl transition-colors font-medium",
                      isActive(link.href)
                        ? "text-brand-700 bg-brand-50"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {t("nav.directories")} & Registers
              </p>
              <div className="space-y-1 px-1">
                {directoryLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={clsx(
                        "flex items-center justify-between px-3 py-2 text-sm rounded-xl transition-colors",
                        isActive(link.href)
                          ? "text-brand-700 bg-brand-50 font-medium"
                          : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className="shrink-0 text-slate-400" />
                        <span>{link.label}</span>
                      </div>
                      <span className={clsx("text-[10px] px-1.5 py-0.2 rounded-full border", link.badgeColor)}>
                        {link.badge}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {isAuthenticated ? (
              <div className="pt-2 border-t border-slate-200/80 space-y-1 px-1">
                <Link
                  href="/events/create"
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl"
                  onClick={() => setMobileOpen(false)}
                >
                  <PlusCircle size={16} />
                  {t("nav.addEvent")}
                </Link>
                <Link
                  href="/saved"
                  className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.savedEvents")}
                </Link>
                <Link
                  href="/profile/events"
                  className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.myEvents")}
                </Link>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 px-1">
                <Link
                  href="/login"
                  className="btn-secondary text-center py-2 text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.signIn")}
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-center py-2 text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.getStarted")}
                </Link>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200/80 px-3 flex items-center justify-between gap-2">
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
