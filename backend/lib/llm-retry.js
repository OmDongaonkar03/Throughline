import logger from '../utils/logger.js';

export async function retryWithBackoff(
  fn,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000
) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (400) or invalid requests
      if (error.statusCode === 400 || error.message?.includes('Invalid')) {
        logger.warn('LLM request failed with client error, not retrying', {
          statusCode: error.statusCode,
          message: error.message,
          attempt: attempt + 1
        });
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      
      logger.warn('LLM request failed, retrying with backoff', {
        attempt: attempt + 1,
        maxRetries,
        delayMs: delay,
        error: error.message,
        statusCode: error.statusCode
      });
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  logger.error('LLM request failed after all retries', {
    maxRetries,
    finalError: lastError.message,
    statusCode: lastError.statusCode,
    stack: lastError.stack
  });

  throw new Error(`LLM call failed after ${maxRetries} attempts: ${lastError.message}`);
}

export function withTimeout(promise, timeoutMs = 60000) {
  const timeoutPromise = new Promise((_, reject) => {
    const timeoutId = setTimeout(() => {
      logger.error('LLM request timeout exceeded', {
        timeoutMs,
        timeoutSeconds: timeoutMs / 1000
      });
      reject(new Error('LLM request timeout'));
    }, timeoutMs);
    
    // Clear timeout if promise resolves first
    promise.finally(() => clearTimeout(timeoutId));
  });

  return Promise.race([promise, timeoutPromise]);
}