import { NextRequest, NextResponse } from "next/server";

import { AuthError } from "@/features/auth/server/session";
import {
  getBirthDateError,
  getDeathDateError,
  requireTreeManager,
} from "@/features/admin/server/tree";
import {
  parsePersonImportWorkbook,
  TreeImportError,
  type PersonImportRow,
} from "@/features/admin/server/tree-import";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function importError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function getUploadFile(formData: FormData) {
  const file = formData.get("file");

  if (
    !file ||
    typeof file === "string" ||
    typeof file.arrayBuffer !== "function"
  ) {
    throw new TreeImportError("Upload an Excel file.");
  }

  return file;
}

function validatePersonRow(row: PersonImportRow) {
  const dateError =
    getBirthDateError({
      birthYear: row.birthYear,
      birthMonth: row.birthMonth,
      birthDay: row.birthDay,
    }) ??
    getDeathDateError({
      deathYear: row.deathYear,
      deathMonth: row.deathMonth,
      deathDay: row.deathDay,
    });

  if (dateError) {
    throw new TreeImportError(`Row ${row.rowNumber}: ${dateError}`);
  }
}

function personData(row: PersonImportRow) {
  return {
    parentMarriageId: row.parentMarriageId,
    firstNameArabic: row.firstNameArabic,
    middleNameArabic: row.middleNameArabic,
    lastNameArabic: row.lastNameArabic,
    firstName: row.firstName,
    middleName: row.middleName,
    lastName: row.lastName,
    isMale: row.isMale,
    isAlive: row.isAlive,
    birthYear: row.birthYear,
    birthMonth: row.birthMonth,
    birthDay: row.birthDay,
    birthCity: row.birthCity,
    birthCountryCode: row.birthCountryCode,
    deathYear: row.deathYear,
    deathMonth: row.deathMonth,
    deathDay: row.deathDay,
    deathCity: row.deathCity,
    deathCountryCode: row.deathCountryCode,
  };
}

export async function POST(req: NextRequest) {
  try {
    await requireTreeManager(req);

    const formData = await req.formData();
    const file = getUploadFile(formData);
    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parsePersonImportWorkbook(buffer);

    if (rows.length === 0) {
      return importError("The Excel file does not contain person rows.");
    }

    rows.forEach(validatePersonRow);

    const ids = rows.map((row) => row.id);
    const result = await prisma.$transaction(async (tx) => {
      const existingRows = await tx.person.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });
      const existingIds = new Set(existingRows.map((row) => row.id));

      for (const row of rows) {
        await tx.person.upsert({
          where: { id: row.id },
          update: personData(row),
          create: {
            id: row.id,
            ...personData(row),
          },
        });
      }

      await tx.$executeRawUnsafe(`
        SELECT setval(
          pg_get_serial_sequence('public.persons', 'id'),
          COALESCE((SELECT MAX("id") FROM "public"."persons"), 1),
          true
        )
      `);

      return {
        importedCount: rows.length,
        createdCount: rows.filter((row) => !existingIds.has(row.id)).length,
        updatedCount: rows.filter((row) => existingIds.has(row.id)).length,
      };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof AuthError) {
      return importError(error.message, error.status);
    }

    if (error instanceof TreeImportError) {
      return importError(error.message);
    }

    console.error("ADMIN_PERSONS_IMPORT_ERROR:", error);
    return importError(
      "Could not import people. Check referenced marriages and row values.",
    );
  }
}
