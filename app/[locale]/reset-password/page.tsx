import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ResetPasswordPage } from "@/features/auth/components/auth-pages";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.reset" });

  return {
    title: `${t("title")} | Zlitni Tree`,
  };
}

export default function Page() {
  return <ResetPasswordPage />;
}
