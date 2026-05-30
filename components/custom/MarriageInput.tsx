"use client";

import { useMemo, useState, type UIEvent } from "react";
import { Check, Plus, Search } from "lucide-react";

import {
  buildMarriageSearchText,
  formatMarriageName,
  type MarriageSelectMarriage,
} from "@/components/custom/MarriageSelect";
import { formatPersonName } from "@/components/custom/PersonSelect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type MarriageInputMarriage = MarriageSelectMarriage;

const PAGE_SIZE = 40;

function getMarriagePartners(
  marriage: MarriageInputMarriage | null | undefined,
) {
  if (!marriage) {
    return {
      firstPartner: "No parent marriage",
      secondPartner: "Unknown partner",
    };
  }

  return {
    firstPartner: formatPersonName(marriage.firstPartner),
    secondPartner: marriage.secondPartner
      ? formatPersonName(marriage.secondPartner)
      : "Unknown partner",
  };
}

export function MarriageInput({
  value,
  marriages,
  placeholder = "Add new marriage",
  title = "Select marriage",
  emptyText = "No marriage found.",
  allowClear = true,
  disabled,
  className,
  onChange,
}: {
  value: number | null;
  marriages: MarriageInputMarriage[];
  placeholder?: string;
  title?: string;
  emptyText?: string;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
  onChange: (value: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const selected = useMemo(
    () => marriages.find((marriage) => marriage.id === value) ?? null,
    [marriages, value],
  );
  const selectedPartners = selected
    ? getMarriagePartners(selected)
    : {
        firstPartner: value === null ? null : `Marriage #${value}`,
        secondPartner: "Marriage details unavailable",
      };

  const options = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return marriages
      .map((marriage) => ({
        marriage,
        label: formatMarriageName(marriage),
        partners: getMarriagePartners(marriage),
        searchText: buildMarriageSearchText(marriage),
      }))
      .filter((option) => {
        if (!normalizedSearch) return true;

        return option.searchText.includes(normalizedSearch);
      });
  }, [marriages, search]);
  const visibleOptions = options.slice(0, visibleCount);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    setVisibleCount(PAGE_SIZE);

    if (!nextOpen) {
      setSearch("");
    }
  }

  function handleSearchChange(nextSearch: string) {
    setSearch(nextSearch);
    setVisibleCount(PAGE_SIZE);
  }

  function handleSelect(nextValue: number | null) {
    onChange(nextValue);
    setOpen(false);
    setSearch("");
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const isNearBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - 32;

    if (isNearBottom) {
      setVisibleCount((current) =>
        Math.min(current + PAGE_SIZE, options.length),
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "group border-input bg-background hover:border-primary/40 hover:bg-muted/30 focus-visible:ring-primary/30 flex min-h-28 w-full cursor-pointer items-center rounded-xl border px-4 py-3 text-left shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60",
            className,
          )}
        >
          {selectedPartners.firstPartner ? (
            <span className="min-w-0">
              <span className="text-primary block text-[11px] font-semibold tracking-normal uppercase">
                Selected marriage
              </span>
              <span className="text-foreground mt-1 block truncate text-base font-semibold">
                {selectedPartners.firstPartner}
              </span>
              <span className="text-muted-foreground mt-1 block truncate text-xs font-medium">
                + {selectedPartners.secondPartner}
              </span>
            </span>
          ) : (
            <span className="flex w-full flex-col items-center justify-center gap-2 text-center">
              <span className="border-primary/25 bg-primary/10 text-primary group-hover:bg-primary/15 flex size-9 items-center justify-center rounded-full border transition-colors">
                <Plus className="size-4" aria-hidden="true" />
              </span>
              <span className="text-foreground text-sm font-semibold">
                {placeholder}
              </span>
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-border border-b px-5 py-4 pr-14">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          <DialogDescription>Search by either partner name.</DialogDescription>
          <div className="relative mt-2">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              value={search}
              placeholder="Search marriages..."
              className="h-10 rounded-lg pl-9"
              onChange={(event) => handleSearchChange(event.target.value)}
            />
          </div>
        </DialogHeader>
        <div
          className="max-h-[60vh] overflow-y-auto p-2"
          onScroll={handleScroll}
        >
          {allowClear ? (
            <button
              type="button"
              className={cn(
                "hover:border-border hover:bg-muted/40 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm transition-colors",
                value === null && "border-primary/30 bg-primary/5 text-primary",
              )}
              onClick={() => handleSelect(null)}
            >
              <span className="text-muted-foreground font-medium">
                No marriage
              </span>
              {value === null ? (
                <Check className="text-primary size-4" aria-hidden="true" />
              ) : null}
            </button>
          ) : null}

          {visibleOptions.map((option) => (
            <button
              key={option.marriage.id}
              type="button"
              className={cn(
                "hover:border-border hover:bg-muted/40 mt-1 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm transition-colors",
                value === option.marriage.id &&
                  "border-primary/30 bg-primary/5",
              )}
              onClick={() => handleSelect(option.marriage.id)}
            >
              <span className="min-w-0">
                <span className="text-foreground block truncate font-medium">
                  {option.label}
                </span>
                <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                  Marriage #{option.marriage.id}
                </span>
              </span>
              {value === option.marriage.id ? (
                <Check
                  className="text-primary size-4 shrink-0"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          ))}

          {options.length === 0 ? (
            <p className="text-muted-foreground px-3 py-8 text-center text-sm">
              {emptyText}
            </p>
          ) : null}

          {visibleOptions.length < options.length ? (
            <p className="text-muted-foreground px-3 py-3 text-center text-xs font-medium">
              Scroll for more marriages
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
