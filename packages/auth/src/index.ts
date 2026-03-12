import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAuth(prisma: any) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
