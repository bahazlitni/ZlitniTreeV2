export type PersonSearchRecord = {
  id: number;
  firstNameArabic: string | null;
  middleNameArabic: string | null;
  lastNameArabic: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
};

export type PersonSearchRecordWithBirth = PersonSearchRecord & {
  birthYear?: number | null;
  birthMonth?: number | null;
  birthDay?: number | null;
};

export type PersonBirthDateLabels = {
  unknown: string;
  born: (date: string) => string;
  bornMonthDay: (month: string, day: string) => string;
  bornMonth: (month: string) => string;
  bornDay: (day: string) => string;
};

function arabicNameParts(person: PersonSearchRecord) {
  return [
    person.firstNameArabic,
    person.middleNameArabic,
    person.lastNameArabic,
  ].filter(Boolean);
}

function latinNameParts(person: PersonSearchRecord) {
  return [person.firstName, person.middleName, person.lastName].filter(Boolean);
}

function joinNameParts(parts: Array<string | null>) {
  return parts.filter(Boolean).join(" ");
}

const defaultBirthDateLabels: PersonBirthDateLabels = {
  unknown: "Birth date unknown",
  born: (date) => `Born ${date}`,
  bornMonthDay: (month, day) => `Born month ${month}, day ${day}`,
  bornMonth: (month) => `Born month ${month}`,
  bornDay: (day) => `Born day ${day}`,
};

export function formatPersonName(
  person: PersonSearchRecord | null | undefined,
) {
  if (!person) return "Unknown person";

  const arabic = joinNameParts(arabicNameParts(person));
  const latin = joinNameParts(latinNameParts(person));

  return arabic || latin || `Person #${person.id}`;
}

export function formatPersonNameForLocale(
  person: PersonSearchRecord | null | undefined,
  locale: string,
) {
  if (!person) return "Unknown person";

  const arabic = joinNameParts(arabicNameParts(person));
  const latin = joinNameParts(latinNameParts(person));

  return locale === "ar"
    ? arabic || latin || `Person #${person.id}`
    : latin || arabic || `Person #${person.id}`;
}

export function formatPersonFirstNameForLocale(
  person: PersonSearchRecord | null | undefined,
  locale: string,
) {
  if (!person) return "";

  return locale === "ar"
    ? person.firstNameArabic?.trim() || person.firstName?.trim() || ""
    : person.firstName?.trim() || person.firstNameArabic?.trim() || "";
}

export function formatPersonLastNameForLocale(
  person: PersonSearchRecord | null | undefined,
  locale: string,
) {
  if (!person) return "";

  return locale === "ar"
    ? person.lastNameArabic?.trim() || person.lastName?.trim() || ""
    : person.lastName?.trim() || person.lastNameArabic?.trim() || "";
}

export function formatPersonBirthDate(
  person: PersonSearchRecordWithBirth | null | undefined,
  labels: PersonBirthDateLabels = defaultBirthDateLabels,
) {
  if (!person) return labels.unknown;

  const year = person.birthYear;
  const month = person.birthMonth;
  const day = person.birthDay;

  if (year === null && month === null && day === null) {
    return labels.unknown;
  }

  const paddedMonth =
    month === null || month === undefined
      ? null
      : String(month).padStart(2, "0");
  const paddedDay =
    day === null || day === undefined ? null : String(day).padStart(2, "0");

  if (year !== null && year !== undefined && paddedMonth && paddedDay) {
    return labels.born(`${year}-${paddedMonth}-${paddedDay}`);
  }

  if (year !== null && year !== undefined && paddedMonth) {
    return labels.born(`${year}-${paddedMonth}`);
  }

  if (year !== null && year !== undefined) {
    return labels.born(String(year));
  }

  if (paddedMonth && paddedDay) {
    return labels.bornMonthDay(paddedMonth, paddedDay);
  }

  if (paddedMonth) return labels.bornMonth(paddedMonth);
  if (paddedDay) return labels.bornDay(paddedDay);

  return labels.unknown;
}

export function buildPersonSearchText(person: PersonSearchRecord) {
  return [
    person.id,
    person.firstNameArabic,
    person.middleNameArabic,
    person.lastNameArabic,
    person.firstName,
    person.middleName,
    person.lastName,
    formatPersonName(person),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function editDistanceAtMost(a: string, b: string, maxDistance: number) {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    let rowMin = current[0];

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
      rowMin = Math.min(rowMin, current[j]);
    }

    if (rowMin > maxDistance) return maxDistance + 1;

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function tokenScore(queryToken: string, candidateToken: string) {
  if (!queryToken || !candidateToken) return 0;
  if (candidateToken === queryToken) return 12;
  if (candidateToken.startsWith(queryToken)) return 9;
  if (candidateToken.includes(queryToken)) return 7;

  const maxDistance =
    queryToken.length <= 3 ? 1 : queryToken.length <= 6 ? 2 : 3;
  const distance = editDistanceAtMost(queryToken, candidateToken, maxDistance);

  if (distance <= maxDistance) return Math.max(1, 6 - distance);

  return 0;
}

export function scorePersonSearch(person: PersonSearchRecord, query: string) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) return 1;

  const haystack = normalizeSearchValue(buildPersonSearchText(person));
  if (haystack.includes(normalizedQuery)) return 100 + normalizedQuery.length;

  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const candidateTokens = haystack.split(" ").filter(Boolean);

  if (!queryTokens.length || !candidateTokens.length) return 0;

  let score = 0;

  for (const queryToken of queryTokens) {
    const bestTokenScore = candidateTokens.reduce(
      (best, candidateToken) =>
        Math.max(best, tokenScore(queryToken, candidateToken)),
      0,
    );

    if (bestTokenScore === 0) return 0;
    score += bestTokenScore;
  }

  return score;
}

export function rankPersonSearchResults<T extends PersonSearchRecord>(
  persons: T[],
  query: string,
) {
  return persons
    .map((person) => ({
      person,
      score: scorePersonSearch(person, query),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.person.id - b.person.id)
    .map((item) => item.person);
}
