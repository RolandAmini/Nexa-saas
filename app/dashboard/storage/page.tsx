"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Cloud,
  HardDrive,
  Image as ImageIcon,
  Users,
  Package,
  FileText,
  Truck,
  ArrowLeft,
} from "lucide-react";

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 Ko";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 && i > 0 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

export default function StoragePage() {
  const router = useRouter();
  const [activeOrg, setActiveOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [breakdown, setBreakdown] = useState({
    logoBytes: 0,
    clientsBytes: 0,
    productsBytes: 0,
    invoicesBytes: 0,
    deliveriesBytes: 0,
    clientsCount: 0,
    productsCount: 0,
    invoicesCount: 0,
    deliveriesCount: 0,
  });

  const quotaBytes = 1024 * 1024 * 1024; // 1 Go

  useEffect(() => {
    const storedUser = localStorage.getItem("nexa_user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const parsed = JSON.parse(storedUser);
    const org = parsed.organizations?.[0] || null;
    setActiveOrg(org);

    if (org?.id) {
      loadStorageBreakdown(org.id, org.logoUrl);
    } else {
      setLoading(false);
    }
  }, [router]);

  const loadStorageBreakdown = async (orgId: string, logoUrl?: string) => {
    try {
      const logoBytes = logoUrl
        ? logoUrl.startsWith("data:")
          ? Math.round((logoUrl.length * 3) / 4)
          : 120 * 1024
        : 0;

      const [clientsRes, productsRes, invoicesRes, deliveriesRes] = await Promise.all([
        fetch(`/api/clients?organizationId=${orgId}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/products?organizationId=${orgId}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/invoices?organizationId=${orgId}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/deliveries?organizationId=${orgId}`).then((r) => (r.ok ? r.json() : null)),
      ]);

      const clientsCount = clientsRes?.clients?.length || 0;
      const productsCount = productsRes?.products?.length || 0;
      const invoicesCount = invoicesRes?.invoices?.length || 0;
      const deliveriesCount = deliveriesRes?.deliveries?.length || 0;

      setBreakdown({
        logoBytes,
        clientsBytes: clientsCount * 8 * 1024,
        productsBytes: productsCount * 12 * 1024,
        invoicesBytes: invoicesCount * 45 * 1024,
        deliveriesBytes: deliveriesCount * 28 * 1024,
        clientsCount,
        productsCount,
        invoicesCount,
        deliveriesCount,
      });
    } finally {
      setLoading(false);
    }
  };

  const totalUsedBytes =
    breakdown.logoBytes +
    breakdown.clientsBytes +
    breakdown.productsBytes +
    breakdown.invoicesBytes +
    breakdown.deliveriesBytes;

  const usagePercent = Math.min(100, Math.round((totalUsedBytes / quotaBytes) * 100));

  const items = [
    {
      label: "Logo & Identité Visuelle",
      count: activeOrg?.logoUrl ? "1 fichier" : "Aucun",
      bytes: breakdown.logoBytes,
      icon: ImageIcon,
      href: "/dashboard/settings",
    },
    {
      label: "Fiches Clients (CRM)",
      count: `${breakdown.clientsCount} enregistrements`,
      bytes: breakdown.clientsBytes,
      icon: Users,
      href: "/dashboard/clients",
    },
    {
      label: "Catalogue Produits & Services",
      count: `${breakdown.productsCount} articles`,
      bytes: breakdown.productsBytes,
      icon: Package,
      href: "/dashboard/products",
    },
    {
      label: "Devis, Commandes & Factures",
      count: `${breakdown.invoicesCount} documents`,
      bytes: breakdown.invoicesBytes,
      icon: FileText,
      href: "/dashboard/invoices",
    },
    {
      label: "Bons de Livraison & Logistique",
      count: `${breakdown.deliveriesCount} bordereaux`,
      bytes: breakdown.deliveriesBytes,
      icon: Truck,
      href: "/dashboard/deliveries",
    },
  ];

  return (
    <div className="relative min-h-full">
      {/* Background fixe [#8A939B] + [#111111] */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 80% 15%, rgba(138, 147, 155, 0.42) 0%, transparent 45%), linear-gradient(150deg, #111111 0%, #262a2e 48%, #8A939B 100%)",
        }}
      />

      <div className="max-w-6xl mx-auto space-y-8">
        <motion.header
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-white/20"
        >
          <div className="space-y-2">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFC300] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour au Centre de Commandement</span>
            </a>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Cloud className="w-6 h-6 text-[#FFC300]" />
              <span>Stockage Cloud & Capacité</span>
            </h1>
            <p className="text-sm text-white/80">
              Répartition de l'espace utilisé pour{" "}
              <span className="text-[#FFC300] font-bold">
                {activeOrg?.name || "l'organisation"}
              </span>
            </p>
          </div>

          <div className="bg-white border border-[#8A939B]/40 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-sm">
            <HardDrive className="w-4 h-4 text-[#111111]" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#8A939B] font-bold">
                Quota Alloué
              </p>
              <p className="text-sm font-extrabold text-[#111111]">1,00 Go</p>
            </div>
          </div>
        </motion.header>

        {/* Carte Jauge Globale */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-white border border-[#8A939B]/30 p-6 rounded-2xl shadow-sm space-y-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#8A939B]">
                Espace Cloud Utilisé
              </p>
              <p className="text-3xl font-extrabold text-[#111111] mt-1">
                {loading ? "Calcul..." : `${formatBytes(totalUsedBytes)} / 1 Go`}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#FFC300] text-[#111111]">
              {usagePercent}% utilisé
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-[#8A939B]/20 overflow-hidden">
            <div
              className="h-full bg-[#FFC300] rounded-full transition-all duration-500"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </motion.div>

        {/* Répartition par module */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.a
                key={item.label}
                href={item.href}
                custom={idx + 2}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="bg-white hover:bg-[#FAFAFA] border border-[#8A939B]/30 hover:border-[#FFC300] p-5 rounded-2xl shadow-sm transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8A939B] group-hover:text-[#111111] transition-colors">
                    {item.label}
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-[#FFC300]/25 text-[#111111] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </span>
                </div>

                <div>
                  <p className="text-xl font-extrabold text-[#111111]">
                    {formatBytes(item.bytes)}
                  </p>
                  <p className="text-xs text-[#8A939B] mt-1">{item.count}</p>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </div>
  );
}