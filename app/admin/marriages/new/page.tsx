import type { Metadata } from "next";

import { AdminRouteFrame } from "@/features/admin/components/admin-route-frame";
import { TreeCreatePage } from "@/features/admin/components/tree-create-page";
import { requireAdminPageSession } from "@/features/admin/server/page-auth";

export const metadata: Metadata = {
  title: "Add marriage | Zlitni Tree",
};

export default async function AddMarriagePage() {
  const session = await requireAdminPageSession();

  return (
    <AdminRouteFrame session={session} activeTab="marriages">
      <TreeCreatePage mode="marriage" />
    </AdminRouteFrame>
  );
}
