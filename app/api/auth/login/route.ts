import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 1. Vérification des champs
    if (!email || !password) {
      return NextResponse.json(
        { error: "Veuillez renseigner votre email et votre mot de passe." },
        { status: 400 }
      );
    }

    // 2. Rechercher l'utilisateur et inclure ses organisations (multi-tenant)
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    // 3. Vérifier le mot de passe haché
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    // 4. Succès : Retourner les données utilisateur et ses accès d'entreprise
    return NextResponse.json(
      {
        message: "Connexion réussie !",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organizations: user.memberships.map((m) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            role: m.role,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur lors de la connexion :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}