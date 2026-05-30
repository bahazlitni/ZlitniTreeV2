"use client";

import { useRouter } from "next/navigation";
import {
  GitFork,
  HomeIcon,
  Network,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AdminUnsavedChangesProvider,
  useAdminUnsavedChangesGuard,
} from "@/features/admin/components/admin-unsaved-changes";
import { AdminSidebarMenu } from "@/features/admin/components/admin-sidebar-menu";
import type { Session } from "@/features/auth/types";
import { PowerType } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

type AdminTab = "users" | "persons" | "marriages" | "account";

function roleLabel(powerType: PowerType) {
  switch (powerType) {
    case PowerType.ROOT:
      return "Root";
    case PowerType.ADMIN:
      return "Admin";
    case PowerType.MEMBER:
      return "Member";
    default:
      return "Anon";
  }
}

function RoleBadge({ powerType }: { powerType: PowerType }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md border px-2 py-0.5 text-xs font-semibold",
        powerType === PowerType.ROOT &&
          "border-primary/40 bg-primary/10 text-primary",
        powerType === PowerType.ADMIN &&
          "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-300",
        powerType === PowerType.MEMBER &&
          "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300",
        powerType === PowerType.ANON && "text-muted-foreground",
      )}
    >
      {roleLabel(powerType)}
    </Badge>
  );
}

function AdminNavItem({
  active,
  icon,
  children,
  onClick,
}: {
  active: boolean;
  icon: "home" | Exclude<AdminTab, "account">;
  children: string;
  onClick: () => void;
}) {
  const Icon =
    icon === "home"
      ? HomeIcon
      : icon === "users"
        ? UsersRound
        : icon === "persons"
          ? Network
          : GitFork;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}

export function AdminRouteFrame({
  session,
  activeTab,
  children,
}: {
  session: Session;
  activeTab: AdminTab;
  children: ReactNode;
}) {
  return (
    <AdminUnsavedChangesProvider>
      <AdminRouteFrameContent session={session} activeTab={activeTab}>
        {children}
      </AdminRouteFrameContent>
    </AdminUnsavedChangesProvider>
  );
}

function AdminRouteFrameContent({
  session,
  activeTab,
  children,
}: {
  session: Session;
  activeTab: AdminTab;
  children: ReactNode;
}) {
  const router = useRouter();
  const unsavedChanges = useAdminUnsavedChangesGuard();

  function selectAdminTab(tab: AdminTab) {
    unsavedChanges?.confirmNavigation(() =>
      router.push(tab === "users" ? "/admin" : `/admin?tab=${tab}`),
    );
  }

  function navigateHome() {
    const run = () => router.push("/");

    if (unsavedChanges) {
      unsavedChanges.confirmNavigation(run);
      return;
    }

    run();
  }

  return (
    <main className="bg-background text-foreground min-h-screen" dir="ltr">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="bg-card border-border border-b px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-r lg:border-b-0">
          <div className="flex items-center gap-3">
            <div className="border-border bg-background text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">Zlitni Tree</div>
              <div className="text-muted-foreground text-xs">Admin panel</div>
            </div>
            <AdminSidebarMenu
              onNavigateToAccount={() => selectAdminTab("account")}
              confirmBeforeLogout={unsavedChanges?.confirmNavigation}
            />
          </div>

          <Separator className="my-5" />

          <nav className="space-y-1">
            <AdminNavItem active={false} icon="home" onClick={navigateHome}>
              Home
            </AdminNavItem>
            <AdminNavItem
              active={activeTab === "users"}
              icon="users"
              onClick={() => selectAdminTab("users")}
            >
              Users
            </AdminNavItem>
            <AdminNavItem
              active={activeTab === "persons"}
              icon="persons"
              onClick={() => selectAdminTab("persons")}
            >
              Persons
            </AdminNavItem>
            <AdminNavItem
              active={activeTab === "marriages"}
              icon="marriages"
              onClick={() => selectAdminTab("marriages")}
            >
              Marriages
            </AdminNavItem>
          </nav>

          <div className="border-border bg-background text-muted-foreground mt-8 rounded-xl border p-3 text-xs leading-5">
            Signed in as{" "}
            <span className="text-foreground font-semibold">
              {session.email}
            </span>
            <div className="mt-2">
              <RoleBadge powerType={session.powerType} />
            </div>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-6 sm:px-8">{children}</section>
      </div>
    </main>
  );
}
