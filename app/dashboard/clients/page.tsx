"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Search,
  X,
  ArrowUpRight,
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

export default function ClientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Formulaire d'ajout de client
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("nexa_user");
    if (!storedUser) {
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchClients(parsedUser.organizations?.[0]?.id);
    }
  }, [router]);

  const fetchClients = async (orgId: string) => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/clients?organizationId=${orgId}`);
      const data = await res.json();
      if (res.ok) {
        setClients(data.clients || []);
      } else {
        setError(data.error || "Erreur lors du chargement des clients.");
      }
    } catch {
      setError("Erreur lors du chargement des clients.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const orgId = user?.organizations?.[0]?.id;
    if (!orgId) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, address, organizationId: orgId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création.");
      }

      setClients([data.client, ...clients]);
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const hay = [c.name, c.email, c.phone, c.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [clients, searchQuery]);

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
              Gestion des Clients (CRM)
            </h1>
            <p className="text-sm text-white/80 mt-1">
              Portefeuille B2B — Cliquez sur un client pour ouvrir son espace activités
            </p>
          </div>

          <div className="bg-white border border-[#8A939B]/40 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFC300]" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#8A939B] font-bold">
                Organisation active
              </p>
              <p className="text-sm font-extrabold text-[#111111]">
                {activeOrg ? activeOrg.name : "Chargement..."}
              </p>
            </div>
          </div>
        </motion.header>

        {error && (
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="p-3.5 rounded-xl bg-white border border-red-300 text-red-700 text-sm font-semibold shadow-sm"
          >
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire d'ajout */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white border border-[#8A939B]/30 p-6 rounded-2xl h-fit shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-lg bg-[#FFC300]/25 text-[#111111] flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </span>
              <h2 className="text-base font-extrabold text-[#111111]">Ajouter un client</h2>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Nom / Entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                  placeholder="Ex: Entreprise Alpha"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                  placeholder="contact@client.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">Téléphone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                  placeholder="+243 / +254..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">Adresse</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                  placeholder="Ville, Quartier..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FFC300] hover:bg-[#f2b800] text-[#111111] font-extrabold text-xs transition-colors disabled:opacity-50 mt-2"
              >
                {submitting ? "Enregistrement..." : "Enregistrer le client"}
              </button>
            </form>
          </motion.div>

          {/* Liste des clients + Barre de recherche */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="lg:col-span-2 bg-white border border-[#8A939B]/30 p-6 rounded-2xl shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#111111]/5 border border-[#8A939B]/20 text-[#111111] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </span>
                <h2 className="text-base font-extrabold text-[#111111]">
                  Portefeuille clients ({filteredClients.length}
                  {searchQuery ? ` / ${clients.length}` : ""})
                </h2>
              </div>

              {/* Barre de recherche */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#8A939B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un client..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-xs font-medium text-[#111111] placeholder:text-[#8A939B] focus:outline-none focus:border-[#111111]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Effacer la recherche"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A939B] hover:text-[#111111]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-[#8A939B] py-8 text-center">
                Chargement des clients...
              </p>
            ) : filteredClients.length === 0 ? (
              <p className="text-sm text-[#8A939B] py-8 text-center">
                {searchQuery
                  ? `Aucun client trouvé pour "${searchQuery}".`
                  : "Aucun client enregistré pour le moment."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#8A939B]/25 text-[11px] text-[#8A939B] uppercase font-bold">
                      <th className="py-3 px-4">Nom</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Téléphone</th>
                      <th className="py-3 px-4">Adresse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A939B]/20 text-sm">
                    {filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                        className="hover:bg-[#FFC300]/15 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-extrabold text-[#111111] group-hover:underline">
                          <span className="inline-flex items-center gap-1.5">
                            <span>{client.name}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-[#8A939B] group-hover:text-[#111111]" />
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#8A939B]">
                          {client.email ? (
                            <span className="inline-flex items-center gap-1.5 text-[#111111]/80">
                              <Mail className="w-3.5 h-3.5 text-[#8A939B]" />
                              {client.email}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#8A939B]">
                          {client.phone ? (
                            <span className="inline-flex items-center gap-1.5 text-[#111111]/80">
                              <Phone className="w-3.5 h-3.5 text-[#8A939B]" />
                              {client.phone}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#8A939B]">
                          {client.address ? (
                            <span className="inline-flex items-center gap-1.5 text-[#111111]/80">
                              <MapPin className="w-3.5 h-3.5 text-[#8A939B]" />
                              {client.address}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}