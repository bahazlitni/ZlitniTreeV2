import type { Metadata } from "next";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { requireAdminPageSession } from "@/features/admin/server/page-auth";

type AdminTab = "users" | "persons" | "marriages" | "account";

type PageProps = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Admin | Zlitni Tree",
};

function parseTab(value: string | undefined): AdminTab {
  if (value === "persons" || value === "marriages" || value === "account") {
    return value;
  }

  return "users";
}

export default async function AdminPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const session = await requireAdminPageSession();

  return <AdminShell session={session} initialTab={parseTab(tab)} />;
}
