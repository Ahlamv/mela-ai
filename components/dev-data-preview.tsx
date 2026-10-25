"use client";

import { useEffect, useState } from "react";
import MelaApp from "./mela-app";
import { createReviewData, reviewModes, type ReviewMode } from "@/lib/review-data";
import styles from "./dev-data-preview.module.css";

type Mode = "saved" | ReviewMode;
const labels: Record<Mode, string> = { saved: "Saved shop", demo: "Demo data", worst: "Worst case", empty: "Empty", one: "One", huge: "1,284 rows" };

export default function DevDataPreview() {
  const [selection, setSelection] = useState<{ mode: Mode; data?: ReturnType<typeof createReviewData> } | null>(null);
  function select(mode: Mode, updateUrl = true) {
    if (selection?.mode === mode) return;
    if (updateUrl) {
      const url = new URL(window.location.href);
      if (mode === "saved") url.searchParams.delete("data"); else url.searchParams.set("data", mode);
      window.history.replaceState(null, "", url);
    }
    setSelection({ mode, data: mode === "saved" ? undefined : createReviewData(mode) });
  }
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("data");
    select(reviewModes.includes(value as ReviewMode) ? value as ReviewMode : "saved", false);
  }, []);
  if (!selection) return null;
  return <div className={styles.preview}>
    <MelaApp key={selection.mode} previewData={selection.data} />
    <aside className={styles.toolbar} aria-label="Development data preview">
      <p>Development preview · {selection.mode === "saved" ? "Uses your saved shop" : "Temporary data · edits reset when switching"}</p>
      <div role="group" aria-label="Review dataset">{(["saved", ...reviewModes] as Mode[]).map(mode => <button key={mode} type="button" aria-pressed={mode === selection.mode} onClick={() => select(mode)}>{labels[mode]}</button>)}</div>
    </aside>
  </div>;
}
