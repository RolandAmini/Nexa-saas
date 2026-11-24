"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Clock,
  Play,
  Pause,
  Target,
  Star,
  Plus,
  Trash2,
  ArrowUpRight,
  TrendingUp,
  Briefcase,
  Users,
  Package,
} from "lucide-react";

interface FavoriteItem {
  id: string;
  label: string;
  href: string;
}

const DEFAULT_FAVORITES: FavoriteItem[] = [
  { id: "fav-1", label: "Ventes & Facturation", href: "/dashboard/invoices" },
  { id: "fav-2", label: "Clients B2B (CRM)", href: "/dashboard/clients" },
  { id: "fav-3", label: "Logistique & Livraisons", href: "/dashboard/deliveries" },
];

function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 700;
    const startTime = performance.now();
    const startVal = displayValue;
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (value - startVal) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const formatted =
    decimals > 0
      ? displayValue.toLocaleString("fr-FR", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(displayValue).toLocaleString("fr-FR");

  return (
    <span>
      {formatted}
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
}

function formatSecondsToHMS(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [hrs, mins, secs].map((n) => String(n).padStart(2, "0")).join(":");
}

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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profil Membre : Heures, Focus de la semaine & Favoris
  const [isRunning, setIsRunning] = useState(false);
  const [workedSeconds, setWorkedSeconds] = useState(0);
  const [weeklyFocus, setWeeklyFocus] = useState(
    "Finaliser les devis prioritaires et sécuriser les livraisons"
  );
  const [focusProgress, setFocusProgress] = useState(65);
  const [favorites, setFavorites] = useState<FavoriteItem[]>(DEFAULT_FAVORITES);
  const [newFavLabel, setNewFavLabel] = useState("");
  const [newFavHref, setNewFavHref] = useState("/dashboard/invoices");

  useEffect(() => {
    const storedUser = localStorage.getItem("nexa_user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const memberKey = `nexa_member_${parsedUser.id || parsedUser.email || "default"}`;
    const savedMember = localStorage.getItem(memberKey);
    if (savedMember) {
      try {
        const data = JSON.parse(savedMember);
        if (typeof data.workedSeconds === "number") setWorkedSeconds(data.workedSeconds);
        if (typeof data.isRunning === "boolean") setIsRunning(data.isRunning);
        if (typeof data.weeklyFocus === "string") setWeeklyFocus(data.weeklyFocus);
        if (typeof data.focusProgress === "number") setFocusProgress(data.focusProgress);
        if (Array.isArray(data.favorites) && data.favorites.length > 0) {
          setFavorites(data.favorites);
        }
      } catch {
        // Ignore les données malformées
      }
    }

    const orgId = parsedUser.organizations?.[0]?.id;
    if (orgId) {
      loadDashboardData(orgId);
    } else {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const memberKey = `nexa_member_${user.id || user.email || "default"}`;
    localStorage.setItem(
      memberKey,
      JSON.stringify({
        workedSeconds,
        isRunning,
        weeklyFocus,
        focusProgress,
        favorites,
      })
    );
  }, [user, workedSeconds, isRunning, weeklyFocus, focusProgress, favorites]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setWorkedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const loadDashboardData = async (orgId: string) => {
    try {
      const [clientsRes, productsRes, invoicesRes] = await Promise.all([
        fetch(`/api/clients?organizationId=${orgId}`),
        fetch(`/api/products?organizationId=${orgId}`),
        fetch(`/api/invoices?organizationId=${orgId}`),
      ]);

      const [clientsData, productsData, invoicesData] = await Promise.all([
        clientsRes.json(),
        productsRes.json(),
        invoicesRes.json(),
      ]);

      if (clientsRes.ok) setClients(clientsData.clients || []);
      if (productsRes.ok) setProducts(productsData.products || []);
      if (invoicesRes.ok) setInvoices(invoicesData.invoices || []);
    } catch (error) {
      console.error("Erreur lors du chargement des KPIs :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFavorite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFavLabel.trim()) return;
    const item: FavoriteItem = {
      id: `fav-${Date.now()}`,
      label: newFavLabel.trim(),
      href: newFavHref,
    };
    setFavorites([...favorites, item]);
    setNewFavLabel("");
  };

  const handleRemoveFavorite = (id: string) => {
    setFavorites(favorites.filter((f) => f.id !== id));
  };

  const paidByCurrency = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((acc: Record<string, number>, inv) => {
      acc[inv.currency] = (acc[inv.currency] || 0) + Number(inv.totalAmount);
      return acc;
    }, {});

  const pendingByCurrency = invoices
    .filter((inv) => inv.status === "SENT" || inv.status === "CONFIRMED" || inv.status === "DRAFT")
    .reduce((acc: Record<string, number>, inv) => {
      acc[inv.currency] = (acc[inv.currency] || 0) + Number(inv.totalAmount);
      return acc;
    }, {});

  const activeOrg = user?.organizations?.[0];

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

      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête */}
        <motion.header
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-white/20"
        >
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Centre de Commandement
            </h1>
            <p className="text-sm text-white/80 mt-1">
              Bienvenue,{" "}
              <span className="text-[#FFC300] font-bold">
                {user?.name || user?.email || "Membre"}
              </span>{" "}
              — Vue opérationnelle en direct
            </p>
          </div>

          <a
            href="/dashboard/settings"
            className="bg-white hover:bg-[#F8F9FA] border border-[#8A939B]/40 hover:border-[#FFC300] px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-sm transition-all group"
            title="Ouvrir les paramètres de l'organisation"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFC300]" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#8A939B] font-bold">
                Organisation active
              </p>
              <p className="text-sm font-extrabold text-[#111111] flex items-center gap-1">
                <span>{activeOrg?.name || "Chargement..."}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#8A939B] group-hover:text-[#111111] transition-colors" />
              </p>
            </div>
          </a>
        </motion.header>

        {/* Grille des KPIs cliquables avec compteurs animés */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <motion.a
            href="/dashboard/invoices"
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white hover:bg-[#FAFAFA] border border-[#8A939B]/30 hover:border-[#FFC300] p-5 rounded-2xl shadow-sm transition-all cursor-pointer group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A939B] group-hover:text-[#111111] transition-colors">
                CA Encaissé
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#FFC300]/25 text-[#111111] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            {loading ? (
              <p className="text-sm text-[#8A939B]">Calcul...</p>
            ) : Object.keys(paidByCurrency).length === 0 ? (
              <p className="text-2xl font-extrabold text-[#111111]">
                <AnimatedNumber value={0} decimals={2} suffix="USD" />
              </p>
            ) : (
              <div className="space-y-1">
                {Object.entries(paidByCurrency).map(([curr, amount]) => (
                  <p key={curr} className="text-xl font-extrabold text-[#111111]">
                    <AnimatedNumber value={amount} decimals={2} suffix={curr} />
                  </p>
                ))}
              </div>
            )}
          </motion.a>

          <motion.a
            href="/dashboard/invoices"
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white hover:bg-[#FAFAFA] border border-[#8A939B]/30 hover:border-[#FFC300] p-5 rounded-2xl shadow-sm transition-all cursor-pointer group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A939B] group-hover:text-[#111111] transition-colors">
                Pipeline Actif
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#111111]/5 border border-[#8A939B]/20 text-[#111111] flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </span>
            </div>
            {loading ? (
              <p className="text-sm text-[#8A939B]">Calcul...</p>
            ) : Object.keys(pendingByCurrency).length === 0 ? (
              <p className="text-2xl font-extrabold text-[#111111]">
                <AnimatedNumber value={0} decimals={2} suffix="USD" />
              </p>
            ) : (
              <div className="space-y-1">
                {Object.entries(pendingByCurrency).map(([curr, amount]) => (
                  <p key={curr} className="text-xl font-extrabold text-[#111111]">
                    <AnimatedNumber value={amount} decimals={2} suffix={curr} />
                  </p>
                ))}
              </div>
            )}
          </motion.a>

          <motion.a
            href="/dashboard/clients"
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white hover:bg-[#FAFAFA] border border-[#8A939B]/30 hover:border-[#FFC300] p-5 rounded-2xl shadow-sm transition-all cursor-pointer group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A939B] group-hover:text-[#111111] transition-colors">
                Clients B2B
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#111111]/5 border border-[#8A939B]/20 text-[#111111] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <p className="text-3xl font-extrabold text-[#111111]">
              <AnimatedNumber value={clients.length} />
            </p>
            <p className="text-xs text-[#8A939B] mt-1">Comptes enregistrés</p>
          </motion.a>

          <motion.a
            href="/dashboard/products"
            custom={4}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white hover:bg-[#FAFAFA] border border-[#8A939B]/30 hover:border-[#FFC300] p-5 rounded-2xl shadow-sm transition-all cursor-pointer group block"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A939B] group-hover:text-[#111111] transition-colors">
                Catalogue
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#111111]/5 border border-[#8A939B]/20 text-[#111111] flex items-center justify-center">
                <Package className="w-4 h-4" />
              </span>
            </div>
            <p className="text-3xl font-extrabold text-[#111111]">
              <AnimatedNumber value={products.length} />
            </p>
            <p className="text-xs text-[#8A939B] mt-1">Produits & services actifs</p>
          </motion.a>
        </div>

        {/* Espace Membre : Heures, Focus de la Semaine & Favoris */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chrono & Heures du Membre */}
          <motion.div
            custom={5}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white border border-[#8A939B]/30 p-6 rounded-2xl flex flex-col justify-between gap-4 shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8A939B] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#111111]" />
                  Temps Membre
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isRunning
                      ? "bg-[#FFC300] text-[#111111]"
                      : "bg-[#111111]/5 text-[#8A939B] border border-[#8A939B]/25"
                  }`}
                >
                  {isRunning ? "En cours" : "En pause"}
                </span>
              </div>

              <p className="text-3xl font-extrabold tracking-tight text-[#111111] font-mono">
                {formatSecondsToHMS(workedSeconds)}
              </p>
              <p className="text-xs text-[#8A939B] mt-1">
                Profil : {user?.name || user?.email || "Collaborateur"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors ${
                isRunning
                  ? "bg-[#111111] text-white hover:bg-[#262626]"
                  : "bg-[#FFC300] text-[#111111] hover:bg-[#f2b800]"
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? "Mettre en pause" : "Démarrer le pointage"}</span>
            </button>
          </motion.div>

          {/* Focus de la Semaine */}
          <motion.div
            custom={6}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white border border-[#8A939B]/30 p-6 rounded-2xl flex flex-col justify-between gap-4 shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8A939B] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#111111]" />
                  Focus de la Semaine
                </span>
                <span className="text-xs font-extrabold text-[#111111]">{focusProgress}%</span>
              </div>

              <textarea
                rows={2}
                value={weeklyFocus}
                onChange={(e) => setWeeklyFocus(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#111111] resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="w-full h-2.5 rounded-full bg-[#8A939B]/20 overflow-hidden">
                <div
                  className="h-full bg-[#FFC300] rounded-full transition-all duration-300"
                  style={{ width: `${focusProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#8A939B]">
                <span>Avancement</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={focusProgress}
                  onChange={(e) => setFocusProgress(Number(e.target.value))}
                  className="w-28 accent-[#111111] cursor-pointer"
                />
              </div>
            </div>
          </motion.div>

          {/* Espace Favoris du Membre */}
          <motion.div
            custom={7}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white border border-[#8A939B]/30 p-6 rounded-2xl flex flex-col justify-between gap-4 shadow-sm"
          >
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A939B] flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-[#FFC300] fill-[#FFC300]" />
                Mes Favoris
              </span>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#111111]/5 hover:bg-[#FFC300]/15 border border-[#8A939B]/20 transition-colors group"
                  >
                    <a
                      href={fav.href}
                      className="text-xs font-bold text-[#111111] hover:underline flex items-center gap-1.5 truncate flex-1"
                    >
                      <span className="truncate">{fav.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#8A939B] shrink-0" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(fav.id)}
                      className="text-[#8A939B] hover:text-red-600 p-1 transition-colors"
                      title="Retirer des favoris"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddFavorite} className="flex gap-2">
              <input
                type="text"
                placeholder="Nouveau raccourci..."
                value={newFavLabel}
                onChange={(e) => setNewFavLabel(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
              />
              <select
                value={newFavHref}
                onChange={(e) => setNewFavHref(e.target.value)}
                className="px-2 py-2 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
              >
                <option value="/dashboard/invoices">Ventes</option>
                <option value="/dashboard/clients">CRM</option>
                <option value="/dashboard/products">Catalogue</option>
                <option value="/dashboard/deliveries">Logistique</option>
                <option value="/dashboard/settings">Paramètres</option>
              </select>
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-[#FFC300] hover:bg-[#f2b800] text-[#111111] font-bold text-xs flex items-center justify-center transition-colors shrink-0"
                title="Ajouter aux favoris"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </div>

        {/* Dernières Opérations Cliquables par Client & Actions Rapides */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            custom={8}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="lg:col-span-2 bg-white border border-[#8A939B]/30 p-6 rounded-2xl shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-extrabold text-[#111111]">
                  Dernières opérations commerciales
                </h2>
                <p className="text-xs text-[#8A939B] mt-0.5">
                  Cliquez sur un document pour ouvrir l'espace activités de ce client
                </p>
              </div>
              <a
                href="/dashboard/invoices"
                className="text-xs font-bold text-[#111111] hover:underline flex items-center gap-1"
              >
                <span>Voir tout</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {loading ? (
              <p className="text-sm text-[#8A939B] py-6 text-center">Chargement...</p>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-[#8A939B] py-6 text-center">
                Aucune opération enregistrée pour le moment.
              </p>
            ) : (
              <div className="divide-y divide-[#8A939B]/20 text-sm">
                {invoices.slice(0, 5).map((inv) => {
                  const targetClientId = inv.clientId || inv.client?.id;
                  const targetHref = targetClientId
                    ? `/dashboard/clients/${targetClientId}`
                    : "/dashboard/invoices";

                  return (
                    <a
                      key={inv.id}
                      href={targetHref}
                      className="py-3 px-2 -mx-2 rounded-xl hover:bg-[#FFC300]/15 flex justify-between items-center gap-4 transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#111111] group-hover:underline truncate flex items-center gap-1.5">
                          <span>
                            {inv.invoiceNumber} — {inv.client?.name || "Client"}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#8A939B] group-hover:text-[#111111] shrink-0" />
                        </p>
                        <p className="text-xs text-[#8A939B]">
                          {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-[#111111]">
                          {Number(inv.totalAmount).toLocaleString()} {inv.currency}
                        </p>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#111111]/5 text-[#8A939B] border border-[#8A939B]/25">
                          {inv.status}
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div
            custom={9}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white border border-[#8A939B]/30 p-6 rounded-2xl h-fit space-y-3 shadow-sm"
          >
            <h2 className="text-base font-extrabold text-[#111111] mb-2">Actions Rapides</h2>
            <a
              href="/dashboard/invoices"
              className="block w-full py-2.5 px-4 bg-[#FFC300] hover:bg-[#f2b800] text-[#111111] text-center rounded-xl text-xs font-extrabold transition-colors"
            >
              + Créer un Devis / Facture
            </a>
            <a
              href="/dashboard/clients"
              className="block w-full py-2.5 px-4 bg-[#111111]/5 hover:bg-[#111111] text-[#111111] hover:text-white border border-[#8A939B]/30 text-center rounded-xl text-xs font-bold transition-colors"
            >
              + Ajouter un Client B2B
            </a>
            <a
              href="/dashboard/products"
              className="block w-full py-2.5 px-4 bg-[#111111]/5 hover:bg-[#111111] text-[#111111] hover:text-white border border-[#8A939B]/30 text-center rounded-xl text-xs font-bold transition-colors"
            >
              + Référencer un Produit
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}