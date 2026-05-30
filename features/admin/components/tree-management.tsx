"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react";

import {
  CountrySelect,
  DEFAULT_COUNTRY_CODE,
} from "@/components/custom/CountrySelect";
import {
  DayMonthYearInputGroup,
  getDayMonthYearError,
  type DayMonthYearApplied,
  type DayMonthYearValue,
} from "@/components/custom/DayMonthYearInputGroup";
import { MarriageSelect } from "@/components/custom/MarriageSelect";
import {
  formatPersonName,
  PersonSelect,
} from "@/components/custom/PersonSelect";
import AnimatedButton from "@/components/ui/custom/AnimatedButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api/auth/api-fetch";
import { cn } from "@/lib/utils";
import type {
  AdminMarriageRow,
  AdminPersonPayload,
  MarriagePatch,
  PersonPatch,
} from "@/features/admin/server/tree";
import {
  MARRIAGE_EXCEL_HEADERS,
  PERSON_EXCEL_HEADERS,
} from "@/features/admin/shared/tree-excel";

type TreeMode = "persons" | "marriages";
type SortDirection = "asc" | "desc";
type SortState<Key extends string> = {
  key: Key;
  direction: SortDirection;
} | null;
type PersonSortKey =
  | "id"
  | "parentMarriage"
  | "firstNameArabic"
  | "lastNameArabic"
  | "firstName"
  | "lastName"
  | "isMale"
  | "isAlive";
type MarriageSortKey =
  | "id"
  | "firstPartner"
  | "secondPartner"
  | "weddingDate"
  | "isDivorced";
type StatusState = {
  tone: "neutral" | "error" | "success";
  text: string | null;
};
type PersonDialogState =
  | { mode: "create" }
  | { mode: "edit"; person: AdminPersonPayload }
  | { mode: "bulk"; ids: number[] };
type MarriageDialogState =
  | { mode: "create" }
  | { mode: "edit"; marriage: AdminMarriageRow }
  | { mode: "bulk"; ids: number[] };
type DeleteTarget =
  | { kind: "person"; ids: number[] }
  | { kind: "marriage"; ids: number[] };
type PersonFormState = Required<
  Pick<
    PersonPatch,
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
  >
>;
type MarriageFormState = {
  firstPartnerId: number | null;
  secondPartnerId: number | null;
  weddingYear: number | null;
  weddingMonth: number | null;
  weddingDay: number | null;
  isDivorced: boolean;
};
type PersonsResponse = {
  ok: boolean;
  persons?: AdminPersonPayload[];
  hasMore?: boolean;
  nextOffset?: number;
  message?: string;
};
type MarriagesResponse = {
  ok: boolean;
  marriages?: AdminMarriageRow[];
  hasMore?: boolean;
  nextOffset?: number;
  message?: string;
};
type ExcelCellValue = string | number | boolean | null | undefined;
type ExcelColumn<T> = {
  header: string;
  value: (row: T) => ExcelCellValue;
};
type ImportResponse = {
  ok: boolean;
  importedCount?: number;
  createdCount?: number;
  updatedCount?: number;
  message?: string;
};
type PersonExcelHeader = (typeof PERSON_EXCEL_HEADERS)[number];
type MarriageExcelHeader = (typeof MARRIAGE_EXCEL_HEADERS)[number];

const TREE_PAGE_SIZE = 32;
const TREE_EXPORT_PAGE_SIZE = 100;

function emptyPersonForm(): PersonFormState {
  return {
    parentMarriageId: null,
    firstNameArabic: null,
    middleNameArabic: null,
    lastNameArabic: null,
    firstName: null,
    middleName: null,
    lastName: null,
    isMale: true,
    isAlive: true,
    birthYear: null,
    birthMonth: null,
    birthDay: null,
    birthCity: null,
    birthCountryCode: DEFAULT_COUNTRY_CODE,
    deathYear: null,
    deathMonth: null,
    deathDay: null,
    deathCity: null,
    deathCountryCode: null,
  };
}

function emptyMarriageForm(): MarriageFormState {
  return {
    firstPartnerId: null,
    secondPartnerId: null,
    weddingYear: null,
    weddingMonth: null,
    weddingDay: null,
    isDivorced: false,
  };
}

function escapeXml(value: ExcelCellValue) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function excelCell(value: ExcelCellValue) {
  if (value === null || value === undefined || value === "") {
    return '<Cell><Data ss:Type="String"></Data></Cell>';
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }

  if (typeof value === "boolean") {
    return `<Cell><Data ss:Type="String">${value ? "true" : "false"}</Data></Cell>`;
  }

  return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function downloadExcelSheet<T>({
  fileName,
  sheetName,
  columns,
  rows,
}: {
  fileName: string;
  sheetName: string;
  columns: ExcelColumn<T>[];
  rows: T[];
}) {
  const header = columns.map((column) => excelCell(column.header)).join("");
  const body = rows
    .map(
      (row) =>
        `<Row>${columns.map((column) => excelCell(column.value(row))).join("")}</Row>`,
    )
    .join("");
  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E8F5E9" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(sheetName)}">
    <Table>
      <Row ss:StyleID="Header">${header}</Row>
      ${body}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([workbook], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const PERSON_EXPORT_VALUES: Record<
  PersonExcelHeader,
  (person: AdminPersonPayload) => ExcelCellValue
> = {
  id: (person) => person.id,
  parentMarriageId: (person) => person.parentMarriageId,
  firstNameArabic: (person) => person.firstNameArabic,
  middleNameArabic: (person) => person.middleNameArabic,
  lastNameArabic: (person) => person.lastNameArabic,
  firstName: (person) => person.firstName,
  middleName: (person) => person.middleName,
  lastName: (person) => person.lastName,
  isMale: (person) => person.isMale,
  isAlive: (person) => person.isAlive,
  birthYear: (person) => person.birthYear,
  birthMonth: (person) => person.birthMonth,
  birthDay: (person) => person.birthDay,
  birthCity: (person) => person.birthCity,
  birthCountryCode: (person) => person.birthCountryCode,
  deathYear: (person) => person.deathYear,
  deathMonth: (person) => person.deathMonth,
  deathDay: (person) => person.deathDay,
  deathCity: (person) => person.deathCity,
  deathCountryCode: (person) => person.deathCountryCode,
};

const MARRIAGE_EXPORT_VALUES: Record<
  MarriageExcelHeader,
  (marriage: AdminMarriageRow) => ExcelCellValue
> = {
  id: (marriage) => marriage.id,
  firstPartnerId: (marriage) => marriage.firstPartnerId,
  secondPartnerId: (marriage) => marriage.secondPartnerId,
  weddingYear: (marriage) => marriage.weddingYear,
  weddingMonth: (marriage) => marriage.weddingMonth,
  weddingDay: (marriage) => marriage.weddingDay,
  isDivorced: (marriage) => marriage.isDivorced,
};

const PERSON_EXPORT_COLUMNS: ExcelColumn<AdminPersonPayload>[] =
  PERSON_EXCEL_HEADERS.map((header) => ({
    header,
    value: PERSON_EXPORT_VALUES[header],
  }));

const MARRIAGE_EXPORT_COLUMNS: ExcelColumn<AdminMarriageRow>[] =
  MARRIAGE_EXCEL_HEADERS.map((header) => ({
    header,
    value: MARRIAGE_EXPORT_VALUES[header],
  }));

function emptyPersonBulkApply(): Record<keyof PersonFormState, boolean> {
  return {
    parentMarriageId: false,
    firstNameArabic: false,
    middleNameArabic: false,
    lastNameArabic: false,
    firstName: false,
    middleName: false,
    lastName: false,
    isMale: false,
    isAlive: false,
    birthYear: false,
    birthMonth: false,
    birthDay: false,
    birthCity: false,
    birthCountryCode: false,
    deathYear: false,
    deathMonth: false,
    deathDay: false,
    deathCity: false,
    deathCountryCode: false,
  };
}

function emptyMarriageBulkApply(): Record<keyof MarriageFormState, boolean> {
  return {
    firstPartnerId: false,
    secondPartnerId: false,
    weddingYear: false,
    weddingMonth: false,
    weddingDay: false,
    isDivorced: false,
  };
}

function normalizeTextValue(value: string) {
  const text = value.trim();
  return text ? text : null;
}

function getNextSort<Key extends string>(
  current: SortState<Key>,
  key: Key,
): SortState<Key> {
  if (current?.key !== key) return { key, direction: "asc" };
  return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}

function getRangeBetweenClickedDots(
  visibleIds: number[],
  anchorId: number | null,
  clickedId: number,
) {
  if (anchorId === null) return [clickedId];

  const anchorIndex = visibleIds.indexOf(anchorId);
  const clickedIndex = visibleIds.indexOf(clickedId);

  if (anchorIndex === -1 || clickedIndex === -1) return [clickedId];

  const start = Math.min(anchorIndex, clickedIndex);
  const end = Math.max(anchorIndex, clickedIndex);
  return visibleIds.slice(start, end + 1);
}

function setIdsInSet(current: Set<number>, ids: number[], selected: boolean) {
  const next = new Set(current);

  ids.forEach((id) => {
    if (selected) next.add(id);
    else next.delete(id);
  });

  return next;
}

function StatusText({ status }: { status: StatusState }) {
  if (!status.text) return null;

  return (
    <p
      className={cn(
        "text-sm leading-6 font-medium",
        status.tone === "neutral" && "text-muted-foreground",
        status.tone === "error" && "text-red-600 dark:text-red-300",
        status.tone === "success" && "text-emerald-600 dark:text-emerald-300",
      )}
    >
      {status.text}
    </p>
  );
}

function SearchField({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative w-full sm:w-[320px]">
      <Search
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
      />
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="border-border bg-card h-10 rounded-lg pr-9 pl-9 text-sm"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="text-muted-foreground hover:text-foreground hover:bg-muted absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors"
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function SortableTableHead<Key extends string>({
  label,
  sortKey,
  sort,
  className,
  align = "left",
  onSort,
}: {
  label: string;
  sortKey: Key;
  sort: SortState<Key>;
  className?: string;
  align?: "left" | "right";
  onSort: (key: Key) => void;
}) {
  const isActive = sort?.key === sortKey;
  const Icon = !isActive
    ? ArrowUpDown
    : sort.direction === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <TableHead
      aria-sort={
        isActive
          ? sort.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className={cn("p-0", className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "group hover:bg-primary/5 flex h-full min-h-9 w-full cursor-pointer items-center gap-2 px-3 text-sm font-semibold transition-colors",
          align === "right"
            ? "justify-end text-right"
            : "justify-start text-left",
        )}
      >
        <span className="truncate">{label}</span>
        <Icon
          aria-hidden="true"
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-colors",
            isActive
              ? "text-primary"
              : "text-muted-foreground/60 group-hover:text-muted-foreground",
          )}
        />
      </button>
    </TableHead>
  );
}

function DotSelector({
  checked,
  mixed,
  label,
  onClick,
}: {
  checked: boolean;
  mixed?: boolean;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={onClick}
      className={cn(
        "mx-auto flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border transition-colors",
        checked
          ? "border-primary bg-primary"
          : "border-muted-foreground/40 hover:border-primary bg-transparent",
      )}
    >
      {checked ? (
        <span className="bg-primary-foreground h-1.5 w-1.5 rounded-full" />
      ) : null}
      {!checked && mixed ? (
        <span className="bg-primary h-1.5 w-1.5 rounded-full" />
      ) : null}
    </button>
  );
}

function TextCell({
  value,
  placeholder,
  onCommit,
}: {
  value: string | null;
  placeholder?: string;
  onCommit: (value: string | null) => void;
}) {
  return (
    <Input
      key={value ?? ""}
      defaultValue={value ?? ""}
      placeholder={placeholder}
      onBlur={(event) => {
        const nextValue = normalizeTextValue(event.currentTarget.value);
        if (nextValue !== value) onCommit(nextValue);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          event.currentTarget.value = value ?? "";
          event.currentTarget.blur();
        }
      }}
      className="focus-visible:ring-primary/25 h-full min-h-9 rounded-none border-0 bg-transparent px-3 text-sm shadow-none focus-visible:ring-2"
    />
  );
}

function SwitchCell({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex h-full min-h-9 items-center px-3">
      <Switch
        size="sm"
        checked={checked}
        aria-label={label}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function FieldApplySwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      size="sm"
      checked={checked}
      aria-label="Apply this field"
      onCheckedChange={onCheckedChange}
    />
  );
}

export function TreeManagementPanel({ mode }: { mode: TreeMode }) {
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const requestIdRef = useRef(0);
  const lastClickedPersonIdRef = useRef<number | null>(null);
  const lastClickedMarriageIdRef = useRef<number | null>(null);
  const [persons, setPersons] = useState<AdminPersonPayload[]>([]);
  const [marriages, setMarriages] = useState<AdminMarriageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    tone: "neutral",
    text: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [personSort, setPersonSort] = useState<SortState<PersonSortKey>>(null);
  const [marriageSort, setMarriageSort] =
    useState<SortState<MarriageSortKey>>(null);
  const [personNextOffset, setPersonNextOffset] = useState(0);
  const [marriageNextOffset, setMarriageNextOffset] = useState(0);
  const [hasMorePersons, setHasMorePersons] = useState(false);
  const [hasMoreMarriages, setHasMoreMarriages] = useState(false);
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [selectedMarriageIds, setSelectedMarriageIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [personDialog, setPersonDialog] = useState<PersonDialogState | null>(
    null,
  );
  const [marriageDialog, setMarriageDialog] =
    useState<MarriageDialogState | null>(null);
  const [personForm, setPersonForm] =
    useState<PersonFormState>(emptyPersonForm);
  const [marriageForm, setMarriageForm] =
    useState<MarriageFormState>(emptyMarriageForm);
  const [personBulkApply, setPersonBulkApply] =
    useState<Record<keyof PersonFormState, boolean>>(emptyPersonBulkApply);
  const [marriageBulkApply, setMarriageBulkApply] = useState<
    Record<keyof MarriageFormState, boolean>
  >(emptyMarriageBulkApply);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const visiblePersons = persons;
  const visibleMarriages = marriages;
  const hasMoreRows = mode === "persons" ? hasMorePersons : hasMoreMarriages;
  const selectedIds =
    mode === "persons" ? selectedPersonIds : selectedMarriageIds;
  const selectedCount = selectedIds.size;
  const visibleIds =
    mode === "persons"
      ? visiblePersons.map((person) => person.id)
      : visibleMarriages.map((marriage) => marriage.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));

  const buildPageUrl = useCallback(
    (offset: number, limit = TREE_PAGE_SIZE) => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      const query = debouncedSearchQuery.trim();
      const sort = mode === "persons" ? personSort : marriageSort;

      if (query) params.set("q", query);
      if (sort) {
        params.set("sort", sort.key);
        params.set("direction", sort.direction);
      }

      return `/api/admin/${mode}?${params.toString()}`;
    },
    [debouncedSearchQuery, marriageSort, mode, personSort],
  );

  const fetchAllRowsForExport = useCallback(async () => {
    const exportedPersons: AdminPersonPayload[] = [];
    const exportedMarriages: AdminMarriageRow[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await apiFetch(
        buildPageUrl(offset, TREE_EXPORT_PAGE_SIZE),
        {
          method: "GET",
          auth: true,
        },
      );
      const data: PersonsResponse | MarriagesResponse = await response
        .json()
        .catch(() => ({ ok: false }));

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "Could not export table.");
      }

      if (mode === "persons") {
        const personsData = data as PersonsResponse;
        const nextRows = personsData.persons ?? [];

        exportedPersons.push(...nextRows);
        hasMore = Boolean(personsData.hasMore);
        offset = personsData.nextOffset ?? offset + nextRows.length;

        if (nextRows.length === 0) hasMore = false;
        continue;
      }

      const marriagesData = data as MarriagesResponse;
      const nextRows = marriagesData.marriages ?? [];

      exportedMarriages.push(...nextRows);
      hasMore = Boolean(marriagesData.hasMore);
      offset = marriagesData.nextOffset ?? offset + nextRows.length;

      if (nextRows.length === 0) hasMore = false;
    }

    return mode === "persons" ? exportedPersons : exportedMarriages;
  }, [buildPageUrl, mode]);

  const appendPersons = useCallback((nextPersons: AdminPersonPayload[]) => {
    setPersons((current) => {
      const existingIds = new Set(current.map((person) => person.id));
      return [
        ...current,
        ...nextPersons.filter((person) => !existingIds.has(person.id)),
      ];
    });
  }, []);

  const appendMarriages = useCallback((nextMarriages: AdminMarriageRow[]) => {
    setMarriages((current) => {
      const existingIds = new Set(current.map((marriage) => marriage.id));
      return [
        ...current,
        ...nextMarriages.filter((marriage) => !existingIds.has(marriage.id)),
      ];
    });
  }, []);

  const loadTree = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setIsLoadingMore(false);
    setStatus({ tone: "neutral", text: null });

    try {
      if (mode === "persons") {
        setPersons([]);
        setPersonNextOffset(0);
        setHasMorePersons(false);

        const [personsResponse, marriagesResponse] = await Promise.all([
          apiFetch(buildPageUrl(0), { method: "GET", auth: true }),
          apiFetch("/api/admin/marriages", { method: "GET", auth: true }),
        ]);
        const personsData: PersonsResponse = await personsResponse
          .json()
          .catch(() => ({ ok: false }));
        const marriagesData: MarriagesResponse = await marriagesResponse
          .json()
          .catch(() => ({ ok: false }));

        if (requestId !== requestIdRef.current) return;

        if (!personsResponse.ok || !personsData.ok || !personsData.persons) {
          setStatus({
            tone: "error",
            text: personsData.message ?? "Could not load people.",
          });
          return;
        }

        if (
          !marriagesResponse.ok ||
          !marriagesData.ok ||
          !marriagesData.marriages
        ) {
          setStatus({
            tone: "error",
            text: marriagesData.message ?? "Could not load marriages.",
          });
          return;
        }

        setPersons(personsData.persons);
        setMarriages(marriagesData.marriages);
        setPersonNextOffset(
          personsData.nextOffset ?? personsData.persons.length,
        );
        setHasMorePersons(Boolean(personsData.hasMore));
        return;
      }

      setMarriages([]);
      setMarriageNextOffset(0);
      setHasMoreMarriages(false);

      const [marriagesResponse, personsResponse] = await Promise.all([
        apiFetch(buildPageUrl(0), { method: "GET", auth: true }),
        apiFetch("/api/admin/persons", { method: "GET", auth: true }),
      ]);
      const marriagesData: MarriagesResponse = await marriagesResponse
        .json()
        .catch(() => ({ ok: false }));
      const personsData: PersonsResponse = await personsResponse
        .json()
        .catch(() => ({ ok: false }));

      if (requestId !== requestIdRef.current) return;

      if (
        !marriagesResponse.ok ||
        !marriagesData.ok ||
        !marriagesData.marriages
      ) {
        setStatus({
          tone: "error",
          text: marriagesData.message ?? "Could not load marriages.",
        });
        return;
      }

      if (!personsResponse.ok || !personsData.ok || !personsData.persons) {
        setStatus({
          tone: "error",
          text: personsData.message ?? "Could not load people.",
        });
        return;
      }

      setMarriages(marriagesData.marriages);
      setPersons(personsData.persons);
      setMarriageNextOffset(
        marriagesData.nextOffset ?? marriagesData.marriages.length,
      );
      setHasMoreMarriages(Boolean(marriagesData.hasMore));
    } catch {
      setStatus({ tone: "error", text: "Could not load tree data." });
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [buildPageUrl, mode]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearchQuery(searchQuery.trim()),
      250,
    );

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadTree();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadTree]);

  const loadMoreRows = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMoreRows) return;

    const requestId = ++requestIdRef.current;
    const offset = mode === "persons" ? personNextOffset : marriageNextOffset;
    setIsLoadingMore(true);

    try {
      const response = await apiFetch(buildPageUrl(offset), {
        method: "GET",
        auth: true,
      });
      const data: PersonsResponse | MarriagesResponse = await response
        .json()
        .catch(() => ({ ok: false }));

      if (requestId !== requestIdRef.current) return;

      if (!response.ok || !data.ok) {
        setStatus({
          tone: "error",
          text: data.message ?? "Could not load more rows.",
        });
        return;
      }

      if (mode === "persons") {
        const personsData = data as PersonsResponse;

        if (!personsData.persons) {
          setStatus({ tone: "error", text: "Could not load more people." });
          return;
        }

        appendPersons(personsData.persons);
        setPersonNextOffset(
          personsData.nextOffset ?? offset + personsData.persons.length,
        );
        setHasMorePersons(Boolean(personsData.hasMore));
        return;
      }

      const marriagesData = data as MarriagesResponse;

      if (!marriagesData.marriages) {
        setStatus({ tone: "error", text: "Could not load more marriages." });
        return;
      }

      appendMarriages(marriagesData.marriages);
      setMarriageNextOffset(
        marriagesData.nextOffset ?? offset + marriagesData.marriages.length,
      );
      setHasMoreMarriages(Boolean(marriagesData.hasMore));
    } catch {
      setStatus({ tone: "error", text: "Could not load more rows." });
    } finally {
      if (requestId === requestIdRef.current) setIsLoadingMore(false);
    }
  }, [
    hasMoreRows,
    appendMarriages,
    appendPersons,
    buildPageUrl,
    isLoading,
    isLoadingMore,
    marriageNextOffset,
    mode,
    personNextOffset,
  ]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasMoreRows) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMoreRows();
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasMoreRows, loadMoreRows, mode]);

  function toggleAllVisible() {
    if (mode === "persons") {
      setSelectedPersonIds((current) => {
        if (allVisibleSelected) return new Set();
        return new Set([...current, ...visibleIds]);
      });
      return;
    }

    setSelectedMarriageIds((current) => {
      if (allVisibleSelected) return new Set();
      return new Set([...current, ...visibleIds]);
    });
  }

  function togglePersonSort(key: PersonSortKey) {
    setPersonSort((current) => getNextSort(current, key));
  }

  function toggleMarriageSort(key: MarriageSortKey) {
    setMarriageSort((current) => getNextSort(current, key));
  }

  function togglePerson(id: number, event?: MouseEvent<HTMLButtonElement>) {
    setSelectedPersonIds((current) => {
      const nextSelectedState = !current.has(id);

      if (event?.shiftKey) {
        return setIdsInSet(
          current,
          getRangeBetweenClickedDots(
            visiblePersons.map((person) => person.id),
            lastClickedPersonIdRef.current,
            id,
          ),
          nextSelectedState,
        );
      }

      return setIdsInSet(current, [id], nextSelectedState);
    });
    lastClickedPersonIdRef.current = id;
  }

  function toggleMarriage(id: number, event?: MouseEvent<HTMLButtonElement>) {
    setSelectedMarriageIds((current) => {
      const nextSelectedState = !current.has(id);

      if (event?.shiftKey) {
        return setIdsInSet(
          current,
          getRangeBetweenClickedDots(
            visibleMarriages.map((marriage) => marriage.id),
            lastClickedMarriageIdRef.current,
            id,
          ),
          nextSelectedState,
        );
      }

      return setIdsInSet(current, [id], nextSelectedState);
    });
    lastClickedMarriageIdRef.current = id;
  }

  function mergePersons(nextPersons: AdminPersonPayload[]) {
    setPersons((current) =>
      current.map(
        (person) => nextPersons.find((item) => item.id === person.id) ?? person,
      ),
    );
  }

  function mergeMarriages(nextMarriages: AdminMarriageRow[]) {
    setMarriages((current) =>
      current.map(
        (marriage) =>
          nextMarriages.find((item) => item.id === marriage.id) ?? marriage,
      ),
    );
  }

  async function updatePerson(person: AdminPersonPayload, patch: PersonPatch) {
    try {
      const response = await apiFetch(`/api/admin/persons/${person.id}`, {
        method: "PATCH",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json().catch(() => ({ ok: false }));

      if (!response.ok || !data.ok || !data.person) {
        setStatus({
          tone: "error",
          text: data.message ?? "Could not update this person.",
        });
        return;
      }

      mergePersons([data.person]);
      setStatus({ tone: "success", text: "Person saved." });
    } catch {
      setStatus({ tone: "error", text: "Could not update this person." });
    }
  }

  async function updateMarriage(
    marriage: AdminMarriageRow,
    patch: MarriagePatch,
  ) {
    if (
      "weddingYear" in patch ||
      "weddingMonth" in patch ||
      "weddingDay" in patch
    ) {
      const dateError = getDayMonthYearError({
        year:
          patch.weddingYear === undefined
            ? marriage.weddingYear
            : patch.weddingYear,
        month:
          patch.weddingMonth === undefined
            ? marriage.weddingMonth
            : patch.weddingMonth,
        day:
          patch.weddingDay === undefined
            ? marriage.weddingDay
            : patch.weddingDay,
      });

      if (dateError) {
        setStatus({ tone: "error", text: dateError });
        return;
      }
    }

    try {
      const response = await apiFetch(`/api/admin/marriages/${marriage.id}`, {
        method: "PATCH",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json().catch(() => ({ ok: false }));

      if (!response.ok || !data.ok || !data.marriage) {
        setStatus({
          tone: "error",
          text: data.message ?? "Could not update this marriage.",
        });
        return;
      }

      mergeMarriages([data.marriage]);
      setStatus({ tone: "success", text: "Marriage saved." });
    } catch {
      setStatus({ tone: "error", text: "Could not update this marriage." });
    }
  }

  async function savePersonDialog() {
    const patch: PersonPatch = {
      parentMarriageId: personForm.parentMarriageId,
      firstNameArabic: personForm.firstNameArabic,
      middleNameArabic: personForm.middleNameArabic,
      lastNameArabic: personForm.lastNameArabic,
      firstName: personForm.firstName,
      middleName: personForm.middleName,
      lastName: personForm.lastName,
      isMale: personForm.isMale,
      isAlive: personForm.isAlive,
      birthYear: personForm.birthYear,
      birthMonth: personForm.birthMonth,
      birthDay: personForm.birthDay,
      birthCity: personForm.birthCity,
      birthCountryCode: personForm.birthCountryCode,
      deathYear: personForm.deathYear,
      deathMonth: personForm.deathMonth,
      deathDay: personForm.deathDay,
      deathCity: personForm.deathCity,
      deathCountryCode: personForm.deathCountryCode,
    };
    const birthDateFieldsAreActive =
      personDialog?.mode !== "bulk" ||
      personBulkApply.birthYear ||
      personBulkApply.birthMonth ||
      personBulkApply.birthDay;
    const deathDateFieldsAreActive =
      personDialog?.mode !== "bulk" ||
      personBulkApply.deathYear ||
      personBulkApply.deathMonth ||
      personBulkApply.deathDay;
    const birthDateError = birthDateFieldsAreActive
      ? getDayMonthYearError({
          year: personForm.birthYear,
          month: personForm.birthMonth,
          day: personForm.birthDay,
        })
      : null;
    const deathDateError = deathDateFieldsAreActive
      ? getDayMonthYearError({
          year: personForm.deathYear,
          month: personForm.deathMonth,
          day: personForm.deathDay,
        })
      : null;

    if (birthDateError || deathDateError) {
      setStatus({ tone: "error", text: birthDateError ?? deathDateError });
      return;
    }

    try {
      if (personDialog?.mode === "create") {
        const response = await apiFetch("/api/admin/persons", {
          method: "POST",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await response.json().catch(() => ({ ok: false }));

        if (!response.ok || !data.ok || !data.person) {
          setStatus({
            tone: "error",
            text: data.message ?? "Could not create person.",
          });
          return;
        }

        setPersons((current) => [...current, data.person]);
        setStatus({ tone: "success", text: "Person created." });
      }

      if (personDialog?.mode === "edit") {
        await updatePerson(personDialog.person, patch);
      }

      if (personDialog?.mode === "bulk") {
        const bulkPatch = Object.fromEntries(
          Object.entries(patch).filter(
            ([key]) => personBulkApply[key as keyof PersonFormState],
          ),
        ) as PersonPatch;
        const response = await apiFetch("/api/admin/persons", {
          method: "PATCH",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: personDialog.ids, patch: bulkPatch }),
        });
        const data = await response.json().catch(() => ({ ok: false }));

        if (!response.ok || !data.ok || !data.persons) {
          setStatus({
            tone: "error",
            text: data.message ?? "Could not update selected people.",
          });
          return;
        }

        mergePersons(data.persons);
        setStatus({
          tone: "success",
          text: `${data.persons.length} people updated.`,
        });
      }

      setPersonDialog(null);
      setPersonForm(emptyPersonForm());
    } catch {
      setStatus({ tone: "error", text: "Could not save person data." });
    }
  }

  async function saveMarriageDialog() {
    const patch: MarriagePatch = {
      firstPartnerId: marriageForm.firstPartnerId ?? undefined,
      secondPartnerId: marriageForm.secondPartnerId,
      weddingYear: marriageForm.weddingYear,
      weddingMonth: marriageForm.weddingMonth,
      weddingDay: marriageForm.weddingDay,
      isDivorced: marriageForm.isDivorced,
    };
    const weddingDateFieldsAreActive =
      marriageDialog?.mode !== "bulk" ||
      marriageBulkApply.weddingYear ||
      marriageBulkApply.weddingMonth ||
      marriageBulkApply.weddingDay;
    const weddingDateError = weddingDateFieldsAreActive
      ? getDayMonthYearError({
          year: marriageForm.weddingYear,
          month: marriageForm.weddingMonth,
          day: marriageForm.weddingDay,
        })
      : null;

    if (weddingDateError) {
      setStatus({ tone: "error", text: weddingDateError });
      return;
    }

    try {
      if (marriageDialog?.mode === "create") {
        const response = await apiFetch("/api/admin/marriages", {
          method: "POST",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await response.json().catch(() => ({ ok: false }));

        if (!response.ok || !data.ok || !data.marriage) {
          setStatus({
            tone: "error",
            text: data.message ?? "Could not create marriage.",
          });
          return;
        }

        setMarriages((current) => [...current, data.marriage]);
        setStatus({ tone: "success", text: "Marriage created." });
      }

      if (marriageDialog?.mode === "edit") {
        await updateMarriage(marriageDialog.marriage, patch);
      }

      if (marriageDialog?.mode === "bulk") {
        const bulkPatch = Object.fromEntries(
          Object.entries(patch).filter(
            ([key]) => marriageBulkApply[key as keyof MarriageFormState],
          ),
        ) as MarriagePatch;
        const response = await apiFetch("/api/admin/marriages", {
          method: "PATCH",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: marriageDialog.ids, patch: bulkPatch }),
        });
        const data = await response.json().catch(() => ({ ok: false }));

        if (!response.ok || !data.ok || !data.marriages) {
          setStatus({
            tone: "error",
            text: data.message ?? "Could not update selected marriages.",
          });
          return;
        }

        mergeMarriages(data.marriages);
        setStatus({
          tone: "success",
          text: `${data.marriages.length} marriages updated.`,
        });
      }

      setMarriageDialog(null);
      setMarriageForm(emptyMarriageForm());
    } catch {
      setStatus({ tone: "error", text: "Could not save marriage data." });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    try {
      const endpoint =
        deleteTarget.kind === "person"
          ? "/api/admin/persons"
          : "/api/admin/marriages";
      const response = await apiFetch(endpoint, {
        method: "DELETE",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: deleteTarget.ids }),
      });
      const data = await response.json().catch(() => ({ ok: false }));

      if (!response.ok || !data.ok) {
        setStatus({
          tone: "error",
          text: data.message ?? "Could not remove records.",
        });
        return;
      }

      if (deleteTarget.kind === "person") {
        setPersons((current) =>
          current.filter((person) => !deleteTarget.ids.includes(person.id)),
        );
        setSelectedPersonIds(new Set());
        setStatus({
          tone: "success",
          text: `${deleteTarget.ids.length} people removed.`,
        });
      } else {
        setMarriages((current) =>
          current.filter((marriage) => !deleteTarget.ids.includes(marriage.id)),
        );
        setSelectedMarriageIds(new Set());
        setStatus({
          tone: "success",
          text: `${deleteTarget.ids.length} marriages removed.`,
        });
      }

      setDeleteTarget(null);
    } catch {
      setStatus({ tone: "error", text: "Could not remove records." });
    }
  }

  function openPersonEdit(person: AdminPersonPayload) {
    router.push(`/admin/persons/edit?id=${person.id}`);
  }

  function openPersonBulk() {
    setPersonForm(emptyPersonForm());
    setPersonBulkApply(emptyPersonBulkApply());
    setPersonDialog({ mode: "bulk", ids: Array.from(selectedPersonIds) });
  }

  function openMarriageEdit(marriage: AdminMarriageRow) {
    router.push(`/admin/marriages/edit?id=${marriage.id}`);
  }

  function openMarriageBulk() {
    setMarriageForm(emptyMarriageForm());
    setMarriageBulkApply(emptyMarriageBulkApply());
    setMarriageDialog({ mode: "bulk", ids: Array.from(selectedMarriageIds) });
  }

  function openSelectedModify() {
    if (mode === "persons") {
      const ids = Array.from(selectedPersonIds);
      if (ids.length === 1) {
        router.push(`/admin/persons/edit?id=${ids[0]}`);
        return;
      }

      openPersonBulk();
      return;
    }

    const ids = Array.from(selectedMarriageIds);
    if (ids.length === 1) {
      router.push(`/admin/marriages/edit?id=${ids[0]}`);
      return;
    }

    openMarriageBulk();
  }

  async function exportTable() {
    setIsExporting(true);
    setStatus({ tone: "neutral", text: "Preparing Excel export..." });

    try {
      const rows = await fetchAllRowsForExport();
      const stamp = new Date().toISOString().slice(0, 10);

      if (mode === "persons") {
        const personRows = rows as AdminPersonPayload[];

        downloadExcelSheet({
          fileName: `zlitni-tree-persons-${stamp}.xls`,
          sheetName: "Persons",
          columns: PERSON_EXPORT_COLUMNS,
          rows: personRows,
        });
        setStatus({
          tone: "success",
          text: `${personRows.length} people exported.`,
        });
        return;
      }

      const marriageRows = rows as AdminMarriageRow[];

      downloadExcelSheet({
        fileName: `zlitni-tree-marriages-${stamp}.xls`,
        sheetName: "Marriages",
        columns: MARRIAGE_EXPORT_COLUMNS,
        rows: marriageRows,
      });
      setStatus({
        tone: "success",
        text: `${marriageRows.length} marriages exported.`,
      });
    } catch (error) {
      setStatus({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not export the table.",
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function importTable(file: File) {
    setIsImporting(true);
    setStatus({ tone: "neutral", text: "Importing Excel file..." });

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await apiFetch(`/api/admin/${mode}/import`, {
        method: "POST",
        auth: true,
        body: formData,
      });
      const data: ImportResponse = await response
        .json()
        .catch(() => ({ ok: false }));

      if (!response.ok || !data.ok) {
        setStatus({
          tone: "error",
          text: data.message ?? "Could not import the Excel file.",
        });
        return;
      }

      setSelectedPersonIds(new Set());
      setSelectedMarriageIds(new Set());
      await loadTree();
      setStatus({
        tone: "success",
        text: `${data.importedCount ?? 0} ${
          mode === "persons" ? "people" : "marriages"
        } imported. ${data.createdCount ?? 0} created, ${
          data.updatedCount ?? 0
        } updated.`,
      });
    } catch (error) {
      setStatus({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not import the Excel file.",
      });
    } finally {
      setIsImporting(false);
    }
  }

  function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    event.currentTarget.value = "";

    if (file) void importTable(file);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <SearchField
            value={searchQuery}
            placeholder={
              mode === "persons"
                ? "Search people in Arabic or Latin..."
                : "Search marriages in Arabic or Latin..."
            }
            onChange={setSearchQuery}
          />
          <StatusText status={status} />
        </div>
        <div className="flex items-center gap-2 lg:ml-auto">
          <input
            ref={importInputRef}
            type="file"
            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={handleImportFileChange}
          />
          <AnimatedButton
            size="lg"
            variant="outline"
            icon="upload"
            loading={isImporting}
            loadingText="Importing..."
            onClick={() => importInputRef.current?.click()}
          >
            Import Excel
          </AnimatedButton>
          <AnimatedButton
            size="lg"
            variant="outline"
            icon="download"
            loading={isExporting}
            loadingText="Exporting..."
            onClick={() => void exportTable()}
          >
            Export Excel
          </AnimatedButton>
          <AnimatedButton
            size="lg"
            variant="outline"
            icon="refresh"
            loading={isLoading}
            loadingText="Loading..."
            onClick={() => void loadTree()}
          >
            Refresh
          </AnimatedButton>
          <AnimatedButton
            size="lg"
            variant="primary"
            icon="plus"
            onClick={() => router.push(`/admin/${mode}/new`)}
          >
            {mode === "persons" ? "Add person" : "Add marriage"}
          </AnimatedButton>
        </div>
      </div>

      {mode === "persons" ? (
        <div className="border-border bg-card overflow-auto rounded-xl border">
          <Table className="min-w-[1310px]">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="border-border h-9 w-10 border-r px-2">
                  <DotSelector
                    label="Select all people"
                    checked={allVisibleSelected}
                    mixed={someVisibleSelected}
                    onClick={toggleAllVisible}
                  />
                </TableHead>
                <SortableTableHead
                  label="ID"
                  sortKey="id"
                  sort={personSort}
                  onSort={togglePersonSort}
                  className="border-border h-9 w-[70px] border-r"
                />
                <SortableTableHead
                  label="Parent marriage"
                  sortKey="parentMarriage"
                  sort={personSort}
                  onSort={togglePersonSort}
                  className="border-border h-9 w-[260px] border-r"
                />
                <SortableTableHead
                  label="First name Arabic"
                  sortKey="firstNameArabic"
                  sort={personSort}
                  onSort={togglePersonSort}
                  className="border-border h-9 w-[160px] border-r"
                />
                <SortableTableHead
                  label="Last name Arabic"
                  sortKey="lastNameArabic"
                  sort={personSort}
                  onSort={togglePersonSort}
                  className="border-border h-9 w-[160px] border-r"
                />
                <SortableTableHead
                  label="First name"
                  sortKey="firstName"
                  sort={personSort}
                  onSort={togglePersonSort}
                  className="border-border h-9 w-[150px] border-r"
                />
                <SortableTableHead
                  label="Last name"
                  sortKey="lastName"
                  sort={personSort}
                  onSort={togglePersonSort}
                  className="border-border h-9 w-[150px] border-r"
                />
                <SortableTableHead
                  label="Male"
                  sortKey="isMale"
                  sort={personSort}
                  onSort={togglePersonSort}
                  className="border-border h-9 w-[90px] border-r"
                />
                <SortableTableHead
                  label="Alive"
                  sortKey="isAlive"
                  sort={personSort}
                  onSort={togglePersonSort}
                  className="border-border h-9 w-[90px] border-r"
                />
                <TableHead className="h-9 w-[100px] px-3 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiblePersons.map((person) => (
                <TableRow
                  key={person.id}
                  className="hover:bg-primary/5 h-10 [&>td]:h-10"
                >
                  <TableCell className="border-border h-10 border-r p-0">
                    <DotSelector
                      label={`Select ${formatPersonName(person)}`}
                      checked={selectedPersonIds.has(person.id)}
                      onClick={(event) => togglePerson(person.id, event)}
                    />
                  </TableCell>
                  <TableCell className="border-border text-muted-foreground h-10 border-r px-3 font-mono text-sm">
                    #{person.id}
                  </TableCell>
                  <TableCell className="border-border h-10 border-r p-0">
                    <MarriageSelect
                      value={person.parentMarriageId}
                      marriages={marriages}
                      placeholder="No parent marriage"
                      showSelectedId
                      onChange={(parentMarriageId) =>
                        void updatePerson(person, { parentMarriageId })
                      }
                    />
                  </TableCell>
                  <TableCell className="border-border h-10 border-r p-0">
                    <TextCell
                      value={person.firstNameArabic}
                      placeholder="First"
                      onCommit={(firstNameArabic) =>
                        void updatePerson(person, { firstNameArabic })
                      }
                    />
                  </TableCell>
                  <TableCell className="border-border h-10 border-r p-0">
                    <TextCell
                      value={person.lastNameArabic}
                      placeholder="Last"
                      onCommit={(lastNameArabic) =>
                        void updatePerson(person, { lastNameArabic })
                      }
                    />
                  </TableCell>
                  <TableCell className="border-border h-10 border-r p-0">
                    <TextCell
                      value={person.firstName}
                      placeholder="First"
                      onCommit={(firstName) =>
                        void updatePerson(person, { firstName })
                      }
                    />
                  </TableCell>
                  <TableCell className="border-border h-10 border-r p-0">
                    <TextCell
                      value={person.lastName}
                      placeholder="Last"
                      onCommit={(lastName) =>
                        void updatePerson(person, { lastName })
                      }
                    />
                  </TableCell>
                  <TableCell className="border-border h-10 border-r p-0">
                    <SwitchCell
                      checked={Boolean(person.isMale)}
                      label="Set male"
                      onCheckedChange={(isMale) =>
                        void updatePerson(person, { isMale })
                      }
                    />
                  </TableCell>
                  <TableCell className="border-border h-10 border-r p-0">
                    <SwitchCell
                      checked={person.isAlive ?? true}
                      label="Set alive"
                      onCheckedChange={(isAlive) =>
                        void updatePerson(person, { isAlive })
                      }
                    />
                  </TableCell>
                  <TableCell className="h-10 px-2 text-right">
                    <div className="flex justify-end gap-1">
                      <AnimatedButton
                        size="sm"
                        variant="ghost"
                        icon="pencil"
                        aria-label={`Modify ${formatPersonName(person)}`}
                        onClick={() => openPersonEdit(person)}
                      />
                      <AnimatedButton
                        size="sm"
                        variant="ghost"
                        icon="trash"
                        aria-label={`Remove ${formatPersonName(person)}`}
                        onClick={() =>
                          setDeleteTarget({ kind: "person", ids: [person.id] })
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {isLoading && visiblePersons.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    Loading people...
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && visiblePersons.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    {debouncedSearchQuery
                      ? "No people match your search."
                      : "No people yet."}
                  </TableCell>
                </TableRow>
              ) : null}
              {isLoadingMore ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-muted-foreground px-4 py-4 text-center text-sm"
                  >
                    Loading more people...
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border-border bg-card overflow-auto rounded-xl border">
          <Table className="min-w-[1150px]">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="border-border h-9 w-10 border-r px-2">
                  <DotSelector
                    label="Select all marriages"
                    checked={allVisibleSelected}
                    mixed={someVisibleSelected}
                    onClick={toggleAllVisible}
                  />
                </TableHead>
                <SortableTableHead
                  label="ID"
                  sortKey="id"
                  sort={marriageSort}
                  onSort={toggleMarriageSort}
                  className="border-border h-9 w-[70px] border-r"
                />
                <SortableTableHead
                  label="First partner"
                  sortKey="firstPartner"
                  sort={marriageSort}
                  onSort={toggleMarriageSort}
                  className="border-border h-9 w-[270px] border-r"
                />
                <SortableTableHead
                  label="Second partner"
                  sortKey="secondPartner"
                  sort={marriageSort}
                  onSort={toggleMarriageSort}
                  className="border-border h-9 w-[270px] border-r"
                />
                <SortableTableHead
                  label="Wedding date"
                  sortKey="weddingDate"
                  sort={marriageSort}
                  onSort={toggleMarriageSort}
                  className="border-border h-9 w-[250px] border-r"
                />
                <SortableTableHead
                  label="Divorced"
                  sortKey="isDivorced"
                  sort={marriageSort}
                  onSort={toggleMarriageSort}
                  className="border-border h-9 w-[110px] border-r"
                />
                <TableHead className="h-9 w-[100px] px-3 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleMarriages.map((marriage) => (
                <TableRow
                  key={marriage.id}
                  className="hover:bg-primary/5 h-10 [&>td]:h-10"
                >
                  <TableCell className="border-border h-10 border-r p-0">
                    <DotSelector
                      label={`Select marriage ${marriage.id}`}
                      checked={selectedMarriageIds.has(marriage.id)}
                      onClick={(event) => toggleMarriage(marriage.id, event)}
                    />
                  </TableCell>
                  <TableCell className="border-border text-muted-foreground h-10 border-r px-3 font-mono text-sm">
                    #{marriage.id}
                  </TableCell>
                  <TableCell className="border-border h-10 border-r p-0">
                    <PersonSelect
                      value={marriage.firstPartnerId}
                      persons={persons}
                      placeholder="First partner"
                      allowClear={false}
                      showSelectedId
                      onChange={(firstPartnerId) => {
                        if (firstPartnerId)
                          void updateMarriage(marriage, { firstPartnerId });
                      }}
                    />
                  </TableCell>
                  <TableCell className="border-border h-10 border-r p-0">
                    <PersonSelect
                      value={marriage.secondPartnerId}
                      persons={persons}
                      placeholder="No second partner"
                      showSelectedId
                      onChange={(secondPartnerId) =>
                        void updateMarriage(marriage, { secondPartnerId })
                      }
                    />
                  </TableCell>
                  <TableCell className="border-border h-10 border-r p-0">
                    <DayMonthYearInputGroup
                      value={{
                        year: marriage.weddingYear,
                        month: marriage.weddingMonth,
                        day: marriage.weddingDay,
                      }}
                      compact
                      showLabels={false}
                      showError={false}
                      placeholders={{ year: "Year", month: "Mo", day: "Day" }}
                      groupClassName="gap-0 divide-x divide-border"
                      inputClassName="h-full min-h-10 px-3"
                      onCommit={({ year, month, day }) =>
                        void updateMarriage(marriage, {
                          weddingYear: year,
                          weddingMonth: month,
                          weddingDay: day,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="border-border h-10 border-r p-0">
                    <SwitchCell
                      checked={marriage.isDivorced}
                      label="Set divorced"
                      onCheckedChange={(isDivorced) =>
                        void updateMarriage(marriage, { isDivorced })
                      }
                    />
                  </TableCell>
                  <TableCell className="h-10 px-2 text-right">
                    <div className="flex justify-end gap-1">
                      <AnimatedButton
                        size="sm"
                        variant="ghost"
                        icon="pencil"
                        aria-label={`Modify marriage ${marriage.id}`}
                        onClick={() => openMarriageEdit(marriage)}
                      />
                      <AnimatedButton
                        size="sm"
                        variant="ghost"
                        icon="trash"
                        aria-label={`Remove marriage ${marriage.id}`}
                        onClick={() =>
                          setDeleteTarget({
                            kind: "marriage",
                            ids: [marriage.id],
                          })
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {isLoading && visibleMarriages.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    Loading marriages...
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && visibleMarriages.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    {debouncedSearchQuery
                      ? "No marriages match your search."
                      : "No marriages yet."}
                  </TableCell>
                </TableRow>
              ) : null}
              {isLoadingMore ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground px-4 py-4 text-center text-sm"
                  >
                    Loading more marriages...
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}

      <div ref={loadMoreRef} className="h-1" aria-hidden="true" />

      {selectedCount > 0 ? (
        <div className="border-border bg-card fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit items-center gap-3 rounded-full border px-4 py-2 shadow-2xl shadow-black/20">
          <span className="text-foreground text-sm font-semibold">
            {selectedCount} selected
          </span>
          <AnimatedButton
            size="sm"
            variant="outline"
            icon="pencil"
            onClick={openSelectedModify}
          >
            Modify
          </AnimatedButton>
          <AnimatedButton
            size="sm"
            variant="ghost"
            icon="trash"
            onClick={() =>
              setDeleteTarget({
                kind: mode === "persons" ? "person" : "marriage",
                ids: Array.from(selectedIds),
              })
            }
          >
            Remove
          </AnimatedButton>
        </div>
      ) : null}

      <Dialog
        open={Boolean(personDialog)}
        onOpenChange={(open) => !open && setPersonDialog(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>
              {personDialog?.mode === "create"
                ? "Add person"
                : personDialog?.mode === "bulk"
                  ? "Modify selected people"
                  : "Modify person"}
            </DialogTitle>
            <DialogDescription>
              {personDialog?.mode === "bulk"
                ? "Enable the fields that should be applied to every selected row."
                : "Edit the complete person record."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow
              bulk={personDialog?.mode === "bulk"}
              applied={personBulkApply.parentMarriageId}
              onApplyChange={(checked) =>
                setPersonBulkApply((current) => ({
                  ...current,
                  parentMarriageId: checked,
                }))
              }
              label="Parent marriage"
            >
              <MarriageSelect
                value={personForm.parentMarriageId}
                marriages={marriages}
                placeholder="No parent marriage"
                disabled={
                  personDialog?.mode === "bulk" &&
                  !personBulkApply.parentMarriageId
                }
                onChange={(parentMarriageId) =>
                  setPersonForm((current) => ({ ...current, parentMarriageId }))
                }
              />
            </FormRow>
            <FormText
              label="First name Arabic"
              value={personForm.firstNameArabic}
              bulk={personDialog?.mode === "bulk"}
              applied={personBulkApply.firstNameArabic}
              onApplyChange={(checked) =>
                setPersonBulkApply((current) => ({
                  ...current,
                  firstNameArabic: checked,
                }))
              }
              onChange={(firstNameArabic) =>
                setPersonForm((current) => ({ ...current, firstNameArabic }))
              }
            />
            <FormText
              label="Middle name Arabic"
              value={personForm.middleNameArabic}
              bulk={personDialog?.mode === "bulk"}
              applied={personBulkApply.middleNameArabic}
              onApplyChange={(checked) =>
                setPersonBulkApply((current) => ({
                  ...current,
                  middleNameArabic: checked,
                }))
              }
              onChange={(middleNameArabic) =>
                setPersonForm((current) => ({ ...current, middleNameArabic }))
              }
            />
            <FormText
              label="Last name Arabic"
              value={personForm.lastNameArabic}
              bulk={personDialog?.mode === "bulk"}
              applied={personBulkApply.lastNameArabic}
              onApplyChange={(checked) =>
                setPersonBulkApply((current) => ({
                  ...current,
                  lastNameArabic: checked,
                }))
              }
              onChange={(lastNameArabic) =>
                setPersonForm((current) => ({ ...current, lastNameArabic }))
              }
            />
            <FormText
              label="First name"
              value={personForm.firstName}
              bulk={personDialog?.mode === "bulk"}
              applied={personBulkApply.firstName}
              onApplyChange={(checked) =>
                setPersonBulkApply((current) => ({
                  ...current,
                  firstName: checked,
                }))
              }
              onChange={(firstName) =>
                setPersonForm((current) => ({ ...current, firstName }))
              }
            />
            <FormText
              label="Middle name"
              value={personForm.middleName}
              bulk={personDialog?.mode === "bulk"}
              applied={personBulkApply.middleName}
              onApplyChange={(checked) =>
                setPersonBulkApply((current) => ({
                  ...current,
                  middleName: checked,
                }))
              }
              onChange={(middleName) =>
                setPersonForm((current) => ({ ...current, middleName }))
              }
            />
            <FormText
              label="Last name"
              value={personForm.lastName}
              bulk={personDialog?.mode === "bulk"}
              applied={personBulkApply.lastName}
              onApplyChange={(checked) =>
                setPersonBulkApply((current) => ({
                  ...current,
                  lastName: checked,
                }))
              }
              onChange={(lastName) =>
                setPersonForm((current) => ({ ...current, lastName }))
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <FormSwitch
                label="Male"
                checked={Boolean(personForm.isMale)}
                bulk={personDialog?.mode === "bulk"}
                applied={personBulkApply.isMale}
                onApplyChange={(checked) =>
                  setPersonBulkApply((current) => ({
                    ...current,
                    isMale: checked,
                  }))
                }
                onCheckedChange={(isMale) =>
                  setPersonForm((current) => ({ ...current, isMale }))
                }
              />
              <FormSwitch
                label="Alive"
                checked={personForm.isAlive ?? true}
                bulk={personDialog?.mode === "bulk"}
                applied={personBulkApply.isAlive}
                onApplyChange={(checked) =>
                  setPersonBulkApply((current) => ({
                    ...current,
                    isAlive: checked,
                  }))
                }
                onCheckedChange={(isAlive) =>
                  setPersonForm((current) => ({ ...current, isAlive }))
                }
              />
            </div>
            <FormDate
              label="Birth date"
              value={{
                year: personForm.birthYear,
                month: personForm.birthMonth,
                day: personForm.birthDay,
              }}
              bulk={personDialog?.mode === "bulk"}
              applied={{
                year: personBulkApply.birthYear,
                month: personBulkApply.birthMonth,
                day: personBulkApply.birthDay,
              }}
              onAppliedChange={(next) =>
                setPersonBulkApply((current) => ({
                  ...current,
                  birthYear: next.year,
                  birthMonth: next.month,
                  birthDay: next.day,
                }))
              }
              onChange={({ year, month, day }) =>
                setPersonForm((current) => ({
                  ...current,
                  birthYear: year,
                  birthMonth: month,
                  birthDay: day,
                }))
              }
            />
            <FormText
              label="Birth city"
              value={personForm.birthCity}
              bulk={personDialog?.mode === "bulk"}
              applied={personBulkApply.birthCity}
              onApplyChange={(checked) =>
                setPersonBulkApply((current) => ({
                  ...current,
                  birthCity: checked,
                }))
              }
              onChange={(birthCity) =>
                setPersonForm((current) => ({ ...current, birthCity }))
              }
            />
            <FormRow
              bulk={personDialog?.mode === "bulk"}
              applied={personBulkApply.birthCountryCode}
              onApplyChange={(checked) =>
                setPersonBulkApply((current) => ({
                  ...current,
                  birthCountryCode: checked,
                }))
              }
              label="Birth country"
            >
              <CountrySelect
                value={personForm.birthCountryCode}
                disabled={
                  personDialog?.mode === "bulk" &&
                  !personBulkApply.birthCountryCode
                }
                onChange={(birthCountryCode) =>
                  setPersonForm((current) => ({
                    ...current,
                    birthCountryCode,
                  }))
                }
              />
            </FormRow>
            <FormDate
              label="Death date"
              value={{
                year: personForm.deathYear,
                month: personForm.deathMonth,
                day: personForm.deathDay,
              }}
              bulk={personDialog?.mode === "bulk"}
              applied={{
                year: personBulkApply.deathYear,
                month: personBulkApply.deathMonth,
                day: personBulkApply.deathDay,
              }}
              onAppliedChange={(next) =>
                setPersonBulkApply((current) => ({
                  ...current,
                  deathYear: next.year,
                  deathMonth: next.month,
                  deathDay: next.day,
                }))
              }
              onChange={({ year, month, day }) =>
                setPersonForm((current) => ({
                  ...current,
                  deathYear: year,
                  deathMonth: month,
                  deathDay: day,
                }))
              }
            />
            <FormText
              label="Death city"
              value={personForm.deathCity}
              bulk={personDialog?.mode === "bulk"}
              applied={personBulkApply.deathCity}
              onApplyChange={(checked) =>
                setPersonBulkApply((current) => ({
                  ...current,
                  deathCity: checked,
                }))
              }
              onChange={(deathCity) =>
                setPersonForm((current) => ({ ...current, deathCity }))
              }
            />
            <FormRow
              bulk={personDialog?.mode === "bulk"}
              applied={personBulkApply.deathCountryCode}
              onApplyChange={(checked) =>
                setPersonBulkApply((current) => ({
                  ...current,
                  deathCountryCode: checked,
                }))
              }
              label="Death country"
            >
              <CountrySelect
                value={personForm.deathCountryCode}
                disabled={
                  personDialog?.mode === "bulk" &&
                  !personBulkApply.deathCountryCode
                }
                onChange={(deathCountryCode) =>
                  setPersonForm((current) => ({
                    ...current,
                    deathCountryCode,
                  }))
                }
              />
            </FormRow>
          </div>

          <DialogFooter>
            <AnimatedButton
              size="lg"
              variant="outline"
              onClick={() => setPersonDialog(null)}
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              size="lg"
              variant="primary"
              icon="save"
              onClick={() => void savePersonDialog()}
            >
              Save
            </AnimatedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(marriageDialog)}
        onOpenChange={(open) => !open && setMarriageDialog(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>
              {marriageDialog?.mode === "create"
                ? "Add marriage"
                : marriageDialog?.mode === "bulk"
                  ? "Modify selected marriages"
                  : "Modify marriage"}
            </DialogTitle>
            <DialogDescription>
              {marriageDialog?.mode === "bulk"
                ? "Enable the fields that should be applied to every selected row."
                : "Edit partner, wedding, and divorce status."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow
              bulk={marriageDialog?.mode === "bulk"}
              applied={marriageBulkApply.firstPartnerId}
              onApplyChange={(checked) =>
                setMarriageBulkApply((current) => ({
                  ...current,
                  firstPartnerId: checked,
                }))
              }
              label="First partner"
            >
              <PersonSelect
                value={marriageForm.firstPartnerId}
                persons={persons}
                placeholder="First partner"
                allowClear={false}
                disabled={
                  marriageDialog?.mode === "bulk" &&
                  !marriageBulkApply.firstPartnerId
                }
                onChange={(firstPartnerId) =>
                  setMarriageForm((current) => ({ ...current, firstPartnerId }))
                }
              />
            </FormRow>
            <FormRow
              bulk={marriageDialog?.mode === "bulk"}
              applied={marriageBulkApply.secondPartnerId}
              onApplyChange={(checked) =>
                setMarriageBulkApply((current) => ({
                  ...current,
                  secondPartnerId: checked,
                }))
              }
              label="Second partner"
            >
              <PersonSelect
                value={marriageForm.secondPartnerId}
                persons={persons}
                placeholder="No second partner"
                disabled={
                  marriageDialog?.mode === "bulk" &&
                  !marriageBulkApply.secondPartnerId
                }
                onChange={(secondPartnerId) =>
                  setMarriageForm((current) => ({
                    ...current,
                    secondPartnerId,
                  }))
                }
              />
            </FormRow>
            <FormDate
              label="Wedding date"
              value={{
                year: marriageForm.weddingYear,
                month: marriageForm.weddingMonth,
                day: marriageForm.weddingDay,
              }}
              bulk={marriageDialog?.mode === "bulk"}
              applied={{
                year: marriageBulkApply.weddingYear,
                month: marriageBulkApply.weddingMonth,
                day: marriageBulkApply.weddingDay,
              }}
              onAppliedChange={(next) =>
                setMarriageBulkApply((current) => ({
                  ...current,
                  weddingYear: next.year,
                  weddingMonth: next.month,
                  weddingDay: next.day,
                }))
              }
              onChange={({ year, month, day }) =>
                setMarriageForm((current) => ({
                  ...current,
                  weddingYear: year,
                  weddingMonth: month,
                  weddingDay: day,
                }))
              }
            />
            <FormSwitch
              label="Divorced"
              checked={marriageForm.isDivorced}
              bulk={marriageDialog?.mode === "bulk"}
              applied={marriageBulkApply.isDivorced}
              onApplyChange={(checked) =>
                setMarriageBulkApply((current) => ({
                  ...current,
                  isDivorced: checked,
                }))
              }
              onCheckedChange={(isDivorced) =>
                setMarriageForm((current) => ({
                  ...current,
                  isDivorced,
                }))
              }
            />
          </div>

          <DialogFooter>
            <AnimatedButton
              size="lg"
              variant="outline"
              onClick={() => setMarriageDialog(null)}
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              size="lg"
              variant="primary"
              icon="save"
              onClick={() => void saveMarriageDialog()}
            >
              Save
            </AnimatedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove records?</DialogTitle>
            <DialogDescription>
              This will remove {deleteTarget?.ids.length ?? 0}{" "}
              {deleteTarget?.kind === "person"
                ? "person record(s)"
                : "marriage record(s)"}
              . Records that are still referenced by the tree cannot be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <AnimatedButton
              size="lg"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              size="lg"
              variant="primary"
              icon="trash"
              onClick={() => void confirmDelete()}
            >
              Remove
            </AnimatedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormDate({
  label,
  value,
  bulk,
  applied,
  disabled,
  onAppliedChange,
  onChange,
}: {
  label: string;
  value: DayMonthYearValue;
  bulk?: boolean;
  applied?: DayMonthYearApplied;
  disabled?: boolean;
  onAppliedChange?: (next: DayMonthYearApplied) => void;
  onChange: (value: DayMonthYearValue) => void;
}) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>{label}</Label>
      <DayMonthYearInputGroup
        value={value}
        bulk={bulk}
        applied={applied}
        disabled={disabled}
        onAppliedChange={onAppliedChange}
        onChange={onChange}
      />
    </div>
  );
}

function FormRow({
  label,
  bulk,
  applied,
  onApplyChange,
  children,
}: {
  label: string;
  bulk?: boolean;
  applied?: boolean;
  onApplyChange?: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        {bulk ? (
          <FieldApplySwitch
            checked={Boolean(applied)}
            onCheckedChange={(checked) => onApplyChange?.(checked)}
          />
        ) : null}
      </div>
      <div
        className={cn(
          "border-input h-10 overflow-hidden rounded-xl border",
          bulk && !applied && "opacity-50",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function FormText({
  label,
  value,
  bulk,
  applied,
  onApplyChange,
  onChange,
}: {
  label: string;
  value: string | null;
  bulk?: boolean;
  applied?: boolean;
  onApplyChange?: (checked: boolean) => void;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        {bulk ? (
          <FieldApplySwitch
            checked={Boolean(applied)}
            onCheckedChange={(checked) => onApplyChange?.(checked)}
          />
        ) : null}
      </div>
      <Input
        value={value ?? ""}
        disabled={bulk && !applied}
        onChange={(event) => onChange(normalizeTextValue(event.target.value))}
        className="h-10 rounded-xl"
      />
    </div>
  );
}

function FormSwitch({
  label,
  checked,
  bulk,
  applied,
  onApplyChange,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  bulk?: boolean;
  applied?: boolean;
  onApplyChange?: (checked: boolean) => void;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "border-input rounded-xl border p-3",
        bulk && !applied && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        {bulk ? (
          <FieldApplySwitch
            checked={Boolean(applied)}
            onCheckedChange={(checked) => onApplyChange?.(checked)}
          />
        ) : null}
      </div>
      <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
        <span>{checked ? "Yes" : "No"}</span>
        <Switch
          checked={checked}
          disabled={bulk && !applied}
          aria-label={label}
          onCheckedChange={onCheckedChange}
        />
      </div>
    </div>
  );
}
