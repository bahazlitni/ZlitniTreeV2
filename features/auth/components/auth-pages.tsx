"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import OtpInput from "@/components/custom/OtpInput";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AnimatedButton from "@/components/ui/custom/AnimatedButton";
import type { AnimatedIconName } from "@/components/ui/custom/AnimatedIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import { isLocale, locales } from "@/i18n/routing";
import {
  ACCESS_TOKEN_KEY,
  AUTH_USER_KEY,
  apiFetch,
} from "@/lib/api/auth/api-fetch";
import {
  removeStoredItem,
  setStoredItem,
} from "@/lib/api/auth/browser-storage";
import { LoginMode } from "@/lib/generated/prisma/enums";
import type { Locale, Theme } from "@/lib/global-types";
import { cn } from "@/lib/utils";
import { useSession } from "@/features/auth/client/use-session";
import type { Session } from "@/features/auth/types";
import { PasswordInput } from "./password-input";
import { ThemeToggle } from "./theme-toggle";

type AuthResponse = {
  ok?: boolean;
  message?: string;
  requiresPassword?: boolean;
  requiresOtp?: boolean;
  accessToken?: string;
  user?: Session;
  cooldownSeconds?: number;
};

type NoticeType = "error" | "success" | "neutral";
type LoginStep = "email" | "password" | "otp";

const MIN_PASSWORD_LENGTH = 8;
const LOGIN_STEP_ORDER: Record<LoginStep, number> = {
  email: 0,
  password: 1,
  otp: 2,
};

const loginStepVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 34 : -34,
    filter: "blur(3px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -34 : 34,
    filter: "blur(3px)",
  }),
};

function useCurrentLocale(): Locale {
  const locale = useLocale();
  return isLocale(locale) ? locale : "en";
}

function useMailTheme(): Theme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "light" ? "light" : "dark";
}

function parseJson(response: Response) {
  return response.json().catch(() => ({})) as Promise<AuthResponse>;
}

function storeSession(data: AuthResponse) {
  if (!data.accessToken || !data.user) {
    return false;
  }

  setStoredItem(ACCESS_TOKEN_KEY, data.accessToken);
  setStoredItem(AUTH_USER_KEY, JSON.stringify(data.user));
  return true;
}

function clearStoredSession() {
  removeStoredItem(ACCESS_TOKEN_KEY);
  removeStoredItem(AUTH_USER_KEY);
}

function LocaleSelect() {
  const t = useTranslations("Common");
  const locale = useCurrentLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(nextLocale: Locale) {
    const pathWithoutLocale =
      pathname.replace(/^\/(en|fr|ar)(?=\/|$)/, "") || "/";
    const query = searchParams.toString();
    router.replace(
      `/${nextLocale}${pathWithoutLocale}${query ? `?${query}` : ""}`,
      { scroll: false },
    );
  }

  return (
    <Select
      value={locale}
      onValueChange={(value) => handleChange(value as Locale)}
    >
      <SelectTrigger
        aria-label={t("language")}
        className="border-border bg-background dark:bg-input/20 h-10 min-w-[8rem] rounded-xl px-3 text-sm font-medium shadow-sm data-[size=default]:h-10"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end" className="rounded-xl">
        {locales.map((item) => (
          <SelectItem key={item} value={item} className="rounded-lg">
            {t(`languages.${item}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AuthFrame({
  title,
  actionIcon,
  actionLabel,
  onAction,
  children,
  bodyClassName,
  titleClassName,
  wide = false,
}: {
  title: string;
  actionIcon: AnimatedIconName;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
  bodyClassName?: string;
  titleClassName?: string;
  wide?: boolean;
}) {
  return (
    <main className="bg-background text-foreground selection:bg-primary/20 flex min-h-screen items-center justify-center px-4 py-8">
      <section
        className={cn(
          "border-border bg-card w-full overflow-hidden rounded-[20px] border shadow-2xl shadow-black/5 dark:shadow-black/35",
          wide ? "max-w-[900px]" : "max-w-[680px]",
        )}
      >
        <header className="border-border flex flex-wrap items-center gap-3 border-b px-5 py-6 sm:flex-nowrap sm:gap-4 sm:px-8 sm:py-8">
          <AnimatedButton
            size="lg"
            variant="outline"
            icon={actionIcon}
            aria-label={actionLabel}
            onClick={onAction}
            className="shrink-0"
          />
          <h1
            className={cn(
              "text-foreground min-w-0 flex-1 text-3xl leading-tight font-semibold tracking-normal sm:text-4xl",
              titleClassName,
            )}
          >
            {title}
          </h1>
          <div className="flex shrink-0 items-center gap-2.5">
            <ThemeToggle />
            <LocaleSelect />
          </div>
        </header>
        <div className={cn("px-5 py-7 sm:px-10 sm:py-9", bodyClassName)}>
          {children}
        </div>
      </section>
    </main>
  );
}

function Notice({
  type,
  title,
  children,
  className,
}: {
  type: NoticeType;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const Icon =
    type === "success" ? CheckCircle2 : type === "neutral" ? Info : AlertCircle;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 text-sm leading-6 font-medium",
        type === "success" && "text-emerald-700 dark:text-emerald-300",
        type === "error" && "text-red-700 dark:text-red-300",
        type === "neutral" && "text-muted-foreground",
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        {title ? (
          <div className="font-semibold text-current">{title}</div>
        ) : null}
        <div>{children}</div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  placeholder,
  required = true,
  disabled,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <Label htmlFor={id} className="text-base font-medium">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="border-input bg-background placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-primary/20 dark:bg-input/20 h-12 rounded-xl px-4 text-base font-medium shadow-none"
      />
    </div>
  );
}

function FormIntro({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground mb-5 max-w-2xl text-base leading-7">
      {children}
    </p>
  );
}

function useAuthNavigation(step: LoginStep | "form") {
  const router = useRouter();
  const locale = useCurrentLocale();
  const t = useTranslations("Common");

  if (step === "password" || step === "otp") {
    return {
      icon: "arrow-left" as const,
      label: t("back"),
      action: null,
    };
  }

  return {
    icon: "home" as const,
    label: t("home"),
    action: () => router.replace(`/${locale}/login`),
  };
}

function SignedInPanel({
  session,
  onLogout,
}: {
  session: Session;
  onLogout: () => Promise<void>;
}) {
  const common = useTranslations("Common");
  const auth = useTranslations("Auth");
  const router = useRouter();
  const locale = useCurrentLocale();
  const role = common(`roles.${session.powerType}`);

  return (
    <div className="space-y-9">
      <p className="text-center text-sm leading-7 font-semibold text-emerald-700 dark:text-emerald-300">
        {auth("login.signedInMessage", {
          email: session.email,
          role,
        })}
      </p>
      <div className="flex items-center justify-between gap-4">
        <AnimatedButton
          size="lg"
          variant="outline"
          icon="logout"
          onClick={() => void onLogout()}
        >
          {common("logout")}
        </AnimatedButton>
        <AnimatedButton
          size="lg"
          variant="primary"
          icon={locale === "ar" ? "arrow-left" : "arrow-right"}
          iconPosition={locale === "ar" ? "left" : "right"}
          onClick={() => router.push(`/${locale}`)}
        >
          {common("continue")}
        </AnimatedButton>
      </div>
    </div>
  );
}

function LoginStepPanel({
  stepKey,
  direction,
  children,
}: {
  stepKey: LoginStep;
  direction: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      key={stepKey}
      custom={direction}
      variants={loginStepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function LoginPage() {
  const router = useRouter();
  const locale = useCurrentLocale();
  const mailTheme = useMailTheme();
  const common = useTranslations("Common");
  const auth = useTranslations("Auth");
  const { session, isLoading, clearSession } = useSession({
    redirectToLogin: false,
  });
  const [step, setStep] = useState<LoginStep>("email");
  const [slideDirection, setSlideDirection] = useState(1);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [notice, setNotice] = useState<{
    type: NoticeType;
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigation = useAuthNavigation(step);
  const isRtl = locale === "ar";
  const stepMotionDirection = isRtl ? slideDirection : -slideDirection;
  const nextChevronIcon = isRtl ? "chevron-left" : "chevron-right";

  function goToStep(nextStep: LoginStep) {
    if (nextStep === step) return;

    setSlideDirection(
      LOGIN_STEP_ORDER[nextStep] > LOGIN_STEP_ORDER[step] ? 1 : -1,
    );
    setNotice(null);
    setStep(nextStep);
  }

  function completeLogin(data: AuthResponse) {
    if (!storeSession(data)) {
      setNotice({ type: "error", text: auth("validation.startError") });
      return false;
    }

    setPasswordRequired(false);
    setPassword("");
    setNotice(null);
    router.replace(`/${locale}`);
    return true;
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setNotice({ type: "error", text: auth("validation.missingFields") });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          locale,
          theme: mailTheme,
        }),
      });
      const data = await parseJson(response);

      if (!response.ok || !data.ok) {
        setNotice({
          type: "error",
          text:
            response.status === 401
              ? auth("validation.invalidCredentials")
              : auth("validation.startError"),
        });
        return;
      }

      if (data.requiresPassword) {
        setPassword("");
        setPasswordRequired(true);
        goToStep("password");
        return;
      }

      if (data.requiresOtp) {
        setCooldownSeconds(Number(data.cooldownSeconds ?? 0));
        setPasswordRequired(false);
        goToStep("otp");
        return;
      }

      completeLogin(data);
    } catch {
      setNotice({ type: "error", text: auth("validation.startError") });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password) {
      setNotice({ type: "error", text: auth("validation.passwordRequired") });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          locale,
          theme: mailTheme,
        }),
      });
      const data = await parseJson(response);

      if (!response.ok || !data.ok) {
        setNotice({
          type: "error",
          text:
            response.status === 401
              ? auth("validation.invalidCredentials")
              : auth("validation.startError"),
        });
        return;
      }

      if (data.requiresOtp) {
        setCooldownSeconds(Number(data.cooldownSeconds ?? 0));
        setPasswordRequired(true);
        goToStep("otp");
        return;
      }

      completeLogin(data);
    } catch {
      setNotice({ type: "error", text: auth("validation.startError") });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendLoginCode() {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          locale,
          theme: mailTheme,
        }),
      });
      const data = await parseJson(response);

      if (!response.ok || !data.ok) {
        return "error-sending-code" as const;
      }

      setCooldownSeconds(Number(data.cooldownSeconds ?? 0));

      if (data.requiresPassword) {
        setPasswordRequired(true);
        goToStep("password");
        return "error-sending-code" as const;
      }

      if (data.requiresOtp) {
        return data.message?.toLowerCase().includes("already")
          ? ("code-already-sent" as const)
          : ("code-resent" as const);
      }

      completeLogin(data);
      return "code-resent" as const;
    } catch {
      return "error-sending-code" as const;
    }
  }

  async function verifyLoginCode(code: string) {
    try {
      const response = await fetch("/api/auth/login/otp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await parseJson(response);

      if (response.ok && data.ok && completeLogin(data)) {
        return "code-correct" as const;
      }

      if (response.status === 429) {
        return "too-many-attempts" as const;
      }

      if (response.status === 401) {
        return "code-mismatch" as const;
      }

      return "error-verifying-code" as const;
    } catch {
      return "error-verifying-code" as const;
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      clearStoredSession();
      clearSession();
    }
  }

  return (
    <AuthFrame
      title={auth("login.title")}
      actionIcon={navigation.icon}
      actionLabel={navigation.label}
      onAction={() => {
        if (step === "otp") {
          goToStep(passwordRequired ? "password" : "email");
          return;
        }
        if (step === "password") {
          goToStep("email");
          return;
        }
        navigation.action?.();
      }}
    >
      {step === "email" && isLoading ? (
        <Notice type="neutral">{common("loading")}</Notice>
      ) : null}

      {step === "email" && !isLoading && session ? (
        <SignedInPanel session={session} onLogout={logout} />
      ) : null}

      {!isLoading && !session ? (
        <AnimatePresence
          mode="wait"
          initial={false}
          custom={stepMotionDirection}
        >
          {step === "email" ? (
            <LoginStepPanel stepKey="email" direction={stepMotionDirection}>
              <form className="space-y-5" onSubmit={submitEmail}>
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-base font-medium">
                    {auth("email")}
                  </Label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      required
                      disabled={isSubmitting}
                      autoComplete="email"
                      placeholder={auth("emailPlaceholder")}
                      onChange={(event) => setEmail(event.target.value)}
                      className="border-input bg-background placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-primary/20 dark:bg-input/20 h-12 min-w-0 flex-1 rounded-xl px-4 text-base font-medium shadow-none"
                    />
                    <AnimatedButton
                      type="submit"
                      size="lg"
                      variant="primary"
                      icon={nextChevronIcon}
                      iconPosition={isRtl ? "left" : "right"}
                      loading={isSubmitting}
                      loadingText={auth("login.loading")}
                      className="h-12 w-full sm:w-auto"
                    >
                      {auth("login.action")}
                    </AnimatedButton>
                  </div>
                </div>

                {notice ? (
                  <Notice type={notice.type}>{notice.text}</Notice>
                ) : null}
              </form>

              <div className="mt-7 text-sm font-semibold">
                <Link
                  href="/how-to-make-account"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  {auth("login.accountHelp")}
                </Link>
              </div>
            </LoginStepPanel>
          ) : null}

          {step === "password" ? (
            <LoginStepPanel stepKey="password" direction={stepMotionDirection}>
              <form className="space-y-5" onSubmit={submitPassword}>
                <input
                  type="text"
                  autoComplete="username"
                  value={email}
                  readOnly
                  hidden
                />
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <PasswordInput
                    id="password"
                    label={auth("password")}
                    value={password}
                    autoComplete="current-password"
                    placeholder={auth("passwordPlaceholder")}
                    onChange={setPassword}
                  />
                  <AnimatedButton
                    type="submit"
                    size="lg"
                    variant="primary"
                    icon={nextChevronIcon}
                    iconPosition={isRtl ? "left" : "right"}
                    loading={isSubmitting}
                    loadingText={auth("login.loading")}
                    className="h-12 w-full sm:w-auto"
                  >
                    {auth("login.action")}
                  </AnimatedButton>
                </div>

                {notice ? (
                  <Notice type={notice.type}>{notice.text}</Notice>
                ) : null}

                <Link
                  className="text-primary hover:text-primary/80 inline-flex text-sm font-semibold transition-colors"
                  href="/forgot-password"
                >
                  {auth("login.forgot")}
                </Link>
              </form>
            </LoginStepPanel>
          ) : null}

          {step === "otp" ? (
            <LoginStepPanel stepKey="otp" direction={stepMotionDirection}>
              <div className="space-y-6">
                <p className="text-foreground text-lg leading-7 font-medium sm:text-xl">
                  {auth("login.otpSentTo", { email })}
                </p>
                <OtpInput
                  key={`${email}-${cooldownSeconds}`}
                  size="xl"
                  cooldownSeconds={cooldownSeconds}
                  resendCode={resendLoginCode}
                  verifyCode={verifyLoginCode}
                  align={isRtl ? "end" : "start"}
                />
              </div>
            </LoginStepPanel>
          ) : null}
        </AnimatePresence>
      ) : null}
    </AuthFrame>
  );
}

export function ForgotPasswordPage() {
  const router = useRouter();
  const locale = useCurrentLocale();
  const mailTheme = useMailTheme();
  const auth = useTranslations("Auth");
  const common = useTranslations("Common");
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<{
    type: NoticeType;
    title?: string;
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          locale,
          theme: mailTheme,
        }),
      });

      if (!response.ok) {
        setNotice({ type: "error", text: auth("forgot.error") });
        return;
      }

      setNotice({
        type: "success",
        title: auth("forgot.successTitle"),
        text: auth("forgot.successBody"),
      });
    } catch {
      setNotice({ type: "error", text: auth("forgot.error") });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthFrame
      title={auth("forgot.title")}
      actionIcon="arrow-left"
      actionLabel={common("back")}
      onAction={() => router.push(`/${locale}/login`)}
    >
      <FormIntro>{auth("forgot.subtitle")}</FormIntro>
      <form className="space-y-5" onSubmit={submitForgotPassword}>
        <Field
          id="forgot-email"
          label={auth("email")}
          type="email"
          value={email}
          autoComplete="email"
          placeholder={auth("emailPlaceholder")}
          onChange={setEmail}
        />

        {notice ? (
          <Notice type={notice.type} title={notice.title}>
            {notice.text}
          </Notice>
        ) : null}

        <AnimatedButton
          type="submit"
          size="lg"
          variant="primary"
          icon="mail"
          loading={isSubmitting}
          loadingText={auth("forgot.loading")}
        >
          {auth("forgot.action")}
        </AnimatedButton>
      </form>
    </AuthFrame>
  );
}

export function ResetPasswordPage() {
  const router = useRouter();
  const locale = useCurrentLocale();
  const searchParams = useSearchParams();
  const auth = useTranslations("Auth");
  const common = useTranslations("Common");
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState<{
    type: NoticeType;
    title?: string;
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => token.length > 0, [token]);

  async function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setNotice({ type: "error", text: auth("reset.missingToken") });
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setNotice({ type: "error", text: auth("validation.weak") });
      return;
    }

    if (password !== confirmPassword) {
      setNotice({ type: "error", text: auth("validation.mismatch") });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        setNotice({ type: "error", text: auth("reset.error") });
        return;
      }

      clearStoredSession();
      setNotice({
        type: "success",
        title: auth("reset.successTitle"),
        text: auth("reset.successBody"),
      });
      setPassword("");
      setConfirmPassword("");
    } catch {
      setNotice({ type: "error", text: auth("reset.error") });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthFrame
      title={auth("reset.title")}
      actionIcon="arrow-left"
      actionLabel={common("back")}
      onAction={() => router.push(`/${locale}/login`)}
    >
      <FormIntro>{auth("reset.subtitle")}</FormIntro>
      <form className="space-y-5" onSubmit={submitResetPassword}>
        <input type="text" autoComplete="username" value="" readOnly hidden />
        {!canSubmit ? (
          <Notice type="error">{auth("reset.missingToken")}</Notice>
        ) : null}
        <PasswordInput
          id="reset-password"
          label={auth("newPassword")}
          value={password}
          autoComplete="new-password"
          placeholder={auth("newPasswordPlaceholder")}
          onChange={setPassword}
        />
        <PasswordInput
          id="reset-confirm-password"
          label={auth("confirmPassword")}
          value={confirmPassword}
          autoComplete="new-password"
          placeholder={auth("confirmPasswordPlaceholder")}
          onChange={setConfirmPassword}
        />

        {notice ? (
          <Notice type={notice.type} title={notice.title}>
            {notice.text}
          </Notice>
        ) : null}

        <AnimatedButton
          type="submit"
          size="lg"
          variant="primary"
          icon="key"
          disabled={!canSubmit}
          loading={isSubmitting}
          loadingText={auth("reset.loading")}
        >
          {auth("reset.action")}
        </AnimatedButton>
      </form>
    </AuthFrame>
  );
}

export function ChangePasswordPage() {
  const router = useRouter();
  const locale = useCurrentLocale();
  const auth = useTranslations("Auth");
  const common = useTranslations("Common");
  const { session, isLoading, clearSession } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState<{
    type: NoticeType;
    title?: string;
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canChangePassword = session?.loginMode !== LoginMode.PASSWORDLESS;

  async function submitChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canChangePassword) {
      setNotice({ type: "error", text: auth("change.passwordless") });
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setNotice({ type: "error", text: auth("validation.weak") });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotice({ type: "error", text: auth("validation.mismatch") });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const response = await apiFetch("/api/auth/change-password", {
        method: "POST",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        setNotice({ type: "error", text: auth("change.error") });
        return;
      }

      clearStoredSession();
      clearSession();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice({
        type: "success",
        title: auth("change.successTitle"),
        text: auth("change.successBody"),
      });
    } catch {
      setNotice({ type: "error", text: auth("change.error") });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthFrame
      title={auth("change.title")}
      actionIcon="arrow-left"
      actionLabel={common("back")}
      onAction={() => router.push(`/${locale}/login`)}
    >
      <FormIntro>{auth("change.subtitle")}</FormIntro>

      {isLoading ? (
        <Notice type="neutral" className="mb-6">
          {auth("change.loadingSession")}
        </Notice>
      ) : session ? (
        <Notice type="neutral" className="mb-6">
          {auth("change.signedInAs", { email: session.email })}
        </Notice>
      ) : null}

      {!isLoading && session && !canChangePassword ? (
        <Notice type="neutral">{auth("change.passwordless")}</Notice>
      ) : (
        <form className="space-y-5" onSubmit={submitChangePassword}>
          <input
            type="text"
            autoComplete="username"
            value={session?.email ?? ""}
            readOnly
            hidden
          />
          <PasswordInput
            id="current-password"
            label={auth("currentPassword")}
            value={currentPassword}
            autoComplete="current-password"
            placeholder={auth("passwordPlaceholder")}
            onChange={setCurrentPassword}
          />
          <PasswordInput
            id="change-new-password"
            label={auth("newPassword")}
            value={newPassword}
            autoComplete="new-password"
            placeholder={auth("newPasswordPlaceholder")}
            onChange={setNewPassword}
          />
          <PasswordInput
            id="change-confirm-password"
            label={auth("confirmPassword")}
            value={confirmPassword}
            autoComplete="new-password"
            placeholder={auth("confirmPasswordPlaceholder")}
            onChange={setConfirmPassword}
          />

          {notice ? (
            <Notice type={notice.type} title={notice.title}>
              {notice.text}
            </Notice>
          ) : null}

          <AnimatedButton
            type="submit"
            size="lg"
            variant="primary"
            icon="shield-check"
            disabled={isLoading}
            loading={isSubmitting}
            loadingText={auth("change.loading")}
          >
            {auth("change.action")}
          </AnimatedButton>
        </form>
      )}
    </AuthFrame>
  );
}

function RoleRow({
  label,
  children,
  tone,
}: {
  label: string;
  children: ReactNode;
  tone: "admin" | "member" | "anon";
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <span
        className={cn(
          "inline-flex w-fit shrink-0 rounded-xl border px-3 py-1 text-sm font-semibold",
          tone === "admin" && "border-primary/35 bg-primary/10 text-primary",
          tone === "member" &&
            "border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300",
          tone === "anon" &&
            "border-border bg-background text-muted-foreground",
        )}
      >
        {label}
      </span>
      <p className="text-foreground text-base leading-7">{children}</p>
    </div>
  );
}

export function AccountHelpPage() {
  const router = useRouter();
  const locale = useCurrentLocale();
  const common = useTranslations("Common");
  const help = useTranslations("AccountHelp");

  return (
    <AuthFrame
      title={help("title")}
      actionIcon="home"
      actionLabel={common("home")}
      onAction={() => router.push(`/${locale}/login`)}
      wide
      titleClassName="text-center sm:text-5xl"
      bodyClassName="max-h-[calc(100vh-14rem)] overflow-y-auto"
    >
      <div className="space-y-9">
        <AnimatedButton
          size="lg"
          variant="outline"
          icon="login"
          onClick={() => router.push(`/${locale}/login`)}
        >
          {help("login")}
        </AnimatedButton>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-normal">
            {help("howTitle")}
          </h2>
          <p className="text-foreground text-base leading-7">{help("intro")}</p>
          <ol className="text-foreground space-y-3 ps-7 text-base leading-7">
            <li>{help("steps.one")}</li>
            <li>{help("steps.two")}</li>
            <li>{help("steps.three")}</li>
            <li>{help("steps.four")}</li>
          </ol>
          <p className="text-muted-foreground text-sm leading-6">
            {help("rolePersistence")}
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-normal">
            {help("rolesTitle")}
          </h2>
          <div className="space-y-5">
            <RoleRow label={help("roles.admin.label")} tone="admin">
              {help("roles.admin.description")}
            </RoleRow>
            <RoleRow label={help("roles.member.label")} tone="member">
              {help("roles.member.description")}
            </RoleRow>
            <RoleRow label={help("roles.anon.label")} tone="anon">
              {help("roles.anon.description")}
            </RoleRow>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-normal">
            {help("faqTitle")}
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem
              value="password"
              className="border-border rounded-xl border px-4"
            >
              <AccordionTrigger className="py-3 text-base font-semibold hover:no-underline">
                {help("faq.password.question")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-7">
                {help("faq.password.answer")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="role"
              className="border-border rounded-xl border px-4"
            >
              <AccordionTrigger className="py-3 text-base font-semibold hover:no-underline">
                {help("faq.role.question")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-7">
                {help("faq.role.answer")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </AuthFrame>
  );
}
