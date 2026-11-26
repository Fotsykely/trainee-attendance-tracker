// Shown while a page loads its data. The shapes roughly match a form or a table of a few rows,
// so the page does not jump when the content arrives.
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      <div aria-hidden className="flex flex-col gap-3">
        <div className="h-16 rounded-md bg-border" />
        <div className="h-14 rounded-md bg-border" />
        <div className="h-14 rounded-md bg-border" />
        <div className="h-14 rounded-md bg-border" />
        <div className="h-14 rounded-md bg-border" />
      </div>
    </div>
  );
}
