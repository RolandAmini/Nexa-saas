import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID requis" }, { status: 400 });
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { organizationId },
      include: { supplier: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ purchaseOrders }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { poNumber, supplierId, organizationId, currency, totalAmount, notes, status } = body;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        organizationId,
        currency: currency || "USD",
        totalAmount: Number(totalAmount) || 0,
        notes,
        status: status || "DRAFT",
      },
      include: { supplier: true },
    });

    return NextResponse.json({ purchaseOrder }, { status: 201 });
  } catch (error) {
    console.error("Erreur création PO :", error);
    return NextResponse.json({ error: "Erreur lors de la création du bon d'achat." }, { status: 500 });
  }
}