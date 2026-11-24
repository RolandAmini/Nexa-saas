import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. LISTER LES BONS DE LIVRAISON
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json({ error: "Organisation requise." }, { status: 400 });
    }

    const deliveries = await prisma.delivery.findMany({
      where: { organizationId },
      include: {
        client: true,
        invoice: {
          include: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ deliveries }, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération livraisons :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// 2. CRÉER UN BON DE LIVRAISON
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deliveryNumber, clientId, invoiceId, carrier, destination, notes, organizationId } = body;

    if (!deliveryNumber || !clientId || !organizationId) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }

    const delivery = await prisma.delivery.create({
      data: {
        deliveryNumber,
        clientId,
        invoiceId: invoiceId || null,
        carrier: carrier || null,
        destination: destination || null,
        notes: notes || null,
        organizationId,
      },
      include: {
        client: true,
        invoice: {
          include: { items: true },
        },
      },
    });

    return NextResponse.json({ delivery }, { status: 201 });
  } catch (error) {
    console.error("Erreur création livraison :", error);
    return NextResponse.json({ error: "Impossible de créer le bon de livraison." }, { status: 500 });
  }
}

// 3. METTRE À JOUR LE STATUT DE LIVRAISON (En préparation -> En transit -> Livré)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const updated = await prisma.delivery.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        invoice: {
          include: { items: true },
        },
      },
    });

    return NextResponse.json({ delivery: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur mise à jour statut." }, { status: 500 });
  }
}