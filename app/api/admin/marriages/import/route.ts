import { NextRequest, NextResponse } from "next/server";

import { AuthError } from "@/features/auth/server/session";
import {
  getWeddingDateError,
  requireTreeManager,
} from "@/features/admin/server/tree";
import {
  parseMarriageImportWorkbook,
  TreeImportError,
  type MarriageImportRow,
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

function validateMarriageRow(row: MarriageImportRow) {
  const dateError = getWeddingDateError({
    weddingYear: row.weddingYear,
    weddingMonth: row.weddingMonth,
    weddingDay: row.weddingDay,
  });

  if (dateError) {
    throw new TreeImportError(`Row ${row.rowNumber}: ${dateError}`);
  }
}

function marriageData(row: MarriageImportRow) {
  return {
    firstPartnerId: row.firstPartnerId,
    secondPartnerId: row.secondPartnerId,
    weddingYear: row.weddingYear,
    weddingMonth: row.weddingMonth,
    weddingDay: row.weddingDay,
    isDivorced: row.isDivorced,
  };
}

export async function POST(req: NextRequest) {
  try {
    await requireTreeManager(req);

    const formData = await req.formData();
    const file = getUploadFile(formData);
    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseMarriageImportWorkbook(buffer);

    if (rows.length === 0) {
      return importError("The Excel file does not contain marriage rows.");
    }

    rows.forEach(validateMarriageRow);

    const ids = rows.map((row) => row.id);
    const result = await prisma.$transaction(async (tx) => {
      const existingRows = await tx.marriage.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });
      const existingIds = new Set(existingRows.map((row) => row.id));

      for (const row of rows) {
        await tx.marriage.upsert({
          where: { id: row.id },
          update: marriageData(row),
          create: {
            id: row.id,
            ...marriageData(row),
          },
        });
      }

      await tx.$executeRawUnsafe(`
        SELECT setval(
          pg_get_serial_sequence('public.marriages', 'id'),
          COALESCE((SELECT MAX("id") FROM "public"."marriages"), 1),
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

    console.error("ADMIN_MARRIAGES_IMPORT_ERROR:", error);
    return importError(
      "Could not import marriages. Check partner records, dates, and duplicate pairs.",
    );
  }
}
