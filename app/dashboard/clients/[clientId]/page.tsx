"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Truck,
  TrendingUp,
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

export default function ClientActivityPage() {
  const params = useParams<{ clientId?: string }>();
  const router = useRouter();
  const clientId = typeof params?.clientId === "string" ? params.clientId : "";

  const [client, setClient] = useState<any>(null);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [clientDeliveries, setClientDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("nexa_user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      const orgId = parsedUser.organizations?.[0]?.id;

      if (orgId && clientId) {
        loadClientActivity(orgId, clientId);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, [router, clientId]);

  const loadClientActivity = async (orgId: string, targetClientId: string) => {
    setLoading(true);
    setError("");

    try {
      const [clientsRes, invoicesRes, deliveriesRes] = await Promise.all([
        fetch(`/api/clients?organizationId=${orgId}`),
        fetch(`/api/invoices?organizationId=${orgId}`),
        fetch(`/api/deliveries?organizationId=${orgId}`),
      ]);

      const [clientsData, invoicesData, deliveriesData] = await Promise.all([
        clientsRes.json(),
        invoicesRes.json(),
        deliveriesRes.json(),
      ]);

      if (clientsRes.ok) {
        const found = (clientsData.clients || []).find((c: any) => c.id === targetClientId);
        setClient(found || null);
        if (!found) {
          setError("Client introuvable dans cette organisation.");
        }
      }

      if (invoicesRes.ok) {
        const filteredInv = (invoicesData.invoices || []).filter(
          (inv: any) => (inv.clientId || inv.client?.id) === targetClientId
        );
        setClientInvoices(filteredInv);
      }

      if (deliveriesRes.ok) {
        const filteredDel = (deliveriesData.deliveries || []).filter(
          (del: any) => (del.clientId || del.client?.id) === targetClientId
        );
        setClientDeliveries(filteredDel);
      }
    } catch {
      setError("Erreur lors du chargement des activités du client.");
    } finally {
      setLoading(false);
    }
  };

  const paidTotals = clientInvoices
    .filter((inv) => inv.status === "PAID")
    .reduce((acc: Record<string, number>, inv) => {
      acc[inv.currency] = (acc[inv.currency] || 0) + Number(inv.totalAmount);
      return acc;
    }, {});

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
        {/* Retour & En-tête Client */}
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
              <Building2 className="w-6 h-6 text-[#FFC300]" />
              <span>{client ? client.name : loading ? "Chargement..." : "Activités Client"}</span>
            </h1>

            {client && (
              <div className="flex flex-wrap gap-4 text-xs text-white/80">
                {client.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#FFC300]" />
                    {client.email}
                  </span>
                )}
                {client.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#FFC300]" />
                    {client.phone}
                  </span>
                )}
                {client.address && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#FFC300]" />
                    {client.address}
                  </span>
                )}
              </div>
            )}
          </div>

          <a
            href="/dashboard/invoices"
            className="py-2.5 px-4 rounded-xl bg-[#FFC300] hover:bg-[#f2b800] text-[#111111] font-extrabold text-xs text-center transition-colors h-fit"
          >
            + Nouveau document pour ce client
          </a>
        </motion.header>

        {error && (
          <div className="p-3.5 rounded-xl bg-white border border-red-300 text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Résumé propre à ce client */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white border border-[#8A939B]/30 p-5 rounded-2xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-[#8A939B]">Documents Client</span>
              <FileText className="w-4 h-4 text-[#111111]" />
            </div>
            <p className="text-3xl font-extrabold text-[#111111]">{clientInvoices.length}</p>
            <p className="text-xs text-[#8A939B] mt-1">Devis, commandes & factures</p>
          </motion.div>

          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white border border-[#8A939B]/30 p-5 rounded-2xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-[#8A939B]">Total Encaissé</span>
              <TrendingUp className="w-4 h-4 text-[#111111]" />
            </div>
            {Object.keys(paidTotals).length === 0 ? (
              <p className="text-2xl font-extrabold text-[#111111]">0,00 USD</p>
            ) : (
              <div className="space-y-1">
                {Object.entries(paidTotals).map(([curr, total]) => (
                  <p key={curr} className="text-xl font-extrabold text-[#111111]">
                    {total.toLocaleString("fr-FR")} {curr}
                  </p>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white border border-[#8A939B]/30 p-5 rounded-2xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-[#8A939B]">Livraisons</span>
              <Truck className="w-4 h-4 text-[#111111]" />
            </div>
            <p className="text-3xl font-extrabold text-[#111111]">{clientDeliveries.length}</p>
            <p className="text-xs text-[#8A939B] mt-1">Bons de livraison liés</p>
          </motion.div>
        </div>

        {/* Historique exclusif des documents & livraisons de ce client */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white border border-[#8A939B]/30 p-6 rounded-2xl shadow-sm"
          >
            <h2 className="text-base font-extrabold text-[#111111] mb-4">
              Documents commerciaux ({clientInvoices.length})
            </h2>

            {loading ? (
              <p className="text-sm text-[#8A939B] py-6 text-center">Chargement...</p>
            ) : clientInvoices.length === 0 ? (
              <p className="text-sm text-[#8A939B] py-6 text-center">
                Aucun document enregistré pour ce client.
              </p>
            ) : (
              <div className="divide-y divide-[#8A939B]/20 text-sm">
                {clientInvoices.map((inv) => (
                  <div key={inv.id} className="py-3 flex justify-between items-center gap-4">
                    <div>
                      <p className="font-bold text-[#111111]">{inv.invoiceNumber}</p>
                      <p className="text-xs text-[#8A939B]">
                        {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-[#111111]">
                        {Number(inv.totalAmount).toLocaleString("fr-FR")} {inv.currency}
                      </p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#111111]/5 text-[#8A939B] border border-[#8A939B]/25">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            custom={5}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white border border-[#8A939B]/30 p-6 rounded-2xl shadow-sm"
          >
            <h2 className="text-base font-extrabold text-[#111111] mb-4">
              Bons de livraison ({clientDeliveries.length})
            </h2>

            {loading ? (
              <p className="text-sm text-[#8A939B] py-6 text-center">Chargement...</p>
            ) : clientDeliveries.length === 0 ? (
              <p className="text-sm text-[#8A939B] py-6 text-center">
                Aucune livraison enregistrée pour ce client.
              </p>
            ) : (
              <div className="divide-y divide-[#8A939B]/20 text-sm">
                {clientDeliveries.map((del) => (
                  <div key={del.id} className="py-3 flex justify-between items-center gap-4">
                    <div>
                      <p className="font-bold text-[#111111]">{del.deliveryNumber}</p>
                      <p className="text-xs text-[#8A939B]">{del.destination || "Destination N/A"}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#FFC300]/25 text-[#111111]">
                      {del.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}