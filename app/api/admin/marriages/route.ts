import { NextRequest, NextResponse } from "next/server";

import { AuthError } from "@/features/auth/server/session";
import {
  getWeddingDateError,
  hasWeddingDatePatch,
  marriageRelationInclude,
  mergeWeddingDatePatch,
  parseIdList,
  parseMarriagePatch,
  requireTreeManager,
  serializeMarriage,
} from "@/features/admin/server/tree";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function mutationError(message = "Could not save marriage data.") {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

function hasPatchValues(patch: Record<string, unknown>) {
  return Object.keys(patch).length > 0;
}

const MAX_PAGE_SIZE = 100;

type MarriageSortKey =
  | "id"
  | "firstPartner"
  | "secondPartner"
  | "weddingDate"
  | "isDivorced";

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
    sort: parseMarriageSortKey(req.nextUrl.searchParams.get("sort")),
    direction: parseSortDirection(req.nextUrl.searchParams.get("direction")),
  };
}

function parseMarriageSortKey(value: string | null): MarriageSortKey | null {
  switch (value) {
    case "id":
    case "firstPartner":
    case "secondPartner":
    case "weddingDate":
    case "isDivorced":
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

function marriageOrderBy(
  sort: MarriageSortKey | null,
  direction: SortDirection,
) {
  const directionFragment = directionSql(direction);

  switch (sort) {
    case "id":
      return Prisma.sql`m."id" ${directionFragment}`;
    case "firstPartner":
      return Prisma.sql`NULLIF(CONCAT_WS(' ', fp."firstname_arabic", fp."middlename_arabic", fp."lastname_arabic", fp."firstname", fp."middlename", fp."lastname"), '') ${directionFragment} NULLS LAST, m."id" ASC`;
    case "secondPartner":
      return Prisma.sql`NULLIF(CONCAT_WS(' ', sp."firstname_arabic", sp."middlename_arabic", sp."lastname_arabic", sp."firstname", sp."middlename", sp."lastname"), '') ${directionFragment} NULLS LAST, m."id" ASC`;
    case "weddingDate":
      return Prisma.sql`m."wedding_year" ${directionFragment} NULLS LAST, m."wedding_month" ${directionFragment} NULLS LAST, m."wedding_day" ${directionFragment} NULLS LAST, m."id" ASC`;
    case "isDivorced":
      return Prisma.sql`m."is_divorced" ${directionFragment}, m."id" ASC`;
    default:
      return Prisma.sql`m."id" ASC`;
  }
}

function marriageSearchWhere(query: string) {
  if (!query) return Prisma.empty;

  const like = `%${query.toLowerCase()}%`;

  return Prisma.sql`
    WHERE
      LOWER(m."id"::text) LIKE ${like}
      OR LOWER(COALESCE(m."wedding_year"::text, '')) LIKE ${like}
      OR LOWER(COALESCE(m."wedding_month"::text, '')) LIKE ${like}
      OR LOWER(COALESCE(m."wedding_day"::text, '')) LIKE ${like}
      OR LOWER(CASE WHEN m."is_divorced" THEN 'divorced' ELSE 'married' END) LIKE ${like}
      OR LOWER(COALESCE(fp."firstname_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(fp."middlename_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(fp."lastname_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(fp."firstname", '')) LIKE ${like}
      OR LOWER(COALESCE(fp."middlename", '')) LIKE ${like}
      OR LOWER(COALESCE(fp."lastname", '')) LIKE ${like}
      OR LOWER(COALESCE(sp."firstname_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(sp."middlename_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(sp."lastname_arabic", '')) LIKE ${like}
      OR LOWER(COALESCE(sp."firstname", '')) LIKE ${like}
      OR LOWER(COALESCE(sp."middlename", '')) LIKE ${like}
      OR LOWER(COALESCE(sp."lastname", '')) LIKE ${like}
  `;
}

export async function GET(req: NextRequest) {
  try {
    await requireTreeManager(req);
    const pageOptions = parsePageOptions(req);

    if (pageOptions) {
      const rows = await prisma.$queryRaw<IdRow[]>(Prisma.sql`
        SELECT m."id"
        FROM "public"."marriages" AS m
        INNER JOIN "public"."persons" AS fp ON fp."id" = m."first_partner_id"
        LEFT JOIN "public"."persons" AS sp ON sp."id" = m."second_partner_id"
        ${marriageSearchWhere(pageOptions.query)}
        ORDER BY ${marriageOrderBy(pageOptions.sort, pageOptions.direction)}
        LIMIT ${pageOptions.limit + 1}
        OFFSET ${pageOptions.offset}
      `);
      const ids = rows.slice(0, pageOptions.limit).map((row) => row.id);
      const marriages = ids.length
        ? await prisma.marriage.findMany({
            where: { id: { in: ids } },
            include: marriageRelationInclude,
          })
        : [];
      const marriagesById = new Map(
        marriages.map((marriage) => [marriage.id, marriage]),
      );
      const orderedMarriages = ids
        .map((id) => marriagesById.get(id))
        .filter((marriage) => marriage !== undefined);

      return NextResponse.json({
        ok: true,
        marriages: orderedMarriages.map(serializeMarriage),
        hasMore: rows.length > pageOptions.limit,
        nextOffset: pageOptions.offset + orderedMarriages.length,
      });
    }

    const marriages = await prisma.marriage.findMany({
      orderBy: [{ id: "asc" }],
      include: marriageRelationInclude,
    });

    return NextResponse.json({
      ok: true,
      marriages: marriages.map(serializeMarriage),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.status },
      );
    }

    console.error("ADMIN_MARRIAGES_GET_ERROR:", error);
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
    const patch = parseMarriagePatch(body);

    if (!patch?.firstPartnerId) {
      return mutationError("First partner is required.");
    }

    if (
      patch.secondPartnerId &&
      patch.firstPartnerId === patch.secondPartnerId
    ) {
      return mutationError("The two partners must be different people.");
    }

    const dateError = getWeddingDateError({
      weddingYear: patch.weddingYear ?? null,
      weddingMonth: patch.weddingMonth ?? null,
      weddingDay: patch.weddingDay ?? null,
    });

    if (dateError) {
      return mutationError(dateError);
    }

    const marriage = await prisma.marriage.create({
      data: {
        firstPartnerId: patch.firstPartnerId,
        secondPartnerId: patch.secondPartnerId ?? null,
        weddingYear: patch.weddingYear ?? null,
        weddingMonth: patch.weddingMonth ?? null,
        weddingDay: patch.weddingDay ?? null,
        isDivorced: patch.isDivorced ?? false,
      },
      include: marriageRelationInclude,
    });

    return NextResponse.json({
      ok: true,
      marriage: serializeMarriage(marriage),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.status },
      );
    }

    console.error("ADMIN_MARRIAGES_POST_ERROR:", error);
    return mutationError(
      "Could not create the marriage. Check partner records and duplicates.",
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireTreeManager(req);

    const body = await req.json();
    const ids = parseIdList(body.ids);
    const patch = parseMarriagePatch(body.patch);

    if (!ids?.length) {
      return mutationError("Select at least one marriage.");
    }

    if (!patch || !hasPatchValues(patch)) {
      return mutationError("Choose at least one field to update.");
    }

    if (
      patch.firstPartnerId !== undefined ||
      patch.secondPartnerId !== undefined ||
      hasWeddingDatePatch(patch)
    ) {
      const selected = await prisma.marriage.findMany({
        where: { id: { in: ids } },
        select: {
          firstPartnerId: true,
          secondPartnerId: true,
          weddingYear: true,
          weddingMonth: true,
          weddingDay: true,
        },
      });

      const invalidPartnerPair = selected.some((marriage) => {
        const nextFirstPartnerId =
          patch.firstPartnerId ?? marriage.firstPartnerId;
        const nextSecondPartnerId =
          patch.secondPartnerId === undefined
            ? marriage.secondPartnerId
            : patch.secondPartnerId;

        return Boolean(
          nextSecondPartnerId && nextFirstPartnerId === nextSecondPartnerId,
        );
      });

      if (invalidPartnerPair) {
        return mutationError("The two partners must be different people.");
      }

      const dateError = selected
        .map((marriage) =>
          getWeddingDateError(mergeWeddingDatePatch(marriage, patch)),
        )
        .find(Boolean);

      if (dateError) {
        return mutationError(dateError);
      }
    }

    await prisma.marriage.updateMany({
      where: { id: { in: ids } },
      data: patch,
    });

    const marriages = await prisma.marriage.findMany({
      where: { id: { in: ids } },
      include: marriageRelationInclude,
    });

    return NextResponse.json({
      ok: true,
      marriages: marriages.map(serializeMarriage),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.status },
      );
    }

    console.error("ADMIN_MARRIAGES_PATCH_ERROR:", error);
    return mutationError(
      "Could not update marriages. Check partners, dates, and duplicates.",
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireTreeManager(req);

    const body = await req.json();
    const ids = parseIdList(body.ids);

    if (!ids?.length) {
      return mutationError("Select at least one marriage.");
    }

    const result = await prisma.marriage.deleteMany({
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

    console.error("ADMIN_MARRIAGES_DELETE_ERROR:", error);
    return mutationError(
      "Could not remove marriages because one or more records are still linked.",
    );
  }
}
