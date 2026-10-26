"use client";

import { useEffect } from "react";

export type DraftChange = (dirty: boolean, saving?: boolean) => void;

export function useDraftGuard(dirty: boolean, saving: boolean, onChange: DraftChange) {
  useEffect(() => { onChange(dirty, saving); return () => onChange(false, false); }, [dirty, saving, onChange]);
  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);
}
