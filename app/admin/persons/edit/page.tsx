import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminRouteFrame } from "@/features/admin/components/admin-route-frame";
import { TreeCreatePage } from "@/features/admin/components/tree-create-page";
import { requireAdminPageSession } from "@/features/admin/server/page-auth";
import {
  personRelationInclude,
  serializePerson,
} from "@/features/admin/server/tree";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Edit person | Zlitni Tree",
};

type EditPersonPageProps = {
  searchParams: Promise<{
    id?: string | string[];
  }>;
};

function parseSearchId(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const id = Number(rawValue);

  if (!Number.isInteger(id) || id <= 0) return null;

  return id;
}

export default async function EditPersonPage({
  searchParams,
}: EditPersonPageProps) {
  const session = await requireAdminPageSession();

  const id = parseSearchId((await searchParams).id);

  if (!id) {
    notFound();
  }

  const person = await prisma.person.findUnique({
    where: { id },
    include: personRelationInclude,
  });

  if (!person) {
    notFound();
  }

  return (
    <AdminRouteFrame session={session} activeTab="persons">
      <TreeCreatePage
        mode="person"
        editId={id}
        initialPerson={serializePerson(person)}
      />
    </AdminRouteFrame>
  );
}
