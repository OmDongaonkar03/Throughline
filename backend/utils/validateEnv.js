import { z } from 'zod';
import logger from './logger.js';

/**
 * Environment variable validation schema
 * Validates all required environment variables on startup
 */
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  TZ: z.string().default('Asia/Kolkata'),
  
  // CORS Configuration
  ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS must be set'),
  
  // Application Mode
  MODE: z.enum(['self-hosted', 'saas']).default('self-hosted'),
  
  // Application URLs
  API_URL: z.string().url('API_URL must be a valid URL'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
  
  // Database Configuration
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // JWT Configuration - Must be at least 32 characters
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_VERIFICATION_SECRET: z.string().min(32, 'JWT_VERIFICATION_SECRET must be at least 32 characters'),
  JWT_PASSWORD_RESET_SECRET: z.string().min(32, 'JWT_PASSWORD_RESET_SECRET must be at least 32 characters'),
  
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  GOOGLE_CALLBACK_URL: z.string().url('GOOGLE_CALLBACK_URL must be a valid URL'),
  
  // Sentry Configuration (optional but recommended)
  SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL').optional(),
  
  // LLM Configuration - At least one must be present in self-hosted mode
  // These are all optional but validated conditionally below
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
  
  // SaaS Mode Configuration
  SAAS_LLM_PROVIDER: z.enum(['openrouter', 'google', 'openai', 'anthropic', 'groq']).optional(),
  SAAS_OPENROUTER_MODEL: z.string().optional(),
  SAAS_GOOGLE_MODEL: z.string().optional(),
  SAAS_OPENAI_MODEL: z.string().optional(),
  SAAS_ANTHROPIC_MODEL: z.string().optional(),
  
  // Scheduler Configuration
  DISABLE_INTERNAL_CRON: z.string().optional(),
  
  // Development Options
  SKIP_RATE_LIMIT: z.string().optional(),
});

/**
 * Validate environment variables
 * @throws {Error} If validation fails
 * @returns {Object} Validated environment variables
 */
export function validateEnv() {
  try {
    const validated = envSchema.parse(process.env);
    
    // Additional validation: Check LLM configuration
    const mode = validated.MODE || 'self-hosted';
    
    if (mode === 'self-hosted') {
      // Self-hosted mode: At least one LLM provider must be configured
      const hasLLMProvider = 
        validated.GROQ_API_KEY ||
        validated.OPENROUTER_API_KEY ||
        validated.GOOGLE_GENERATIVE_AI_API_KEY ||
        validated.OPENAI_API_KEY ||
        validated.ANTHROPIC_API_KEY;
      
      if (!hasLLMProvider) {
        logger.warn('No LLM provider configured in self-hosted mode', {
          mode: 'self-hosted',
          aiFeatures: 'disabled',
          availableProviders: ['GROQ', 'OPENROUTER', 'GOOGLE', 'OPENAI', 'ANTHROPIC'],
          message: 'Application will start but AI features will not work'
        });
      } else {
        logger.info('LLM providers validated for self-hosted mode', {
          mode: 'self-hosted',
          hasGroq: !!validated.GROQ_API_KEY,
          hasOpenRouter: !!validated.OPENROUTER_API_KEY,
          hasGoogle: !!validated.GOOGLE_GENERATIVE_AI_API_KEY,
          hasOpenAI: !!validated.OPENAI_API_KEY,
          hasAnthropic: !!validated.ANTHROPIC_API_KEY
        });
      }
    } else if (mode === 'saas') {
      // SaaS mode: Provider must be specified and API key must exist
      if (!validated.SAAS_LLM_PROVIDER) {
        logger.error('SaaS mode missing LLM provider configuration', {
          mode: 'saas',
          missingConfig: 'SAAS_LLM_PROVIDER'
        });
        throw new Error('SAAS_LLM_PROVIDER must be set when MODE=saas');
      }
      
      const provider = validated.SAAS_LLM_PROVIDER;
      const providerKeyMap = {
        'groq': 'GROQ_API_KEY',
        'openrouter': 'OPENROUTER_API_KEY',
        'google': 'GOOGLE_GENERATIVE_AI_API_KEY',
        'openai': 'OPENAI_API_KEY',
        'anthropic': 'ANTHROPIC_API_KEY',
      };
      
      const requiredKey = providerKeyMap[provider];
      if (!validated[requiredKey]) {
        logger.error('SaaS mode missing API key for selected provider', {
          mode: 'saas',
          provider,
          missingKey: requiredKey
        });
        throw new Error(`${requiredKey} must be set when SAAS_LLM_PROVIDER=${provider}`);
      }

      logger.info('LLM provider validated for SaaS mode', {
        mode: 'saas',
        provider,
        keyConfigured: requiredKey
      });
    }
    
    logger.info('Environment validation successful');
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Environment validation failed: Zod schema errors', {
        errorCount: error.errors.length,
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        })),
        hint: 'Please check your .env file and ensure all required variables are set'
      });
    } else {
      logger.error('Environment validation failed', {
        error: error.message,
        stack: error.stack
      });
    }
    
    throw new Error('Environment validation failed. Cannot start application.');
  }
}

/**
 * Log environment configuration (safe version without secrets)
 */
export function logEnvConfig(env) {
  // Show configured LLM providers
  const llmProviders = [];
  if (env.GROQ_API_KEY) llmProviders.push('Groq');
  if (env.OPENROUTER_API_KEY) llmProviders.push('OpenRouter');
  if (env.GOOGLE_GENERATIVE_AI_API_KEY) llmProviders.push('Google Gemini');
  if (env.OPENAI_API_KEY) llmProviders.push('OpenAI');
  if (env.ANTHROPIC_API_KEY) llmProviders.push('Anthropic');

  const dbHost = env.DATABASE_URL.split('@')[1] || 'configured';

  logger.info('Environment configuration loaded', {
    mode: env.MODE,
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    timezone: env.TZ,
    databaseHost: dbHost,
    frontendUrl: env.FRONTEND_URL,
    llmProviders: llmProviders.length > 0 ? llmProviders : ['none'],
    cronEnabled: env.DISABLE_INTERNAL_CRON !== 'true',
    sentryEnabled: !!env.SENTRY_DSN,
    rateLimitSkipped: env.SKIP_RATE_LIMIT === 'true'
  });
}