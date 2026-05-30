"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import AnimatedButton from "@/components/ui/custom/AnimatedButton";

export function ThemeToggle() {
  const t = useTranslations("Common");
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <motion.span
      animate={{ rotate: isDark ? 0 : 180 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      className="inline-flex"
    >
      <AnimatedButton
        size="lg"
        variant="outline"
        icon={isDark ? "sun" : "moon"}
        aria-label={t("themeToggle")}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      />
    </motion.span>
  );
}
