"use client";

import { LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import AnimatedButton from "@/components/ui/custom/AnimatedButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCESS_TOKEN_KEY, AUTH_USER_KEY } from "@/lib/api/auth/api-fetch";
import { removeStoredItem } from "@/lib/api/auth/browser-storage";

export function AdminSidebarMenu({
  onNavigateToAccount,
  confirmBeforeLogout,
}: {
  onNavigateToAccount: () => void;
  confirmBeforeLogout?: (action: () => void) => void;
}) {
  const router = useRouter();

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      removeStoredItem(ACCESS_TOKEN_KEY);
      removeStoredItem(AUTH_USER_KEY);
      router.replace("/en/login");
    }
  }

  function requestLogout() {
    if (confirmBeforeLogout) {
      confirmBeforeLogout(() => void logout());
      return;
    }

    void logout();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AnimatedButton
          size="sm"
          variant="ghost"
          icon="settings"
          className="ml-auto shrink-0"
          aria-label="Open account menu"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={onNavigateToAccount}
        >
          <UserRound aria-hidden="true" />
          My account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          variant="destructive"
          onSelect={requestLogout}
        >
          <LogOut aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
