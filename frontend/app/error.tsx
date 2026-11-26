"use client";

import { useEffect } from "react";
import { Button } from "@/components/button";

// Last safety net for unexpected errors (API unreachable, server error...).
// The technical message is logged but never shown to the user.
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
      <p className="text-muted-foreground">
        Le service ne répond pas comme prévu. Vérifiez que l&apos;API est lancée, puis réessayez.
      </p>
      <Button onClick={() => retry()}>Réessayer</Button>
    </div>
  );
}
