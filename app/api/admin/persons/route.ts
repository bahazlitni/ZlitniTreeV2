import { NextRequest, NextResponse } from "next/server";

import { AuthError } from "@/features/auth/server/session";
import {
  getBirthDateError,
  getDeathDateError,
  hasBirthDatePatch,
  hasDeathDatePatch,
  mergeBirthDatePatch,
  mergeDeathDatePatch,
  parseIdList,
  parsePersonPatch,
  personRelationInclude,
  requireTreeManager,
  serializePerson,
} from "@/features/admin/server/tree";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function mutationError(message = "Could not save person data.") {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

function hasPatchValues(patch: Record<string, unknown>) {
  return Object.keys(patch).length > 0;
}

const MAX_PAGE_SIZE = 100;

type PersonSortKey =
  | "id"
  | "parentMarriage"
  | "firstNameArabic"
  | "lastNameArabic"
  | "firstName"
  | "lastName"
  | "isMale"
  | "isAlive";

type SortDirection = "asc" | "desc";
type IdRow = { id: number };

function parsePageOptions(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get("limit");

  if (!limitParam) return null;

  const requestedLimit = Number(limitParam);
  const requestedOffset = Number(req.nextUrl.searchParams.get("offset") ?? 0);

  return {
    limit:
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, MAX_PAGE_SIZE)
        : 32,
    offset:
      Number.isInteger(requestedOffset) && requestedOffset > 0
        ? requestedOffset
        : 0,
    query: req.nextUrl.searchParams.get("q")?.trim() ?? "",
    sort: parsePersonSortKey(req.nextUrl.searchParams.get("sort")),
    direction: parseSortDirection(req.nextUrl.searchParams.get("direction")),
  };
}

function parsePersonSortKey(value: string | null): PersonSortKey | null {
  switch (value) {
    case "id":
    case "parentMarriage":
    case "firstNameArabic":
    case "lastNameArabic":
    case "firstName":
    case "lastName":
    case "isMale":
    case "isAlive":
      return value;
    default:
      return null;
  }
}

function parseSortDirection(value: string | null): SortDirection {
  return value === "desc" ? "desc" : "asc";
}

function directionSql(direction: SortDirection) {
  return direction === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
}

function personOrderBy(sort: PersonSortKey | null, direction: SortDirection) {
  const directionFragment = directionSql(direction);

  switch (sort) {
    case "id":
      return Prisma.sql`p."id" ${directionFragment}`;
    case "parentMarriage":
      return Prisma.sql`NULLIF(CONCAT_WS(' ', parent_fp."firstname_arabic", parent_fp."middlename_arabic", parent_fp."lastname_arabic", parent_fp."firstname", parent_fp."middlename", parent_fp."lastname", parent_sp."firstname_arabic", parent_sp."middlename_arabic", parent_sp."lastname_arabic", parent_sp."firstname", parent_sp."middlename", parent_sp."lastname"), '') ${directionFragment} NULLS LAST, p."id" ASC`;
    case "firstNameArabic":
      return Prisma.sql`p."firstname_arabic" ${directionFragment} NULLS LAST, p."id" ASC`;
    case "lastNameArabic":
      return Prisma.sql`p."lastname_arabic" ${directionFragment} NULLS LAST, p."id" ASC`;
    case "firstName":
      return Prisma.sql`p."firstname" ${directionFragment} NULLS LAST, p."id" ASC`;
    case "lastName":
      return Prisma.sql`p."lastname" ${directionFragment} NULLS LAST, p."id" ASC`;
    case "isMale":
      return Prisma.sql`p."is_male" ${directionFragment} NULLS LAST, p."id" ASC`;
    case "isAlive":
      return Prisma.sql`p."is_alive" ${directionFragment} NULLS LAST, p."id" ASC`;
    default:
      return Prisma.sql`p."lastname_arabic" ASC NULLS LAST, p."firstname_arabic" ASC NULLS LAST, p."id" ASC`;
  }
}

function personSearchWhere(query: string) {
  if (!query) return Prisma.empty;

  const like = `%${query.toLowerCase()}%`;

  return Prisma.sql`
    WHERE
      LOWER(p."id"::text) LIKE ${like}
      OR LOWER(COALESCE(p."firstname_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(p."middlename_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(p."lastname_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(p."firstname", '')) LIKE ${like}
      OR LOWER(COALESCE(p."middlename", '')) LIKE ${like}
      OR LOWER(COALESCE(p."lastname", '')) LIKE ${like}
      OR LOWER(COALESCE(parent_fp."firstname_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(parent_fp."middlename_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(parent_fp."lastname_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(parent_fp."firstname", '')) LIKE ${like}
      OR LOWER(COALESCE(parent_fp."middlename", '')) LIKE ${like}
      OR LOWER(COALESCE(parent_fp."lastname", '')) LIKE ${like}
      OR LOWER(COALESCE(parent_sp."firstname_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(parent_sp."middlename_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(parent_sp."lastname_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(parent_sp."firstname", '')) LIKE ${like}
      OR LOWER(COALESCE(parent_sp."middlename", '')) LIKE ${like}
      OR LOWER(COALESCE(parent_sp."lastname", '')) LIKE ${like}
  `;
}

export async function GET(req: NextRequest) {
  try {
    await requireTreeManager(req);
    const pageOptions = parsePageOptions(req);

    if (pageOptions) {
      const rows = await prisma.$queryRaw<IdRow[]>(Prisma.sql`
        SELECT p."id"
        FROM "public"."persons" AS p
        LEFT JOIN "public"."marriages" AS parent_m ON parent_m."id" = p."parent_marriage_id"
        LEFT JOIN "public"."persons" AS parent_fp ON parent_fp."id" = parent_m."first_partner_id"
        LEFT JOIN "public"."persons" AS parent_sp ON parent_sp."id" = parent_m."second_partner_id"
        ${personSearchWhere(pageOptions.query)}
        ORDER BY ${personOrderBy(pageOptions.sort, pageOptions.direction)}
        LIMIT ${pageOptions.limit + 1}
        OFFSET ${pageOptions.offset}
      `);
      const ids = rows.slice(0, pageOptions.limit).map((row) => row.id);
      const persons = ids.length
        ? await prisma.person.findMany({
            where: { id: { in: ids } },
            include: personRelationInclude,
          })
        : [];
      const personsById = new Map(persons.map((person) => [person.id, person]));
      const orderedPersons = ids
        .map((id) => personsById.get(id))
        .filter((person) => person !== undefined);

      return NextResponse.json({
        ok: true,
        persons: orderedPersons.map(serializePerson),
        hasMore: rows.length > pageOptions.limit,
        nextOffset: pageOptions.offset + orderedPersons.length,
      });
    }

    const persons = await prisma.person.findMany({
      orderBy: [
        { lastNameArabic: "asc" },
        { firstNameArabic: "asc" },
        { id: "asc" },
      ],
      include: personRelationInclude,
    });

    return NextResponse.json({
      ok: true,
      persons: persons.map(serializePerson),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.status },
      );
    }

    console.error("ADMIN_PERSONS_GET_ERROR:", error);
    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireTreeManager(req);

    const body = await req.json();
    const patch = parsePersonPatch(body);

    if (!patch) {
      return mutationError("Invalid person data.");
    }

    const birthDateError = getBirthDateError({
      birthYear: patch.birthYear ?? null,
      birthMonth: patch.birthMonth ?? null,
      birthDay: patch.birthDay ?? null,
    });
    const deathDateError = getDeathDateError({
      deathYear: patch.deathYear ?? null,
      deathMonth: patch.deathMonth ?? null,
      deathDay: patch.deathDay ?? null,
    });

    if (birthDateError || deathDateError) {
      return mutationError(birthDateError ?? deathDateError ?? undefined);
    }

    const person = await prisma.person.create({
      data: patch,
      include: personRelationInclude,
    });

    return NextResponse.json({
      ok: true,
      person: serializePerson(person),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.status },
      );
    }

    console.error("ADMIN_PERSONS_POST_ERROR:", error);
    return mutationError(
      "Could not create the person. Check referenced marriages.",
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireTreeManager(req);

    const body = await req.json();
    const ids = parseIdList(body.ids);
    const patch = parsePersonPatch(body.patch);

    if (!ids?.length) {
      return mutationError("Select at least one person.");
    }

    if (!patch || !hasPatchValues(patch)) {
      return mutationError("Choose at least one field to update.");
    }

    if (hasBirthDatePatch(patch) || hasDeathDatePatch(patch)) {
      const selected = await prisma.person.findMany({
        where: { id: { in: ids } },
        select: {
          birthYear: true,
          birthMonth: true,
          birthDay: true,
          deathYear: true,
          deathMonth: true,
          deathDay: true,
        },
      });
      const dateError = selected
        .map(
          (person) =>
            getBirthDateError(mergeBirthDatePatch(person, patch)) ??
            getDeathDateError(mergeDeathDatePatch(person, patch)),
        )
        .find(Boolean);

      if (dateError) {
        return mutationError(dateError);
      }
    }

    await prisma.person.updateMany({
      where: { id: { in: ids } },
      data: patch,
    });

    const persons = await prisma.person.findMany({
      where: { id: { in: ids } },
      include: personRelationInclude,
    });

    return NextResponse.json({
      ok: true,
      persons: persons.map(serializePerson),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.status },
      );
    }

    console.error("ADMIN_PERSONS_PATCH_ERROR:", error);
    return mutationError(
      "Could not update people. Check referenced marriages.",
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireTreeManager(req);

    const body = await req.json();
    const ids = parseIdList(body.ids);

    if (!ids?.length) {
      return mutationError("Select at least one person.");
    }

    const result = await prisma.person.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      ok: true,
      deletedCount: result.count,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.status },
      );
    }

    console.error("ADMIN_PERSONS_DELETE_ERROR:", error);
    return mutationError(
      "Could not remove people because one or more records are still linked.",
    );
  }
}
