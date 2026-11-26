// Shown while a page loads its data. The shapes roughly match a heading and a few cards,
// so the page does not jump when the content arrives.
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      <div aria-hidden className="flex flex-col gap-3">
        <div className="mb-3 h-8 w-1/2 rounded-md bg-border" />
        <div className="h-24 rounded-lg bg-border" />
        <div className="h-24 rounded-lg bg-border" />
        <div className="h-24 rounded-lg bg-border" />
      </div>
    </div>
  );
}
