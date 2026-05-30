"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import AnimatedButton from "@/components/ui/custom/AnimatedButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PendingNavigation = (() => void) | null;
type UnsavedChangesContextValue = {
  confirmNavigation: (action: () => void) => void;
  setUnsavedChanges: (isDirty: boolean) => void;
};

const AdminUnsavedChangesContext =
  createContext<UnsavedChangesContextValue | null>(null);

export function AdminUnsavedChangesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation>(null);

  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const setUnsavedChanges = useCallback((nextIsDirty: boolean) => {
    isDirtyRef.current = nextIsDirty;
    setIsDirty(nextIsDirty);
  }, []);

  const confirmNavigation = useCallback((action: () => void) => {
    if (!isDirtyRef.current) {
      action();
      return;
    }

    setPendingNavigation(() => action);
    setIsDialogOpen(true);
  }, []);

  const contextValue = useMemo(
    () => ({ confirmNavigation, setUnsavedChanges }),
    [confirmNavigation, setUnsavedChanges],
  );

  function stayOnPage() {
    setIsDialogOpen(false);
    setPendingNavigation(null);
  }

  function leavePage() {
    const action = pendingNavigation;
    isDirtyRef.current = false;
    setIsDirty(false);
    setIsDialogOpen(false);
    setPendingNavigation(null);
    window.setTimeout(() => action?.(), 0);
  }

  return (
    <AdminUnsavedChangesContext.Provider value={contextValue}>
      {children}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && stayOnPage()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave without saving?</DialogTitle>
            <DialogDescription>
              You have unsaved changes on this edit page. Leaving now will
              discard them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <AnimatedButton size="lg" variant="outline" onClick={stayOnPage}>
              Stay
            </AnimatedButton>
            <AnimatedButton
              size="lg"
              variant="primary"
              icon="arrow-right"
              onClick={leavePage}
            >
              Leave
            </AnimatedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminUnsavedChangesContext.Provider>
  );
}

export function useAdminUnsavedChangesGuard() {
  return useContext(AdminUnsavedChangesContext);
}
