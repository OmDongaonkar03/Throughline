import prisma from '../db/prisma.js';
import { generateDailyPost } from '../mastra/index.js';

/**
 * Process pending generation jobs
 * Runs periodically via cron to generate posts
 */
export async function processGenerationJobs() {
  console.log('[Job Processor] Starting job processing...');
  
  try {
    // Fetch pending jobs (limit to 50 per run to avoid overwhelming)
    const jobs = await prisma.generationJob.findMany({
      where: {
        status: 'PENDING',
      },
      take: 50,
      orderBy: {
        createdAt: 'asc', // Process oldest first
      },
    });
    
    if (jobs.length === 0) {
      console.log('[Job Processor] No pending jobs found');
      return;
    }
    
    console.log(`[Job Processor] Found ${jobs.length} pending jobs`);
    
    // Process each job
    for (const job of jobs) {
      await processJob(job);
    }
    
    console.log('[Job Processor] Finished processing jobs');
  } catch (error) {
    console.error('[Job Processor] Error processing jobs:', error);
  }
}

// Process a single job
async function processJob(job) {
  console.log(`[Job Processor] Processing job ${job.id} (${job.type}) for user ${job.userId}`);
  
  try {
    // Mark job as processing
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });
    
    // Generate post based on type
    if (job.type === 'DAILY') {
      await generateDailyPost(job.userId, job.date, prisma, false);
    } 
    /*
    else if (job.type === 'WEEKLY') {
      throw new Error('Weekly generation not yet implemented');
    } 
    else if (job.type === 'MONTHLY') {
      throw new Error('Monthly generation not yet implemented');
    }
    */
    
    // Mark job as completed
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    
    console.log(`[Job Processor] Job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`[Job Processor] Job ${job.id} failed:`, error.message);
    
    // Mark job as failed
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        error: error.message,
        completedAt: new Date(),
      },
    });
  }
}

// Retry failed jobs
export async function retryFailedJobs(maxRetries = 3) {
  console.log('[Job Processor] Retrying failed jobs...');
  
  // Get failed jobs from last 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  const failedJobs = await prisma.generationJob.findMany({
    where: {
      status: 'FAILED',
      createdAt: {
        gte: oneDayAgo,
      },
    },
    take: 10, // Limit retries
  });
  
  console.log(`[Job Processor] Found ${failedJobs.length} failed jobs to retry`);
  
  for (const job of failedJobs) {
    // Reset to pending for retry
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: 'PENDING',
        error: null,
        startedAt: null,
        completedAt: null,
      },
    });
    
    await processJob(job);
  }
}

// Cleanup old completed jobs
export async function cleanupOldJobs(daysToKeep = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await prisma.generationJob.deleteMany({
    where: {
      status: 'COMPLETED',
      completedAt: {
        lt: cutoffDate,
      },
    },
  });
  
  console.log(`[Job Processor] Cleaned up ${result.count} old jobs`);
}