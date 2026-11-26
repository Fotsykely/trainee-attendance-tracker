import { notFound } from "next/navigation";
import { ApiNotFoundError } from "./api-client/client";

// Route segments are strings. An id that is not a positive integer cannot match any record.
export function parseRouteId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return id;
}

// Shows the "not found" page when the API answers 404; any other error propagates.
export async function orNotFound<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiNotFoundError) notFound();
    throw error;
  }
}
