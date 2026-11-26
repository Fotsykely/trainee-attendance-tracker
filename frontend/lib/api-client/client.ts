import "server-only";
import type { FieldErrors } from "./types";

// The only place that talks HTTP to the ASP.NET Core API. Pages and Server Actions call the
// functions of attendance.ts and never see fetch or status codes.

const REQUEST_TIMEOUT_MS = 5000;

export class ApiValidationError extends Error {
  constructor(readonly fieldErrors: FieldErrors) {
    super("The API rejected the submitted data.");
    this.name = "ApiValidationError";
  }
}

export class ApiNotFoundError extends Error {
  constructor() {
    super("The requested resource does not exist.");
    this.name = "ApiNotFoundError";
  }
}

// Reads a JSON response (GET, POST, PUT).
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await sendRequest(path, init);
  // The API contract is trusted here: this is the single boundary where JSON becomes a typed value.
  return (await response.json()) as T;
}

// For responses without a body (DELETE answers 204 No Content).
export async function apiFetchNoContent(path: string, init: RequestInit = {}): Promise<void> {
  await sendRequest(path, init);
}

export function jsonRequest(method: "POST" | "PUT", body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) };
}

async function sendRequest(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (response.ok) return response;
  if (response.status === 404) throw new ApiNotFoundError();
  if (response.status === 400) throw new ApiValidationError(await readFieldErrors(response));
  throw new Error(`The API answered with status ${response.status}.`);
}

function apiUrl(path: string): string {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) throw new Error("API_BASE_URL is not set (see frontend/.env.example).");
  return `${baseUrl}${path}`;
}

// The API answers 400 with { errors: { "Name": ["message"] } }; field names come in PascalCase.
async function readFieldErrors(response: Response): Promise<FieldErrors> {
  const problem = (await response.json()) as { errors?: FieldErrors };

  return Object.fromEntries(
    Object.entries(problem.errors ?? {}).map(([field, messages]) => [toCamelCase(field), messages]),
  );
}

function toCamelCase(field: string): string {
  return field.charAt(0).toLowerCase() + field.slice(1);
}
