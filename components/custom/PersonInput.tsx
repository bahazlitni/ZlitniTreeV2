"use client";

import { useMemo, useState, type UIEvent } from "react";
import { Check, Plus, Search } from "lucide-react";

import {
  formatPersonBirthDate,
  formatPersonName,
  rankPersonSearchResults,
  type PersonSearchRecordWithBirth,
} from "@/components/custom/person-search";
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

export type PersonInputPerson = PersonSearchRecordWithBirth;

const PAGE_SIZE = 40;

export function PersonInput({
  value,
  persons,
  placeholder = "Add new person",
  title = "Select person",
  emptyText = "No person found.",
  allowClear = true,
  disabled,
  className,
  onChange,
}: {
  value: number | null;
  persons: PersonInputPerson[];
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
    () => persons.find((person) => person.id === value) ?? null,
    [persons, value],
  );
  const selectedName = selected
    ? formatPersonName(selected)
    : value === null
      ? null
      : `Person #${value}`;
  const selectedBirthDate = selected
    ? formatPersonBirthDate(selected)
    : "Birth date unknown";

  const options = useMemo(() => {
    return rankPersonSearchResults(persons, search).map((person) => ({
      person,
      label: formatPersonName(person),
      birthDate: formatPersonBirthDate(person),
    }));
  }, [persons, search]);
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
          {selectedName ? (
            <span className="min-w-0">
              <span className="text-primary block text-[11px] font-semibold tracking-normal uppercase">
                Selected person
              </span>
              <span className="text-foreground mt-1 block truncate text-base font-semibold">
                {selectedName}
              </span>
              <span className="text-muted-foreground mt-1 block truncate text-xs font-medium">
                {selectedBirthDate}
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
          <DialogDescription>
            Search by Arabic or Latin full name.
          </DialogDescription>
          <div className="relative mt-2">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              value={search}
              placeholder="Search people..."
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
                No person
              </span>
              {value === null ? (
                <Check className="text-primary size-4" aria-hidden="true" />
              ) : null}
            </button>
          ) : null}

          {visibleOptions.map((option) => (
            <button
              key={option.person.id}
              type="button"
              className={cn(
                "hover:border-border hover:bg-muted/40 mt-1 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm transition-colors",
                value === option.person.id && "border-primary/30 bg-primary/5",
              )}
              onClick={() => handleSelect(option.person.id)}
            >
              <span className="min-w-0">
                <span className="text-foreground block truncate font-medium">
                  {option.label}
                </span>
                <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                  {option.birthDate}
                </span>
              </span>
              {value === option.person.id ? (
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
              Scroll for more people
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
