import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiNotFoundError, ApiValidationError, apiFetch, apiFetchNoContent } from "./client";

// "server-only" throws when imported outside a Server Component: replace it with an empty module.
vi.mock("server-only", () => ({}));

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("api client", () => {
  beforeEach(() => {
    vi.stubEnv("API_BASE_URL", "http://api.test");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the parsed JSON body of a successful response", async () => {
    const fetchMock = stubFetch(jsonResponse([{ id: 1, name: "First" }]));

    const items = await apiFetch<{ id: number; name: string }[]>("/api/items");

    expect(items).toEqual([{ id: 1, name: "First" }]);
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/api/items", expect.anything());
  });

  it("throws ApiNotFoundError on a 404", async () => {
    stubFetch(new Response(null, { status: 404 }));

    await expect(apiFetch("/api/items/42")).rejects.toBeInstanceOf(ApiNotFoundError);
  });

  it("throws ApiValidationError with camelCase field names on a 400", async () => {
    stubFetch(jsonResponse({ errors: { Name: ["Le nom est obligatoire."] } }, 400));

    const error = await apiFetch("/api/items").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiValidationError);
    expect((error as ApiValidationError).fieldErrors).toEqual({ name: ["Le nom est obligatoire."] });
  });

  it("throws a generic error on any other failure status", async () => {
    stubFetch(new Response(null, { status: 500 }));

    await expect(apiFetch("/api/items")).rejects.toThrow("status 500");
  });

  it("accepts an empty 204 response when no body is expected", async () => {
    stubFetch(new Response(null, { status: 204 }));

    await expect(apiFetchNoContent("/api/items/1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("fails clearly when API_BASE_URL is not set", async () => {
    vi.stubEnv("API_BASE_URL", "");

    await expect(apiFetch("/api/items")).rejects.toThrow("API_BASE_URL is not set");
  });
});
