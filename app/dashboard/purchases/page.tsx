"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PurchasesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulaire
  const [poNumber, setPoNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [totalAmount, setTotalAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("nexa_user");
    if (!storedUser) {
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setPoNumber(`PO-${Math.floor(1000 + Math.random() * 9000)}`);
      const orgId = parsedUser.organizations?.[0]?.id;
      if (orgId) {
        fetchData(orgId);
      }
    }
  }, [router]);

  const fetchData = async (orgId: string) => {
    try {
      const [poRes, supRes] = await Promise.all([
        fetch(`/api/purchases?organizationId=${orgId}`),
        fetch(`/api/suppliers?organizationId=${orgId}`), // (Vous pouvez créer une route api/suppliers similaire aux clients)
      ]);
      const poData = await poRes.json();
      if (poRes.ok) setPurchases(poData.purchaseOrders || []);
    } catch (err) {
      setError("Erreur chargement des achats.");
    } finally {
      setLoading(false);
    }
  };

  const activeOrg = user?.organizations?.[0];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">N</div>
            <span className="text-xl font-bold tracking-tight">Nexa SaaS</span>
          </div>

          <nav className="space-y-1">
            <a href="/dashboard" className="block px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white text-sm font-medium transition-colors">
              Tableau de bord
            </a>
            <a href="/dashboard/clients" className="block px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white text-sm font-medium transition-colors">
              Clients (CRM)
            </a>
            <a href="/dashboard/products" className="block px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white text-sm font-medium transition-colors">
              Catalogue Produits
            </a>
            <a href="/dashboard/invoices" className="block px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white text-sm font-medium transition-colors">
              Ventes & Facturation
            </a>
            <a href="/dashboard/deliveries" className="block px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white text-sm font-medium transition-colors">
              Logistique & Livraisons
            </a>
            <a href="/dashboard/purchases" className="block px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium">
              Achats & Bons de Commande
            </a>
            <a href="/dashboard/settings" className="block px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white text-sm font-medium transition-colors">
              Paramètres & Logo
            </a>
          </nav>
        </div>

        <div>
          <button
            onClick={() => {
              localStorage.removeItem("nexa_user");
              router.push("/login");
            }}
            className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold">Achats & Bons de Commande Fournisseurs</h2>
            <p className="text-sm text-gray-400 mt-0.5">Pilotez vos approvisionnements et coûts d'acquisition</p>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 px-4 py-2.5 rounded-xl text-right">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Organisation active</p>
            <p className="text-sm font-bold text-indigo-400">{activeOrg?.name || "Chargement..."}</p>
          </div>
        </header>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-4">Bons de commande émis ({purchases.length})</h3>
          <p className="text-sm text-gray-400">Module d'achat prêt à être configuré selon vos flux d'approvisionnement spécifiques.</p>
        </div>
      </main>
    </div>
  );
}