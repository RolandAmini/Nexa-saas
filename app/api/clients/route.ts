import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. LISTER LES CLIENTS (Filtrés par organisation pour le multi-tenant)
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

    const clients = await prisma.client.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ clients }, { status: 200 });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des clients :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

// 2. CRÉER UN NOUVEAU CLIENT
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, address, organizationId } = body;

    if (!name || !organizationId) {
      return NextResponse.json(
        { error: "Le nom du client et l'organisation sont obligatoires." },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
        organizationId,
      },
    });

    return NextResponse.json(
      { message: "Client créé avec succès !", client },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur lors de la création du client :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}