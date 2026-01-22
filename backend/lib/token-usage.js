/**
 * Normalize token usage from different LLM providers
 * 
 * Different providers return usage in different formats:
 * - OpenAI: { promptTokens, completionTokens, totalTokens }
 * - Google (Gemini): { totalTokens } only
 * - Anthropic: { input_tokens, output_tokens }
 * 
 * @param {Object} usage - Raw usage object from LLM provider
 * @returns {Object} Normalized usage with promptTokens, completionTokens, totalTokens
 */
function normalizeUsage(usage) {
  if (!usage) {
    console.warn('No usage data provided, using defaults');
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
  }

  // OpenAI format (standard)
  if (usage.promptTokens !== undefined && usage.completionTokens !== undefined) {
    return {
      promptTokens: usage.promptTokens || 0,
      completionTokens: usage.completionTokens || 0,
      totalTokens: usage.totalTokens || (usage.promptTokens + usage.completionTokens),
    };
  }

  // Anthropic format
  if (usage.input_tokens !== undefined && usage.output_tokens !== undefined) {
    return {
      promptTokens: usage.input_tokens || 0,
      completionTokens: usage.output_tokens || 0,
      totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
    };
  }

  // Google Gemini format (only provides totalTokens)
  if (usage.totalTokens !== undefined) {
    // Estimate split: typically 60% prompt, 40% completion
    const total = usage.totalTokens || 0;
    const estimatedPrompt = Math.round(total * 0.6);
    const estimatedCompletion = total - estimatedPrompt;
    
    return {
      promptTokens: estimatedPrompt,
      completionTokens: estimatedCompletion,
      totalTokens: total,
    };
  }

  // Fallback: try to extract any token counts
  console.warn('Unknown usage format, attempting to extract data:', usage);
  
  const total = usage.total || usage.totalTokens || 0;
  const prompt = usage.prompt || usage.promptTokens || usage.input || usage.input_tokens || 0;
  const completion = usage.completion || usage.completionTokens || usage.output || usage.output_tokens || 0;

  if (total > 0 || prompt > 0 || completion > 0) {
    return {
      promptTokens: prompt || (total > 0 ? Math.round(total * 0.6) : 0),
      completionTokens: completion || (total > 0 ? Math.round(total * 0.4) : 0),
      totalTokens: total || (prompt + completion),
    };
  }

  // Last resort: return zeros
  console.warn('Could not extract token usage, using zeros');
  return {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
}

/**
 * Save token usage for a generated post (daily/weekly/monthly)
 * 
 * @param {Object} prisma - Prisma client instance
 * @param {Object} params - Token usage parameters
 * @param {string} params.generatedPostId - ID of the generated post
 * @param {Object} params.usage - Token usage object from agent response
 * @param {number} params.usage.promptTokens - Input tokens
 * @param {number} params.usage.completionTokens - Output tokens
 * @param {number} params.usage.totalTokens - Total tokens
 * @param {string} params.modelUsed - Model identifier (e.g., "openai/gpt-4o-mini")
 * @param {string} params.agentType - Agent type: "daily-generator", "weekly-generator", "monthly-generator", "tone-extractor"
 * @param {number} [params.estimatedCost] - Optional estimated cost in USD
 */
export async function saveGeneratedPostTokenUsage(prisma, params) {
  const {
    generatedPostId,
    usage,
    modelUsed,
    agentType,
    estimatedCost = null,
  } = params;

  try {
    // Normalize usage object to handle different provider formats
    const normalizedUsage = normalizeUsage(usage);

    await prisma.tokenUsage.create({
      data: {
        generatedPostId,
        promptTokens: normalizedUsage.promptTokens,
        completionTokens: normalizedUsage.completionTokens,
        totalTokens: normalizedUsage.totalTokens,
        modelUsed,
        agentType,
        estimatedCost,
      },
    });

    console.log(`✅ Token usage saved for ${agentType}:`, {
      postId: generatedPostId,
      total: normalizedUsage.totalTokens,
    });
  } catch (error) {
    // Log error but don't throw - user experience should not be disrupted
    console.error(`⚠️ Failed to save token usage for ${agentType}:`, {
      error: error.message,
      postId: generatedPostId,
    });
  }
}

/**
 * Save token usage for a platform post
 * 
 * @param {Object} prisma - Prisma client instance
 * @param {Object} params - Token usage parameters
 * @param {string} params.platformPostId - ID of the platform post
 * @param {Object} params.usage - Token usage object from agent response
 * @param {number} params.usage.promptTokens - Input tokens
 * @param {number} params.usage.completionTokens - Output tokens
 * @param {number} params.usage.totalTokens - Total tokens
 * @param {string} params.modelUsed - Model identifier
 * @param {string} params.platform - Platform name: "X", "LINKEDIN", "REDDIT"
 * @param {number} [params.estimatedCost] - Optional estimated cost in USD
 */
export async function savePlatformPostTokenUsage(prisma, params) {
  const {
    platformPostId,
    usage,
    modelUsed,
    platform,
    estimatedCost = null,
  } = params;

  try {
    // Normalize usage object to handle different provider formats
    const normalizedUsage = normalizeUsage(usage);

    await prisma.tokenUsage.create({
      data: {
        platformPostId,
        promptTokens: normalizedUsage.promptTokens,
        completionTokens: normalizedUsage.completionTokens,
        totalTokens: normalizedUsage.totalTokens,
        modelUsed,
        agentType: "platform-adapter",
        platform,
        estimatedCost,
      },
    });

    console.log(`✅ Token usage saved for platform-adapter (${platform}):`, {
      platformPostId,
      total: normalizedUsage.totalTokens,
    });
  } catch (error) {
    // Log error but don't throw - user experience should not be disrupted
    console.error(`⚠️ Failed to save token usage for platform ${platform}:`, {
      error: error.message,
      platformPostId,
    });
  }
}

/**
 * Calculate estimated cost based on token usage
 * 
 * @param {Object} usage - Token usage object
 * @param {string} modelUsed - Model identifier
 * @returns {number|null} Estimated cost in USD or null if pricing unknown
 */
export function calculateEstimatedCost(usage, modelUsed) {
  // Normalize usage first
  const normalizedUsage = normalizeUsage(usage);

  // Pricing per 1M tokens (as of Jan 2025)
  const pricing = {
    // OpenAI
    "openai/gpt-4o": { input: 2.50, output: 10.00 },
    "openai/gpt-4o-mini": { input: 0.15, output: 0.60 },
    "openai/gpt-4-turbo": { input: 10.00, output: 30.00 },
    "openai/gpt-3.5-turbo": { input: 0.50, output: 1.50 },
    
    // Anthropic
    "anthropic/claude-sonnet-4": { input: 3.00, output: 15.00 },
    "anthropic/claude-opus-4": { input: 15.00, output: 75.00 },
    "anthropic/claude-haiku-4": { input: 0.25, output: 1.25 },
    
    // Google Gemini
    "google/gemini-2.0-flash-exp": { input: 0.00, output: 0.00 }, // Free tier
    "google/gemini-2.5-flash": { input: 0.075, output: 0.30 },
    "google/gemini-1.5-flash": { input: 0.075, output: 0.30 },
    "google/gemini-1.5-pro": { input: 1.25, output: 5.00 },
    "google/gemini-pro": { input: 0.50, output: 1.50 },
  };

  const model = pricing[modelUsed];
  if (!model) {
    console.warn(`Unknown model pricing: ${modelUsed}, cost estimation skipped`);
    return null;
  }

  const inputCost = (normalizedUsage.promptTokens / 1_000_000) * model.input;
  const outputCost = (normalizedUsage.completionTokens / 1_000_000) * model.output;

  return inputCost + outputCost;
}

/**
 * Get total token usage for a generated post (including all platform adaptations)
 * 
 * @param {Object} prisma - Prisma client instance
 * @param {string} generatedPostId - ID of the generated post
 * @returns {Promise<Object>} Aggregated token usage
 */
export async function getGeneratedPostTotalUsage(prisma, generatedPostId) {
  try {
    // Get base post token usage
    const baseUsage = await prisma.tokenUsage.findMany({
      where: { generatedPostId },
    });

    // Get platform post token usage
    const platformPosts = await prisma.platformPost.findMany({
      where: { postId: generatedPostId },
      include: { tokenUsage: true },
    });

    const platformUsage = platformPosts.flatMap((pp) => pp.tokenUsage);

    // Combine all usage
    const allUsage = [...baseUsage, ...platformUsage];

    const totals = allUsage.reduce(
      (acc, usage) => ({
        promptTokens: acc.promptTokens + usage.promptTokens,
        completionTokens: acc.completionTokens + usage.completionTokens,
        totalTokens: acc.totalTokens + usage.totalTokens,
        estimatedCost: acc.estimatedCost + (usage.estimatedCost || 0),
      }),
      {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
      }
    );

    return {
      ...totals,
      breakdown: {
        base: baseUsage[0] || null,
        platforms: platformUsage,
      },
    };
  } catch (error) {
    console.error("Failed to get token usage:", error);
    return null;
  }
}

/**
 * Get user's total token usage for a time period
 * 
 * @param {Object} prisma - Prisma client instance
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Aggregated token usage by agent type
 */
export async function getUserTokenUsage(prisma, userId, startDate, endDate) {
  try {
    // Get all token usage for user's posts in date range
    const usage = await prisma.tokenUsage.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          {
            generatedPost: {
              userId,
            },
          },
          {
            platformPost: {
              post: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        generatedPost: {
          select: { type: true },
        },
      },
    });

    // Group by agent type
    const byAgentType = usage.reduce((acc, u) => {
      if (!acc[u.agentType]) {
        acc[u.agentType] = {
          count: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCost: 0,
        };
      }

      acc[u.agentType].count++;
      acc[u.agentType].promptTokens += u.promptTokens;
      acc[u.agentType].completionTokens += u.completionTokens;
      acc[u.agentType].totalTokens += u.totalTokens;
      acc[u.agentType].estimatedCost += u.estimatedCost || 0;

      return acc;
    }, {});

    // Calculate totals
    const totals = {
      count: usage.length,
      promptTokens: usage.reduce((sum, u) => sum + u.promptTokens, 0),
      completionTokens: usage.reduce((sum, u) => sum + u.completionTokens, 0),
      totalTokens: usage.reduce((sum, u) => sum + u.totalTokens, 0),
      estimatedCost: usage.reduce((sum, u) => sum + (u.estimatedCost || 0), 0),
    };

    return {
      totals,
      byAgentType,
      dateRange: { startDate, endDate },
    };
  } catch (error) {
    console.error("Failed to get user token usage:", error);
    return null;
  }
}