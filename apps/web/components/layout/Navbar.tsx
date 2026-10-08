"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, Bookmark, User, LogOut, PlusCircle, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/hooks/useAuth";
import { clsx } from "clsx";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const logout = useLogout();

  const navLinks = [
    { href: "/events", label: "Events" },
    { href: "/categories", label: "Categories" },
    { href: "/organizers", label: "Organizers" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-white/10">
      <div className="container-page">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-400 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CE</span>
            </div>
            <span className="font-bold text-white hidden sm:block">
              Community<span className="text-brand-400">Events</span>
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
            <Link href="/events?search=" className="btn-ghost p-2" aria-label="Search">
              <Search size={18} />
            </Link>

            {isAuthenticated ? (
              <>
                <Link href="/events/create" className="btn-primary hidden sm:inline-flex py-2 px-4 text-xs">
                  <PlusCircle size={15} />
                  Add Event
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
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-white/50 truncate">{user?.email}</p>
                      </div>

                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <User size={15} /> Profile
                      </Link>

                      <Link href="/saved" className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <Bookmark size={15} /> Saved Events
                      </Link>

                      <Link href="/profile/events" className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard size={15} /> My Events
                      </Link>

                      {user?.role === "ADMIN" && (
                        <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-brand-300 hover:text-brand-200 hover:bg-white/5 transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <LayoutDashboard size={15} /> Admin Panel
                        </Link>
                      )}

                      <div className="border-t border-white/10 mt-1 pt-1">
                        <button
                          onClick={() => { logout.mutate(); setUserMenuOpen(false); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                          id="logout-button"
                        >
                          <LogOut size={15} /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-ghost text-sm hidden sm:inline-flex">Sign in</Link>
                <Link href="/register" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
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
          <div className="md:hidden border-t border-white/10 py-3 space-y-1 animate-slide-up">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="block px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors" onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link href="/events/create" className="block px-3 py-2 text-sm text-brand-400 font-medium hover:bg-white/5 rounded-lg transition-colors" onClick={() => setMobileOpen(false)}>
                + Add Event
              </Link>
            )}
            {isAuthenticated && (
              <Link href="/saved" className="block px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors" onClick={() => setMobileOpen(false)}>
                Saved Events
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
