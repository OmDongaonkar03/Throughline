export function getLLMConfig() {
  const mode = process.env.MODE || "self-hosted";

  // SaaS mode: Use configured provider from ENV
  if (mode === "saas") {
    const provider = process.env.SAAS_LLM_PROVIDER || "openai";

    if (provider === "openai") {
      return {
        provider: "openai",
        model: process.env.SAAS_OPENAI_MODEL || "gpt-4o-mini",
        apiKey: process.env.OPENAI_API_KEY,
      };
    }

    if (provider === "anthropic") {
      return {
        provider: "anthropic",
        model: process.env.SAAS_ANTHROPIC_MODEL || "claude-sonnet-4",
        apiKey: process.env.ANTHROPIC_API_KEY,
      };
    }

    if (provider === "google") {
      return {
        provider: "google",
        model: process.env.SAAS_GOOGLE_MODEL || "gemini-1.5-flash",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      };
    }

    if (provider === "openrouter") {
      return {
        provider: "openrouter",
        model: process.env.SAAS_OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
        apiKey: process.env.OPENROUTER_API_KEY,
      };
    }
  }

  // Self-hosted mode: Detect what user has configured

  // Check for Groq FIRST (free and fast!)
  if (process.env.GROQ_API_KEY) {
    return {
      provider: "groq",
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      apiKey: process.env.GROQ_API_KEY,
    };
  }

  // Check for OpenRouter (gives access to many models)
  if (process.env.OPENROUTER_API_KEY) {
    return {
      provider: "openrouter",
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
      apiKey: process.env.OPENROUTER_API_KEY,
    };
  }

  // Check for Gemini (Cloud)
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      provider: "google",
      model: process.env.GOOGLE_MODEL || "gemini-2.0-flash",
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    };
  }

  // Check for OpenAI
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      apiKey: process.env.OPENAI_API_KEY,
    };
  }

  // Check for Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic",
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4",
      apiKey: process.env.ANTHROPIC_API_KEY,
    };
  }

  // No provider found
  throw new Error(
    "No LLM provider configured. Please set one of: " +
      "GROQ_API_KEY, OPENROUTER_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in your .env file"
  );
}

// Get model string in Mastra format (provider/model)
export function getModelString() {
  const config = getLLMConfig();
  return `${config.provider}/${config.model}`;
}

// Get available providers from environment
export function getAvailableProviders() {
  const providers = [];

  if (process.env.GROQ_API_KEY) {
    providers.push({
      provider: "groq",
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      type: "cloud",
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      provider: "openrouter",
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
      type: "cloud",
    });
  }

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    providers.push({
      provider: "google",
      model: process.env.GOOGLE_MODEL || "gemini-1.5-flash",
      type: "cloud",
    });
  }

  if (process.env.OPENAI_API_KEY) {
    providers.push({
      provider: "openai",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      type: "cloud",
    });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      provider: "anthropic",
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4",
      type: "cloud",
    });
  }

  return providers;
}

// Check if LLM is configured
export function isLLMConfigured() {
  try {
    getLLMConfig();
    return true;
  } catch (error) {
    return false;
  }
}