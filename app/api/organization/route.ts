import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "ID de l'organisation requis." },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization }, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération organisation :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, name, taxId, address, logoUrl } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "ID de l'organisation requis." },
        { status: 400 }
      );
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(name !== undefined && { name }),
        ...(taxId !== undefined && { taxId: taxId || null }),
        ...(address !== undefined && { address: address || null }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      },
    });

    return NextResponse.json({ organization: updatedOrg }, { status: 200 });
  } catch (error) {
    console.error("Erreur mise à jour organisation :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour." },
      { status: 500 }
    );
  }
}