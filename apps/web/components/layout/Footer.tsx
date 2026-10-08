import Link from "next/link";
import { Heart, Github, Twitter } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "Events", href: "/events" },
    { label: "Categories", href: "/categories" },
    { label: "Organizers", href: "/organizers" },
  ],
  Community: [
    { label: "Add Event", href: "/events/create" },
    { label: "Register", href: "/register" },
    { label: "Sign In", href: "/login" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-surface-50/30 border-t border-white/10 mt-16">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-400 flex items-center justify-center">
                <span className="text-white font-bold text-xs">CE</span>
              </div>
              <span className="font-bold text-white text-sm">CommunityEvents</span>
            </div>
            <p className="text-white/50 text-xs leading-relaxed max-w-xs">
              Connecting South Asian communities through religious and cultural events across the globe.
            </p>
            <p className="text-arabic text-white/40 text-sm mt-3">بسم اللہ الرحمن الرحیم</p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">{group}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-white/60 hover:text-white text-sm transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/40">
          <p>© {new Date().getFullYear()} CommunityEvents. Made with <Heart size={12} className="inline text-red-500" /> for the ummah.</p>
          <p>Pakistan · India · UK · USA · Canada · UAE · Australia</p>
        </div>
      </div>
    </footer>
  );
}
