import { z } from "zod";
import logger from "./logger.js";

const envSchema = z.object({
  // Server
  PORT: z.string().regex(/^\d+$/).default("3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  TZ: z.string().default("Asia/Kolkata"),

  // CORS
  ALLOWED_ORIGINS: z.string().min(1),

  // Mode
  MODE: z.enum(["self-hosted", "saas"]).default("self-hosted"),

  // URLs
  API_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().min(1),

  // JWT - min 32 chars for security
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_VERIFICATION_SECRET: z.string().min(32),
  JWT_PASSWORD_RESET_SECRET: z.string().min(32),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1).startsWith("re_"),
  MAIL_FROM: z
    .string()
    .email()
    .optional()
    .default("Throughline <onboarding@resend.dev>"),

  // Cron
  CRON_SECRET: z.string().min(32).optional(),
  DISABLE_INTERNAL_CRON: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),

  // LLM providers (at least one needed in self-hosted mode)
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GOOGLE_MODEL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional(),

  // SaaS mode config
  SAAS_LLM_PROVIDER: z
    .enum(["openrouter", "google", "openai", "anthropic", "groq"])
    .optional(),
  SAAS_OPENROUTER_MODEL: z.string().optional(),
  SAAS_GOOGLE_MODEL: z.string().optional(),
  SAAS_OPENAI_MODEL: z.string().optional(),
  SAAS_ANTHROPIC_MODEL: z.string().optional(),
  SAAS_GROQ_MODEL: z.string().optional(),

  // Dev options
  SKIP_RATE_LIMIT: z.string().optional(),
});

export function validateEnv() {
  try {
    const validated = envSchema.parse(process.env);

    const mode = validated.MODE || "self-hosted";

    // Check LLM config for self-hosted
    if (mode === "self-hosted") {
      const hasLLMProvider =
        validated.GROQ_API_KEY ||
        validated.OPENROUTER_API_KEY ||
        validated.GOOGLE_GENERATIVE_AI_API_KEY ||
        validated.OPENAI_API_KEY ||
        validated.ANTHROPIC_API_KEY;

      if (!hasLLMProvider) {
        logger.warn("No LLM provider configured - AI features will not work");
      }
    }

    // Check LLM config for SaaS
    if (mode === "saas") {
      if (!validated.SAAS_LLM_PROVIDER) {
        throw new Error("SAAS_LLM_PROVIDER must be set when MODE=saas");
      }

      const providerKeyMap = {
        groq: "GROQ_API_KEY",
        openrouter: "OPENROUTER_API_KEY",
        google: "GOOGLE_GENERATIVE_AI_API_KEY",
        openai: "OPENAI_API_KEY",
        anthropic: "ANTHROPIC_API_KEY",
      };

      const requiredKey = providerKeyMap[validated.SAAS_LLM_PROVIDER];
      if (!validated[requiredKey]) {
        throw new Error(
          `${requiredKey} must be set when SAAS_LLM_PROVIDER=${validated.SAAS_LLM_PROVIDER}`,
        );
      }
    }

    // Check CRON_SECRET when internal cron is enabled
    const cronEnabled = validated.DISABLE_INTERNAL_CRON !== "true";
    if (cronEnabled && !validated.CRON_SECRET) {
      throw new Error(
        "CRON_SECRET required when internal cron is enabled (generate with: openssl rand -base64 32)",
      );
    }

    // Validate CORS origins are actual URLs
    const origins = validated.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
    const invalidOrigins = origins.filter((origin) => {
      try {
        new URL(origin);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidOrigins.length > 0) {
      throw new Error(`Invalid CORS origins: ${invalidOrigins.join(", ")}`);
    }

    // Check DB URL has protocol
    if (!validated.DATABASE_URL.includes("://")) {
      throw new Error("DATABASE_URL must include protocol (e.g., mysql://...)");
    }

    // Production warnings
    if (validated.NODE_ENV === "production") {
      if (validated.MAIL_FROM?.includes("onboarding@resend.dev")) {
        logger.warn(
          "Using default Resend test email - set MAIL_FROM to your domain",
        );
      }

      if (!validated.SENTRY_DSN) {
        logger.warn("Sentry not configured - no error tracking");
      }

      if (validated.SKIP_RATE_LIMIT === "true") {
        logger.warn("SECURITY WARNING: Rate limiting disabled in production!");
      }

      if (
        !validated.API_URL.startsWith("https://") ||
        !validated.FRONTEND_URL.startsWith("https://")
      ) {
        logger.warn("SECURITY WARNING: Not using HTTPS in production");
      }
    }

    logger.info("Environment validation successful");
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`,
      );
      logger.error("Environment validation failed:", { errors });
    } else {
      logger.error("Environment validation failed:", error.message);
    }

    throw new Error("Environment validation failed. Check your .env file.");
  }
}

export function logEnvConfig(env) {
  const llmProviders = [];
  if (env.GROQ_API_KEY) llmProviders.push("Groq");
  if (env.OPENROUTER_API_KEY) llmProviders.push("OpenRouter");
  if (env.GOOGLE_GENERATIVE_AI_API_KEY) llmProviders.push("Google Gemini");
  if (env.OPENAI_API_KEY) llmProviders.push("OpenAI");
  if (env.ANTHROPIC_API_KEY) llmProviders.push("Anthropic");

  // Extract DB host without credentials
  const dbHost = env.DATABASE_URL.split("@")[1]?.split("/")[0] || "configured";

  logger.info("Config loaded", {
    mode: env.MODE,
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    dbHost,
    llmProviders: llmProviders.length > 0 ? llmProviders : ["none"],
    cronEnabled: env.DISABLE_INTERNAL_CRON !== "true",
    sentryEnabled: !!env.SENTRY_DSN,
  });
}
