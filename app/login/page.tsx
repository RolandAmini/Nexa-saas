"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Identifiants incorrects.");
      }

      // Stocker les informations utilisateur dans le localStorage pour la session
      localStorage.setItem("nexa_user", JSON.stringify(data.user));

      // Redirection vers le tableau de bord
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Connexion à Nexa</h1>
        <p className="text-sm text-gray-400 mt-2">Accédez à votre espace CRM & Facturation</p>
      </div>

      {registered && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg">
          Compte créé avec succès ! Connectez-vous dès maintenant.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Email professionnel</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            placeholder="vous@entreprise.com"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Mot de passe</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 mt-2"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-6">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-indigo-400 hover:underline">
          Créer un espace
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-4">
      <Suspense fallback={<div className="text-gray-400 text-sm">Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}