import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Agent client — token fetching", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  it("skips auth token in local dev (no AGENT_SERVICE_URL)", async () => {
    delete process.env.AGENT_SERVICE_URL;

    const calls: { url: string; headers: Record<string, string> }[] = [];
    globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({
        url: url.toString(),
        headers: (init?.headers ?? {}) as Record<string, string>,
      });
      return new Response("ok", { status: 200 });
    }) as typeof fetch;

    const { agentFetch } = await import("../../lib/agent-client");
    await agentFetch("/chat/stream", { method: "POST", body: "{}" });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("localhost:3001/chat/stream");
    expect(calls[0].headers.Authorization).toBeUndefined();
  });

  it("fetches identity token in production", async () => {
    process.env.AGENT_SERVICE_URL = "https://agent.run.app";

    const calls: { url: string; headers: Record<string, string> }[] = [];
    globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("metadata.google.internal")) {
        return new Response("fake-id-token", { status: 200 });
      }
      calls.push({
        url: urlStr,
        headers: (init?.headers ?? {}) as Record<string, string>,
      });
      return new Response("ok", { status: 200 });
    }) as typeof fetch;

    const { agentFetch } = await import("../../lib/agent-client");
    await agentFetch("/chat/stream", { method: "POST", body: "{}" });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://agent.run.app/chat/stream");
    expect(calls[0].headers.Authorization).toBe("Bearer fake-id-token");
  });

  it("falls back to no auth when metadata server fails", async () => {
    process.env.AGENT_SERVICE_URL = "https://agent.run.app";

    const calls: { url: string; headers: Record<string, string> }[] = [];
    globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("metadata.google.internal")) {
        return new Response("not found", { status: 404 });
      }
      calls.push({
        url: urlStr,
        headers: (init?.headers ?? {}) as Record<string, string>,
      });
      return new Response("ok", { status: 200 });
    }) as typeof fetch;

    const { agentFetch } = await import("../../lib/agent-client");
    await agentFetch("/test", { method: "GET" });

    expect(calls).toHaveLength(1);
    expect(calls[0].headers.Authorization).toBeUndefined();
  });
});
