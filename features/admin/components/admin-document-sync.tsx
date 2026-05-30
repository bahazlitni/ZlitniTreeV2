"use client";

import { useEffect } from "react";

export function AdminDocumentSync() {
  useEffect(() => {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  }, []);

  return null;
}
