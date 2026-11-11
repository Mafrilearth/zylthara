import { createNeonAuth } from "@neon/auth/next/server";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || "",
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || "default_development_secret_at_least_32_characters_long",
  },
});

