const getEnv = (key: string, fallback = "") => process.env[key] || fallback;
const isPlaceholder = (value: string) =>
  !value || value === "placeholder" || value === "replace-me";

const config = {
  env: {
    apiEndpoint: getEnv("NEXT_PUBLIC_API_ENDPOINT", "http://localhost:3000"),
    prodApiEndpoint: getEnv(
      "NEXT_PUBLIC_PROD_API_ENDPOINT",
      "http://localhost:3000",
    ),
    imagekit: {
      publicKey: getEnv("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY", "placeholder"),
      urlEndpoint: getEnv(
        "NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT",
        "https://ik.imagekit.io/placeholder",
      ),
      privateKey: getEnv("IMAGEKIT_PRIVATE_KEY", "placeholder"),
    },
    databaseUrl: getEnv(
      "DATABASE_URL",
      "postgresql://library_user:library_pass@127.0.0.1:5432/library_db",
    ),
    upstash: {
      redisUrl: getEnv("UPSTASH_REDIS_URL", "placeholder"),
      redisToken: getEnv("UPSTASH_REDIS_TOKEN", "placeholder"),
      qstashUrl: getEnv("QSTASH_URL", "placeholder"),
      qstashToken: getEnv("QSTASH_TOKEN", "placeholder"),
    },
    resendToken: getEnv("RESEND_TOKEN", "placeholder"),
    authSecret: getEnv(
      "AUTH_SECRET",
      "local-dev-auth-secret-change-me-in-production",
    ),
    nextAuthUrl: getEnv("NEXTAUTH_URL", "http://localhost:3000"),
    riskModelMode: getEnv("RISK_MODEL_MODE", "rule"),
    riskHighThreshold: Number(getEnv("RISK_HIGH_THRESHOLD", "80")),
    riskMediumThreshold: Number(getEnv("RISK_MEDIUM_THRESHOLD", "50")),
  },
  features: {
    hasImagekit:
      !isPlaceholder(getEnv("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY")) &&
      !isPlaceholder(getEnv("IMAGEKIT_PRIVATE_KEY")),
    hasUpstash:
      !isPlaceholder(getEnv("UPSTASH_REDIS_URL")) &&
      !isPlaceholder(getEnv("UPSTASH_REDIS_TOKEN")),
    hasQstash:
      !isPlaceholder(getEnv("QSTASH_URL")) &&
      !isPlaceholder(getEnv("QSTASH_TOKEN")),
    hasResend: !isPlaceholder(getEnv("RESEND_TOKEN")),
  },
};

export default config;
