"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import type { ReactNode } from "react";

import type { ButtonVariant, Size } from "@/lib/global-types";
import AnimatedIcon, { type AnimatedIconName } from "./AnimatedIcon";

export interface AnimatedButtonProps
  extends Omit<
    HTMLMotionProps<"button">,
    "children" | "size" | "variants" | "initial" | "whileHover" | "whileTap"
  > {
  size: Size;
  variant: ButtonVariant;
  icon?: AnimatedIconName;
  iconPosition?: "left" | "right";
  children?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const buttonSizeClasses: Record<Size, string> = {
  xs: "h-8 px-3 text-xs rounded-lg",
  sm: "h-9 px-3.5 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-11 px-5 text-base rounded-xl",
  xl: "h-12 px-6 text-base rounded-2xl",
  "2xl": "h-14 px-7 text-lg rounded-2xl",
};

const iconOnlySizeClasses: Record<Size, string> = {
  xs: "h-8 w-8 p-0 text-xs rounded-lg",
  sm: "h-9 w-9 p-0 text-sm rounded-lg",
  md: "h-10 w-10 p-0 text-sm rounded-xl",
  lg: "h-11 w-11 p-0 text-base rounded-xl",
  xl: "h-12 w-12 p-0 text-base rounded-2xl",
  "2xl": "h-14 w-14 p-0 text-lg rounded-2xl",
};

const contentGapClasses: Record<Size, string> = {
  xs: "gap-1.5",
  sm: "gap-1.5",
  md: "gap-2",
  lg: "gap-2.5",
  xl: "gap-3",
  "2xl": "gap-3.5",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 focus-visible:ring-primary",

  secondary:
    "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 focus-visible:ring-ring",

  default:
    "bg-zinc-950 text-white shadow-sm shadow-zinc-950/20 hover:bg-zinc-800 focus-visible:ring-zinc-500 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200",

  outline:
    "border border-border bg-background text-foreground hover:bg-muted focus-visible:ring-ring dark:bg-input/20 dark:hover:bg-input/40",

  ghost:
    "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring dark:hover:bg-muted/60",
};

const buttonMotionConfig: Record<
  Size,
  {
    lift: number;
    hoverScale: number;
    tapScale: number;
    labelShift: number;
    shineDistance: number;
  }
> = {
  xs: {
    lift: 1,
    hoverScale: 1.01,
    tapScale: 0.985,
    labelShift: 1,
    shineDistance: 52,
  },
  sm: {
    lift: 1.2,
    hoverScale: 1.012,
    tapScale: 0.982,
    labelShift: 1.2,
    shineDistance: 58,
  },
  md: {
    lift: 1.5,
    hoverScale: 1.014,
    tapScale: 0.98,
    labelShift: 1.5,
    shineDistance: 66,
  },
  lg: {
    lift: 2,
    hoverScale: 1.016,
    tapScale: 0.978,
    labelShift: 2,
    shineDistance: 76,
  },
  xl: {
    lift: 2.5,
    hoverScale: 1.018,
    tapScale: 0.975,
    labelShift: 2.5,
    shineDistance: 88,
  },
  "2xl": {
    lift: 3,
    hoverScale: 1.02,
    tapScale: 0.972,
    labelShift: 3,
    shineDistance: 100,
  },
};

function spring(stiffness = 420, damping = 18, mass = 0.7) {
  return {
    type: "spring",
    stiffness,
    damping,
    mass,
  } as const;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function buildButtonVariants(size: Size): Variants {
  const cfg = buttonMotionConfig[size];

  return {
    rest: {
      y: 0,
      scale: 1,
    },
    hover: {
      y: -cfg.lift,
      scale: cfg.hoverScale,
      transition: spring(380, 17, 0.7),
    },
    tap: {
      y: 0,
      scale: cfg.tapScale,
      transition: spring(620, 23, 0.55),
    },
  };
}

function buildShineVariants(size: Size): Variants {
  const cfg = buttonMotionConfig[size];

  return {
    rest: {
      x: -cfg.shineDistance,
      opacity: 0,
    },
    hover: {
      x: cfg.shineDistance,
      opacity: [0, 0.22, 0],
      transition: {
        duration: 0.68,
        ease: "easeOut",
      },
    },
  };
}

function buildLabelVariants(
  size: Size,
  hasIcon: boolean,
  iconPosition: "left" | "right",
): Variants {
  const cfg = buttonMotionConfig[size];

  if (!hasIcon) {
    return {
      rest: { x: 0 },
      hover: { x: 0 },
    };
  }

  return {
    rest: {
      x: 0,
    },
    hover: {
      x: iconPosition === "left" ? cfg.labelShift : -cfg.labelShift,
      transition: spring(360, 18, 0.65),
    },
  };
}

export default function AnimatedButton({
  size,
  variant,
  icon,
  iconPosition = "left",
  children,
  className,
  fullWidth = false,
  loading = false,
  loadingText,
  disabled,
  type = "button",
  ...buttonProps
}: AnimatedButtonProps) {
  const isDisabled = disabled || loading;
  const visibleIcon: AnimatedIconName | undefined = loading ? "loader" : icon;
  const visibleIconPosition: "left" | "right" = loading ? "left" : iconPosition;

  const hasText = Boolean(loading && loadingText ? loadingText : children);
  const hasIcon = Boolean(visibleIcon);

  const buttonVariants = buildButtonVariants(size);
  const shineVariants = buildShineVariants(size);
  const labelVariants = buildLabelVariants(size, hasIcon, visibleIconPosition);

  return (
    <motion.button
      {...buttonProps}
      type={type}
      disabled={isDisabled}
      className={cx(
        "group relative inline-flex select-none items-center justify-center overflow-hidden font-medium",
        "outline-none transition-colors duration-200",
        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
        hasText ? buttonSizeClasses[size] : iconOnlySizeClasses[size],
        variantClasses[variant],
        fullWidth && "w-full",
        className,
      )}
      variants={buttonVariants}
      initial="rest"
      whileHover={isDisabled ? undefined : "hover"}
      whileTap={isDisabled ? undefined : "tap"}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/3 z-0 w-1/3 rotate-12 bg-white/35 blur-md dark:bg-white/20"
        variants={shineVariants}
      />

      <span
        className={cx(
          "relative z-10 inline-flex items-center justify-center",
          contentGapClasses[size],
        )}
      >
        {visibleIcon && visibleIconPosition === "left" && (
          <AnimatedIcon
            icon={visibleIcon}
            size={size}
            trigger={loading ? "loop" : "parent"}
          />
        )}

        {hasText && (
          <motion.span
            className="inline-flex items-center whitespace-nowrap"
            variants={labelVariants}
          >
            {loading && loadingText ? loadingText : children}
          </motion.span>
        )}

        {visibleIcon && visibleIconPosition === "right" && (
          <AnimatedIcon
            icon={visibleIcon}
            size={size}
            trigger={loading ? "loop" : "parent"}
          />
        )}
      </span>
    </motion.button>
  );
}
