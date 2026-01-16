import prisma from '../db/prisma.js';
import { 
  getUserHour, 
  getUserMinute, 
  isTimeMatch, 
  getToday,
  startOfWeek,
  startOfMonth,
} from '../lib/time.js';

/**
 * Check schedules and create generation jobs
 * Runs periodically to check which users need posts generated
 */
export async function checkSchedules() {
  console.log('[Schedule Checker] Checking schedules...');
  
  const currentHour = getUserHour();
  const currentMinute = getUserMinute();
  const currentDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  const currentDate = new Date().getDate(); // 1-31
  
  console.log(`[Schedule Checker] Current time: ${currentHour}:${currentMinute}, Day: ${currentDay}, Date: ${currentDate}`);
  
  try {
    // Check all schedule types
    await checkDailySchedules(currentHour, currentMinute);
    await checkWeeklySchedules(currentHour, currentMinute, currentDay);
    await checkMonthlySchedules(currentHour, currentMinute, currentDate);
    
    console.log('[Schedule Checker] Finished checking schedules');
  } catch (error) {
    console.error('[Schedule Checker] Error checking schedules:', error);
  }
}

/**
 * Check daily generation schedules
 */
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

/**
 * Check weekly generation schedules
 */
async function checkWeeklySchedules(currentHour, currentMinute, currentDay) {
  // Get all users with weekly generation enabled
  const schedules = await prisma.generationSchedule.findMany({
    where: {
      weeklyEnabled: true,
      weeklyDay: currentDay, // Match current day of week
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
  
  console.log(`[Schedule Checker] Found ${schedules.length} users with weekly generation enabled for day ${currentDay}`);
  
  let jobsCreated = 0;
  
  for (const schedule of schedules) {
    if (isTimeMatch(schedule.weeklyTime, currentHour, currentMinute, 15)) {
      const created = await createWeeklyJobIfNeeded(schedule.userId);
      if (created) {
        jobsCreated++;
      }
    }
  }
  
  console.log(`[Schedule Checker] Created ${jobsCreated} weekly generation jobs`);
}

/**
 * Check monthly generation schedules
 */
async function checkMonthlySchedules(currentHour, currentMinute, currentDate) {
  // Get all users with monthly generation enabled
  const schedules = await prisma.generationSchedule.findMany({
    where: {
      monthlyEnabled: true,
      monthlyDay: currentDate, // Match current day of month
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
  
  console.log(`[Schedule Checker] Found ${schedules.length} users with monthly generation enabled for day ${currentDate}`);
  
  let jobsCreated = 0;
  
  for (const schedule of schedules) {
    if (isTimeMatch(schedule.monthlyTime, currentHour, currentMinute, 15)) {
      const created = await createMonthlyJobIfNeeded(schedule.userId);
      if (created) {
        jobsCreated++;
      }
    }
  }
  
  console.log(`[Schedule Checker] Created ${jobsCreated} monthly generation jobs`);
}

/**
 * Create daily generation job if needed
 */
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
    console.error(`[Schedule Checker] Error creating daily job for user ${userId}:`, error);
    return false;
  }
}

/**
 * Create weekly generation job if needed
 */
async function createWeeklyJobIfNeeded(userId) {
  const weekStart = startOfWeek(new Date());
  
  try {
    // Check if this week's post already exists
    const existingPost = await prisma.generatedPost.findFirst({
      where: {
        userId,
        type: 'WEEKLY',
        date: weekStart,
        isLatest: true,
      },
    });
    
    if (existingPost) {
      console.log(`[Schedule Checker] User ${userId} already has this week's post, skipping`);
      return false;
    }
    
    // Check if there are daily posts for this week (need at least 3)
    const dailyPostCount = await prisma.generatedPost.count({
      where: {
        userId,
        type: 'DAILY',
        date: {
          gte: weekStart,
        },
        isLatest: true,
      },
    });
    
    if (dailyPostCount < 3) {
      console.log(`[Schedule Checker] User ${userId} has only ${dailyPostCount} daily posts this week (need 3+), skipping`);
      return false;
    }
    
    // Check if job already exists
    const existingJob = await prisma.generationJob.findFirst({
      where: {
        userId,
        type: 'WEEKLY',
        date: weekStart,
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
      },
    });
    
    if (existingJob) {
      console.log(`[Schedule Checker] User ${userId} already has pending weekly job, skipping`);
      return false;
    }
    
    // Create generation job
    await prisma.generationJob.create({
      data: {
        userId,
        type: 'WEEKLY',
        date: weekStart,
        status: 'PENDING',
      },
    });
    
    console.log(`[Schedule Checker] Created weekly job for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[Schedule Checker] Error creating weekly job for user ${userId}:`, error);
    return false;
  }
}

/**
 * Create monthly generation job if needed
 */
async function createMonthlyJobIfNeeded(userId) {
  const monthStart = startOfMonth(new Date());
  
  try {
    // Check if this month's post already exists
    const existingPost = await prisma.generatedPost.findFirst({
      where: {
        userId,
        type: 'MONTHLY',
        date: monthStart,
        isLatest: true,
      },
    });
    
    if (existingPost) {
      console.log(`[Schedule Checker] User ${userId} already has this month's post, skipping`);
      return false;
    }
    
    // Check if there are weekly posts for this month (need at least 3)
    const weeklyPostCount = await prisma.generatedPost.count({
      where: {
        userId,
        type: 'WEEKLY',
        date: {
          gte: monthStart,
        },
        isLatest: true,
      },
    });
    
    if (weeklyPostCount < 3) {
      console.log(`[Schedule Checker] User ${userId} has only ${weeklyPostCount} weekly posts this month (need 3+), skipping`);
      return false;
    }
    
    // Check if job already exists
    const existingJob = await prisma.generationJob.findFirst({
      where: {
        userId,
        type: 'MONTHLY',
        date: monthStart,
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
      },
    });
    
    if (existingJob) {
      console.log(`[Schedule Checker] User ${userId} already has pending monthly job, skipping`);
      return false;
    }
    
    // Create generation job
    await prisma.generationJob.create({
      data: {
        userId,
        type: 'MONTHLY',
        date: monthStart,
        status: 'PENDING',
      },
    });
    
    console.log(`[Schedule Checker] Created monthly job for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[Schedule Checker] Error creating monthly job for user ${userId}:`, error);
    return false;
  }
}

/**
 * Create manual generation job
 * Used when user manually triggers generation
 */
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