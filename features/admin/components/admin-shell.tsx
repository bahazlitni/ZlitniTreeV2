"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { GitFork, HomeIcon, Network, UsersRound } from "lucide-react";

import AnimatedButton from "@/components/ui/custom/AnimatedButton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ACCESS_TOKEN_KEY,
  AUTH_USER_KEY,
  apiFetch,
} from "@/lib/api/auth/api-fetch";
import { removeStoredItem } from "@/lib/api/auth/browser-storage";
import { cn } from "@/lib/utils";
import { LoginMode, PowerType } from "@/lib/generated/prisma/enums";
import type { Session } from "@/features/auth/types";
import type { AdminUserRow } from "@/features/admin/server/users";
import { AdminSidebarMenu } from "./admin-sidebar-menu";
import { TreeManagementPanel } from "./tree-management";

const ROOT_EMAIL = "baha.zlitni989@gmail.com";
const POWER_TYPES = [
  PowerType.ADMIN,
  PowerType.MEMBER,
  PowerType.ANON,
] as const;
const LOGIN_MODES = [
  LoginMode.PASSWORDLESS,
  LoginMode.PASSWORD_ONLY,
  LoginMode.PASSWORD_AND_OTP,
] as const;
const MIN_PASSWORD_LENGTH = 8;

type AdminTab = "users" | "persons" | "marriages" | "account";

type UsersResponse = {
  ok: boolean;
  users?: AdminUserRow[];
  message?: string;
};

type Credentials = {
  email: string;
  password: string;
};

type PasswordFlow =
  | {
      mode: "update";
      user: AdminUserRow;
      nextLoginMode: LoginMode;
      credentials: Credentials | null;
    }
  | {
      mode: "create";
      email: string;
      credentials: Credentials | null;
    };

function isPasswordRequiredMode(loginMode: LoginMode) {
  return (
    loginMode === LoginMode.PASSWORD_ONLY ||
    loginMode === LoginMode.PASSWORD_AND_OTP
  );
}

function loginModeLabel(loginMode: LoginMode) {
  switch (loginMode) {
    case LoginMode.PASSWORD_ONLY:
      return "Password only";
    case LoginMode.PASSWORD_AND_OTP:
      return "Password + OTP";
    default:
      return "Passwordless";
  }
}

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

function adminTabTitle(tab: AdminTab) {
  switch (tab) {
    case "persons":
      return "Persons";
    case "marriages":
      return "Marriages";
    case "account":
      return "My account";
    default:
      return "Users";
  }
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusText({
  tone,
  children,
}: {
  tone: "neutral" | "error" | "success";
  children: string | null;
}) {
  if (!children) return null;

  return (
    <p
      className={cn(
        "text-sm leading-6 font-medium",
        tone === "neutral" && "text-muted-foreground",
        tone === "error" && "text-red-600 dark:text-red-300",
        tone === "success" && "text-emerald-600 dark:text-emerald-300",
      )}
    >
      {children}
    </p>
  );
}

function CellInput({
  value,
  disabled,
  onCommit,
}: {
  value: string;
  disabled?: boolean;
  onCommit: (value: string) => void;
}) {
  return (
    <Input
      key={value}
      defaultValue={value}
      disabled={disabled}
      onBlur={(event) => {
        const draft = event.currentTarget.value;
        if (draft !== value) {
          onCommit(draft);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          event.currentTarget.value = value;
          event.currentTarget.blur();
        }
      }}
      className="focus-visible:ring-primary/25 h-full min-h-9 rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-2 disabled:opacity-60"
    />
  );
}

function RoleBadge({ powerType }: { powerType: PowerType }) {
  if (powerType === PowerType.ROOT) {
    return (
      <span className="text-primary text-sm font-semibold">
        {roleLabel(powerType)}
      </span>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md",
        powerType === PowerType.ADMIN &&
          "border-sky-500/40 text-sky-700 dark:text-sky-300",
        powerType === PowerType.MEMBER && "border-primary/40 text-primary",
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
  icon: "home" | "users" | "persons" | "marriages";
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
    <div className="border-border border-b px-4 py-3 last:border-b-0 sm:grid sm:grid-cols-[180px_1fr] sm:items-center">
      <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </div>
      <div className="text-foreground mt-1 text-sm font-medium sm:mt-0">
        {children ?? value}
      </div>
    </div>
  );
}

function AdminPasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 rounded-xl pr-12"
        />
        <div className="absolute top-1/2 right-1.5 -translate-y-1/2">
          <AnimatedButton
            size="sm"
            variant="ghost"
            icon={visible ? "eye-off" : "eye"}
            className="rounded-lg"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((current) => !current)}
          />
        </div>
      </div>
    </div>
  );
}

export function AdminShell({
  session,
  initialTab = "users",
}: {
  session: Session;
  initialTab?: AdminTab;
}) {
  const router = useRouter();
  const isRoot = session.powerType === PowerType.ROOT;
  const accountCanChangePassword = isPasswordRequiredMode(session.loginMode);
  const activeTab = initialTab;
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<{
    tone: "neutral" | "error" | "success";
    text: string | null;
  }>({
    tone: "neutral",
    text: null,
  });
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPowerType, setNewPowerType] = useState<PowerType>(
    isRoot ? PowerType.MEMBER : PowerType.MEMBER,
  );
  const [newLoginMode, setNewLoginMode] = useState<LoginMode>(
    LoginMode.PASSWORDLESS,
  );
  const [newPassword, setNewPassword] = useState("");
  const [passwordFlow, setPasswordFlow] = useState<PasswordFlow | null>(null);
  const [flowPassword, setFlowPassword] = useState("");
  const [flowTab, setFlowTab] = useState("password");
  const [currentPassword, setCurrentPassword] = useState("");
  const [accountNewPassword, setAccountNewPassword] = useState("");
  const [accountConfirmPassword, setAccountConfirmPassword] = useState("");
  const [accountStatus, setAccountStatus] = useState<{
    tone: "neutral" | "error" | "success";
    text: string | null;
  }>({
    tone: "neutral",
    text: null,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const visiblePowerTypes = useMemo(() => {
    return isRoot ? POWER_TYPES : ([PowerType.MEMBER] as const);
  }, [isRoot]);

  function selectAdminTab(tab: AdminTab) {
    router.push(tab === "users" ? "/admin" : `/admin?tab=${tab}`);
  }

  async function loadUsers() {
    setIsLoading(true);
    setStatus({ tone: "neutral", text: null });

    try {
      const response = await apiFetch("/api/admin/users", {
        method: "GET",
        auth: true,
      });
      const data: UsersResponse = await response
        .json()
        .catch(() => ({ ok: false }));

      if (!response.ok || !data.ok || !data.users) {
        setStatus({
          tone: "error",
          text: data.message ?? "Could not load users.",
        });
        return;
      }

      setUsers(data.users);
    } catch {
      setStatus({ tone: "error", text: "Could not load users." });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function canManage(row: AdminUserRow) {
    return isRoot || row.powerType === PowerType.MEMBER;
  }

  function canEditRole(row: AdminUserRow) {
    return isRoot && row.email !== ROOT_EMAIL;
  }

  async function updateUser(
    row: AdminUserRow,
    patch: Partial<Pick<AdminUserRow, "email" | "powerType" | "loginMode">> & {
      password?: string;
      keepExistingPassword?: boolean;
    },
  ) {
    if (!canManage(row)) {
      setStatus({
        tone: "error",
        text: "Admins can only manage member accounts.",
      });
      return false;
    }

    try {
      const response = await apiFetch(`/api/admin/users/${row.id}`, {
        method: "PATCH",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json().catch(() => ({ ok: false }));

      if (!response.ok || !data.ok || !data.user) {
        setStatus({
          tone: "error",
          text: data.message ?? "Could not update user.",
        });
        return false;
      }

      setUsers((current) =>
        current.map((item) => (item.id === row.id ? data.user : item)),
      );
      setStatus({ tone: "success", text: "Saved." });
      return true;
    } catch {
      setStatus({ tone: "error", text: "Could not update user." });
      return false;
    }
  }

  async function deleteUser(row: AdminUserRow) {
    if (!window.confirm(`Remove ${row.email}?`)) return;

    try {
      const response = await apiFetch(`/api/admin/users/${row.id}`, {
        method: "DELETE",
        auth: true,
      });
      const data = await response.json().catch(() => ({ ok: false }));

      if (!response.ok || !data.ok) {
        setStatus({
          tone: "error",
          text: data.message ?? "Could not remove user.",
        });
        return;
      }

      setUsers((current) => current.filter((item) => item.id !== row.id));
      setStatus({ tone: "success", text: "Removed." });
    } catch {
      setStatus({ tone: "error", text: "Could not remove user." });
    }
  }

  async function createUser() {
    try {
      const response = await apiFetch("/api/admin/users", {
        method: "POST",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          powerType: newPowerType,
          loginMode: newLoginMode,
          password: newPassword,
        }),
      });
      const data = await response.json().catch(() => ({ ok: false }));

      if (!response.ok || !data.ok || !data.user) {
        setStatus({
          tone: "error",
          text: data.message ?? "Could not create user.",
        });
        return;
      }

      setUsers((current) =>
        [...current, data.user].sort((a, b) => a.email.localeCompare(b.email)),
      );
      setStatus({ tone: "success", text: "User created." });

      if (newPassword) {
        setPasswordFlow({
          mode: "create",
          email: data.user.email,
          credentials: { email: data.user.email, password: newPassword },
        });
        setFlowTab("credentials");
      }

      setAddOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewLoginMode(LoginMode.PASSWORDLESS);
      setNewPowerType(PowerType.MEMBER);
    } catch {
      setStatus({ tone: "error", text: "Could not create user." });
    }
  }

  function beginLoginModeChange(row: AdminUserRow, nextLoginMode: LoginMode) {
    if (nextLoginMode === row.loginMode) return;

    if (isPasswordRequiredMode(nextLoginMode)) {
      setPasswordFlow({
        mode: "update",
        user: row,
        nextLoginMode,
        credentials: null,
      });
      setFlowPassword("");
      setFlowTab("password");
      return;
    }

    void updateUser(row, { loginMode: nextLoginMode });
  }

  async function applyPasswordFlow(keepExistingPassword = false) {
    if (!passwordFlow || passwordFlow.mode !== "update") return;

    const password = keepExistingPassword ? "" : flowPassword;
    const success = await updateUser(passwordFlow.user, {
      loginMode: passwordFlow.nextLoginMode,
      keepExistingPassword,
      password,
    });

    if (!success) return;

    if (password) {
      setPasswordFlow({
        ...passwordFlow,
        credentials: {
          email: passwordFlow.user.email,
          password,
        },
      });
      setFlowTab("credentials");
      return;
    }

    setPasswordFlow(null);
  }

  async function copyCredentials(credentials: Credentials) {
    await navigator.clipboard.writeText(
      `Email: ${credentials.email}\nPassword: ${credentials.password}`,
    );
    setStatus({ tone: "success", text: "Credentials copied." });
  }

  async function changeOwnPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accountCanChangePassword) {
      setAccountStatus({
        tone: "error",
        text: "Passwordless accounts do not use password changes.",
      });
      return;
    }

    if (accountNewPassword.length < MIN_PASSWORD_LENGTH) {
      setAccountStatus({
        tone: "error",
        text: "New password must contain at least 8 characters.",
      });
      return;
    }

    if (accountNewPassword !== accountConfirmPassword) {
      setAccountStatus({
        tone: "error",
        text: "The new passwords do not match.",
      });
      return;
    }

    setIsChangingPassword(true);
    setAccountStatus({ tone: "neutral", text: null });

    try {
      const response = await apiFetch("/api/auth/change-password", {
        method: "POST",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword: accountNewPassword,
        }),
      });
      const data = await response.json().catch(() => ({ ok: false }));

      if (!response.ok || !data.ok) {
        setAccountStatus({
          tone: "error",
          text: data.message ?? "Could not update the password.",
        });
        return;
      }

      removeStoredItem(ACCESS_TOKEN_KEY);
      removeStoredItem(AUTH_USER_KEY);
      setCurrentPassword("");
      setAccountNewPassword("");
      setAccountConfirmPassword("");
      setAccountStatus({
        tone: "success",
        text: "Password updated. Redirecting you to sign in again.",
      });

      window.setTimeout(() => {
        router.replace("/en/login");
      }, 900);
    } catch {
      setAccountStatus({
        tone: "error",
        text: "Could not update the password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <main className="bg-background text-foreground min-h-screen" dir="ltr">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-border bg-card border-b px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-r lg:border-b-0">
          <div className="flex items-center gap-3">
            <div className="text-foreground flex flex-col text-xs font-semibold">
              <span>{session.email}</span>
              <RoleBadge powerType={session.powerType} />
            </div>

            <AdminSidebarMenu
              onNavigateToAccount={() => selectAdminTab("account")}
            />
          </div>

          <Separator className="my-3" />

          <nav className="space-y-1">
            <AdminNavItem
              active={false}
              icon="home"
              onClick={() => router.push("/")}
            >
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
        </aside>

        <section className="min-w-0 px-5 py-6 sm:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-3xl font-semibold tracking-normal">
              {adminTabTitle(activeTab)}
            </h1>
            <div className="flex items-center gap-3">
              {activeTab === "users" ? (
                <>
                  <StatusText tone={status.tone}>{status.text}</StatusText>
                  <AnimatedButton
                    size="lg"
                    variant="primary"
                    icon="plus"
                    onClick={() => setAddOpen(true)}
                  >
                    Add user
                  </AnimatedButton>
                </>
              ) : activeTab === "account" ? (
                <StatusText tone={accountStatus.tone}>
                  {accountStatus.text}
                </StatusText>
              ) : null}
            </div>
          </div>

          {activeTab === "users" ? (
            <div className="border-border bg-card overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="border-border h-9 w-[34%] border-r px-3">
                      Email
                    </TableHead>
                    <TableHead className="border-border h-9 w-[14%] border-r px-3">
                      Role
                    </TableHead>
                    <TableHead className="border-border h-9 w-[20%] border-r px-3">
                      Login mode
                    </TableHead>
                    <TableHead className="border-border h-9 w-[10%] border-r px-3">
                      Password
                    </TableHead>
                    <TableHead className="border-border h-9 w-[16%] border-r px-3">
                      Last login
                    </TableHead>
                    <TableHead className="h-9 w-[6%] px-3 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((row) => {
                    const rowCanManage = canManage(row);
                    const protectedRoot = row.email === ROOT_EMAIL;

                    return (
                      <TableRow
                        key={row.id}
                        className="hover:bg-primary/5 h-10 [&>td]:h-10"
                      >
                        <TableCell className="border-border h-10 border-r p-0">
                          <CellInput
                            value={row.email}
                            disabled={!rowCanManage || protectedRoot}
                            onCommit={(email) =>
                              void updateUser(row, { email })
                            }
                          />
                        </TableCell>
                        <TableCell className="border-border h-10 border-r p-0">
                          {canEditRole(row) ? (
                            <Select
                              value={row.powerType}
                              onValueChange={(value) =>
                                void updateUser(row, {
                                  powerType: value as PowerType,
                                })
                              }
                            >
                              <SelectTrigger className="h-full min-h-10 w-full rounded-none border-0 bg-transparent px-3 shadow-none data-[size=default]:h-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {visiblePowerTypes.map((powerType) => (
                                  <SelectItem key={powerType} value={powerType}>
                                    {roleLabel(powerType)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex h-10 items-center px-3">
                              <RoleBadge powerType={row.powerType} />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="border-border h-10 border-r p-0">
                          <Select
                            value={row.loginMode}
                            disabled={!rowCanManage}
                            onValueChange={(value) =>
                              beginLoginModeChange(row, value as LoginMode)
                            }
                          >
                            <SelectTrigger className="h-full min-h-10 w-full rounded-none border-0 bg-transparent px-3 shadow-none data-[size=default]:h-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LOGIN_MODES.map((loginMode) => (
                                <SelectItem key={loginMode} value={loginMode}>
                                  {loginModeLabel(loginMode)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border-border h-10 border-r px-3">
                          <button
                            type="button"
                            disabled={!rowCanManage}
                            className="text-primary disabled:text-muted-foreground cursor-pointer text-sm font-medium disabled:pointer-events-none"
                            onClick={() => {
                              setPasswordFlow({
                                mode: "update",
                                user: row,
                                nextLoginMode: row.loginMode,
                                credentials: null,
                              });
                              setFlowPassword("");
                              setFlowTab("password");
                            }}
                          >
                            {row.hasPassword ? "Set" : "Missing"}
                          </button>
                        </TableCell>
                        <TableCell className="border-border text-muted-foreground h-10 border-r px-3 text-sm">
                          {formatDate(row.lastLoginAt)}
                        </TableCell>
                        <TableCell className="h-10 px-2 text-right">
                          <AnimatedButton
                            size="sm"
                            variant="ghost"
                            icon="trash"
                            disabled={
                              !rowCanManage ||
                              protectedRoot ||
                              row.id === session.id
                            }
                            aria-label={`Remove ${row.email}`}
                            onClick={() => void deleteUser(row)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!isLoading && users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-muted-foreground px-4 py-8 text-center"
                      >
                        No manageable users yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          ) : activeTab === "persons" || activeTab === "marriages" ? (
            <TreeManagementPanel mode={activeTab} />
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
              <section className="border-border bg-card overflow-hidden rounded-xl border">
                <div className="border-border border-b px-4 py-3">
                  <h2 className="text-base font-semibold">Account details</h2>
                </div>
                <div>
                  <AccountDatum label="Email" value={session.email} />
                  <AccountDatum label="Role">
                    <RoleBadge powerType={session.powerType} />
                  </AccountDatum>
                  <AccountDatum
                    label="Login mode"
                    value={loginModeLabel(session.loginMode)}
                  />
                  <AccountDatum label="User ID">
                    <span className="text-muted-foreground font-mono text-xs">
                      {session.id}
                    </span>
                  </AccountDatum>
                </div>
              </section>

              <section className="border-border bg-card rounded-xl border p-4">
                <div className="mb-5">
                  <h2 className="text-base font-semibold">Password</h2>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    Your login mode cannot be changed here. Password changes
                    require your current password.
                  </p>
                </div>

                {accountCanChangePassword ? (
                  <form className="space-y-4" onSubmit={changeOwnPassword}>
                    <input
                      type="text"
                      autoComplete="username"
                      value={session.email}
                      readOnly
                      hidden
                    />
                    <AdminPasswordField
                      id="account-current-password"
                      label="Current password"
                      value={currentPassword}
                      autoComplete="current-password"
                      onChange={setCurrentPassword}
                    />
                    <AdminPasswordField
                      id="account-new-password"
                      label="New password"
                      value={accountNewPassword}
                      autoComplete="new-password"
                      onChange={setAccountNewPassword}
                    />
                    <AdminPasswordField
                      id="account-confirm-password"
                      label="Confirm new password"
                      value={accountConfirmPassword}
                      autoComplete="new-password"
                      onChange={setAccountConfirmPassword}
                    />
                    <AnimatedButton
                      type="submit"
                      size="lg"
                      variant="primary"
                      icon="shield-check"
                      loading={isChangingPassword}
                      loadingText="Updating..."
                    >
                      Update password
                    </AnimatedButton>
                  </form>
                ) : (
                  <p className="text-muted-foreground text-sm leading-6 font-medium">
                    This account uses passwordless login. There is no password
                    to change.
                  </p>
                )}
              </section>
            </div>
          )}
        </section>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>
              Create a login record. Admins can only create member accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={newPowerType}
                  onValueChange={(value) => setNewPowerType(value as PowerType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {visiblePowerTypes.map((powerType) => (
                      <SelectItem key={powerType} value={powerType}>
                        {roleLabel(powerType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Login mode</Label>
                <Select
                  value={newLoginMode}
                  onValueChange={(value) => setNewLoginMode(value as LoginMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOGIN_MODES.map((loginMode) => (
                      <SelectItem key={loginMode} value={loginMode}>
                        {loginModeLabel(loginMode)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isPasswordRequiredMode(newLoginMode) ? (
              <div className="space-y-2">
                <Label htmlFor="new-user-password">Password</Label>
                <Input
                  id="new-user-password"
                  type="text"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Temporary password"
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <AnimatedButton
              size="lg"
              variant="outline"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              size="lg"
              variant="primary"
              icon="plus"
              onClick={() => void createUser()}
            >
              Create
            </AnimatedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(passwordFlow)}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordFlow(null);
            setFlowPassword("");
            setFlowTab("password");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {passwordFlow?.mode === "create"
                ? "Copy credentials"
                : "Set password"}
            </DialogTitle>
            <DialogDescription>
              Required when an account uses password-only or password + OTP
              login.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={flowTab} onValueChange={setFlowTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="password"
                disabled={passwordFlow?.mode === "create"}
              >
                Password
              </TabsTrigger>
              <TabsTrigger
                value="credentials"
                disabled={!passwordFlow?.credentials}
              >
                Credentials
              </TabsTrigger>
            </TabsList>
            <TabsContent value="password" className="space-y-4 pt-4">
              {passwordFlow?.mode === "update" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="flow-password">New password</Label>
                    <Input
                      id="flow-password"
                      type="text"
                      value={flowPassword}
                      onChange={(event) => setFlowPassword(event.target.value)}
                      placeholder="Temporary password"
                    />
                  </div>
                  <DialogFooter>
                    {passwordFlow.user.hasPassword &&
                    isPasswordRequiredMode(passwordFlow.nextLoginMode) ? (
                      <AnimatedButton
                        size="lg"
                        variant="outline"
                        icon="shield-check"
                        onClick={() => void applyPasswordFlow(true)}
                      >
                        Keep old password
                      </AnimatedButton>
                    ) : null}
                    <AnimatedButton
                      size="lg"
                      variant="primary"
                      icon="key"
                      onClick={() => void applyPasswordFlow(false)}
                    >
                      Set password
                    </AnimatedButton>
                  </DialogFooter>
                </>
              ) : null}
            </TabsContent>
            <TabsContent value="credentials" className="space-y-4 pt-4">
              {passwordFlow?.credentials ? (
                <>
                  <div className="border-border bg-background rounded-xl border p-4 font-mono text-sm">
                    <div>Email: {passwordFlow.credentials.email}</div>
                    <div>Password: {passwordFlow.credentials.password}</div>
                  </div>
                  <DialogFooter>
                    <AnimatedButton
                      size="lg"
                      variant="outline"
                      icon="copy"
                      onClick={() =>
                        void copyCredentials(passwordFlow.credentials!)
                      }
                    >
                      Copy credentials
                    </AnimatedButton>
                    <AnimatedButton
                      size="lg"
                      variant="primary"
                      icon="check"
                      onClick={() => setPasswordFlow(null)}
                    >
                      Done
                    </AnimatedButton>
                  </DialogFooter>
                </>
              ) : null}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </main>
  );
}
