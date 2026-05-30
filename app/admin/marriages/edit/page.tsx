import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminRouteFrame } from "@/features/admin/components/admin-route-frame";
import { TreeCreatePage } from "@/features/admin/components/tree-create-page";
import { requireAdminPageSession } from "@/features/admin/server/page-auth";
import {
  marriageRelationInclude,
  serializeMarriage,
} from "@/features/admin/server/tree";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Edit marriage | Zlitni Tree",
};

type EditMarriagePageProps = {
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

export default async function EditMarriagePage({
  searchParams,
}: EditMarriagePageProps) {
  const session = await requireAdminPageSession();

  const id = parseSearchId((await searchParams).id);

  if (!id) {
    notFound();
  }

  const marriage = await prisma.marriage.findUnique({
    where: { id },
    include: marriageRelationInclude,
  });

  if (!marriage) {
    notFound();
  }

  return (
    <AdminRouteFrame session={session} activeTab="marriages">
      <TreeCreatePage
        mode="marriage"
        editId={id}
        initialMarriage={serializeMarriage(marriage)}
      />
    </AdminRouteFrame>
  );
}
