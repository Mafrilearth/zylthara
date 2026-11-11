import { Redis } from "@upstash/redis";

// Check if Upstash Redis credentials exist in environment
const hasUpstashConfig =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

export const redis = hasUpstashConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// In-memory fallback map if Upstash Redis is not configured in local environment
interface MemoryTimer {
  endTime: number;
  durationSeconds: number;
}
const memoryTimers = new Map<string, MemoryTimer>();

const DEFAULT_EXAM_DURATION_MINUTES = 60;

/**
 * Starts a server-enforced countdown timer for an exam attempt.
 */
export async function startAttemptTimer(
  attemptId: string,
  durationMinutes: number = DEFAULT_EXAM_DURATION_MINUTES,
): Promise<{ remainingSeconds: number }> {
  const durationSeconds = durationMinutes * 60;
  const now = Date.now();
  const endTime = now + durationSeconds * 1000;

  if (redis) {
    try {
      const key = `attempt:timer:${attemptId}`;
      await redis.set(
        key,
        JSON.stringify({
          startTime: now,
          endTime,
          durationSeconds,
        }),
        { ex: durationSeconds },
      );
      return { remainingSeconds: durationSeconds };
    } catch (err) {
      console.warn("Upstash Redis unreachable, using in-memory timer fallback:", err);
    }
  }

  // Fallback to in-memory store
  memoryTimers.set(attemptId, { endTime, durationSeconds });
  return { remainingSeconds: durationSeconds };
}

/**
 * Checks remaining time for an exam attempt and determines if the session is still valid.
 */
export async function checkAttemptTime(
  attemptId: string,
): Promise<{ isValid: boolean; remainingSeconds: number }> {
  if (redis) {
    try {
      const key = `attempt:timer:${attemptId}`;
      const dataStr = await redis.get<string | object>(key);
      const ttl = await redis.ttl(key);

      if (!dataStr || ttl <= 0) {
        return { isValid: false, remainingSeconds: 0 };
      }

      return {
        isValid: true,
        remainingSeconds: ttl,
      };
    } catch (err) {
      console.warn("Upstash Redis unreachable, reading in-memory fallback:", err);
    }
  }

  // Check in-memory store
  const memoryTimer = memoryTimers.get(attemptId);
  if (!memoryTimer) {
    return { isValid: false, remainingSeconds: 0 };
  }

  const remainingMs = memoryTimer.endTime - Date.now();
  if (remainingMs <= 0) {
    memoryTimers.delete(attemptId);
    return { isValid: false, remainingSeconds: 0 };
  }

  return {
    isValid: true,
    remainingSeconds: Math.ceil(remainingMs / 1000),
  };
}

/**
 * Clears the attempt timer upon official exam submission.
 */
export async function clearAttemptTimer(attemptId: string): Promise<void> {
  if (redis) {
    try {
      await redis.del(`attempt:timer:${attemptId}`);
    } catch (err) {
      console.warn("Failed to delete timer in Redis:", err);
    }
  }
  memoryTimers.delete(attemptId);
}
