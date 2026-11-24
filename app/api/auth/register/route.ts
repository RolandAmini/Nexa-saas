import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, organizationName, organizationSlug } = body;

    // 1. Vérification des champs obligatoires
    if (!email || !password || !organizationName || !organizationSlug) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires ne sont pas remplis." },
        { status: 400 }
      );
    }

    // 2. Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé." },
        { status: 400 }
      );
    }

    // 3. Hacher le mot de passe
    const passwordHash = await hashPassword(password);

    // 4. Créer l'utilisateur, son organisation et son rôle en une transaction atomique
    const result = await prisma.$transaction(async (tx) => {
      // Création de l'utilisateur
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
        },
      });

      // Création de l'organisation (Espace multi-tenant)
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: organizationSlug,
        },
      });

      // Liaison de l'utilisateur à l'organisation en tant qu'OWNER
      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "OWNER",
        },
      });

      return { user, organization, membership };
    });

    return NextResponse.json(
      {
        message: "Compte et organisation créés avec succès !",
        userId: result.user.id,
        organizationId: result.organization.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur lors de l'inscription :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}