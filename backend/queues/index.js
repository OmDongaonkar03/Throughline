import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { postGenerationQueue } from './post-generation.queue.js';
import { emailQueue } from './email-sending.queue.js';

// Import workers (they self-initialize)
import '../workers/post-generation.worker.js';
import '../workers/email-sending.worker.js';

/**
 * Initialize Bull Board for queue monitoring
 */
export function setupBullBoard() {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullMQAdapter(postGenerationQueue),
      new BullMQAdapter(emailQueue),
    ],
    serverAdapter,
  });

  console.log('[Bull Board] Dashboard initialized at /admin/queues');
  return serverAdapter;
}

/**
 * Export queues for use in controllers
 */
export { postGenerationQueue, emailQueue };
export {
  addPostGenerationJob,
  getJobStatus,
  getUserJobs,
} from './post-generation.queue.js';
export {
  addVerificationEmailJob,
  addPasswordResetEmailJob,
} from './email-sending.queue.js';