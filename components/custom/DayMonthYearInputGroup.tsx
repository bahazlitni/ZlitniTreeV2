"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type DayMonthYearValue = {
  year: number | null;
  month: number | null;
  day: number | null;
};

export type DayMonthYearApplied = {
  year: boolean;
  month: boolean;
  day: boolean;
};

type DraftValue = {
  year: string;
  month: string;
  day: string;
};

function toDraft(value: DayMonthYearValue): DraftValue {
  return {
    year: value.year === null ? "" : String(value.year),
    month: value.month === null ? "" : String(value.month),
    day: value.day === null ? "" : String(value.day),
  };
}

function parseDraftNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

export function isCompleteDayMonthYear(value: DayMonthYearValue) {
  return value.year !== null && value.month !== null && value.day !== null;
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getDaysInMonth(year: number, month: number) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

export function isValidCompleteDate(value: DayMonthYearValue) {
  if (!isCompleteDayMonthYear(value)) return true;

  const { year, month, day } = value;

  if (year === null || month === null || day === null) return true;
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  return day <= getDaysInMonth(year, month);
}

export function getDayMonthYearError(value: DayMonthYearValue) {
  if (
    (value.year !== null && !Number.isInteger(value.year)) ||
    (value.month !== null && !Number.isInteger(value.month)) ||
    (value.day !== null && !Number.isInteger(value.day))
  ) {
    return "Use whole numbers only.";
  }

  if (value.month !== null && (value.month < 1 || value.month > 12)) {
    return "Month must be between 1 and 12.";
  }

  if (value.day !== null && (value.day < 1 || value.day > 31)) {
    return "Day must be between 1 and 31.";
  }

  if (!isValidCompleteDate(value)) {
    return "This date does not exist.";
  }

  return null;
}

function parseDraft(draft: DraftValue): DayMonthYearValue {
  return {
    year: parseDraftNumber(draft.year),
    month: parseDraftNumber(draft.month),
    day: parseDraftNumber(draft.day),
  };
}

function valueChanged(a: DayMonthYearValue, b: DayMonthYearValue) {
  return a.year !== b.year || a.month !== b.month || a.day !== b.day;
}

function getValueKey(value: DayMonthYearValue) {
  return `${value.year ?? ""}|${value.month ?? ""}|${value.day ?? ""}`;
}

function ApplySwitch({
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
      aria-label="Apply this date part"
      onCheckedChange={onCheckedChange}
    />
  );
}

export function DayMonthYearInputGroup({
  value,
  labels = { year: "Year", month: "Month", day: "Day" },
  placeholders = { year: "Year", month: "Month", day: "Day" },
  disabled,
  compact = false,
  showLabels = true,
  showError = true,
  bulk = false,
  applied,
  className,
  groupClassName,
  inputClassName,
  onAppliedChange,
  onChange,
  onCommit,
}: {
  value: DayMonthYearValue;
  labels?: { year: string; month: string; day: string };
  placeholders?: { year: string; month: string; day: string };
  disabled?: boolean;
  compact?: boolean;
  showLabels?: boolean;
  showError?: boolean;
  bulk?: boolean;
  applied?: DayMonthYearApplied;
  className?: string;
  groupClassName?: string;
  inputClassName?: string;
  onAppliedChange?: (next: DayMonthYearApplied) => void;
  onChange?: (value: DayMonthYearValue) => void;
  onCommit?: (value: DayMonthYearValue) => void;
}) {
  const valueKey = getValueKey(value);
  const [draftState, setDraftState] = useState(() => ({
    valueKey,
    draft: toDraft(value),
  }));
  let currentDraftState = draftState;

  if (draftState.valueKey !== valueKey) {
    currentDraftState = { valueKey, draft: toDraft(value) };
    setDraftState(currentDraftState);
  }

  const draft = currentDraftState.draft;
  const parsed = parseDraft(draft);
  const error = getDayMonthYearError(parsed);

  function updateDraft(part: keyof DayMonthYearValue, nextValue: string) {
    const nextDraft = { ...draft, [part]: nextValue };
    setDraftState({ valueKey, draft: nextDraft });

    const nextValueObject = parseDraft(nextDraft);
    onChange?.(nextValueObject);
  }

  function commitDraft() {
    if (error || !onCommit || !valueChanged(value, parsed)) return;
    onCommit(parsed);
  }

  function setApplied(part: keyof DayMonthYearApplied, checked: boolean) {
    onAppliedChange?.({
      year: applied?.year ?? false,
      month: applied?.month ?? false,
      day: applied?.day ?? false,
      [part]: checked,
    });
  }

  const dateParts: Array<keyof DayMonthYearValue> = ["year", "month", "day"];

  return (
    <div className={cn("space-y-1.5", compact && "h-full", className)}>
      <div
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-[1fr_68px_68px]" : "grid-cols-3",
          compact && "h-full",
          groupClassName,
        )}
      >
        {dateParts.map((part) => {
          const isApplied = !bulk || Boolean(applied?.[part]);

          return (
            <div
              key={part}
              className={cn("min-w-0", showLabels ? "space-y-1" : "h-full")}
            >
              {showLabels ? (
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs text-muted-foreground">{labels[part]}</Label>
                  {bulk ? (
                    <ApplySwitch
                      checked={Boolean(applied?.[part])}
                      onCheckedChange={(checked) => setApplied(part, checked)}
                    />
                  ) : null}
                </div>
              ) : null}
              <Input
                type="number"
                value={draft[part]}
                min={part === "month" || part === "day" ? 1 : undefined}
                max={part === "month" ? 12 : part === "day" ? 31 : undefined}
                placeholder={placeholders[part]}
                disabled={disabled || !isApplied}
                aria-invalid={Boolean(error)}
                onChange={(event) => updateDraft(part, event.target.value)}
                onBlur={commitDraft}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                  if (event.key === "Escape") {
                    setDraftState({ valueKey, draft: toDraft(value) });
                    event.currentTarget.blur();
                  }
                }}
                className={cn(
                  "h-9 rounded-lg px-2 text-sm shadow-none",
                  compact && "rounded-none border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-primary/25",
                  error && "border-red-500/60 focus-visible:ring-red-500/20",
                  inputClassName,
                )}
              />
            </div>
          );
        })}
      </div>
      {showError && error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
