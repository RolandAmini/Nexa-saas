"use client";

import React, { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Truck,
  Settings,
  LogOut,
  Cloud,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients (CRM)", href: "/dashboard/clients", icon: Users },
  { label: "Catalogue", href: "/dashboard/products", icon: Package },
  { label: "Ventes & Factures", href: "/dashboard/invoices", icon: FileText },
  { label: "Logistique", href: "/dashboard/deliveries", icon: Truck },
  { label: "Paramètres & Logo", href: "/dashboard/settings", icon: Settings },
];

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 Ko";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 && i > 0 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeOrg, setActiveOrg] = useState<any>(null);
  const [usedBytes, setUsedBytes] = useState<number>(0);

  const quotaBytes = 1024 * 1024 * 1024; // 1 Go

  useEffect(() => {
    const storedUser = localStorage.getItem("nexa_user");
    if (!storedUser) return;

    try {
      const parsed = JSON.parse(storedUser);
      const org = parsed.organizations?.[0] || null;
      setActiveOrg(org);

      if (org?.id) {
        computeStorageUsage(org.id, org.logoUrl);
      }
    } catch {
      // Ignore les erreurs de parsing localStorage
    }
  }, [pathname]);

  const computeStorageUsage = async (orgId: string, logoUrl?: string) => {
    try {
      let total = 0;

      if (logoUrl) {
        total += logoUrl.startsWith("data:")
          ? Math.round((logoUrl.length * 3) / 4)
          : 120 * 1024;
      }

      const [clientsRes, productsRes, invoicesRes, deliveriesRes] = await Promise.all([
        fetch(`/api/clients?organizationId=${orgId}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/products?organizationId=${orgId}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/invoices?organizationId=${orgId}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/deliveries?organizationId=${orgId}`).then((r) => (r.ok ? r.json() : null)),
      ]);

      total += (clientsRes?.clients?.length || 0) * 8 * 1024;
      total += (productsRes?.products?.length || 0) * 12 * 1024;
      total += (invoicesRes?.invoices?.length || 0) * 45 * 1024;
      total += (deliveriesRes?.deliveries?.length || 0) * 28 * 1024;

      setUsedBytes(total);
    } catch {
      // Garde la valeur actuelle
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("nexa_user");
    router.push("/login");
  };

  const usagePercent = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));
  const isStorageActive = pathname?.startsWith("/dashboard/storage");

  return (
    <div className="relative min-h-screen text-[#111111] flex">
      {/* Arrière-plan fixe combinant #8A939B et #111111 */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 85% 15%, rgba(138, 147, 155, 0.35) 0%, transparent 45%), linear-gradient(145deg, #111111 0%, #23272b 52%, #8A939B 100%)",
        }}
      />

      {/* Bouton mobile */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[#111111] border border-[#8A939B]/40 text-white shadow-md print:hidden"
        aria-label="Menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-[#111111]/70 z-30 print:hidden"
        />
      )}

      {/* Barre latérale persistante — Icônes uniquement */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 w-20 bg-[#111111] text-white border-r border-[#8A939B]/30 flex flex-col items-center justify-between py-4 transition-transform duration-300 print:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Haut : Marque + Icônes de navigation */}
        <div className="flex flex-col items-center gap-6 w-full px-3 overflow-y-auto">
          <a
            href="/dashboard"
            title={activeOrg?.name ? `Nexa ERP — ${activeOrg.name}` : "Nexa ERP"}
            className="w-10 h-10 rounded-xl bg-[#FFC300] text-[#111111] font-extrabold flex items-center justify-center shrink-0 shadow-xs"
          >
            N
          </a>

          <nav className="flex flex-col items-center gap-2 w-full">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname?.startsWith(item.href);

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={item.label}
                  aria-label={item.label}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-[#FFC300] text-[#111111]"
                      : "text-[#8A939B] hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </nav>
        </div>

        {/* Bas : Icône Stockage Cloud (page dédiée) + Déconnexion */}
        <div className="flex flex-col items-center gap-3 w-full px-3 pt-3 border-t border-[#8A939B]/25">
          <a
            href="/dashboard/storage"
            onClick={() => setMobileOpen(false)}
            title={`Stockage Cloud (${usagePercent}%) : ${formatBytes(usedBytes)} / ${formatBytes(quotaBytes)}`}
            aria-label="Stockage Cloud"
            className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              isStorageActive
                ? "bg-[#FFC300] text-[#111111]"
                : "text-[#FFC300] bg-white/5 hover:bg-white/15 border border-[#8A939B]/25"
            }`}
          >
            <Cloud className="w-5 h-5" />
            <span
              className={`absolute -top-1 -right-1 text-[9px] font-extrabold px-1 py-0.2 rounded-full ${
                isStorageActive
                  ? "bg-[#111111] text-[#FFC300]"
                  : "bg-[#FFC300] text-[#111111]"
              }`}
            >
              {usagePercent}%
            </span>
          </a>

          <button
            type="button"
            onClick={handleLogout}
            title="Déconnexion"
            aria-label="Déconnexion"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[#8A939B] bg-white/5 hover:bg-red-500/20 hover:text-red-300 border border-[#8A939B]/25 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Zone principale au-dessus du fond fixe */}
      <main className="flex-1 min-w-0 p-6 lg:p-8 pt-16 lg:pt-8">{children}</main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111111]" />}>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}