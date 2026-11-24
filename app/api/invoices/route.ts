import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. LISTER LES DEVIS, COMMANDES & FACTURES
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

    const invoices = await prisma.invoice.findMany({
      where: { organizationId },
      include: {
        client: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invoices }, { status: 200 });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des documents :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

// 2. CRÉER UN DEVIS, BON DE COMMANDE OU FACTURE
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoiceNumber, clientId, organizationId, currency, status, items } = body;

    if (!invoiceNumber || !clientId || !organizationId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Informations incomplètes pour créer le document." },
        { status: 400 }
      );
    }

    let totalAmount = 0;
    const formattedItems = items.map((item: any) => {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice);
      totalAmount += itemTotal;
      return {
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: itemTotal,
        productId: item.productId || null,
      };
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        currency: currency || "USD",
        totalAmount,
        status: status || "DRAFT",
        clientId,
        organizationId,
        items: {
          create: formattedItems,
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    return NextResponse.json(
      { message: "Document créé avec succès !", invoice },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur lors de la création :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

// 3. METTRE À JOUR UN DOCUMENT (Changement de statut / Remise en brouillon / Édition complète)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, invoiceNumber, clientId, currency, items } = body;

    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant du document est requis." },
        { status: 400 }
      );
    }

    // Cas A : Édition complète d'un brouillon (mise à jour des lignes et du montant total)
    if (items && Array.isArray(items) && items.length > 0) {
      let totalAmount = 0;
      const formattedItems = items.map((item: any) => {
        const itemTotal = Number(item.quantity) * Number(item.unitPrice);
        totalAmount += itemTotal;
        return {
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: itemTotal,
          productId: item.productId || null,
        };
      });

      const updatedInvoice = await prisma.$transaction(async (tx) => {
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });

        return tx.invoice.update({
          where: { id },
          data: {
            ...(invoiceNumber && { invoiceNumber }),
            ...(clientId && { clientId }),
            ...(currency && { currency }),
            ...(status && { status }),
            totalAmount,
            items: {
              create: formattedItems,
            },
          },
          include: {
            client: true,
            items: true,
          },
        });
      });

      return NextResponse.json({ invoice: updatedInvoice }, { status: 200 });
    }

    // Cas B : Changement de statut simple (ex: CONFIRMED -> DRAFT, SENT -> DRAFT, PAID -> DRAFT)
    if (!status) {
      return NextResponse.json(
        { error: "Le nouveau statut est requis." },
        { status: 400 }
      );
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        items: true,
      },
    });

    return NextResponse.json({ invoice: updatedInvoice }, { status: 200 });
  } catch (error: any) {
    console.error("Erreur mise à jour document :", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le document." },
      { status: 500 }
    );
  }
}