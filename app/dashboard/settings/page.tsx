"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, CheckCircle2, Building2, Image as ImageIcon } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeOrg, setActiveOrg] = useState<any>(null);

  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("nexa_user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const parsed = JSON.parse(storedUser);
    setUser(parsed);
    const org = parsed.organizations?.[0];
    if (org) {
      setActiveOrg(org);
      setName(org.name || "");
      setTaxId(org.taxId || "");
      setAddress(org.address || "");
      setLogoUrl(org.logoUrl || "");
      fetchLatestOrg(org.id);
    }
  }, [router]);

  const fetchLatestOrg = async (orgId: string) => {
    try {
      const res = await fetch(`/api/organization?organizationId=${orgId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.organization) {
          setActiveOrg(data.organization);
          setName(data.organization.name || "");
          setTaxId(data.organization.taxId || "");
          setAddress(data.organization.address || "");
          setLogoUrl(data.organization.logoUrl || "");
        }
      }
    } catch {
      // Conserve les valeurs locales si l'endpoint GET n'est pas encore exposé
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setMessage("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner un fichier image valide (PNG, JPG, WEBP, SVG).");
      return;
    }

    const maxSizeBytes = 1.5 * 1024 * 1024; // 1.5 Mo
    if (file.size > maxSizeBytes) {
      setError("La taille du logo ne doit pas dépasser 1,5 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    setMessage("Logo retiré du brouillon. Cliquez sur « Enregistrer les paramètres » pour valider.");
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg?.id) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: activeOrg.id,
          name,
          taxId,
          address,
          logoUrl: logoUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour.");
      }

      const updatedOrg = data.organization || {
        ...activeOrg,
        name,
        taxId,
        address,
        logoUrl: logoUrl || null,
      };

      setActiveOrg(updatedOrg);

      // Synchronise le localStorage pour que le layout et les PDF reflètent immédiatement le nouveau logo
      if (user) {
        const updatedUser = {
          ...user,
          organizations: [updatedOrg, ...(user.organizations?.slice(1) || [])],
        };
        setUser(updatedUser);
        localStorage.setItem("nexa_user", JSON.stringify(updatedUser));
      }

      setMessage("Paramètres et logo enregistrés avec succès.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#8A939B]/25">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111111]">
            Paramètres & Identité Visuelle
          </h1>
          <p className="text-sm text-[#8A939B] mt-1">
            Gérez le logo officiel, les mentions légales et les coordonnées de votre organisation
          </p>
        </div>

        <div className="bg-white border border-[#8A939B]/25 px-4 py-2.5 rounded-xl">
          <span className="text-[11px] uppercase tracking-wider text-[#8A939B] font-bold block">
            Organisation
          </span>
          <span className="text-sm font-bold text-[#111111]">{activeOrg?.name || "Chargement..."}</span>
        </div>
      </header>

      {message && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte Upload & Aperçu Logo */}
        <div className="bg-white border border-[#8A939B]/25 rounded-2xl p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-4 h-4 text-[#111111]" />
              <h2 className="text-base font-bold text-[#111111]">Logo de l'entreprise</h2>
            </div>

            <div className="w-full h-40 rounded-xl bg-[#F8F9FA] border border-dashed border-[#8A939B]/50 flex items-center justify-center p-4 overflow-hidden">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Aperçu du logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-[#8A939B] font-medium text-center">
                  Aucun logo défini
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FFC300] hover:bg-[#f2b800] text-[#111111] font-bold text-xs cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>{logoUrl ? "Changer le logo" : "Téléverser un logo"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {logoUrl && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-red-50 text-[#8A939B] hover:text-red-600 border border-[#8A939B]/30 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer le logo</span>
              </button>
            )}

            <p className="text-[11px] text-[#8A939B] text-center">
              PNG, JPG, WEBP ou SVG • Max 1,5 Mo
            </p>
          </div>
        </div>

        {/* Carte Informations Légales */}
        <div className="lg:col-span-2 bg-white border border-[#8A939B]/25 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-[#111111]" />
            <h2 className="text-base font-bold text-[#111111]">Informations de l'organisation</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1.5">
              Raison sociale / Nom commercial *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1.5">
              Identifiant fiscal (RCCM, Id. Nat., KRA PIN...)
            </label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="Ex: CD/KGO/RCCM/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1.5">
              Adresse du siège / Bureau
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Nairobi / Goma..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#8A939B]/30 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 rounded-xl bg-[#111111] hover:bg-[#262626] text-white font-bold text-sm transition-colors disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}