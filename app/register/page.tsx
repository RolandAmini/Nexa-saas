"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
    organizationSlug: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      // Redirection vers la page de connexion après succès
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-4">
      <div className="max-w-md w-full bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Créer votre espace Nexa</h1>
          <p className="text-sm text-gray-400 mt-2">Initialisez votre CRM & Facturation multi-tenant</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Nom complet</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Ex: Roland Amini"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Email professionnel</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              placeholder="vous@entreprise.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Mot de passe sécurisé</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <hr className="border-gray-800 my-4" />

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Nom de l'entreprise (Organisation)</label>
            <input
              type="text"
              name="organizationName"
              required
              value={formData.organizationName}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Ex: Olidor SARL"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Identifiant unique (Slug)</label>
            <input
              type="text"
              name="organizationSlug"
              required
              value={formData.organizationSlug}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Ex: olidor-sarl"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? "Création en cours..." : "S'inscrire et lancer Nexa"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-indigo-400 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}