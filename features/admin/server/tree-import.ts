import * as XLSX from "xlsx";

import {
  MARRIAGE_EXCEL_HEADERS,
  PERSON_EXCEL_HEADERS,
} from "@/features/admin/shared/tree-excel";
import type { MarriagePatch, PersonPatch } from "@/features/admin/server/tree";

type RawImportRow = {
  rowNumber: number;
  values: Record<string, unknown>;
};

export type PersonImportRow = Required<PersonPatch> & {
  id: number;
  rowNumber: number;
};

export type MarriageImportRow = Required<MarriagePatch> & {
  id: number;
  rowNumber: number;
};

export class TreeImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TreeImportError";
  }
}

function isBlank(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  );
}

function trimTrailingEmptyHeaders(headers: string[]) {
  const trimmed = [...headers];

  while (trimmed.length > 0 && trimmed[trimmed.length - 1] === "") {
    trimmed.pop();
  }

  return trimmed;
}

function assertHeaders(
  actualHeaders: string[],
  expectedHeaders: readonly string[],
) {
  const headers = trimTrailingEmptyHeaders(actualHeaders);
  const hasExactHeaders =
    headers.length === expectedHeaders.length &&
    expectedHeaders.every((header, index) => headers[index] === header);

  if (hasExactHeaders) return;

  throw new TreeImportError(
    `Invalid Excel headers. Expected: ${expectedHeaders.join(", ")}`,
  );
}

function getFirstWorksheet(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new TreeImportError("The Excel file does not contain a sheet.");
  }

  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new TreeImportError("The first Excel sheet could not be read.");
  }

  return sheet;
}

function readRows(buffer: Buffer, expectedHeaders: readonly string[]) {
  const sheet = getFirstWorksheet(buffer);
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  });
  const headerRow = rows[0];

  if (!headerRow) {
    throw new TreeImportError("The Excel file does not contain headers.");
  }

  assertHeaders(
    headerRow.map((header) => String(header ?? "").trim()),
    expectedHeaders,
  );

  return rows.slice(1).reduce<RawImportRow[]>((acc, row, index) => {
    const values = Object.fromEntries(
      expectedHeaders.map((header, columnIndex) => [
        header,
        row[columnIndex] ?? null,
      ]),
    );

    if (expectedHeaders.every((header) => isBlank(values[header]))) {
      return acc;
    }

    acc.push({ rowNumber: index + 2, values });
    return acc;
  }, []);
}

function fieldError(rowNumber: number, field: string, message: string): never {
  throw new TreeImportError(`Row ${rowNumber}, ${field}: ${message}`);
}

function parseInteger(value: unknown, rowNumber: number, field: string) {
  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      fieldError(rowNumber, field, "must be a whole number.");
    }

    return value;
  }

  if (typeof value === "string") {
    const text = value.trim();

    if (!/^-?\d+$/.test(text)) {
      fieldError(rowNumber, field, "must be a whole number.");
    }

    return Number(text);
  }

  fieldError(rowNumber, field, "must be a whole number.");
}

function parseRequiredPositiveInt(
  value: unknown,
  rowNumber: number,
  field: string,
) {
  if (isBlank(value)) fieldError(rowNumber, field, "is required.");

  const parsed = parseInteger(value, rowNumber, field);

  if (parsed <= 0) {
    fieldError(rowNumber, field, "must be greater than zero.");
  }

  return parsed;
}

function parseNullablePositiveInt(
  value: unknown,
  rowNumber: number,
  field: string,
) {
  if (isBlank(value)) return null;

  const parsed = parseInteger(value, rowNumber, field);

  if (parsed <= 0) {
    fieldError(rowNumber, field, "must be greater than zero.");
  }

  return parsed;
}

function parseNullableYear(value: unknown, rowNumber: number, field: string) {
  if (isBlank(value)) return null;
  return parseInteger(value, rowNumber, field);
}

function parseNullableMonth(value: unknown, rowNumber: number, field: string) {
  if (isBlank(value)) return null;

  const parsed = parseInteger(value, rowNumber, field);

  if (parsed < 1 || parsed > 12) {
    fieldError(rowNumber, field, "must be between 1 and 12.");
  }

  return parsed;
}

function parseNullableDay(value: unknown, rowNumber: number, field: string) {
  if (isBlank(value)) return null;

  const parsed = parseInteger(value, rowNumber, field);

  if (parsed < 1 || parsed > 31) {
    fieldError(rowNumber, field, "must be between 1 and 31.");
  }

  return parsed;
}

function parseNullableString(value: unknown) {
  if (isBlank(value)) return null;

  const text = String(value).trim();
  return text ? text : null;
}

function parseNullableCountryCode(
  value: unknown,
  rowNumber: number,
  field: string,
) {
  if (isBlank(value)) return null;

  const text = String(value).trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(text)) {
    fieldError(rowNumber, field, "must be a two-letter country code.");
  }

  return text;
}

function parseBooleanValue(value: unknown, rowNumber: number, field: string) {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const text = value.trim().toLowerCase();

    if (["true", "yes", "1"].includes(text)) return true;
    if (["false", "no", "0"].includes(text)) return false;
  }

  fieldError(rowNumber, field, "must be true or false.");
}

function parseNullableBoolean(
  value: unknown,
  rowNumber: number,
  field: string,
) {
  if (isBlank(value)) return null;
  return parseBooleanValue(value, rowNumber, field);
}

function parseRequiredBoolean(
  value: unknown,
  rowNumber: number,
  field: string,
) {
  if (isBlank(value)) fieldError(rowNumber, field, "is required.");
  return parseBooleanValue(value, rowNumber, field);
}

function assertUniqueIds(
  rows: Array<{ id: number; rowNumber: number }>,
  label: string,
) {
  const seen = new Map<number, number>();

  rows.forEach((row) => {
    const existingRowNumber = seen.get(row.id);

    if (existingRowNumber) {
      throw new TreeImportError(
        `${label} id ${row.id} appears more than once (rows ${existingRowNumber} and ${row.rowNumber}).`,
      );
    }

    seen.set(row.id, row.rowNumber);
  });
}

export function parsePersonImportWorkbook(buffer: Buffer) {
  const rows = readRows(buffer, PERSON_EXCEL_HEADERS).map(
    ({ rowNumber, values }) => ({
      id: parseRequiredPositiveInt(values.id, rowNumber, "id"),
      rowNumber,
      parentMarriageId: parseNullablePositiveInt(
        values.parentMarriageId,
        rowNumber,
        "parentMarriageId",
      ),
      firstNameArabic: parseNullableString(values.firstNameArabic),
      middleNameArabic: parseNullableString(values.middleNameArabic),
      lastNameArabic: parseNullableString(values.lastNameArabic),
      firstName: parseNullableString(values.firstName),
      middleName: parseNullableString(values.middleName),
      lastName: parseNullableString(values.lastName),
      isMale: parseNullableBoolean(values.isMale, rowNumber, "isMale"),
      isAlive: parseNullableBoolean(values.isAlive, rowNumber, "isAlive"),
      birthYear: parseNullableYear(values.birthYear, rowNumber, "birthYear"),
      birthMonth: parseNullableMonth(
        values.birthMonth,
        rowNumber,
        "birthMonth",
      ),
      birthDay: parseNullableDay(values.birthDay, rowNumber, "birthDay"),
      birthCity: parseNullableString(values.birthCity),
      birthCountryCode: parseNullableCountryCode(
        values.birthCountryCode,
        rowNumber,
        "birthCountryCode",
      ),
      deathYear: parseNullableYear(values.deathYear, rowNumber, "deathYear"),
      deathMonth: parseNullableMonth(
        values.deathMonth,
        rowNumber,
        "deathMonth",
      ),
      deathDay: parseNullableDay(values.deathDay, rowNumber, "deathDay"),
      deathCity: parseNullableString(values.deathCity),
      deathCountryCode: parseNullableCountryCode(
        values.deathCountryCode,
        rowNumber,
        "deathCountryCode",
      ),
    }),
  );

  assertUniqueIds(rows, "Person");

  return rows satisfies PersonImportRow[];
}

export function parseMarriageImportWorkbook(buffer: Buffer) {
  const rows = readRows(buffer, MARRIAGE_EXCEL_HEADERS).map(
    ({ rowNumber, values }) => {
      const firstPartnerId = parseRequiredPositiveInt(
        values.firstPartnerId,
        rowNumber,
        "firstPartnerId",
      );
      const secondPartnerId = parseNullablePositiveInt(
        values.secondPartnerId,
        rowNumber,
        "secondPartnerId",
      );

      if (secondPartnerId && firstPartnerId === secondPartnerId) {
        fieldError(
          rowNumber,
          "secondPartnerId",
          "must be different from firstPartnerId.",
        );
      }

      return {
        id: parseRequiredPositiveInt(values.id, rowNumber, "id"),
        rowNumber,
        firstPartnerId,
        secondPartnerId,
        weddingYear: parseNullableYear(
          values.weddingYear,
          rowNumber,
          "weddingYear",
        ),
        weddingMonth: parseNullableMonth(
          values.weddingMonth,
          rowNumber,
          "weddingMonth",
        ),
        weddingDay: parseNullableDay(
          values.weddingDay,
          rowNumber,
          "weddingDay",
        ),
        isDivorced: parseRequiredBoolean(
          values.isDivorced,
          rowNumber,
          "isDivorced",
        ),
      };
    },
  );

  assertUniqueIds(rows, "Marriage");

  return rows satisfies MarriageImportRow[];
}
