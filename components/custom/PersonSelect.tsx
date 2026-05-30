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
  scorePersonSearch,
  type PersonSearchRecord,
} from "@/components/custom/person-search";
import { cn } from "@/lib/utils";

export type PersonSelectPerson = PersonSearchRecord;

const NONE_VALUE = "__none__";

export { buildPersonSearchText, formatPersonName };

export function PersonSelect({
  value,
  persons,
  placeholder = "Select person",
  emptyText = "No person found.",
  allowClear = true,
  showSelectedId = false,
  disabled,
  className,
  triggerClassName,
  onChange,
}: {
  value: number | null;
  persons: PersonSelectPerson[];
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
      persons.map((person) => ({
        value: String(person.id),
        label: formatPersonName(person),
        description: `#${person.id}`,
        person,
        searchText: buildPersonSearchText(person),
      })),
    [persons],
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
                {selected.description}
              </span>
            ) : null}
          </span>
          <ChevronsUpDown
            className="text-muted-foreground h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("w-[340px] p-0", className)}>
        <Command
          filter={(itemValue, search) => {
            const option = options.find(
              (candidate) => candidate.value === itemValue,
            );
            return option ? scorePersonSearch(option.person, search) : 0;
          }}
        >
          <CommandInput placeholder="Search by Arabic or Latin name..." />
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
