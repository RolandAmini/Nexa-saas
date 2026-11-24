import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. LISTER LES PRODUITS & SERVICES (Filtrés par organisation)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "L'identifiant de l'organisation est requis." },
        { status: 400 }
      );
    }

    const products = await prisma.product.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products }, { status: 200 });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des produits :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

// 2. CRÉER UN NOUVEAU PRODUIT OU SERVICE
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, currency, organizationId } = body;

    if (!name || price === undefined || !organizationId) {
      return NextResponse.json(
        { error: "Le nom, le prix et l'organisation sont obligatoires." },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: Number(price),
        currency: currency || "USD",
        organizationId,
      },
    });

    return NextResponse.json(
      { message: "Produit ajouté au catalogue avec succès !", product },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur lors de la création du produit :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}