"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import AnimatedButton from "@/components/ui/custom/AnimatedButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
  required?: boolean;
};

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  required = true,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const t = useTranslations("Common");
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const isArabic = locale === "ar";

  return (
    <div className="space-y-2.5">
      <Label htmlFor={id} className="text-base font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-12 rounded-xl border-input bg-background px-4 text-base font-medium shadow-none placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-primary/20 dark:bg-input/20",
            isArabic ? "pl-12" : "pr-12",
          )}
        />
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2",
            isArabic ? "left-1.5" : "right-1.5",
          )}
        >
          <AnimatedButton
            size="sm"
            variant="ghost"
            icon={visible ? "eye-off" : "eye"}
            className="rounded-lg"
            aria-label={visible ? t("hidePassword") : t("showPassword")}
            onClick={() => setVisible((current) => !current)}
          />
        </div>
      </div>
    </div>
  );
}
