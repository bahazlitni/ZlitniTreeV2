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
  DEFAULT_COUNTRY_CODE,
  getCountryOptions,
} from "@/components/custom/countries";
import { cn } from "@/lib/utils";

const NONE_VALUE = "__none__";

export { DEFAULT_COUNTRY_CODE };

export function CountrySelect({
  value,
  defaultValue = DEFAULT_COUNTRY_CODE,
  placeholder = "Country",
  emptyText = "No country found.",
  allowClear = true,
  disabled,
  className,
  triggerClassName,
  onChange,
}: {
  value?: string | null;
  defaultValue?: string;
  placeholder?: string;
  emptyText?: string;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => getCountryOptions(), []);
  const activeValue = value === undefined ? defaultValue : value;
  const selected = activeValue
    ? options.find((option) => option.value === activeValue)
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "hover:bg-muted/40 flex h-full min-h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-none bg-transparent px-3 text-left text-sm font-medium transition-colors outline-none disabled:pointer-events-none disabled:opacity-60",
            triggerClassName,
          )}
        >
          <span
            className={cn("truncate", !selected && "text-muted-foreground")}
          >
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown
            className="text-muted-foreground h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("w-[280px] p-0", className)}>
        <Command
          filter={(itemValue, search) => {
            const option = options.find(
              (candidate) => candidate.value === itemValue,
            );
            const haystack = option?.searchText ?? itemValue;
            return haystack.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search country..." />
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
                  {activeValue === null ? (
                    <Check className="ml-auto h-4 w-4" />
                  ) : null}
                </CommandItem>
              ) : null}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  {activeValue === option.value ? (
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
