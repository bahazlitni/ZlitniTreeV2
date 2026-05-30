import { NextRequest, NextResponse } from "next/server";

import { AuthError } from "@/features/auth/server/session";
import {
  getBirthDateError,
  getDeathDateError,
  hasBirthDatePatch,
  hasDeathDatePatch,
  mergeBirthDatePatch,
  mergeDeathDatePatch,
  parsePersonPatch,
  parsePositiveInt,
  personRelationInclude,
  requireTreeManager,
  serializePerson,
} from "@/features/admin/server/tree";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function mutationError(message = "Could not save person data.") {
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
    const patch = parsePersonPatch(body);

    if (!id) {
      return mutationError("Invalid person id.");
    }

    if (!patch || !hasPatchValues(patch)) {
      return mutationError("Choose at least one field to update.");
    }

    if (hasBirthDatePatch(patch) || hasDeathDatePatch(patch)) {
      const current = await prisma.person.findUnique({
        where: { id },
        select: {
          birthYear: true,
          birthMonth: true,
          birthDay: true,
          deathYear: true,
          deathMonth: true,
          deathDay: true,
        },
      });

      if (!current) {
        return NextResponse.json({ ok: false, message: "Person not found." }, { status: 404 });
      }

      const dateError =
        getBirthDateError(mergeBirthDatePatch(current, patch)) ??
        getDeathDateError(mergeDeathDatePatch(current, patch));

      if (dateError) {
        return mutationError(dateError);
      }
    }

    const person = await prisma.person.update({
      where: { id },
      data: patch,
      include: personRelationInclude,
    });

    return NextResponse.json({
      ok: true,
      person: serializePerson(person),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }

    console.error("ADMIN_PERSON_PATCH_ERROR:", error);
    return mutationError("Could not update this person. Check referenced marriages.");
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireTreeManager(req);

    const { id: rawId } = await params;
    const id = parsePositiveInt(rawId);

    if (!id) {
      return mutationError("Invalid person id.");
    }

    await prisma.person.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }

    console.error("ADMIN_PERSON_DELETE_ERROR:", error);
    return mutationError("Could not remove this person because the record is still linked.");
  }
}
