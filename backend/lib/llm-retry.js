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
      
      if (error.statusCode === 400 || error.message?.includes('Invalid')) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      
      console.log(`[LLM Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms...`);
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`LLM call failed after ${maxRetries} attempts: ${lastError.message}`);
}

export function withTimeout(promise, timeoutMs = 60000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('LLM request timeout')), timeoutMs)
    ),
  ]);
}