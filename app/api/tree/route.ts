import { NextRequest, NextResponse } from "next/server";

import { AuthError, requireSession } from "@/features/auth/server/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireSession(req);

    const persons = await prisma.person.findMany({
      select: {
        id: true,
        parentMarriageId: true,
        firstNameArabic: true,
        middleNameArabic: true,
        lastNameArabic: true,
        firstName: true,
        middleName: true,
        lastName: true,
        isMale: true,
        isAlive: true,
        birthYear: true,
        birthMonth: true,
        birthDay: true,
        birthCity: true,
        birthCountryCode: true,
        deathYear: true,
        deathMonth: true,
        deathDay: true,
        deathCity: true,
        deathCountryCode: true,
        parentMarriage: {
          select: {
            id: true,
            firstPartnerId: true,
            secondPartnerId: true,
          },
        },
      },
      orderBy: [{ birthYear: "asc" }, { id: "asc" }],
    });

    const marriages = await prisma.marriage.findMany({
      select: {
        id: true,
        firstPartnerId: true,
        secondPartnerId: true,
        firstPartner: {
          select: {
            id: true,
            firstNameArabic: true,
            middleNameArabic: true,
            lastNameArabic: true,
            firstName: true,
            middleName: true,
            lastName: true,
            birthYear: true,
            birthMonth: true,
            birthDay: true,
          },
        },
        secondPartner: {
          select: {
            id: true,
            firstNameArabic: true,
            middleNameArabic: true,
            lastNameArabic: true,
            firstName: true,
            middleName: true,
            lastName: true,
            birthYear: true,
            birthMonth: true,
            birthDay: true,
          },
        },
      },
      orderBy: [{ id: "asc" }],
    });

    return NextResponse.json({
      ok: true,
      sentinel: "ZLITNI",
      persons,
      marriages,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.status },
      );
    }

    console.error("TREE_GET_ERROR:", error);
    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
