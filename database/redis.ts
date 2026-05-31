import { Redis } from "@upstash/redis";
import config from "@/lib/config";

const redis = config.features.hasUpstash
  ? new Redis({
      url: config.env.upstash.redisUrl,
      token: config.env.upstash.redisToken,
    })
  : null;

export default redis;
