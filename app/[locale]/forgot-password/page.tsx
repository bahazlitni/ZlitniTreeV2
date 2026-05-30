import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ForgotPasswordPage } from "@/features/auth/components/auth-pages";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.forgot" });

  return {
    title: `${t("title")} | Zlitni Tree`,
  };
}

export default function Page() {
  return <ForgotPasswordPage />;
}
