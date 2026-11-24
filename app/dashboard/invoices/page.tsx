"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  RotateCcw,
  Edit3,
  Printer,
  CheckCircle2,
  Plus,
  Trash2,
  Eye,
  X,
} from "lucide-react";

interface LineItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
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

function createEmptyLine(): LineItem {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

function InvoicesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId") || "";
  const preselectedType = searchParams.get("type") === "CONFIRMED" ? "CONFIRMED" : "DRAFT";

  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mode Édition
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formulaire multi-produits
  const [docType, setDocType] = useState<"DRAFT" | "CONFIRMED">(preselectedType);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [clientId, setClientId] = useState(preselectedClientId);
  const [currency, setCurrency] = useState("USD");
  const [lines, setLines] = useState<LineItem[]>([createEmptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  // Ouverture d'un document pour consulter son contenu
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  // Impression PDF
  const [printDoc, setPrintDoc] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("nexa_user");
    if (!storedUser) {
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const prefix = preselectedType === "CONFIRMED" ? "BC" : "DEV";
      setInvoiceNumber(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
      if (preselectedClientId) {
        setClientId(preselectedClientId);
      }

      const orgId = parsedUser.organizations?.[0]?.id;
      if (orgId) {
        fetchInvoices(orgId);
        fetchClients(orgId);
        fetchProducts(orgId);
      } else {
        setLoading(false);
      }
    }
  }, [router, preselectedClientId, preselectedType]);

  const fetchInvoices = async (orgId: string) => {
    try {
      const res = await fetch(`/api/invoices?organizationId=${orgId}`);
      const data = await res.json();
      if (res.ok) setInvoices(data.invoices || []);
    } catch {
      setError("Erreur lors du chargement des documents.");
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async (orgId: string) => {
    try {
      const res = await fetch(`/api/clients?organizationId=${orgId}`);
      const data = await res.json();
      if (res.ok) setClients(data.clients || []);
    } catch {
      console.error("Erreur chargement clients");
    }
  };

  const fetchProducts = async (orgId: string) => {
    try {
      const res = await fetch(`/api/products?organizationId=${orgId}`);
      const data = await res.json();
      if (res.ok) setProducts(data.products || []);
    } catch {
      console.error("Erreur chargement produits");
    }
  };

  const handleSelectProductForLine = (lineId: string, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    setLines((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;
        if (!prod) {
          return { ...line, productId: prodId };
        }
        return {
          ...line,
          productId: prod.id,
          description: prod.description ? `${prod.name} - ${prod.description}` : prod.name,
          unitPrice: Number(prod.price),
        };
      })
    );
    if (prod?.currency) {
      setCurrency(prod.currency);
    }
  };

  const handleUpdateLine = (
    lineId: string,
    field: "description" | "quantity" | "unitPrice",
    value: string | number
  ) => {
    setLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, [field]: value } : line))
    );
  };

  const handleAddLine = () => {
    setLines((prev) => [...prev, createEmptyLine()]);
  };

  const handleRemoveLine = (lineId: string) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== lineId) : prev));
  };

  const handleDocTypeChange = (type: "DRAFT" | "CONFIRMED") => {
    setDocType(type);
    if (!editingId) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setInvoiceNumber(type === "DRAFT" ? `DEV-${randomNum}` : `BC-${randomNum}`);
    }
  };

  const handleStartEdit = (inv: any) => {
    setEditingId(inv.id);
    setDocType("DRAFT");
    setInvoiceNumber(inv.invoiceNumber);
    setClientId(inv.clientId);
    setCurrency(inv.currency);

    if (Array.isArray(inv.items) && inv.items.length > 0) {
      setLines(
        inv.items.map((item: any, idx: number) => ({
          id: item.id || `edit-line-${idx}`,
          productId: item.productId || "",
          description: item.description || "",
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
        }))
      );
    } else {
      setLines([createEmptyLine()]);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setDocType("DRAFT");
    setInvoiceNumber(`DEV-${randomNum}`);
    setClientId(preselectedClientId || "");
    setLines([createEmptyLine()]);
  };

  const totalEstimated = lines.reduce(
    (sum, l) => sum + Number(l.quantity || 0) * Number(l.unitPrice || 0),
    0
  );

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const orgId = user?.organizations?.[0]?.id;
    if (!orgId || !clientId) return;

    setSubmitting(true);
    setError("");

    const payloadItems = lines.map((l) => ({
      productId: l.productId || null,
      description: l.description.trim() || "Prestation / Produit B2B",
      quantity: Number(l.quantity) || 1,
      unitPrice: Number(l.unitPrice) || 0,
    }));

    try {
      if (editingId) {
        const res = await fetch("/api/invoices", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            invoiceNumber,
            clientId,
            currency,
            status: "DRAFT",
            items: payloadItems,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setInvoices(invoices.map((inv) => (inv.id === editingId ? data.invoice : inv)));
        handleCancelEdit();
      } else {
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceNumber,
            clientId,
            organizationId: orgId,
            currency,
            status: docType,
            items: payloadItems,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setInvoices([data.invoice, ...invoices]);
        handleCancelEdit();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setInvoices(invoices.map((inv) => (inv.id === id ? data.invoice : inv)));
        if (viewingDoc?.id === id) setViewingDoc(data.invoice);
        if (newStatus === "DRAFT" && editingId === id) {
          handleCancelEdit();
        }
      }
    } catch {
      setError("Erreur lors de la mise à jour du statut.");
    }
  };

  const activeOrg = user?.organizations?.[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#111111]/10 text-[#111111] border border-[#8A939B]/30">
            Brouillon
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFC300]/30 text-[#111111] border border-[#FFC300]">
            Bon de Commande
          </span>
        );
      case "SENT":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#111111] text-[#FFC300]">
            Facture Émise
          </span>
        );
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Payée
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
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
              Ventes : Devis, Commandes & Facturation
            </h1>
            <p className="text-sm text-white/80 mt-1">
              Devis & factures multi-produits, ouverture détaillée des documents et impression PDF
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
          {/* Formulaire multi-produits */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className={`bg-white border p-6 rounded-2xl h-fit shadow-sm transition-colors ${
              editingId ? "border-[#FFC300] ring-2 ring-[#FFC300]/40" : "border-[#8A939B]/30"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#FFC300]/25 text-[#111111] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </span>
                <h2 className="text-base font-extrabold text-[#111111]">
                  {editingId ? `Modifier ${invoiceNumber}` : "Nouveau document"}
                </h2>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-bold text-[#8A939B] hover:text-[#111111] underline"
                >
                  Annuler
                </button>
              )}
            </div>

            {!editingId && (
              <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-[#111111]/5 border border-[#8A939B]/25 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleDocTypeChange("DRAFT")}
                  className={`py-2 text-xs font-extrabold rounded-lg transition-colors cursor-pointer ${
                    docType === "DRAFT"
                      ? "bg-[#FFC300] text-[#111111]"
                      : "text-[#8A939B] hover:text-[#111111]"
                  }`}
                >
                  Devis (Brouillon)
                </button>
                <button
                  type="button"
                  onClick={() => handleDocTypeChange("CONFIRMED")}
                  className={`py-2 text-xs font-extrabold rounded-lg transition-colors cursor-pointer ${
                    docType === "CONFIRMED"
                      ? "bg-[#FFC300] text-[#111111]"
                      : "text-[#8A939B] hover:text-[#111111]"
                  }`}
                >
                  Bon de Commande
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">Référence *</label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">Devise</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                  >
                    <option value="USD">USD</option>
                    <option value="KES">KES</option>
                    <option value="CDF">CDF</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">Client B2B *</label>
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

              {/* Lignes multiples de produits */}
              <div className="border-t border-[#8A939B]/20 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-[#111111]">
                    Produits / Lignes ({lines.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFC300]/25 hover:bg-[#FFC300]/40 text-[#111111] text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter un produit
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {lines.map((line, index) => (
                    <div
                      key={line.id}
                      className="p-3 rounded-xl bg-[#111111]/[0.03] border border-[#8A939B]/25 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-[#8A939B]">
                          Ligne #{index + 1}
                        </span>
                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(line.id)}
                            className="text-[#8A939B] hover:text-red-600 p-0.5 cursor-pointer"
                            title="Supprimer cette ligne"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <select
                        value={line.productId}
                        onChange={(e) => handleSelectProductForLine(line.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#8A939B]/30 text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                      >
                        <option value="">-- Catalogue produit (optionnel) --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({Number(p.price).toLocaleString()} {p.currency})
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        required
                        placeholder="Description du produit / prestation"
                        value={line.description}
                        onChange={(e) => handleUpdateLine(line.id, "description", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#8A939B]/30 text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#8A939B] mb-1">
                            Qté
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            required
                            value={line.quantity}
                            onChange={(e) =>
                              handleUpdateLine(line.id, "quantity", Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#8A939B]/30 text-xs text-[#111111]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#8A939B] mb-1">
                            Prix U.
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={line.unitPrice}
                            onChange={(e) =>
                              handleUpdateLine(line.id, "unitPrice", Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#8A939B]/30 text-xs text-[#111111]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-sm font-bold text-[#111111]">
                <span>Total estimé :</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FFC300]/25 text-[#111111] font-extrabold text-sm">
                  {totalEstimated.toLocaleString("fr-FR")} {currency}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2.5 px-4 font-extrabold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer ${
                  editingId
                    ? "bg-[#111111] hover:bg-[#262626] text-[#FFC300]"
                    : "bg-[#FFC300] hover:bg-[#f2b800] text-[#111111]"
                }`}
              >
                {submitting
                  ? "Enregistrement..."
                  : editingId
                  ? "Enregistrer les corrections"
                  : docType === "DRAFT"
                  ? "Créer le Devis"
                  : "Créer le Bon de Commande"}
              </button>
            </form>
          </motion.div>

          {/* Liste des documents */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="lg:col-span-2 bg-white border border-[#8A939B]/30 p-6 rounded-2xl shadow-sm"
          >
            <h2 className="text-base font-extrabold text-[#111111] mb-4">
              Documents commerciaux ({invoices.length})
            </h2>

            {loading ? (
              <p className="text-sm text-[#8A939B] py-8 text-center">Chargement...</p>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-[#8A939B] py-8 text-center">
                Aucun document pour le moment.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#8A939B]/25 text-[11px] text-[#8A939B] uppercase font-bold">
                      <th className="py-3 px-3">Réf.</th>
                      <th className="py-3 px-3">Client</th>
                      <th className="py-3 px-3">Total</th>
                      <th className="py-3 px-3">Statut</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A939B]/20 text-sm">
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        onClick={() => setViewingDoc(inv)}
                        className="hover:bg-[#FFC300]/10 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-3 font-extrabold text-[#111111]">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-3 text-[#111111]/80 font-medium">
                          {inv.client?.name || "—"}
                        </td>
                        <td className="py-3.5 px-3 font-extrabold text-[#111111]">
                          {Number(inv.totalAmount).toLocaleString()} {inv.currency}
                        </td>
                        <td className="py-3.5 px-3">{getStatusBadge(inv.status)}</td>
                        <td
                          className="py-3.5 px-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingDoc(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#111111]/5 hover:bg-[#FFC300]/30 text-[#111111] border border-[#8A939B]/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              Ouvrir
                            </button>
                            {inv.status === "DRAFT" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(inv)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#111111]/5 hover:bg-[#111111]/10 text-[#111111] border border-[#8A939B]/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Modifier
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(inv.id, "CONFIRMED")}
                                  className="px-2.5 py-1 bg-[#FFC300] hover:bg-[#f2b800] text-[#111111] rounded-lg text-xs font-extrabold transition-colors cursor-pointer"
                                >
                                  Confirmer
                                </button>
                              </>
                            )}
                            {inv.status === "CONFIRMED" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(inv.id, "DRAFT")}
                                  title="Remettre en brouillon pour corriger"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#111111]/5 hover:bg-[#111111]/10 text-[#111111] border border-[#8A939B]/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Brouillon
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(inv.id, "SENT")}
                                  className="px-2.5 py-1 bg-[#111111] hover:bg-[#262626] text-[#FFC300] rounded-lg text-xs font-extrabold transition-colors cursor-pointer"
                                >
                                  Émettre Facture
                                </button>
                              </>
                            )}
                            {inv.status === "SENT" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(inv.id, "DRAFT")}
                                  title="Remettre en brouillon pour corriger"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#111111]/5 hover:bg-[#111111]/10 text-[#111111] border border-[#8A939B]/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Brouillon
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(inv.id, "PAID")}
                                  className="px-2.5 py-1 bg-[#FFC300] hover:bg-[#f2b800] text-[#111111] rounded-lg text-xs font-extrabold transition-colors cursor-pointer"
                                >
                                  Marquer Payée
                                </button>
                              </>
                            )}
                            {inv.status === "PAID" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(inv.id, "DRAFT")}
                                title="Annuler le paiement et remettre en brouillon"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#111111]/5 hover:bg-[#111111]/10 text-[#111111] border border-[#8A939B]/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Brouillon
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setPrintDoc(inv);
                                setTimeout(() => window.print(), 200);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#111111] hover:bg-[#262626] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Printer className="w-3 h-3 text-[#FFC300]" />
                              {inv.status === "PAID" ? "Reçu PDF" : "PDF"}
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

      {/* MODAL DE CONSULTATION DU CONTENU D'UN DOCUMENT */}
      {viewingDoc && (
        <div
          onClick={() => setViewingDoc(null)}
          className="fixed inset-0 z-50 bg-[#111111]/70 flex items-center justify-center p-4 print:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#8A939B]/40 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#8A939B]/20 pb-4">
              <div>
                {getStatusBadge(viewingDoc.status)}
                <h3 className="text-xl font-extrabold text-[#111111] mt-2">
                  {viewingDoc.invoiceNumber} — {viewingDoc.client?.name || "Client"}
                </h3>
                <p className="text-xs text-[#8A939B] mt-0.5">
                  Créé le {new Date(viewingDoc.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="p-2 rounded-xl bg-[#111111]/5 hover:bg-[#111111]/10 text-[#111111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-[#8A939B]/25 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#111111]/5 border-b border-[#8A939B]/20 text-[#111111] font-extrabold">
                    <th className="py-2.5 px-3">Produit / Description</th>
                    <th className="py-2.5 px-3 text-right">Qté</th>
                    <th className="py-2.5 px-3 text-right">Prix U.</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8A939B]/15">
                  {(viewingDoc.items || []).map((item: any, idx: number) => (
                    <tr key={item.id || idx}>
                      <td className="py-2.5 px-3 font-semibold text-[#111111]">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#111111]">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-[#8A939B]">
                        {Number(item.unitPrice).toLocaleString("fr-FR")} {viewingDoc.currency}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-[#111111]">
                        {(
                          item.total !== undefined
                            ? Number(item.total)
                            : Number(item.quantity || 0) * Number(item.unitPrice || 0)
                        ).toLocaleString("fr-FR")}{" "}
                        {viewingDoc.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#8A939B]/20">
              <div>
                <span className="text-xs text-[#8A939B] block">Total</span>
                <span className="text-xl font-extrabold text-[#111111]">
                  {Number(viewingDoc.totalAmount).toLocaleString("fr-FR")} {viewingDoc.currency}
                </span>
              </div>

              <div className="flex gap-2">
                {viewingDoc.status === "DRAFT" && (
                  <button
                    type="button"
                    onClick={() => {
                      const docToEdit = viewingDoc;
                      setViewingDoc(null);
                      handleStartEdit(docToEdit);
                    }}
                    className="py-2 px-4 rounded-xl bg-[#FFC300] text-[#111111] font-extrabold text-xs cursor-pointer"
                  >
                    Modifier
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPrintDoc(viewingDoc);
                    setTimeout(() => window.print(), 200);
                  }}
                  className="py-2 px-4 rounded-xl bg-[#111111] text-[#FFC300] font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODÈLE D'IMPRESSION PDF OFFICIEL */}
      {printDoc && (
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
              <h2 className="text-2xl font-bold uppercase text-[#111111]">
                {printDoc.status === "DRAFT"
                  ? "DEVIS / PROFORMA"
                  : printDoc.status === "CONFIRMED"
                  ? "BON DE COMMANDE"
                  : printDoc.status === "PAID"
                  ? "REÇU DE PAIEMENT"
                  : "FACTURE OFFICIELLE"}
              </h2>
              <p className="text-sm font-semibold mt-1">
                {printDoc.status === "PAID"
                  ? `Reçu N° REC-${printDoc.invoiceNumber}`
                  : `Réf : ${printDoc.invoiceNumber}`}
              </p>
              <p className="text-xs text-gray-500">
                Date : {new Date(printDoc.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          <div className="mb-8 bg-gray-100 p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-xs uppercase font-bold text-gray-500 mb-1">
                {printDoc.status === "PAID" ? "Reçu de la part de :" : "Client :"}
              </p>
              <p className="text-lg font-bold">{printDoc.client?.name}</p>
              {printDoc.client?.email && <p className="text-sm text-gray-700">{printDoc.client.email}</p>}
              {printDoc.client?.phone && <p className="text-sm text-gray-700">{printDoc.client.phone}</p>}
              {printDoc.client?.address && (
                <p className="text-sm text-gray-700">{printDoc.client.address}</p>
              )}
            </div>

            {printDoc.status === "PAID" && (
              <div className="border-4 border-[#111111] bg-[#FFC300] text-[#111111] px-6 py-2 rounded-xl font-black text-xl uppercase tracking-widest transform -rotate-6">
                PAYÉ / SOLDÉ
              </div>
            )}
          </div>

          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="border-b-2 border-[#111111] text-xs uppercase bg-gray-100">
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Quantité</th>
                <th className="py-3 px-4 text-right">Prix Unitaire</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 text-sm">
              {printDoc.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-3 px-4">{item.description}</td>
                  <td className="py-3 px-4 text-right">{item.quantity}</td>
                  <td className="py-3 px-4 text-right">
                    {Number(item.unitPrice).toLocaleString()} {printDoc.currency}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    {Number(item.total).toLocaleString()} {printDoc.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-72 bg-[#111111] text-white p-4 rounded-lg text-right">
              <p className="text-xs uppercase text-gray-300">
                {printDoc.status === "PAID" ? "Total Encaissé" : "Total Général"}
              </p>
              <p className="text-2xl font-bold text-[#FFC300] mt-1">
                {Number(printDoc.totalAmount).toLocaleString()} {printDoc.currency}
              </p>
            </div>
          </div>

          <div className="mt-16 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
            Document généré par Nexa ERP — {activeOrg?.name}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111111]" />}>
      <InvoicesPageInner />
    </Suspense>
  );
}