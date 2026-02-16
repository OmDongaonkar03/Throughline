import prisma from '../db/prisma.js';
import logger from '../utils/logger.js';
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
  logger.info('Schedule checker started');
  
  const currentHour = getUserHour();
  const currentMinute = getUserMinute();
  const currentDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  const currentDate = new Date().getDate(); // 1-31
  
  logger.debug('Schedule checker time context', {
    hour: currentHour,
    minute: currentMinute,
    dayOfWeek: currentDay,
    dayOfMonth: currentDate
  });
  
  try {
    // Check all schedule types
    await checkDailySchedules(currentHour, currentMinute);
    await checkWeeklySchedules(currentHour, currentMinute, currentDay);
    await checkMonthlySchedules(currentHour, currentMinute, currentDate);
    
    logger.info('Schedule checker completed successfully');
  } catch (error) {
    logger.error('Schedule checker failed', {
      error: error.message,
      stack: error.stack
    });
    throw error; // Re-throw to let caller handle
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
  
  logger.debug('Daily schedules check', {
    totalEnabled: schedules.length
  });
  
  // Filter schedules that match current time window
  const matchingSchedules = schedules.filter(schedule => 
    isTimeMatch(schedule.dailyTime, currentHour, currentMinute, 15)
  );
  
  if (matchingSchedules.length === 0) {
    logger.debug('No daily schedules match current time');
    return;
  }
  
  logger.info('Daily schedules matched', {
    matchingCount: matchingSchedules.length
  });
  
  const userIds = matchingSchedules.map(s => s.userId);
  const today = getToday();
  
  // Batch query: Check which users already have today's post
  const existingPosts = await prisma.generatedPost.findMany({
    where: {
      userId: { in: userIds },
      type: 'DAILY',
      date: today,
      isLatest: true,
    },
    select: { userId: true },
  });
  
  const usersWithPosts = new Set(existingPosts.map(p => p.userId));
  
  // Batch query: Check which users have check-ins today
  const checkInCounts = await prisma.checkIn.groupBy({
    by: ['userId'],
    where: {
      userId: { in: userIds },
      createdAt: { gte: today },
    },
    _count: { userId: true },
  });
  
  const usersWithCheckIns = new Set(
    checkInCounts.filter(c => c._count.userId > 0).map(c => c.userId)
  );
  
  // Batch query: Check for existing pending/processing jobs
  const existingJobs = await prisma.generationJob.findMany({
    where: {
      userId: { in: userIds },
      type: 'DAILY',
      date: today,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
    select: { userId: true },
  });
  
  const usersWithJobs = new Set(existingJobs.map(j => j.userId));
  
  // Filter users who need jobs created
  const usersNeedingJobs = matchingSchedules.filter(schedule => {
    const userId = schedule.userId;
    
    if (usersWithPosts.has(userId)) {
      logger.debug('User already has daily post', { userId, reason: 'post_exists' });
      return false;
    }
    
    if (!usersWithCheckIns.has(userId)) {
      logger.debug('User has no check-ins today', { userId, reason: 'no_checkins' });
      return false;
    }
    
    if (usersWithJobs.has(userId)) {
      logger.debug('User already has pending daily job', { userId, reason: 'job_exists' });
      return false;
    }
    
    return true;
  });
  
  // Batch create jobs
  if (usersNeedingJobs.length > 0) {
    await prisma.generationJob.createMany({
      data: usersNeedingJobs.map(schedule => ({
        userId: schedule.userId,
        type: 'DAILY',
        date: today,
        status: 'PENDING',
      })),
    });
    
    logger.info('Daily generation jobs created', {
      jobsCreated: usersNeedingJobs.length,
      date: today.toISOString().split('T')[0]
    });
  } else {
    logger.debug('No daily jobs needed');
  }
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
  
  logger.debug('Weekly schedules check', {
    totalEnabled: schedules.length,
    dayOfWeek: currentDay
  });
  
  // Filter schedules that match current time window
  const matchingSchedules = schedules.filter(schedule =>
    isTimeMatch(schedule.weeklyTime, currentHour, currentMinute, 15)
  );
  
  if (matchingSchedules.length === 0) {
    logger.debug('No weekly schedules match current time');
    return;
  }
  
  logger.info('Weekly schedules matched', {
    matchingCount: matchingSchedules.length
  });
  
  const userIds = matchingSchedules.map(s => s.userId);
  const weekStart = startOfWeek(new Date());
  
  // Batch query: Check which users already have this week's post
  const existingPosts = await prisma.generatedPost.findMany({
    where: {
      userId: { in: userIds },
      type: 'WEEKLY',
      date: weekStart,
      isLatest: true,
    },
    select: { userId: true },
  });
  
  const usersWithPosts = new Set(existingPosts.map(p => p.userId));
  
  // Batch query: Check which users have enough daily posts this week
  const dailyPostCounts = await prisma.generatedPost.groupBy({
    by: ['userId'],
    where: {
      userId: { in: userIds },
      type: 'DAILY',
      date: { gte: weekStart },
      isLatest: true,
    },
    _count: { userId: true },
  });
  
  const usersWithEnoughDailyPosts = new Set(
    dailyPostCounts.filter(c => c._count.userId >= 3).map(c => c.userId)
  );
  
  // Batch query: Check for existing pending/processing jobs
  const existingJobs = await prisma.generationJob.findMany({
    where: {
      userId: { in: userIds },
      type: 'WEEKLY',
      date: weekStart,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
    select: { userId: true },
  });
  
  const usersWithJobs = new Set(existingJobs.map(j => j.userId));
  
  // Filter users who need jobs created
  const usersNeedingJobs = matchingSchedules.filter(schedule => {
    const userId = schedule.userId;
    
    if (usersWithPosts.has(userId)) {
      logger.debug('User already has weekly post', { userId, reason: 'post_exists' });
      return false;
    }
    
    if (!usersWithEnoughDailyPosts.has(userId)) {
      const count = dailyPostCounts.find(c => c.userId === userId)?._count.userId || 0;
      logger.debug('User has insufficient daily posts', {
        userId,
        reason: 'insufficient_daily_posts',
        dailyPostCount: count,
        required: 3
      });
      return false;
    }
    
    if (usersWithJobs.has(userId)) {
      logger.debug('User already has pending weekly job', { userId, reason: 'job_exists' });
      return false;
    }
    
    return true;
  });
  
  // Batch create jobs
  if (usersNeedingJobs.length > 0) {
    await prisma.generationJob.createMany({
      data: usersNeedingJobs.map(schedule => ({
        userId: schedule.userId,
        type: 'WEEKLY',
        date: weekStart,
        status: 'PENDING',
      })),
    });
    
    logger.info('Weekly generation jobs created', {
      jobsCreated: usersNeedingJobs.length,
      weekStart: weekStart.toISOString().split('T')[0]
    });
  } else {
    logger.debug('No weekly jobs needed');
  }
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
  
  logger.debug('Monthly schedules check', {
    totalEnabled: schedules.length,
    dayOfMonth: currentDate
  });
  
  // Filter schedules that match current time window
  const matchingSchedules = schedules.filter(schedule =>
    isTimeMatch(schedule.monthlyTime, currentHour, currentMinute, 15)
  );
  
  if (matchingSchedules.length === 0) {
    logger.debug('No monthly schedules match current time');
    return;
  }
  
  logger.info('Monthly schedules matched', {
    matchingCount: matchingSchedules.length
  });
  
  const userIds = matchingSchedules.map(s => s.userId);
  const monthStart = startOfMonth(new Date());
  
  // Batch query: Check which users already have this month's post
  const existingPosts = await prisma.generatedPost.findMany({
    where: {
      userId: { in: userIds },
      type: 'MONTHLY',
      date: monthStart,
      isLatest: true,
    },
    select: { userId: true },
  });
  
  const usersWithPosts = new Set(existingPosts.map(p => p.userId));
  
  // Batch query: Check which users have enough weekly posts this month
  const weeklyPostCounts = await prisma.generatedPost.groupBy({
    by: ['userId'],
    where: {
      userId: { in: userIds },
      type: 'WEEKLY',
      date: { gte: monthStart },
      isLatest: true,
    },
    _count: { userId: true },
  });
  
  const usersWithEnoughWeeklyPosts = new Set(
    weeklyPostCounts.filter(c => c._count.userId >= 3).map(c => c.userId)
  );
  
  // Batch query: Check for existing pending/processing jobs
  const existingJobs = await prisma.generationJob.findMany({
    where: {
      userId: { in: userIds },
      type: 'MONTHLY',
      date: monthStart,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
    select: { userId: true },
  });
  
  const usersWithJobs = new Set(existingJobs.map(j => j.userId));
  
  // Filter users who need jobs created
  const usersNeedingJobs = matchingSchedules.filter(schedule => {
    const userId = schedule.userId;
    
    if (usersWithPosts.has(userId)) {
      logger.debug('User already has monthly post', { userId, reason: 'post_exists' });
      return false;
    }
    
    if (!usersWithEnoughWeeklyPosts.has(userId)) {
      const count = weeklyPostCounts.find(c => c.userId === userId)?._count.userId || 0;
      logger.debug('User has insufficient weekly posts', {
        userId,
        reason: 'insufficient_weekly_posts',
        weeklyPostCount: count,
        required: 3
      });
      return false;
    }
    
    if (usersWithJobs.has(userId)) {
      logger.debug('User already has pending monthly job', { userId, reason: 'job_exists' });
      return false;
    }
    
    return true;
  });
  
  // Batch create jobs
  if (usersNeedingJobs.length > 0) {
    await prisma.generationJob.createMany({
      data: usersNeedingJobs.map(schedule => ({
        userId: schedule.userId,
        type: 'MONTHLY',
        date: monthStart,
        status: 'PENDING',
      })),
    });
    
    logger.info('Monthly generation jobs created', {
      jobsCreated: usersNeedingJobs.length,
      monthStart: monthStart.toISOString().split('T')[0]
    });
  } else {
    logger.debug('No monthly jobs needed');
  }
}