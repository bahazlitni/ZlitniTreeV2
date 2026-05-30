"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  CountrySelect,
  DEFAULT_COUNTRY_CODE,
} from "@/components/custom/CountrySelect";
import {
  DayMonthYearInputGroup,
  getDayMonthYearError,
} from "@/components/custom/DayMonthYearInputGroup";
import { MarriageInput } from "@/components/custom/MarriageInput";
import { PersonInput } from "@/components/custom/PersonInput";
import AnimatedButton from "@/components/ui/custom/AnimatedButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api/auth/api-fetch";
import { cn } from "@/lib/utils";
import { useAdminUnsavedChangesGuard } from "./admin-unsaved-changes";
import type {
  AdminMarriageRow,
  AdminPersonPayload,
  MarriagePatch,
  PersonPatch,
} from "@/features/admin/server/tree";

type CreateMode = "person" | "marriage";
type StatusState = {
  tone: "neutral" | "error" | "success";
  text: string | null;
};
type FullPersonForm = Required<
  Pick<
    PersonPatch,
    | "parentMarriageId"
    | "firstNameArabic"
    | "middleNameArabic"
    | "lastNameArabic"
    | "firstName"
    | "middleName"
    | "lastName"
    | "isMale"
    | "isAlive"
    | "birthYear"
    | "birthMonth"
    | "birthDay"
    | "birthCity"
    | "birthCountryCode"
    | "deathYear"
    | "deathMonth"
    | "deathDay"
    | "deathCity"
    | "deathCountryCode"
  >
>;
type FullMarriageForm = {
  firstPartnerId: number | null;
  secondPartnerId: number | null;
  weddingYear: number | null;
  weddingMonth: number | null;
  weddingDay: number | null;
  isDivorced: boolean;
};

function emptyPersonForm(): FullPersonForm {
  return {
    parentMarriageId: null,
    firstNameArabic: null,
    middleNameArabic: null,
    lastNameArabic: null,
    firstName: null,
    middleName: null,
    lastName: null,
    isMale: true,
    isAlive: true,
    birthYear: null,
    birthMonth: null,
    birthDay: null,
    birthCity: null,
    birthCountryCode: DEFAULT_COUNTRY_CODE,
    deathYear: null,
    deathMonth: null,
    deathDay: null,
    deathCity: null,
    deathCountryCode: null,
  };
}

function emptyMarriageForm(): FullMarriageForm {
  return {
    firstPartnerId: null,
    secondPartnerId: null,
    weddingYear: null,
    weddingMonth: null,
    weddingDay: null,
    isDivorced: false,
  };
}

function personToFullForm(person: AdminPersonPayload): FullPersonForm {
  return {
    parentMarriageId: person.parentMarriageId,
    firstNameArabic: person.firstNameArabic,
    middleNameArabic: person.middleNameArabic,
    lastNameArabic: person.lastNameArabic,
    firstName: person.firstName,
    middleName: person.middleName,
    lastName: person.lastName,
    isMale: person.isMale ?? true,
    isAlive: person.isAlive ?? true,
    birthYear: person.birthYear,
    birthMonth: person.birthMonth,
    birthDay: person.birthDay,
    birthCity: person.birthCity,
    birthCountryCode: person.birthCountryCode,
    deathYear: person.deathYear,
    deathMonth: person.deathMonth,
    deathDay: person.deathDay,
    deathCity: person.deathCity,
    deathCountryCode: person.deathCountryCode,
  };
}

function marriageToFullForm(marriage: AdminMarriageRow): FullMarriageForm {
  return {
    firstPartnerId: marriage.firstPartnerId,
    secondPartnerId: marriage.secondPartnerId,
    weddingYear: marriage.weddingYear,
    weddingMonth: marriage.weddingMonth,
    weddingDay: marriage.weddingDay,
    isDivorced: marriage.isDivorced,
  };
}

function normalizeTextValue(value: string) {
  const text = value.trim();
  return text ? text : null;
}

function formSignature(value: FullPersonForm | FullMarriageForm) {
  return JSON.stringify(value);
}

function StatusText({ status }: { status: StatusState }) {
  if (!status.text) return null;

  return (
    <p
      className={cn(
        "text-sm leading-6 font-medium",
        status.tone === "neutral" && "text-muted-foreground",
        status.tone === "error" && "text-red-600 dark:text-red-300",
        status.tone === "success" && "text-emerald-600 dark:text-emerald-300",
      )}
    >
      {status.text}
    </p>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-border bg-card rounded-xl border">
      <div className="border-border border-b px-4 py-3">
        <h2 className="text-foreground text-sm font-semibold">{title}</h2>
        {description ? (
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            {description}
          </p>
        ) : null}
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <Input
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(normalizeTextValue(event.target.value))}
        className="h-11 rounded-xl"
      />
    </Field>
  );
}

function SwitchField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="border-input hover:bg-muted/40 focus-visible:ring-primary/30 w-full cursor-pointer rounded-xl border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      onClick={() => onCheckedChange(!checked)}
    >
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <span
          aria-hidden="true"
          className={cn(
            "relative inline-flex h-[18.4px] w-8 shrink-0 rounded-full transition-colors",
            checked ? "bg-primary" : "bg-input dark:bg-input/80",
          )}
        >
          <span
            className={cn(
              "bg-background dark:bg-foreground absolute top-[1.2px] size-4 rounded-full transition-transform",
              checked
                ? "dark:bg-primary-foreground translate-x-[14px]"
                : "translate-x-[1.2px]",
            )}
          />
        </span>
      </div>
      <p className="text-muted-foreground mt-3 text-sm font-medium">
        {checked ? "Yes" : "No"}
      </p>
    </button>
  );
}

function SelectFrame({ children }: { children: ReactNode }) {
  return (
    <div className="border-input bg-background h-11 overflow-hidden rounded-xl border">
      {children}
    </div>
  );
}

export function TreeCreatePage({
  mode,
  editId,
  initialPerson,
  initialMarriage,
}: {
  mode: CreateMode;
  editId?: number;
  initialPerson?: AdminPersonPayload;
  initialMarriage?: AdminMarriageRow;
}) {
  const router = useRouter();
  const unsavedChanges = useAdminUnsavedChangesGuard();
  const initialPersonForm = useMemo(
    () => (initialPerson ? personToFullForm(initialPerson) : emptyPersonForm()),
    [initialPerson],
  );
  const initialMarriageForm = useMemo(
    () =>
      initialMarriage
        ? marriageToFullForm(initialMarriage)
        : emptyMarriageForm(),
    [initialMarriage],
  );
  const [persons, setPersons] = useState<AdminPersonPayload[]>([]);
  const [marriages, setMarriages] = useState<AdminMarriageRow[]>([]);
  const [personForm, setPersonForm] =
    useState<FullPersonForm>(initialPersonForm);
  const [marriageForm, setMarriageForm] =
    useState<FullMarriageForm>(initialMarriageForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    tone: "neutral",
    text: null,
  });
  const isPerson = mode === "person";
  const isEdit = editId !== undefined;
  const backHref = isPerson ? "/admin?tab=persons" : "/admin?tab=marriages";
  const hasUnsavedChanges =
    isEdit &&
    (isPerson
      ? formSignature(personForm) !== formSignature(initialPersonForm)
      : formSignature(marriageForm) !== formSignature(initialMarriageForm));

  useEffect(() => {
    unsavedChanges?.setUnsavedChanges(hasUnsavedChanges);
  }, [hasUnsavedChanges, unsavedChanges]);

  useEffect(() => {
    return () => unsavedChanges?.setUnsavedChanges(false);
  }, [unsavedChanges]);

  useEffect(() => {
    async function loadOptions() {
      setIsLoading(true);
      setStatus({ tone: "neutral", text: null });

      try {
        const [personsResponse, marriagesResponse] = await Promise.all([
          apiFetch("/api/admin/persons", { method: "GET", auth: true }),
          apiFetch("/api/admin/marriages", { method: "GET", auth: true }),
        ]);
        const personsData = await personsResponse
          .json()
          .catch(() => ({ ok: false }));
        const marriagesData = await marriagesResponse
          .json()
          .catch(() => ({ ok: false }));

        if (!personsResponse.ok || !personsData.ok || !personsData.persons) {
          setStatus({
            tone: "error",
            text: personsData.message ?? "Could not load people.",
          });
          return;
        }

        if (
          !marriagesResponse.ok ||
          !marriagesData.ok ||
          !marriagesData.marriages
        ) {
          setStatus({
            tone: "error",
            text: marriagesData.message ?? "Could not load marriages.",
          });
          return;
        }

        setPersons(personsData.persons);
        setMarriages(marriagesData.marriages);

        if (isEdit && isPerson) {
          const person =
            initialPerson ??
            personsData.persons.find(
              (candidate: AdminPersonPayload) => candidate.id === editId,
            );

          if (person) {
            setPersonForm(personToFullForm(person));
          } else {
            setStatus({ tone: "error", text: "Person not found." });
          }
        }

        if (isEdit && !isPerson) {
          const marriage =
            initialMarriage ??
            marriagesData.marriages.find(
              (candidate: AdminMarriageRow) => candidate.id === editId,
            );

          if (marriage) {
            setMarriageForm(marriageToFullForm(marriage));
          } else {
            setStatus({ tone: "error", text: "Marriage not found." });
          }
        }
      } catch {
        setStatus({ tone: "error", text: "Could not load tree data." });
      } finally {
        setIsLoading(false);
      }
    }

    void loadOptions();
  }, [editId, initialMarriage, initialPerson, isEdit, isPerson]);

  function leavePage(href: string) {
    if (unsavedChanges) {
      unsavedChanges.confirmNavigation(() => router.push(href));
      return;
    }

    router.push(href);
  }

  async function savePerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const birthDateError = getDayMonthYearError({
      year: personForm.birthYear,
      month: personForm.birthMonth,
      day: personForm.birthDay,
    });
    const deathDateError = getDayMonthYearError({
      year: personForm.deathYear,
      month: personForm.deathMonth,
      day: personForm.deathDay,
    });

    if (birthDateError || deathDateError) {
      setStatus({ tone: "error", text: birthDateError ?? deathDateError });
      return;
    }

    setIsSaving(true);
    setStatus({ tone: "neutral", text: null });

    try {
      const response = await apiFetch(
        isEdit ? `/api/admin/persons/${editId}` : "/api/admin/persons",
        {
          method: isEdit ? "PATCH" : "POST",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(personForm),
        },
      );
      const data = await response.json().catch(() => ({ ok: false }));

      if (!response.ok || !data.ok) {
        setStatus({
          tone: "error",
          text:
            data.message ?? `Could not ${isEdit ? "update" : "create"} person.`,
        });
        return;
      }

      router.replace("/admin?tab=persons");
    } catch {
      setStatus({
        tone: "error",
        text: `Could not ${isEdit ? "update" : "create"} person.`,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function saveMarriage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstPartnerId = marriageForm.firstPartnerId;

    if (!firstPartnerId) {
      setStatus({ tone: "error", text: "First partner is required." });
      return;
    }

    const weddingDateError = getDayMonthYearError({
      year: marriageForm.weddingYear,
      month: marriageForm.weddingMonth,
      day: marriageForm.weddingDay,
    });
    if (weddingDateError) {
      setStatus({ tone: "error", text: weddingDateError });
      return;
    }

    setIsSaving(true);
    setStatus({ tone: "neutral", text: null });

    try {
      const patch: MarriagePatch = {
        firstPartnerId,
        secondPartnerId: marriageForm.secondPartnerId,
        weddingYear: marriageForm.weddingYear,
        weddingMonth: marriageForm.weddingMonth,
        weddingDay: marriageForm.weddingDay,
        isDivorced: marriageForm.isDivorced,
      };
      const response = await apiFetch(
        isEdit ? `/api/admin/marriages/${editId}` : "/api/admin/marriages",
        {
          method: isEdit ? "PATCH" : "POST",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        },
      );
      const data = await response.json().catch(() => ({ ok: false }));

      if (!response.ok || !data.ok) {
        setStatus({
          tone: "error",
          text:
            data.message ??
            `Could not ${isEdit ? "update" : "create"} marriage.`,
        });
        return;
      }

      router.replace("/admin?tab=marriages");
    } catch {
      setStatus({
        tone: "error",
        text: `Could not ${isEdit ? "update" : "create"} marriage.`,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="text-foreground">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="border-border flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            {isEdit
              ? isPerson
                ? "Edit person"
                : "Edit marriage"
              : isPerson
                ? "Add person"
                : "Add marriage"}
          </h1>
          <div className="flex items-center gap-3">
            <StatusText status={status} />
            <AnimatedButton
              size="lg"
              variant="outline"
              icon="arrow-left"
              onClick={() => leavePage(backHref)}
            >
              Back
            </AnimatedButton>
          </div>
        </div>

        {isPerson ? (
          <form className="space-y-5" onSubmit={savePerson}>
            <Section title="Family link">
              <Field label="Parent marriage" className="lg:col-span-2">
                <MarriageInput
                  value={personForm.parentMarriageId}
                  marriages={marriages}
                  placeholder={
                    isLoading ? "Loading marriages..." : "Add new marriage"
                  }
                  disabled={isLoading}
                  onChange={(parentMarriageId) =>
                    setPersonForm((current) => ({
                      ...current,
                      parentMarriageId,
                    }))
                  }
                />
              </Field>
            </Section>

            <Section title="Arabic name">
              <TextField
                label="First name Arabic"
                value={personForm.firstNameArabic}
                onChange={(firstNameArabic) =>
                  setPersonForm((current) => ({ ...current, firstNameArabic }))
                }
              />
              <TextField
                label="Middle name Arabic"
                value={personForm.middleNameArabic}
                onChange={(middleNameArabic) =>
                  setPersonForm((current) => ({ ...current, middleNameArabic }))
                }
              />
              <TextField
                label="Last name Arabic"
                value={personForm.lastNameArabic}
                onChange={(lastNameArabic) =>
                  setPersonForm((current) => ({ ...current, lastNameArabic }))
                }
              />
            </Section>

            <Section title="Latin name">
              <TextField
                label="First name"
                value={personForm.firstName}
                onChange={(firstName) =>
                  setPersonForm((current) => ({ ...current, firstName }))
                }
              />
              <TextField
                label="Middle name"
                value={personForm.middleName}
                onChange={(middleName) =>
                  setPersonForm((current) => ({ ...current, middleName }))
                }
              />
              <TextField
                label="Last name"
                value={personForm.lastName}
                onChange={(lastName) =>
                  setPersonForm((current) => ({ ...current, lastName }))
                }
              />
            </Section>

            <Section title="Identity">
              <SwitchField
                label="Male"
                checked={Boolean(personForm.isMale)}
                onCheckedChange={(isMale) =>
                  setPersonForm((current) => ({ ...current, isMale }))
                }
              />
              <SwitchField
                label="Alive"
                checked={personForm.isAlive ?? true}
                onCheckedChange={(isAlive) =>
                  setPersonForm((current) => ({ ...current, isAlive }))
                }
              />
            </Section>

            <Section title="Birth">
              <Field label="Birth date" className="lg:col-span-3">
                <DayMonthYearInputGroup
                  value={{
                    year: personForm.birthYear,
                    month: personForm.birthMonth,
                    day: personForm.birthDay,
                  }}
                  onChange={({ year, month, day }) =>
                    setPersonForm((current) => ({
                      ...current,
                      birthYear: year,
                      birthMonth: month,
                      birthDay: day,
                    }))
                  }
                />
              </Field>
              <TextField
                label="Birth city"
                value={personForm.birthCity}
                onChange={(birthCity) =>
                  setPersonForm((current) => ({ ...current, birthCity }))
                }
              />
              <Field label="Birth country">
                <SelectFrame>
                  <CountrySelect
                    value={personForm.birthCountryCode}
                    onChange={(birthCountryCode) =>
                      setPersonForm((current) => ({
                        ...current,
                        birthCountryCode,
                      }))
                    }
                  />
                </SelectFrame>
              </Field>
            </Section>

            <Section title="Death">
              <Field label="Death date" className="lg:col-span-3">
                <DayMonthYearInputGroup
                  value={{
                    year: personForm.deathYear,
                    month: personForm.deathMonth,
                    day: personForm.deathDay,
                  }}
                  onChange={({ year, month, day }) =>
                    setPersonForm((current) => ({
                      ...current,
                      deathYear: year,
                      deathMonth: month,
                      deathDay: day,
                    }))
                  }
                />
              </Field>
              <TextField
                label="Death city"
                value={personForm.deathCity}
                onChange={(deathCity) =>
                  setPersonForm((current) => ({ ...current, deathCity }))
                }
              />
              <Field label="Death country">
                <SelectFrame>
                  <CountrySelect
                    value={personForm.deathCountryCode}
                    onChange={(deathCountryCode) =>
                      setPersonForm((current) => ({
                        ...current,
                        deathCountryCode,
                      }))
                    }
                  />
                </SelectFrame>
              </Field>
            </Section>

            <div className="flex justify-end gap-3">
              <AnimatedButton
                size="lg"
                variant="outline"
                onClick={() => leavePage(backHref)}
              >
                Cancel
              </AnimatedButton>
              <AnimatedButton
                type="submit"
                size="lg"
                variant="primary"
                icon="save"
                loading={isSaving}
                loadingText="Saving..."
              >
                {isEdit ? "Save person" : "Create person"}
              </AnimatedButton>
            </div>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={saveMarriage}>
            <Section title="Partners">
              <Field label="First partner">
                <PersonInput
                  value={marriageForm.firstPartnerId}
                  persons={persons}
                  placeholder={
                    isLoading ? "Loading people..." : "Add new person"
                  }
                  allowClear={false}
                  disabled={isLoading}
                  onChange={(firstPartnerId) =>
                    setMarriageForm((current) => ({
                      ...current,
                      firstPartnerId,
                    }))
                  }
                />
              </Field>
              <Field label="Second partner">
                <PersonInput
                  value={marriageForm.secondPartnerId}
                  persons={persons}
                  placeholder={
                    isLoading ? "Loading people..." : "Add new person"
                  }
                  disabled={isLoading}
                  onChange={(secondPartnerId) =>
                    setMarriageForm((current) => ({
                      ...current,
                      secondPartnerId,
                    }))
                  }
                />
              </Field>
            </Section>

            <Section title="Wedding">
              <Field label="Wedding date" className="lg:col-span-3">
                <DayMonthYearInputGroup
                  value={{
                    year: marriageForm.weddingYear,
                    month: marriageForm.weddingMonth,
                    day: marriageForm.weddingDay,
                  }}
                  onChange={({ year, month, day }) =>
                    setMarriageForm((current) => ({
                      ...current,
                      weddingYear: year,
                      weddingMonth: month,
                      weddingDay: day,
                    }))
                  }
                />
              </Field>
            </Section>

            <Section title="Divorce">
              <SwitchField
                label="Divorced"
                checked={marriageForm.isDivorced}
                onCheckedChange={(isDivorced) =>
                  setMarriageForm((current) => ({
                    ...current,
                    isDivorced,
                  }))
                }
              />
            </Section>

            <div className="flex justify-end gap-3">
              <AnimatedButton
                size="lg"
                variant="outline"
                onClick={() => leavePage(backHref)}
              >
                Cancel
              </AnimatedButton>
              <AnimatedButton
                type="submit"
                size="lg"
                variant="primary"
                icon="save"
                loading={isSaving}
                loadingText="Saving..."
              >
                {isEdit ? "Save marriage" : "Create marriage"}
              </AnimatedButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
