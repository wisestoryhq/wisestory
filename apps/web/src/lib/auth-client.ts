"use client";

import { createWiseStoryAuthClient } from "@wisestory/auth/client";

export const authClient = createWiseStoryAuthClient();

export const { signIn, signOut, useSession } = authClient;
