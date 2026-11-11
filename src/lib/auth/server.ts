import { createNeonAuth } from "@neon/auth/next/server";

const NEON_AUTH_BASE_URL =
  process.env.NEON_AUTH_BASE_URL ||
  (process.env.BETTER_AUTH_URL?.includes("neonauth") ? process.env.BETTER_AUTH_URL : undefined) ||
  "https://ep-muddy-lake-b3y5a66d.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth";

const COOKIE_SECRET =
  process.env.NEON_AUTH_COOKIE_SECRET ||
  process.env.BETTER_AUTH_SECRET ||
  "zylthara_secret_auth_session_key_production_2026_secure";

export const auth = createNeonAuth({
  baseUrl: NEON_AUTH_BASE_URL,
  cookies: {
    secret: COOKIE_SECRET,
  },
});
