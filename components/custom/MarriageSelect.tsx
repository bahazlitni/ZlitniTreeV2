"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  buildPersonSearchText,
  formatPersonName,
  type PersonSelectPerson,
} from "@/components/custom/PersonSelect";
import { cn } from "@/lib/utils";

export type MarriageSelectMarriage = {
  id: number;
  firstPartnerId: number;
  secondPartnerId: number | null;
  weddingYear: number | null;
  weddingMonth: number | null;
  weddingDay: number | null;
  isDivorced: boolean;
  firstPartner: PersonSelectPerson;
  secondPartner: PersonSelectPerson | null;
};

const NONE_VALUE = "__none__";

export function formatMarriageName(
  marriage: MarriageSelectMarriage | null | undefined,
) {
  if (!marriage) return "No parent marriage";

  const secondPartner = marriage.secondPartner
    ? formatPersonName(marriage.secondPartner)
    : "Unknown partner";

  return `${formatPersonName(marriage.firstPartner)} + ${secondPartner}`;
}

export function buildMarriageSearchText(marriage: MarriageSelectMarriage) {
  return [
    marriage.id,
    formatMarriageName(marriage),
    buildPersonSearchText(marriage.firstPartner),
    marriage.secondPartner ? buildPersonSearchText(marriage.secondPartner) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function MarriageSelect({
  value,
  marriages,
  placeholder = "Select marriage",
  emptyText = "No marriage found.",
  allowClear = true,
  showSelectedId = false,
  disabled,
  className,
  triggerClassName,
  onChange,
}: {
  value: number | null;
  marriages: MarriageSelectMarriage[];
  placeholder?: string;
  emptyText?: string;
  allowClear?: boolean;
  showSelectedId?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  onChange: (value: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = useMemo(
    () =>
      marriages.map((marriage) => ({
        value: String(marriage.id),
        label: formatMarriageName(marriage),
        description: `Marriage #${marriage.id}`,
        searchText: buildMarriageSearchText(marriage),
      })),
    [marriages],
  );
  const selected =
    value === null
      ? null
      : options.find((option) => option.value === String(value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "hover:bg-muted/40 flex h-full min-h-9 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-none bg-transparent px-3 text-left text-sm font-medium transition-colors outline-none disabled:pointer-events-none disabled:opacity-60",
            triggerClassName,
          )}
        >
          <span className="flex min-w-0 flex-1 items-baseline gap-2">
            <span
              className={cn("truncate", !selected && "text-muted-foreground")}
            >
              {selected?.label ?? placeholder}
            </span>
            {showSelectedId && selected ? (
              <span className="text-muted-foreground shrink-0 text-xs font-medium">
                #{selected.value}
              </span>
            ) : null}
          </span>
          <ChevronsUpDown
            className="text-muted-foreground h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("w-[380px] p-0", className)}>
        <Command
          filter={(itemValue, search) => {
            const option = options.find(
              (candidate) => candidate.value === itemValue,
            );
            const haystack = option?.searchText ?? itemValue;
            return haystack.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search by partner names..." />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allowClear ? (
                <CommandItem
                  value={NONE_VALUE}
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <span className="text-muted-foreground">None</span>
                  {value === null ? (
                    <Check className="ml-auto h-4 w-4" />
                  ) : null}
                </CommandItem>
              ) : null}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(Number(option.value));
                    setOpen(false);
                  }}
                >
                  <div className="min-w-0">
                    <div className="truncate">{option.label}</div>
                    <div className="text-muted-foreground truncate text-xs">
                      {option.description}
                    </div>
                  </div>
                  {String(value) === option.value ? (
                    <Check className="ml-auto h-4 w-4" />
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
