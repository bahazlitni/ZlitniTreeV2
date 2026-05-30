"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useTranslations } from "next-intl";

import type { Size } from "@/lib/global-types";
import AnimatedButton from "../ui/custom/AnimatedButton";

type Status = "idle" | "error" | "success" | "warning";

type FeedbackKey =
  | "idle"
  | "error-sending-code"
  | "error-verifying-code"
  | "code-mismatch"
  | "code-already-sent"
  | "too-many-attempts"
  | "code-resent"
  | "code-correct"
  | "resend-in-cooldown";

type ResendResult =
  | "error-sending-code"
  | "code-already-sent"
  | "code-resent"
  | "resend-in-cooldown";

type VerifyResult =
  | "error-verifying-code"
  | "code-mismatch"
  | "too-many-attempts"
  | "code-correct";

interface OtpInputProps {
  length?: number;
  size: Size;
  resendCode: () => Promise<ResendResult>;
  verifyCode: (code: string) => Promise<VerifyResult>;
  onSuccess?: () => void;
  cooldownSeconds?: number;
  autoVerifyOnComplete?: boolean;
  align?: "start" | "end";
}

const FEEDBACKS: Record<
  FeedbackKey,
  { status: Status; messageKey: string | null }
> = {
  idle: {
    status: "idle",
    messageKey: null,
  },
  "error-sending-code": {
    status: "error",
    messageKey: "feedback.errorSendingCode",
  },
  "error-verifying-code": {
    status: "error",
    messageKey: "feedback.errorVerifyingCode",
  },
  "code-mismatch": {
    status: "error",
    messageKey: "feedback.codeMismatch",
  },
  "code-already-sent": {
    status: "warning",
    messageKey: "feedback.codeAlreadySent",
  },
  "too-many-attempts": {
    status: "warning",
    messageKey: "feedback.tooManyAttempts",
  },
  "resend-in-cooldown": {
    status: "warning",
    messageKey: "feedback.resendInCooldown",
  },
  "code-resent": {
    status: "success",
    messageKey: "feedback.codeResent",
  },
  "code-correct": {
    status: "success",
    messageKey: "feedback.codeCorrect",
  },
};

const CELL_SIZE_CLASSES: Record<Size, string> = {
  xs: "h-8 w-8 rounded-lg text-sm",
  sm: "h-9 w-9 rounded-lg text-base",
  md: "h-11 w-11 rounded-xl text-lg",
  lg: "h-14 w-14 rounded-xl text-xl",
  xl: "h-16 w-16 rounded-xl text-2xl",
  "2xl":
    "h-20 w-20 rounded-xl text-4xl max-sm:h-12 max-sm:w-12 max-sm:text-2xl",
};

const CELL_GAP_CLASSES: Record<Size, string> = {
  xs: "gap-1.5",
  sm: "gap-2",
  md: "gap-2.5",
  lg: "gap-4",
  xl: "gap-5",
  "2xl": "gap-8 max-sm:gap-2.5",
};

const STATUS_BORDER_CLASSES: Record<Status, string> = {
  idle: "border-border border-b-muted-foreground/70",
  error: "border-red-500/35 border-b-red-300",
  warning: "border-amber-500/35 border-b-amber-300",
  success: "border-emerald-500/35 border-b-emerald-300",
};

const STATUS_RING_CLASSES: Record<Status, string> = {
  idle: "focus:border-primary focus:ring-primary/25",
  error: "focus:border-red-500 focus:ring-red-500/25",
  warning: "focus:border-amber-500 focus:ring-amber-500/25",
  success: "focus:border-emerald-500 focus:ring-emerald-500/25",
};

const MESSAGE_CLASSES: Record<Status, string> = {
  idle: "text-muted-foreground",
  error: "text-red-600 dark:text-red-300",
  warning: "text-amber-600 dark:text-amber-300",
  success: "text-emerald-600 dark:text-emerald-300",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function buildRange(start: number, end: number) {
  const min = Math.min(start, end);
  const max = Math.max(start, end);

  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

function selectedIndexesToArray(selectedIndexes: Set<number>) {
  return Array.from(selectedIndexes).sort((a, b) => a - b);
}

export default function OtpInput({
  length = 6,
  size,
  resendCode,
  verifyCode,
  onSuccess,
  cooldownSeconds = 0,
  autoVerifyOnComplete = true,
  align = "start",
}: OtpInputProps) {
  const t = useTranslations("Otp");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const cellsRef = useRef<HTMLDivElement | null>(null);
  const [digits, setDigits] = useState(() => Array.from({ length }, () => ""));
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(
    () => new Set([0]),
  );
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [feedbackKey, setFeedbackKey] = useState<FeedbackKey>("idle");
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState<
    number | null
  >(() => (cooldownSeconds > 0 ? cooldownSeconds : null));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const feedback = FEEDBACKS[feedbackKey];
  const status = feedback.status;
  const code = digits.join("");
  const canVerify =
    code.length === length &&
    !digits.includes("") &&
    !isVerifying &&
    !isResending;
  const canResend =
    resendCooldownSeconds === null && !isResending && !isVerifying;

  const message = useMemo(() => {
    if (!feedback.messageKey) return null;
    return t(feedback.messageKey);
  }, [feedback.messageKey, t]);

  useEffect(() => {
    if (resendCooldownSeconds === null || resendCooldownSeconds <= 0) return;

    const timeout = window.setTimeout(() => {
      setResendCooldownSeconds((current) => {
        if (current === null) return null;
        return current <= 1 ? null : current - 1;
      });
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [resendCooldownSeconds]);

  useEffect(() => {
    function clearSelectionOnOutsideClick(event: PointerEvent) {
      if (cellsRef.current?.contains(event.target as Node)) return;
      setSelectedIndexes(new Set());
    }

    document.addEventListener("pointerdown", clearSelectionOnOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", clearSelectionOnOutsideClick);
    };
  }, []);

  function focusCell(index: number) {
    const safeIndex = Math.max(0, Math.min(index, length - 1));
    setFocusedIndex(safeIndex);

    requestAnimationFrame(() => {
      inputRefs.current[safeIndex]?.focus();
      inputRefs.current[safeIndex]?.select();
    });
  }

  async function handleVerify(nextCode = code) {
    if (nextCode.length !== length || isVerifying || isResending) return;

    setIsVerifying(true);

    try {
      const result = await verifyCode(nextCode);
      setFeedbackKey(result);

      if (result === "code-correct") {
        onSuccess?.();
      }
    } finally {
      setIsVerifying(false);
    }
  }

  function commitDigits(
    nextDigits: string[],
    focusIndex?: number,
    nextSelectedIndexes?: Set<number>,
  ) {
    setDigits(nextDigits);

    if (feedbackKey !== "idle") {
      setFeedbackKey("idle");
    }

    if (nextSelectedIndexes) {
      setSelectedIndexes(nextSelectedIndexes);
    }

    if (typeof focusIndex === "number") {
      focusCell(focusIndex);
    }

    const nextCode = nextDigits.join("");

    if (
      autoVerifyOnComplete &&
      nextCode.length === length &&
      !nextDigits.includes("")
    ) {
      void handleVerify(nextCode);
    }
  }

  function selectOnly(index: number) {
    setSelectedIndexes(new Set([index]));
    focusCell(index);
  }

  function getClosestSelectedIndex(index: number, selection = selectedIndexes) {
    const selected = selectedIndexesToArray(selection);

    if (selected.length === 0) {
      return focusedIndex;
    }

    return selected.reduce((closest, current) =>
      Math.abs(current - index) < Math.abs(closest - index) ? current : closest,
    );
  }

  function handleCellClick(event: MouseEvent<HTMLInputElement>, index: number) {
    focusCell(index);

    if (event.shiftKey) {
      event.preventDefault();
      setSelectedIndexes((current) => {
        const anchor = getClosestSelectedIndex(index, current);
        const range = buildRange(anchor, index);
        const shouldRemove = range.every((rangeIndex) =>
          current.has(rangeIndex),
        );
        const next = new Set(current);

        range.forEach((rangeIndex) => {
          if (shouldRemove) {
            next.delete(rangeIndex);
          } else {
            next.add(rangeIndex);
          }
        });

        return next;
      });
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      setSelectedIndexes((current) => {
        const next = new Set(current);

        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }

        return next;
      });
      return;
    }

    selectOnly(index);
  }

  function handleCellDoubleClick(
    event: MouseEvent<HTMLInputElement>,
    index: number,
  ) {
    event.preventDefault();
    setSelectedIndexes((current) =>
      current.size === length
        ? new Set([index])
        : new Set(Array.from({ length }, (_, cellIndex) => cellIndex)),
    );
    focusCell(index);
  }

  async function copySelectedDigits() {
    const selectedDigits = selectedIndexesToArray(selectedIndexes)
      .map((index) => digits[index])
      .join("");

    if (!selectedDigits) return;

    try {
      await navigator.clipboard.writeText(selectedDigits);
    } catch {
      // The native copy event still handles plain input text if clipboard access is blocked.
    }
  }

  function clearSelectedDigits(nextFocusIndex = focusedIndex) {
    const nextDigits = [...digits];
    const selected = selectedIndexesToArray(selectedIndexes);

    selected.forEach((selectedIndex) => {
      nextDigits[selectedIndex] = "";
    });

    const safeFocusIndex = Math.max(0, Math.min(nextFocusIndex, length - 1));
    commitDigits(nextDigits, safeFocusIndex, new Set([safeFocusIndex]));
  }

  function applyDigitsFromIndex(value: string, index: number) {
    const nextDigits = [...digits];
    const selected = selectedIndexesToArray(selectedIndexes);
    const startIndex =
      value.length >= length
        ? 0
        : selected.length > 1
          ? Math.min(...selected)
          : index;

    selected.forEach((selectedIndex) => {
      nextDigits[selectedIndex] = "";
    });

    for (
      let offset = 0;
      offset < value.length && startIndex + offset < length;
      offset += 1
    ) {
      nextDigits[startIndex + offset] = value[offset];
    }

    const nextFocusIndex = Math.min(startIndex + value.length, length - 1);
    commitDigits(nextDigits, nextFocusIndex, new Set([nextFocusIndex]));
  }

  function handleInput(rawValue: string, index: number) {
    const cleanValue = onlyDigits(rawValue);

    if (cleanValue.length > 1) {
      applyDigitsFromIndex(cleanValue.slice(0, length), index);
      return;
    }

    const digit = cleanValue.slice(-1);

    if (!digit) {
      clearSelectedDigits(index);
      return;
    }

    const nextDigits = [...digits];
    selectedIndexes.forEach((selectedIndex) => {
      nextDigits[selectedIndex] = "";
    });
    nextDigits[index] = digit;
    const nextFocusIndex = Math.min(index + 1, length - 1);
    commitDigits(nextDigits, nextFocusIndex, new Set([nextFocusIndex]));
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    const isControlKey = event.ctrlKey || event.metaKey;

    if (isControlKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      void copySelectedDigits();
      return;
    }

    if (isControlKey && event.key.toLowerCase() === "a") {
      event.preventDefault();
      setSelectedIndexes(
        new Set(Array.from({ length }, (_, cellIndex) => cellIndex)),
      );
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();

      if (selectedIndexes.size > 1 || !selectedIndexes.has(index)) {
        clearSelectedDigits(
          Math.min(...selectedIndexesToArray(selectedIndexes), index),
        );
        return;
      }

      const nextDigits = [...digits];

      if (nextDigits[index]) {
        nextDigits[index] = "";
        commitDigits(nextDigits, index, new Set([index]));
        return;
      }

      const previousIndex = Math.max(index - 1, 0);
      nextDigits[previousIndex] = "";
      commitDigits(nextDigits, previousIndex, new Set([previousIndex]));
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      clearSelectedDigits(index);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectOnly(index - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectOnly(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>, index: number) {
    event.preventDefault();
    const pastedCode = onlyDigits(event.clipboardData.getData("text")).slice(
      0,
      length,
    );

    if (!pastedCode) return;

    applyDigitsFromIndex(pastedCode, index);
  }

  async function handleResend() {
    if (!canResend) return;

    setIsResending(true);

    try {
      const result = await resendCode();
      setFeedbackKey(result);

      if (
        result === "code-resent" ||
        result === "code-already-sent" ||
        result === "resend-in-cooldown"
      ) {
        setDigits(Array.from({ length }, () => ""));
        setSelectedIndexes(new Set([0]));
        setResendCooldownSeconds(cooldownSeconds > 0 ? cooldownSeconds : 30);
        focusCell(0);
      }
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <div
        ref={cellsRef}
        className={cx(
          "flex items-center",
          align === "end" ? "justify-end" : "justify-start",
          CELL_GAP_CLASSES[size],
        )}
        dir="ltr"
      >
        {digits.map((digit, index) => (
          <input
            key={`otp-cell-${index}`}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            value={digit}
            disabled={isVerifying || isResending}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={t("digitLabel", { number: index + 1 })}
            className={cx(
              "bg-muted/45 text-foreground border border-b-2 text-center font-semibold outline-none",
              "transition-all duration-200 selection:bg-transparent",
              "focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
              CELL_SIZE_CLASSES[size],
              STATUS_BORDER_CLASSES[status],
              STATUS_RING_CLASSES[status],
              selectedIndexes.has(index) &&
                "border-primary/70 bg-primary/10 ring-primary/20 dark:bg-primary/15 ring-2",
            )}
            onChange={(event) => handleInput(event.target.value, index)}
            onClick={(event) => handleCellClick(event, index)}
            onDoubleClick={(event) => handleCellDoubleClick(event, index)}
            onFocus={(event) => {
              setFocusedIndex(index);
              if (selectedIndexes.size === 0) {
                setSelectedIndexes(new Set([index]));
              }
              event.currentTarget.select();
            }}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onPaste={(event) => handlePaste(event, index)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AnimatedButton
          icon="refresh"
          variant="ghost"
          size="lg"
          disabled={!canResend}
          loading={isResending}
          loadingText={t("sending")}
          onClick={() => void handleResend()}
        >
          {resendCooldownSeconds === null
            ? t("resend")
            : t("resendIn", { seconds: resendCooldownSeconds })}
        </AnimatedButton>

        {message ? (
          <p
            role={status === "error" ? "alert" : "status"}
            className={cx(
              "max-w-sm text-sm leading-relaxed font-semibold",
              MESSAGE_CLASSES[status],
            )}
          >
            {message}
          </p>
        ) : null}

        {!autoVerifyOnComplete ? (
          <AnimatedButton
            icon="check"
            variant="primary"
            size="lg"
            disabled={!canVerify}
            loading={isVerifying}
            loadingText={t("verifying")}
            onClick={() => void handleVerify()}
          >
            {t("verify")}
          </AnimatedButton>
        ) : null}
      </div>
    </div>
  );
}
