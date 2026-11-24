"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Package, PlusCircle, Tag } from "lucide-react";

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

export default function ProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulaire d'ajout de produit
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("nexa_user");
    if (!storedUser) {
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const orgId = parsedUser.organizations?.[0]?.id;
      if (orgId) {
        fetchProducts(orgId);
      } else {
        setLoading(false);
      }
    }
  }, [router]);

  const fetchProducts = async (orgId: string) => {
    try {
      const res = await fetch(`/api/products?organizationId=${orgId}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      } else {
        setError(data.error || "Erreur lors du chargement du catalogue.");
      }
    } catch (err) {
      setError("Erreur lors du chargement du catalogue.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const orgId = user?.organizations?.[0]?.id;
    if (!orgId) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          currency,
          organizationId: orgId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création.");
      }

      setProducts([data.product, ...products]);
      setName("");
      setDescription("");
      setPrice("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
              Catalogue Produits & Services
            </h1>
            <p className="text-sm text-white/80 mt-1">
              Référentiel des articles, spécifications et tarifs B2B
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
                <PlusCircle className="w-4 h-4" />
              </span>
              <h2 className="text-base font-extrabold text-[#111111]">Nouveau produit / service</h2>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Nom de l'article *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                  placeholder="Ex: Lot B2B / Transport Fret"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Description / Spécifications
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111] resize-none"
                  placeholder="Détails techniques, conditionnement..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    Prix unitaire *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">Devise</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#111111]/5 border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KES">KES (Ksh)</option>
                    <option value="CDF">CDF (FC)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FFC300] hover:bg-[#f2b800] text-[#111111] font-extrabold text-xs transition-colors disabled:opacity-50 mt-2"
              >
                {submitting ? "Enregistrement..." : "Ajouter au catalogue"}
              </button>
            </form>
          </motion.div>

          {/* Liste des produits */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="lg:col-span-2 bg-white border border-[#8A939B]/30 p-6 rounded-2xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#111111]/5 border border-[#8A939B]/20 text-[#111111] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </span>
                <h2 className="text-base font-extrabold text-[#111111]">
                  Articles référencés ({products.length})
                </h2>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-[#8A939B] py-8 text-center">
                Chargement du catalogue...
              </p>
            ) : products.length === 0 ? (
              <p className="text-sm text-[#8A939B] py-8 text-center">
                Aucun produit ou service enregistré pour le moment.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#8A939B]/25 text-[11px] text-[#8A939B] uppercase font-bold">
                      <th className="py-3 px-4">Article</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Prix unitaire</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A939B]/20 text-sm">
                    {products.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#111111]/5 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-extrabold text-[#111111]">
                          <span className="inline-flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-[#8A939B]" />
                            {item.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#8A939B]">{item.description || "—"}</td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-[#111111]">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-[#FFC300]/20 text-[#111111] text-xs">
                            {Number(item.price).toLocaleString()} {item.currency}
                          </span>
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