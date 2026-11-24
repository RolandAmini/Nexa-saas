"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Truck, PlusCircle, Printer, CheckCircle2, MapPin } from "lucide-react";

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

export default function DeliveriesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulaire
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [carrier, setCarrier] = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Impression PDF Bon de Livraison
  const [printDelivery, setPrintDelivery] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("nexa_user");
    if (!storedUser) {
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setDeliveryNumber(`BL-${Math.floor(1000 + Math.random() * 9000)}`);
      const orgId = parsedUser.organizations?.[0]?.id;
      if (orgId) {
        fetchData(orgId);
      } else {
        setLoading(false);
      }
    }
  }, [router]);

  const fetchData = async (orgId: string) => {
    try {
      const [delRes, cliRes, invRes] = await Promise.all([
        fetch(`/api/deliveries?organizationId=${orgId}`),
        fetch(`/api/clients?organizationId=${orgId}`),
        fetch(`/api/invoices?organizationId=${orgId}`),
      ]);
      const [delData, cliData, invData] = await Promise.all([
        delRes.json(),
        cliRes.json(),
        invRes.json(),
      ]);

      if (delRes.ok) setDeliveries(delData.deliveries || []);
      if (cliRes.ok) setClients(cliData.clients || []);
      if (invRes.ok) setInvoices(invData.invoices || []);
    } catch {
      setError("Erreur de chargement des données logistiques.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInvoice = (invId: string) => {
    setInvoiceId(invId);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      setClientId(inv.clientId);
      if (inv.client?.address) setDestination(inv.client.address);
    }
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    const orgId = user?.organizations?.[0]?.id;
    if (!orgId || !clientId) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryNumber,
          clientId,
          invoiceId: invoiceId || null,
          carrier,
          destination,
          notes,
          organizationId: orgId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDeliveries([data.delivery, ...deliveries]);
      setDeliveryNumber(`BL-${Math.floor(1000 + Math.random() * 9000)}`);
      setInvoiceId("");
      setCarrier("");
      setDestination("");
      setNotes("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/deliveries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeliveries(deliveries.map((d) => (d.id === id ? data.delivery : d)));
      }
    } catch {
      setError("Erreur de mise à jour.");
    }
  };

  const activeOrg = user?.organizations?.[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PREPARING":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#111111]/10 text-[#111111] border border-[#8A939B]/30">
            En préparation
          </span>
        );
      case "IN_TRANSIT":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFC300]/30 text-[#111111] border border-[#FFC300]">
            En transit
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Livré
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#111111]/5 text-[#8A939B]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="relative min-h-full">
      {/* Background fixe [#8A939B] + [#111111] */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none print:hidden"
        style={{
          background:
            "radial-gradient(circle at 80% 15%, rgba(138, 147, 155, 0.42) 0%, transparent 45%), linear-gradient(150deg, #111111 0%, #262a2e 48%, #8A939B 100%)",
        }}
      />

      <div className="max-w-7xl mx-auto space-y-8 print:hidden">
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
              Logistique & Bons de Livraison
            </h1>
            <p className="text-sm text-white/80 mt-1">
              Suivi des expéditions, transit transfrontalier et bordereaux de réception
            </p>
          </div>

          <div className="bg-white border border-[#8A939B]/40 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFC300]" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#8A939B] font-bold">
                Organisation active
              </p>
              <p className="text-sm font-extrabold text-[#111111]">
                {activeOrg?.name || "Chargement..."}
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
          {/* Formulaire Bon de Livraison */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white border border-[#8A939B]/30 p-6 rounded-2xl h-fit shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-lg bg-[#FFC300]/25 text-[#111111] flex items-center justify-center">
                <PlusCircle className="w-4 h-4" />
              </span>
              <h2 className="text-base font-extrabold text-[#111111]">Créer un Bon de Livraison</h2>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  N° Bon de Livraison *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryNumber}
                  onChange={(e) => setDeliveryNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Lier à une Facture / Devis (Recommandé)
                </label>
                <select
                  value={invoiceId}
                  onChange={(e) => handleSelectInvoice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  <option value="">-- Sans facture liée --</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.client?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Client Destinataire *
                </label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Transporteur / Véhicule / Chauffeur
                </label>
                <input
                  type="text"
                  placeholder="Ex: Camion KCA 123B / Transitaire"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Destination / Entrepôt
                </label>
                <input
                  type="text"
                  placeholder="Ex: Entrepôt Goma / Nairobi Mombasa Rd"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Instructions / Colisage
                </label>
                <textarea
                  rows={2}
                  placeholder="Nombre de cartons, palettes, scellés..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FFC300] hover:bg-[#f2b800] text-[#111111] font-extrabold text-xs transition-colors disabled:opacity-50"
              >
                {submitting ? "Création..." : "Générer le Bon de Livraison"}
              </button>
            </form>
          </motion.div>

          {/* Liste des expéditions */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="lg:col-span-2 bg-white border border-[#8A939B]/30 p-6 rounded-2xl shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-lg bg-[#111111]/5 border border-[#8A939B]/20 text-[#111111] flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </span>
              <h2 className="text-base font-extrabold text-[#111111]">
                Expéditions & Livraisons ({deliveries.length})
              </h2>
            </div>

            {loading ? (
              <p className="text-sm text-[#8A939B] py-8 text-center">Chargement...</p>
            ) : deliveries.length === 0 ? (
              <p className="text-sm text-[#8A939B] py-8 text-center">
                Aucun bon de livraison enregistré.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#8A939B]/25 text-[11px] text-[#8A939B] uppercase font-bold">
                      <th className="py-3 px-3">N° BL</th>
                      <th className="py-3 px-3">Client & Destination</th>
                      <th className="py-3 px-3">Facture liée</th>
                      <th className="py-3 px-3">Statut</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A939B]/20 text-sm">
                    {deliveries.map((del) => (
                      <tr
                        key={del.id}
                        className="hover:bg-[#111111]/5 transition-colors"
                      >
                        <td className="py-3.5 px-3 font-extrabold text-[#111111]">
                          {del.deliveryNumber}
                        </td>
                        <td className="py-3.5 px-3">
                          <p className="text-[#111111] font-bold">{del.client?.name}</p>
                          <p className="text-xs text-[#8A939B] inline-flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {del.destination || "—"}
                          </p>
                        </td>
                        <td className="py-3.5 px-3 text-xs font-extrabold text-[#111111]">
                          <span className="px-2 py-0.5 rounded-md bg-[#FFC300]/20 text-[#111111]">
                            {del.invoice?.invoiceNumber || "Direct"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">{getStatusBadge(del.status)}</td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {del.status === "PREPARING" && (
                              <button
                                onClick={() => handleStatusChange(del.id, "IN_TRANSIT")}
                                className="px-2.5 py-1 bg-[#FFC300] hover:bg-[#f2b800] text-[#111111] rounded-lg text-xs font-extrabold transition-colors"
                              >
                                Expédier
                              </button>
                            )}
                            {del.status === "IN_TRANSIT" && (
                              <button
                                onClick={() => handleStatusChange(del.id, "DELIVERED")}
                                className="px-2.5 py-1 bg-[#111111] hover:bg-[#262626] text-[#FFC300] rounded-lg text-xs font-extrabold transition-colors"
                              >
                                Confirmer Réception
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setPrintDelivery(del);
                                setTimeout(() => window.print(), 200);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#111111] hover:bg-[#262626] text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              <Printer className="w-3 h-3 text-[#FFC300]" />
                              BL PDF
                            </button>
                          </div>
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

      {/* MODÈLE D'IMPRESSION BON DE LIVRAISON PDF AVEC LOGO DYNAMIQUE */}
      {printDelivery && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-12 z-50">
          <div className="flex justify-between items-start border-b-2 border-[#111111] pb-6 mb-8">
            <div>
              {activeOrg?.logoUrl ? (
                <img
                  src={activeOrg.logoUrl}
                  alt="Logo Entreprise"
                  className="h-16 max-w-[200px] object-contain mb-2"
                />
              ) : (
                <h1 className="text-3xl font-extrabold uppercase tracking-tight">
                  {activeOrg?.name}
                </h1>
              )}
              <p className="text-xs font-bold text-gray-700 mt-1">{activeOrg?.name}</p>
              {activeOrg?.taxId && (
                <p className="text-sm text-gray-600">N° Fiscal / RCCM / PIN : {activeOrg.taxId}</p>
              )}
              {activeOrg?.address && (
                <p className="text-sm text-gray-600">{activeOrg.address}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-[#111111] uppercase">BON DE LIVRAISON</h2>
              <p className="text-sm font-semibold mt-1">Réf : {printDelivery.deliveryNumber}</p>
              {printDelivery.invoice && (
                <p className="text-xs text-gray-600">
                  Facture associée : {printDelivery.invoice.invoiceNumber}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Date : {new Date(printDelivery.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-100 p-4 rounded-lg">
            <div>
              <p className="text-xs uppercase font-bold text-gray-500 mb-1">Destinataire :</p>
              <p className="text-lg font-bold">{printDelivery.client?.name}</p>
              {printDelivery.client?.phone && (
                <p className="text-sm text-gray-700">Tél : {printDelivery.client.phone}</p>
              )}
              <p className="text-sm text-gray-700">
                Lieu de livraison :{" "}
                {printDelivery.destination || printDelivery.client?.address || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-gray-500 mb-1">
                Informations Transport :
              </p>
              <p className="text-sm text-gray-800">
                <strong>Transporteur / Véhicule :</strong> {printDelivery.carrier || "Non spécifié"}
              </p>
              <p className="text-sm text-gray-800 mt-1">
                <strong>Colisage / Notes :</strong> {printDelivery.notes || "RAS"}
              </p>
            </div>
          </div>

          <table className="w-full text-left border-collapse mb-12">
            <thead>
              <tr className="border-b-2 border-[#111111] text-xs uppercase bg-gray-100">
                <th className="py-3 px-4">Désignation des marchandises</th>
                <th className="py-3 px-4 text-right">Quantité Livrée</th>
                <th className="py-3 px-4 text-center">Contrôle Réception</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 text-sm">
              {printDelivery.invoice?.items?.length > 0 ? (
                printDelivery.invoice.items.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-3 px-4">{item.description}</td>
                    <td className="py-3 px-4 text-right font-bold">{item.quantity}</td>
                    <td className="py-3 px-4 text-center text-gray-400">[  ] Conforme</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 px-4">
                    {printDelivery.notes || "Lot de marchandises selon accord"}
                  </td>
                  <td className="py-3 px-4 text-right font-bold">1 Lot</td>
                  <td className="py-3 px-4 text-center text-gray-400">[  ] Conforme</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-8 mt-16">
            <div className="border border-gray-400 p-4 rounded-lg h-32">
              <p className="text-xs font-bold uppercase text-gray-600">
                Cachet & Signature Expéditeur ({activeOrg?.name})
              </p>
            </div>
            <div className="border border-gray-400 p-4 rounded-lg h-32">
              <p className="text-xs font-bold uppercase text-gray-600">
                Nom, Date, Cachet & Signature Réceptionnaire
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Marchandises reçues en bon état
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}