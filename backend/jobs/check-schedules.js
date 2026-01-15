import prisma from '../db/prisma.js';
import { getUserHour, getUserMinute, isTimeMatch, getToday } from '../lib/time.js';

/**
 * Check schedules and create generation jobs
 * Runs periodically to check which users need posts generated
 */
export async function checkSchedules() {
  console.log('[Schedule Checker] Checking schedules...');
  
  const currentHour = getUserHour();
  const currentMinute = getUserMinute();
  
  console.log(`[Schedule Checker] Current time: ${currentHour}:${currentMinute}`);
  
  try {
    // Check daily schedules
    await checkDailySchedules(currentHour, currentMinute);
    
    // TODO: Check weekly schedules
    // TODO: Check monthly schedules
    
    console.log('[Schedule Checker] Finished checking schedules');
  } catch (error) {
    console.error('[Schedule Checker] Error checking schedules:', error);
  }
}

// Check daily generation schedules
async function checkDailySchedules(currentHour, currentMinute) {
  // Get all users with daily generation enabled
  const schedules = await prisma.generationSchedule.findMany({
    where: {
      dailyEnabled: true,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
  
  console.log(`[Schedule Checker] Found ${schedules.length} users with daily generation enabled`);
  
  let jobsCreated = 0;
  
  for (const schedule of schedules) {
    // Check if current time matches their scheduled time (within 15-min window)
    if (isTimeMatch(schedule.dailyTime, currentHour, currentMinute, 15)) {
      const created = await createDailyJobIfNeeded(schedule.userId);
      if (created) {
        jobsCreated++;
      }
    }
  }
  
  console.log(`[Schedule Checker] Created ${jobsCreated} daily generation jobs`);
}

// Create daily generation job if needed
async function createDailyJobIfNeeded(userId) {
  const today = getToday();
  
  try {
    // Check if today's post already exists
    const existingPost = await prisma.generatedPost.findFirst({
      where: {
        userId,
        type: 'DAILY',
        date: today,
        isLatest: true,
      },
    });
    
    if (existingPost) {
      console.log(`[Schedule Checker] User ${userId} already has today's post, skipping`);
      return false;
    }
    
    // Check if there are check-ins for today
    const checkInCount = await prisma.checkIn.count({
      where: {
        userId,
        createdAt: {
          gte: today,
        },
      },
    });
    
    if (checkInCount === 0) {
      console.log(`[Schedule Checker] User ${userId} has no check-ins today, skipping`);
      return false;
    }
    
    // Check if job already exists (pending or processing)
    const existingJob = await prisma.generationJob.findFirst({
      where: {
        userId,
        type: 'DAILY',
        date: today,
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
      },
    });
    
    if (existingJob) {
      console.log(`[Schedule Checker] User ${userId} already has pending job, skipping`);
      return false;
    }
    
    // Create generation job
    await prisma.generationJob.create({
      data: {
        userId,
        type: 'DAILY',
        date: today,
        status: 'PENDING',
      },
    });
    
    console.log(`[Schedule Checker] Created daily job for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[Schedule Checker] Error creating job for user ${userId}:`, error);
    return false;
  }
}

// Create manual generation job
export async function createManualJob(userId, type, date) {
  // Check for existing pending/processing job
  const existingJob = await prisma.generationJob.findFirst({
    where: {
      userId,
      type,
      date,
      status: {
        in: ['PENDING', 'PROCESSING'],
      },
    },
  });
  
  if (existingJob) {
    throw new Error('A generation job is already in progress for this date');
  }
  
  // Create job
  const job = await prisma.generationJob.create({
    data: {
      userId,
      type,
      date,
      status: 'PENDING',
    },
  });
  
  console.log(`[Schedule Checker] Created manual ${type} job for user ${userId}`);
  
  return job;
}