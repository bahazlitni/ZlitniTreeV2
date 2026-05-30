import { NextRequest, NextResponse } from "next/server";

import { AuthError } from "@/features/auth/server/session";
import {
  getWeddingDateError,
  marriageRelationInclude,
  mergeWeddingDatePatch,
  parseMarriagePatch,
  parsePositiveInt,
  requireTreeManager,
  serializeMarriage,
} from "@/features/admin/server/tree";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function mutationError(message = "Could not save marriage data.") {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

function hasPatchValues(patch: Record<string, unknown>) {
  return Object.keys(patch).length > 0;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireTreeManager(req);

    const { id: rawId } = await params;
    const id = parsePositiveInt(rawId);
    const body = await req.json();
    const patch = parseMarriagePatch(body);

    if (!id) {
      return mutationError("Invalid marriage id.");
    }

    if (!patch || !hasPatchValues(patch)) {
      return mutationError("Choose at least one field to update.");
    }

    const current = await prisma.marriage.findUnique({
      where: { id },
      select: {
        firstPartnerId: true,
        secondPartnerId: true,
        weddingYear: true,
        weddingMonth: true,
        weddingDay: true,
      },
    });

    if (!current) {
      return NextResponse.json(
        { ok: false, message: "Marriage not found." },
        { status: 404 },
      );
    }

    const nextFirstPartnerId = patch.firstPartnerId ?? current.firstPartnerId;
    const nextSecondPartnerId =
      patch.secondPartnerId === undefined
        ? current.secondPartnerId
        : patch.secondPartnerId;

    if (nextSecondPartnerId && nextFirstPartnerId === nextSecondPartnerId) {
      return mutationError("The two partners must be different people.");
    }

    const dateError = getWeddingDateError(
      mergeWeddingDatePatch(current, patch),
    );

    if (dateError) {
      return mutationError(dateError);
    }

    const marriage = await prisma.marriage.update({
      where: { id },
      data: patch,
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

    console.error("ADMIN_MARRIAGE_PATCH_ERROR:", error);
    return mutationError(
      "Could not update this marriage. Check partners, dates, and duplicates.",
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireTreeManager(req);

    const { id: rawId } = await params;
    const id = parsePositiveInt(rawId);

    if (!id) {
      return mutationError("Invalid marriage id.");
    }

    await prisma.marriage.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.status },
      );
    }

    console.error("ADMIN_MARRIAGE_DELETE_ERROR:", error);
    return mutationError(
      "Could not remove this marriage because the record is still linked.",
    );
  }
}
