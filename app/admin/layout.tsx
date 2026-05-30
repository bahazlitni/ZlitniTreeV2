import type { ReactNode } from "react";

import { AdminDocumentSync } from "@/features/admin/components/admin-document-sync";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminDocumentSync />
      {children}
    </>
  );
}
