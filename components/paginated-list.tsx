"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";

import { pageBounds } from "@/lib/pagination";

export function PaginatedList<T>({ items, renderItem, label, resetKey = "", className = "" }: {
  items: T[]; renderItem: (item: T) => ReactNode; label: string; resetKey?: string; className?: string;
}) {
  const [selection, setSelection] = useState({ key: resetKey, page: 1 });
  if (selection.key !== resetKey) setSelection({ key: resetKey, page: 1 });
  const root = useRef<HTMLDivElement>(null);
  const { page, pages, start, end } = pageBounds(items.length, selection.key === resetKey ? selection.page : 1);
  function changePage(next: number) {
    setSelection({ key: resetKey, page: next });
    requestAnimationFrame(() => {
      root.current?.scrollIntoView({ block: "start", behavior: "instant" });
      root.current?.focus({ preventScroll: true });
    });
  }
  return <div className={`paginated-list ${className}`} ref={root} tabIndex={-1} role="region" aria-label={label}>
    <div className="grouped-list">{items.slice(start, end).map(renderItem)}</div>
    {pages > 1 && <nav className="list-pagination" aria-label={`${label} pages`}>
      <p aria-live="polite">Showing {new Intl.NumberFormat("en-ET").format(start + 1)}–{new Intl.NumberFormat("en-ET").format(end)} of {new Intl.NumberFormat("en-ET").format(items.length)}</p>
      <div><button type="button" className="button white" disabled={page === 1} onClick={() => changePage(page - 1)}><ArrowLeft size={17} />Previous</button><span>Page {page} of {pages}</span><button type="button" className="button white" disabled={page === pages} onClick={() => changePage(page + 1)}>Next<ArrowRight size={17} /></button></div>
    </nav>}
  </div>;
}
