import { Ratelimit } from "@upstash/ratelimit";
import redis from "@/database/redis";

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(5, "1m"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    })
  : {
      limit: async () => ({
        success: true,
        remaining: 9999,
        reset: Date.now() + 60_000,
        pending: Promise.resolve(),
      }),
    };

export default ratelimit;
