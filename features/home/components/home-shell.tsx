"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type FocusEvent,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import { Search, ShieldCheck, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";

import {
  formatPersonBirthDate,
  formatPersonNameForLocale,
  type PersonSearchRecordWithBirth,
} from "@/components/custom/person-search";
import { PasswordInput } from "@/features/auth/components/password-input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import AnimatedButton from "@/components/ui/custom/AnimatedButton";
import {
  FamilyTreeFlow,
  type FamilyTreeHandle,
} from "@/features/home/components/family-tree-flow";
import { useSession } from "@/features/auth/client/use-session";
import { apiFetch } from "@/lib/api/auth/api-fetch";
import { LoginMode, PowerType } from "@/lib/generated/prisma/enums";
import { isLocale, locales } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type PersonSearchResponse = {
  ok: boolean;
  persons?: PersonSearchRecordWithBirth[];
  message?: string;
};

function useCurrentLocale() {
  const rawLocale = useLocale();
  return isLocale(rawLocale) ? rawLocale : "en";
}

function useLocaleNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (nextLocale: string) => {
    if (!isLocale(nextLocale)) return;

    const pathWithoutLocale =
      pathname.replace(/^\/(en|fr|ar)(?=\/|$)/, "") || "/";
    const query = searchParams.toString();

    router.push(
      `/${nextLocale}${pathWithoutLocale}${query ? `?${query}` : ""}`,
    );
  };
}

function ToolbarButton({
  icon,
  label,
  children,
  onClick,
}: {
  icon: Parameters<typeof AnimatedButton>[0]["icon"];
  label: string;
  children?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <AnimatedButton
      size="md"
      variant="outline"
      icon={icon}
      aria-label={label}
      onClick={onClick}
      className="bg-background/90 shrink-0 backdrop-blur-xl"
    >
      {children}
    </AnimatedButton>
  );
}

function CompactThemeToggle() {
  const common = useTranslations("Common");
  const home = useTranslations("Home");
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <motion.span
      animate={{ rotate: isDark ? 0 : 180 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      className="inline-flex shrink-0"
    >
      <AnimatedButton
        size="md"
        variant="outline"
        icon={isDark ? "sun" : "moon"}
        aria-label={common("themeToggle")}
        title={home(isDark ? "lightMode" : "darkMode")}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="bg-background/90 backdrop-blur-xl"
      />
    </motion.span>
  );
}

function LanguageDropdown({ compact = false }: { compact?: boolean }) {
  const common = useTranslations("Common");
  const locale = useCurrentLocale();
  const navigateLocale = useLocaleNavigation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AnimatedButton
          size={compact ? "sm" : "md"}
          variant="outline"
          icon="globe"
          aria-label={common("language")}
          className="bg-background/90 backdrop-blur-xl"
        >
          {compact ? null : common(`languages.${locale}`)}
        </AnimatedButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel>{common("language")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={locale} onValueChange={navigateLocale}>
          {locales.map((item) => (
            <DropdownMenuRadioItem key={item} value={item}>
              {common(`languages.${item}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileLanguageSubMenu() {
  const common = useTranslations("Common");
  const locale = useCurrentLocale();
  const navigateLocale = useLocaleNavigation();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{common("language")}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-40">
        <DropdownMenuRadioGroup value={locale} onValueChange={navigateLocale}>
          {locales.map((item) => (
            <DropdownMenuRadioItem key={item} value={item}>
              {common(`languages.${item}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function PersonSearchBox({
  authenticated,
  onPersonSelect,
}: {
  authenticated: boolean;
  onPersonSelect?: (person: PersonSearchRecordWithBirth) => void;
}) {
  const t = useTranslations("Home");
  const locale = useCurrentLocale();
  const isRtl = locale === "ar";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonSearchRecordWithBirth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isFocusedWithin, setIsFocusedWithin] = useState(false);
  const trimmedQuery = query.trim();
  const birthDateLabels = useMemo(
    () => ({
      unknown: t("birthUnknown"),
      born: (date: string) => t("bornDate", { date }),
      bornMonthDay: (month: string, day: string) =>
        t("bornMonthDay", { month, day }),
      bornMonth: (month: string) => t("bornMonth", { month }),
      bornDay: (day: string) => t("bornDay", { day }),
    }),
    [t],
  );

  useEffect(() => {
    if (!authenticated || !isFocusedWithin) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setMessage(null);

      try {
        const response = await apiFetch(
          `/api/persons/search?q=${encodeURIComponent(trimmedQuery)}&limit=8`,
          {
            method: "GET",
            auth: true,
            signal: controller.signal,
          },
        );
        const data: PersonSearchResponse = await response
          .json()
          .catch(() => ({ ok: false }));

        if (!response.ok || !data.ok || !data.persons) {
          setResults([]);
          setMessage(data.message ?? t("searchError"));
          return;
        }

        setResults(data.persons);
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
        setMessage(t("searchError"));
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [authenticated, isFocusedWithin, trimmedQuery, t]);

  const showPanel =
    authenticated &&
    isFocusedWithin &&
    (trimmedQuery.length > 0 || results.length > 0 || message || isLoading);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextFocus = event.relatedTarget;

    if (
      !(nextFocus instanceof Node) ||
      !event.currentTarget.contains(nextFocus)
    ) {
      setIsLoading(false);
      setIsFocusedWithin(false);
    }
  }

  return (
    <div
      className="relative w-full min-w-0 sm:w-[320px]"
      onFocusCapture={() => setIsFocusedWithin(true)}
      onBlurCapture={handleBlur}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        value={query}
        disabled={!authenticated}
        placeholder={
          authenticated ? t("searchPlaceholder") : t("searchLoginRequired")
        }
        onChange={(event) => setQuery(event.currentTarget.value)}
        className="border-border bg-background/90 placeholder:text-muted-foreground/75 focus-visible:border-primary focus-visible:ring-primary/20 dark:bg-background/80 h-10 rounded-xl pr-4 pl-10 text-sm font-medium shadow-lg shadow-black/5 backdrop-blur-xl dark:shadow-black/30"
      />
      {showPanel ? (
        <div
          className={cn(
            "border-border bg-popover/95 absolute top-[calc(100%+0.5rem)] z-50 max-h-[320px] w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border p-1 shadow-2xl shadow-black/10 backdrop-blur-xl dark:shadow-black/40",
            isRtl ? "right-0 text-right" : "left-0 text-left",
          )}
        >
          {isLoading ? (
            <p className="text-muted-foreground px-3 py-3 text-sm font-medium">
              {t("searching")}
            </p>
          ) : null}
          {!isLoading && message ? (
            <p className="text-muted-foreground px-3 py-3 text-sm font-medium">
              {message}
            </p>
          ) : null}
          {!isLoading && !message && results.length === 0 ? (
            <p className="text-muted-foreground px-3 py-3 text-sm font-medium">
              {t("searchEmpty")}
            </p>
          ) : null}
          {!isLoading && !message
            ? results.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className="hover:bg-muted/70 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-start transition-colors"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setQuery(formatPersonNameForLocale(person, locale));
                    setIsFocusedWithin(false);
                    onPersonSelect?.(person);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {formatPersonNameForLocale(person, locale)}
                    </span>
                    <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                      {formatPersonBirthDate(person, birthDateLabels)}
                    </span>
                  </span>
                  <span className="text-muted-foreground shrink-0 font-mono text-xs">
                    #{person.id}
                  </span>
                </button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}

function AccountDatum({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-border flex items-start justify-between gap-5 border-b px-1 py-4 last:border-b-0">
      <span className="text-muted-foreground max-w-32 text-sm leading-6 font-medium">
        {label}
      </span>
      <span className="text-end text-sm leading-6 font-semibold break-words">
        {children ?? value}
      </span>
    </div>
  );
}

function AccountDialog({
  open,
  onOpenChange,
  session,
  clearSession,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ReturnType<typeof useSession>["session"];
  clearSession: () => void;
}) {
  const common = useTranslations("Common");
  const auth = useTranslations("Auth");
  const home = useTranslations("Home");
  const locale = useCurrentLocale();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canChangePassword = session?.loginMode !== LoginMode.PASSWORDLESS;

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStatus(null);
    setError(null);
  };

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setError(null);

    if (newPassword.length < 8) {
      setError(auth("validation.weak"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(auth("validation.mismatch"));
      return;
    }

    setIsSaving(true);

    try {
      const response = await apiFetch("/api/auth/change-password", {
        method: "POST",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => ({ ok: false }));

      if (!response.ok || !data.ok) {
        setError(data.message ?? auth("change.error"));
        return;
      }

      setStatus(auth("change.successBody"));
      clearSession();
      window.setTimeout(() => router.push(`/${locale}/login`), 450);
    } catch {
      setError(auth("change.error"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogContent className="max-h-[88vh] gap-7 overflow-y-auto p-7 sm:max-w-4xl sm:p-8">
        <DialogHeader className="pe-12">
          <DialogTitle className="text-xl font-semibold">
            {home("accountTitle")}
          </DialogTitle>
        </DialogHeader>

        {session ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)] lg:items-start">
            <section className="border-border bg-card/45 rounded-xl border px-5 py-3">
              <AccountDatum label={auth("email")} value={session.email} />
              <AccountDatum
                label={home("role")}
                value={common(`roles.${session.powerType}`)}
              />
              <AccountDatum
                label={home("loginMode")}
                value={session.loginMode.replaceAll("_", " ").toLowerCase()}
              />
              <AccountDatum label={home("accountId")}>
                <span className="text-muted-foreground font-mono text-xs">
                  {session.id}
                </span>
              </AccountDatum>
            </section>

            <section className="min-w-0">
              <div className="mb-5">
                <h3 className="text-base font-semibold">
                  {auth("login.changePassword")}
                </h3>
              </div>

              {canChangePassword ? (
                <form className="space-y-4" onSubmit={changePassword}>
                  <input
                    type="text"
                    autoComplete="username"
                    value={session.email}
                    readOnly
                    hidden
                  />
                  <PasswordInput
                    id="home-current-password"
                    label={auth("currentPassword")}
                    value={currentPassword}
                    autoComplete="current-password"
                    onChange={setCurrentPassword}
                  />
                  <PasswordInput
                    id="home-new-password"
                    label={auth("newPassword")}
                    value={newPassword}
                    autoComplete="new-password"
                    onChange={setNewPassword}
                  />
                  <PasswordInput
                    id="home-confirm-password"
                    label={auth("confirmPassword")}
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={setConfirmPassword}
                  />
                  {error ? (
                    <p className="text-sm font-medium text-red-600 dark:text-red-300">
                      {error}
                    </p>
                  ) : null}
                  {status ? (
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">
                      {status}
                    </p>
                  ) : null}
                  <AnimatedButton
                    type="submit"
                    size="md"
                    variant="primary"
                    icon="shield-check"
                    loading={isSaving}
                    loadingText={auth("change.loading")}
                    className="mt-1"
                  >
                    {auth("change.action")}
                  </AnimatedButton>
                </form>
              ) : (
                <p className="text-muted-foreground text-sm leading-6 font-medium">
                  {auth("change.passwordless")}
                </p>
              )}
            </section>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm font-medium">
            {home("accountLoginRequired")}
          </p>
        )}

        <DialogFooter>
          <AnimatedButton
            size="md"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {common("continue")}
          </AnimatedButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MobileMenu({
  onAccount,
  onFit,
}: {
  onAccount: () => void;
  onFit: () => void;
}) {
  const t = useTranslations("Home");
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AnimatedButton
          size="md"
          variant="outline"
          icon="menu"
          aria-label={t("menu")}
          className="bg-background/90 backdrop-blur-xl"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={onFit}>{t("fit")}</DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            setTheme(isDark ? "light" : "dark");
          }}
        >
          {t(isDark ? "lightMode" : "darkMode")}
        </DropdownMenuItem>
        <MobileLanguageSubMenu />
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onAccount}>
          {t("myAccount")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ViewportHint({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="border-border bg-background/75 dark:bg-background/65 flex items-center gap-3 rounded-xl border px-3 py-2 shadow-lg shadow-black/5 backdrop-blur-xl dark:shadow-black/25">
      <Icon className="text-primary size-4" aria-hidden="true" />
      <span className="min-w-0">
        <span className="text-muted-foreground block text-[11px] font-semibold uppercase">
          {label}
        </span>
        <span className="block truncate text-sm font-semibold">{value}</span>
      </span>
    </div>
  );
}

export function HomeShell() {
  const common = useTranslations("Common");
  const t = useTranslations("Home");
  const auth = useTranslations("Auth");
  const locale = useCurrentLocale();
  const router = useRouter();
  const { session, isAuthenticated, isLoading, clearSession } = useSession({
    redirectToLogin: false,
  });
  const treeRef = useRef<FamilyTreeHandle>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const isAdmin =
    session?.powerType === PowerType.ROOT ||
    session?.powerType === PowerType.ADMIN;
  const roleLabel = session ? common(`roles.${session.powerType}`) : t("guest");

  const authButton = useMemo(() => {
    if (isAuthenticated) {
      return {
        label: common("logout"),
        icon: "logout" as const,
        action: async () => {
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          }).catch(() => null);
          clearSession();
        },
      };
    }

    return {
      label: auth("login.title"),
      icon: "login" as const,
      action: () => router.push(`/${locale}/login`),
    };
  }, [auth, clearSession, common, isAuthenticated, locale, router]);

  return (
    <main
      className="bg-background text-foreground relative min-h-screen overflow-hidden"
      aria-label={t("treeAria")}
    >
      <FamilyTreeFlow ref={treeRef} authenticated={isAuthenticated} />

      <div
        className={cn(
          "fixed top-3 z-40 hidden max-w-[calc(100vw-1.5rem)] flex-wrap items-start gap-1.5 md:flex",
          locale === "ar" ? "right-3 left-auto" : "left-3",
        )}
      >
        {isAuthenticated && (
          <ToolbarButton
            icon="user"
            label={t("myAccount")}
            onClick={() => setAccountOpen(true)}
          />
        )}
        <PersonSearchBox
          authenticated={isAuthenticated}
          onPersonSelect={(person) => treeRef.current?.pushFocus(person.id)}
        />
        <ToolbarButton
          icon="scaling"
          label={t("fit")}
          onClick={() => treeRef.current?.fitView()}
        />
        <CompactThemeToggle />
        <LanguageDropdown />

        <ToolbarButton
          icon={authButton.icon}
          label={authButton.label}
          onClick={() => void authButton.action()}
        >
          {authButton.label}
        </ToolbarButton>
      </div>

      <div className="fixed top-3 right-3 left-3 z-40 flex items-start gap-1.5 md:hidden">
        <PersonSearchBox
          authenticated={isAuthenticated}
          onPersonSelect={(person) => treeRef.current?.pushFocus(person.id)}
        />
        <AnimatedButton
          size="md"
          variant="outline"
          icon={authButton.icon}
          aria-label={authButton.label}
          onClick={() => void authButton.action()}
          className="bg-background/90 shrink-0 backdrop-blur-xl"
        />
        <MobileMenu
          onAccount={() => setAccountOpen(true)}
          onFit={() => treeRef.current?.fitView()}
        />
      </div>

      {isAdmin ? (
        <div className="fixed right-3 bottom-3 z-40">
          <AnimatedButton
            size="md"
            variant="primary"
            icon="shield-check"
            aria-label="Admin panel"
            onClick={() => router.push("/admin")}
            className="shadow-primary/20 shadow-lg"
            dir="ltr"
          >
            Admin panel
          </AnimatedButton>
        </div>
      ) : null}

      <section className="pointer-events-none absolute bottom-4 left-4 hidden justify-between gap-3 md:flex">
        <ViewportHint
          icon={ShieldCheck}
          label={isLoading ? common("loading") : t("access")}
          value={isAuthenticated ? roleLabel : t("signedOut")}
        />
      </section>

      <AccountDialog
        open={accountOpen}
        onOpenChange={setAccountOpen}
        session={session}
        clearSession={clearSession}
      />
    </main>
  );
}
