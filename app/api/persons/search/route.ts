import { NextRequest, NextResponse } from "next/server";

import { AuthError, requireSession } from "@/features/auth/server/session";
import { rankPersonSearchResults } from "@/components/custom/person-search";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_SEARCH_POOL = 1000;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 40;

export async function GET(req: NextRequest) {
  try {
    await requireSession(req);

    const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const requestedLimit = Number(req.nextUrl.searchParams.get("limit"));
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;

    const persons = await prisma.person.findMany({
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
      orderBy: [
        { lastNameArabic: "asc" },
        { firstNameArabic: "asc" },
        { id: "asc" },
      ],
      take: MAX_SEARCH_POOL,
    });

    return NextResponse.json({
      ok: true,
      persons: rankPersonSearchResults(persons, query).slice(0, limit),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.status },
      );
    }

    console.error("PERSON_SEARCH_ERROR:", error);
    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
