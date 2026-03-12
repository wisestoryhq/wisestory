import { createAuthClient } from "better-auth/react";

export function createWiseStoryAuthClient(baseURL?: string) {
  const client = createAuthClient({
    baseURL: baseURL ?? process.env.NEXT_PUBLIC_APP_URL ?? "",
  });
  return client;
}
