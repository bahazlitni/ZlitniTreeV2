import { AuthError, requireSession } from "@/features/auth/server/session";
import type { Session } from "@/features/auth/types";
import type { Marriage, Person } from "@/lib/generated/prisma/client";
import { PowerType } from "@/lib/generated/prisma/enums";

export type PersonSummary = Pick<
  Person,
  | "id"
  | "firstNameArabic"
  | "middleNameArabic"
  | "lastNameArabic"
  | "firstName"
  | "middleName"
  | "lastName"
>;

export type MarriageSummary = Pick<
  Marriage,
  | "id"
  | "firstPartnerId"
  | "secondPartnerId"
  | "weddingYear"
  | "weddingMonth"
  | "weddingDay"
  | "isDivorced"
> & {
  firstPartner: PersonSummary;
  secondPartner: PersonSummary | null;
};

export type AdminPersonRow = Pick<
  Person,
  | "id"
  | "parentMarriageId"
  | "firstNameArabic"
  | "middleNameArabic"
  | "lastNameArabic"
  | "firstName"
  | "middleName"
  | "lastName"
  | "isMale"
  | "isAlive"
  | "birthYear"
  | "birthMonth"
  | "birthDay"
  | "birthCity"
  | "birthCountryCode"
  | "deathYear"
  | "deathMonth"
  | "deathDay"
  | "deathCity"
  | "deathCountryCode"
  | "createdAt"
  | "updatedAt"
> & {
  parentMarriage: MarriageSummary | null;
};

export type AdminMarriageRow = MarriageSummary & {
  createdAt: string;
  updatedAt: string;
};

export type AdminPersonPayload = Omit<
  AdminPersonRow,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

export type PersonPatch = {
  parentMarriageId?: number | null;
  firstNameArabic?: string | null;
  middleNameArabic?: string | null;
  lastNameArabic?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  isMale?: boolean | null;
  isAlive?: boolean | null;
  birthYear?: number | null;
  birthMonth?: number | null;
  birthDay?: number | null;
  birthCity?: string | null;
  birthCountryCode?: string | null;
  deathYear?: number | null;
  deathMonth?: number | null;
  deathDay?: number | null;
  deathCity?: string | null;
  deathCountryCode?: string | null;
};

export type MarriagePatch = {
  firstPartnerId?: number;
  secondPartnerId?: number | null;
  weddingYear?: number | null;
  weddingMonth?: number | null;
  weddingDay?: number | null;
  isDivorced?: boolean;
};

const PERSON_RELATION_INCLUDE = {
  parentMarriage: {
    include: {
      firstPartner: true,
      secondPartner: true,
    },
  },
} as const;

const MARRIAGE_RELATION_INCLUDE = {
  firstPartner: true,
  secondPartner: true,
} as const;

export const personRelationInclude = PERSON_RELATION_INCLUDE;
export const marriageRelationInclude = MARRIAGE_RELATION_INCLUDE;

export async function requireTreeManager(req: Request): Promise<Session> {
  const session = await requireSession(req);

  if (
    session.powerType !== PowerType.ROOT &&
    session.powerType !== PowerType.ADMIN
  ) {
    throw new AuthError("Forbidden", 403);
  }

  return session;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parsePositiveInt(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }

  return numberValue;
}

export function parseIdList(value: unknown) {
  if (!Array.isArray(value)) return null;

  const ids = value.map(parsePositiveInt);

  if (ids.some((id) => id === null)) return null;

  return Array.from(new Set(ids as number[]));
}

function parseNullableInt(value: unknown) {
  if (value === null || value === "") return null;
  return parsePositiveInt(value) ?? undefined;
}

function parseNullableYear(value: unknown) {
  if (value === null || value === "") return null;

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) return undefined;

  return parsed;
}

function normalizeNullableString(value: unknown) {
  if (value === null) return null;

  const text = String(value ?? "").trim();
  return text ? text : null;
}

function normalizeCountryCode(value: unknown) {
  if (value === null || value === "") return null;

  const text = String(value ?? "")
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{2}$/.test(text)) return undefined;

  return text;
}

function parseNullableBoolean(value: unknown) {
  if (value === null) return null;
  if (typeof value === "boolean") return value;
  return undefined;
}

function parseBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function parseMonth(value: unknown) {
  if (value === null || value === "") return null;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) return undefined;

  return parsed;
}

function parseDay(value: unknown) {
  if (value === null || value === "") return null;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 31) return undefined;

  return parsed;
}

type CompleteDateParts = {
  year: number | null;
  month: number | null;
  day: number | null;
};

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getDaysInMonth(year: number, month: number) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

export function getCompleteDateError({ year, month, day }: CompleteDateParts) {
  if (
    (year !== null && !Number.isInteger(year)) ||
    (month !== null && !Number.isInteger(month)) ||
    (day !== null && !Number.isInteger(day))
  ) {
    return "Use whole numbers only.";
  }

  if (month !== null && (month < 1 || month > 12)) {
    return "Month must be between 1 and 12.";
  }

  if (day !== null && (day < 1 || day > 31)) {
    return "Day must be between 1 and 31.";
  }

  if (year === null || month === null || day === null) return null;

  if (day > getDaysInMonth(year, month)) {
    return "This date does not exist.";
  }

  return null;
}

export function getWeddingDateError(value: {
  weddingYear: number | null;
  weddingMonth: number | null;
  weddingDay: number | null;
}) {
  return getCompleteDateError({
    year: value.weddingYear,
    month: value.weddingMonth,
    day: value.weddingDay,
  });
}

export function getBirthDateError(value: {
  birthYear: number | null;
  birthMonth: number | null;
  birthDay: number | null;
}) {
  return getCompleteDateError({
    year: value.birthYear,
    month: value.birthMonth,
    day: value.birthDay,
  });
}

export function getDeathDateError(value: {
  deathYear: number | null;
  deathMonth: number | null;
  deathDay: number | null;
}) {
  return getCompleteDateError({
    year: value.deathYear,
    month: value.deathMonth,
    day: value.deathDay,
  });
}

export function hasWeddingDatePatch(patch: MarriagePatch) {
  return (
    "weddingYear" in patch || "weddingMonth" in patch || "weddingDay" in patch
  );
}

export function hasBirthDatePatch(patch: PersonPatch) {
  return "birthYear" in patch || "birthMonth" in patch || "birthDay" in patch;
}

export function hasDeathDatePatch(patch: PersonPatch) {
  return "deathYear" in patch || "deathMonth" in patch || "deathDay" in patch;
}

export function mergeWeddingDatePatch(
  current: {
    weddingYear: number | null;
    weddingMonth: number | null;
    weddingDay: number | null;
  },
  patch: MarriagePatch,
) {
  return {
    weddingYear:
      patch.weddingYear === undefined ? current.weddingYear : patch.weddingYear,
    weddingMonth:
      patch.weddingMonth === undefined
        ? current.weddingMonth
        : patch.weddingMonth,
    weddingDay:
      patch.weddingDay === undefined ? current.weddingDay : patch.weddingDay,
  };
}

export function mergeBirthDatePatch(
  current: {
    birthYear: number | null;
    birthMonth: number | null;
    birthDay: number | null;
  },
  patch: PersonPatch,
) {
  return {
    birthYear:
      patch.birthYear === undefined ? current.birthYear : patch.birthYear,
    birthMonth:
      patch.birthMonth === undefined ? current.birthMonth : patch.birthMonth,
    birthDay: patch.birthDay === undefined ? current.birthDay : patch.birthDay,
  };
}

export function mergeDeathDatePatch(
  current: {
    deathYear: number | null;
    deathMonth: number | null;
    deathDay: number | null;
  },
  patch: PersonPatch,
) {
  return {
    deathYear:
      patch.deathYear === undefined ? current.deathYear : patch.deathYear,
    deathMonth:
      patch.deathMonth === undefined ? current.deathMonth : patch.deathMonth,
    deathDay: patch.deathDay === undefined ? current.deathDay : patch.deathDay,
  };
}

export function buildPersonSearchText(person: PersonSummary) {
  return [
    person.firstNameArabic,
    person.middleNameArabic,
    person.lastNameArabic,
    person.firstName,
    person.middleName,
    person.lastName,
    person.id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function formatPersonName(person: PersonSummary | null | undefined) {
  if (!person) return "Unknown person";

  const arabic = [
    person.firstNameArabic,
    person.middleNameArabic,
    person.lastNameArabic,
  ]
    .filter(Boolean)
    .join(" ");
  const latin = [person.firstName, person.middleName, person.lastName]
    .filter(Boolean)
    .join(" ");

  return arabic || latin || `Person #${person.id}`;
}

export function formatMarriageName(
  marriage: MarriageSummary | null | undefined,
) {
  if (!marriage) return "No parent marriage";

  const second = marriage.secondPartner
    ? formatPersonName(marriage.secondPartner)
    : "Unknown partner";

  return `${formatPersonName(marriage.firstPartner)} + ${second}`;
}

export function buildMarriageSearchText(marriage: MarriageSummary) {
  return [
    marriage.id,
    buildPersonSearchText(marriage.firstPartner),
    marriage.secondPartner ? buildPersonSearchText(marriage.secondPartner) : "",
    formatMarriageName(marriage),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function serializeMarriageSummary(
  marriage: MarriageSummary,
): MarriageSummary {
  return {
    id: marriage.id,
    firstPartnerId: marriage.firstPartnerId,
    secondPartnerId: marriage.secondPartnerId,
    weddingYear: marriage.weddingYear,
    weddingMonth: marriage.weddingMonth,
    weddingDay: marriage.weddingDay,
    isDivorced: marriage.isDivorced,
    firstPartner: marriage.firstPartner,
    secondPartner: marriage.secondPartner,
  };
}

export function serializePerson(
  person: Person & {
    parentMarriage: MarriageSummary | null;
  },
): AdminPersonPayload {
  return {
    id: person.id,
    parentMarriageId: person.parentMarriageId,
    firstNameArabic: person.firstNameArabic,
    middleNameArabic: person.middleNameArabic,
    lastNameArabic: person.lastNameArabic,
    firstName: person.firstName,
    middleName: person.middleName,
    lastName: person.lastName,
    isMale: person.isMale,
    isAlive: person.isAlive,
    birthYear: person.birthYear,
    birthMonth: person.birthMonth,
    birthDay: person.birthDay,
    birthCity: person.birthCity,
    birthCountryCode: person.birthCountryCode,
    deathYear: person.deathYear,
    deathMonth: person.deathMonth,
    deathDay: person.deathDay,
    deathCity: person.deathCity,
    deathCountryCode: person.deathCountryCode,
    parentMarriage: person.parentMarriage
      ? serializeMarriageSummary(person.parentMarriage)
      : null,
    createdAt: person.createdAt.toISOString(),
    updatedAt: person.updatedAt.toISOString(),
  };
}

export function serializeMarriage(
  marriage: Marriage & {
    firstPartner: PersonSummary;
    secondPartner: PersonSummary | null;
  },
): AdminMarriageRow {
  return {
    id: marriage.id,
    firstPartnerId: marriage.firstPartnerId,
    secondPartnerId: marriage.secondPartnerId,
    weddingYear: marriage.weddingYear,
    weddingMonth: marriage.weddingMonth,
    weddingDay: marriage.weddingDay,
    isDivorced: marriage.isDivorced,
    firstPartner: marriage.firstPartner,
    secondPartner: marriage.secondPartner,
    createdAt: marriage.createdAt.toISOString(),
    updatedAt: marriage.updatedAt.toISOString(),
  };
}

export function parsePersonPatch(value: unknown): PersonPatch | null {
  if (!isObject(value)) return null;

  const patch: PersonPatch = {};

  if ("parentMarriageId" in value) {
    const parsed = parseNullableInt(value.parentMarriageId);
    if (parsed === undefined) return null;
    patch.parentMarriageId = parsed;
  }

  if ("firstNameArabic" in value) {
    patch.firstNameArabic = normalizeNullableString(value.firstNameArabic);
  }

  if ("middleNameArabic" in value) {
    patch.middleNameArabic = normalizeNullableString(value.middleNameArabic);
  }

  if ("lastNameArabic" in value) {
    patch.lastNameArabic = normalizeNullableString(value.lastNameArabic);
  }

  if ("firstName" in value) {
    patch.firstName = normalizeNullableString(value.firstName);
  }

  if ("middleName" in value) {
    patch.middleName = normalizeNullableString(value.middleName);
  }

  if ("lastName" in value) {
    patch.lastName = normalizeNullableString(value.lastName);
  }

  if ("isMale" in value) {
    const parsed = parseNullableBoolean(value.isMale);
    if (parsed === undefined) return null;
    patch.isMale = parsed;
  }

  if ("isAlive" in value) {
    const parsed = parseNullableBoolean(value.isAlive);
    if (parsed === undefined) return null;
    patch.isAlive = parsed;
  }

  if ("birthYear" in value) {
    const parsed = parseNullableYear(value.birthYear);
    if (parsed === undefined) return null;
    patch.birthYear = parsed;
  }

  if ("birthMonth" in value) {
    const parsed = parseMonth(value.birthMonth);
    if (parsed === undefined) return null;
    patch.birthMonth = parsed;
  }

  if ("birthDay" in value) {
    const parsed = parseDay(value.birthDay);
    if (parsed === undefined) return null;
    patch.birthDay = parsed;
  }

  if ("birthCity" in value) {
    patch.birthCity = normalizeNullableString(value.birthCity);
  }

  if ("birthCountryCode" in value) {
    const parsed = normalizeCountryCode(value.birthCountryCode);
    if (parsed === undefined) return null;
    patch.birthCountryCode = parsed;
  }

  if ("deathYear" in value) {
    const parsed = parseNullableYear(value.deathYear);
    if (parsed === undefined) return null;
    patch.deathYear = parsed;
  }

  if ("deathMonth" in value) {
    const parsed = parseMonth(value.deathMonth);
    if (parsed === undefined) return null;
    patch.deathMonth = parsed;
  }

  if ("deathDay" in value) {
    const parsed = parseDay(value.deathDay);
    if (parsed === undefined) return null;
    patch.deathDay = parsed;
  }

  if ("deathCity" in value) {
    patch.deathCity = normalizeNullableString(value.deathCity);
  }

  if ("deathCountryCode" in value) {
    const parsed = normalizeCountryCode(value.deathCountryCode);
    if (parsed === undefined) return null;
    patch.deathCountryCode = parsed;
  }

  return patch;
}

export function parseMarriagePatch(value: unknown): MarriagePatch | null {
  if (!isObject(value)) return null;

  const patch: MarriagePatch = {};
  const weddingYear =
    "weddingYear" in value ? parseNullableYear(value.weddingYear) : undefined;
  const weddingMonth =
    "weddingMonth" in value ? parseMonth(value.weddingMonth) : undefined;

  if (weddingYear === undefined && "weddingYear" in value) return null;
  if (weddingMonth === undefined && "weddingMonth" in value) return null;

  if ("firstPartnerId" in value) {
    const parsed = parsePositiveInt(value.firstPartnerId);
    if (!parsed) return null;
    patch.firstPartnerId = parsed;
  }

  if ("secondPartnerId" in value) {
    const parsed = parseNullableInt(value.secondPartnerId);
    if (parsed === undefined) return null;
    patch.secondPartnerId = parsed;
  }

  if ("weddingYear" in value) {
    patch.weddingYear = weddingYear;
  }

  if ("weddingMonth" in value) {
    patch.weddingMonth = weddingMonth;
  }

  if ("weddingDay" in value) {
    const parsed = parseDay(value.weddingDay);
    if (parsed === undefined) return null;
    patch.weddingDay = parsed;
  }

  if ("isDivorced" in value) {
    const parsed = parseBoolean(value.isDivorced);
    if (parsed === undefined) return null;
    patch.isDivorced = parsed;
  }

  const firstPartnerId = patch.firstPartnerId;
  const secondPartnerId = patch.secondPartnerId;

  if (
    firstPartnerId !== undefined &&
    secondPartnerId !== undefined &&
    secondPartnerId !== null &&
    firstPartnerId === secondPartnerId
  ) {
    return null;
  }

  return patch;
}
