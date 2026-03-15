const AGENT_URL = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001";
const METADATA_URL = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity";

/**
 * Fetch an identity token for the agent service from the Cloud Run metadata server.
 * Returns null in local dev (no metadata server).
 */
async function getIdToken(): Promise<string | null> {
  if (!process.env.AGENT_SERVICE_URL || AGENT_URL.includes("localhost")) {
    return null; // Local dev — no auth needed
  }

  try {
    const res = await fetch(
      `${METADATA_URL}?audience=${AGENT_URL}`,
      { headers: { "Metadata-Flavor": "Google" } },
    );
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

/**
 * Make an authenticated fetch to the agent service.
 * In production, adds an identity token. In dev, passes through.
 */
export async function agentFetch(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const token = await getIdToken();

  const agentHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    agentHeaders["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${AGENT_URL}${path}`, {
    ...init,
    headers: agentHeaders,
  });
}
