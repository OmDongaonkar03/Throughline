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
  
  // Filter schedules that match current time window
  const matchingSchedules = schedules.filter(schedule => 
    isTimeMatch(schedule.dailyTime, currentHour, currentMinute, 15)
  );
  
  if (matchingSchedules.length === 0) {
    console.log('[Schedule Checker] No daily schedules match current time');
    return;
  }
  
  console.log(`[Schedule Checker] ${matchingSchedules.length} schedules match current time`);
  
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
      console.log(`[Schedule Checker] User ${userId} already has today's post, skipping`);
      return false;
    }
    
    if (!usersWithCheckIns.has(userId)) {
      console.log(`[Schedule Checker] User ${userId} has no check-ins today, skipping`);
      return false;
    }
    
    if (usersWithJobs.has(userId)) {
      console.log(`[Schedule Checker] User ${userId} already has pending job, skipping`);
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
    
    console.log(`[Schedule Checker] Created ${usersNeedingJobs.length} daily generation jobs`);
  } else {
    console.log('[Schedule Checker] No daily jobs needed');
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
  
  console.log(`[Schedule Checker] Found ${schedules.length} users with weekly generation enabled for day ${currentDay}`);
  
  // Filter schedules that match current time window
  const matchingSchedules = schedules.filter(schedule =>
    isTimeMatch(schedule.weeklyTime, currentHour, currentMinute, 15)
  );
  
  if (matchingSchedules.length === 0) {
    console.log('[Schedule Checker] No weekly schedules match current time');
    return;
  }
  
  console.log(`[Schedule Checker] ${matchingSchedules.length} schedules match current time`);
  
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
      console.log(`[Schedule Checker] User ${userId} already has this week's post, skipping`);
      return false;
    }
    
    if (!usersWithEnoughDailyPosts.has(userId)) {
      const count = dailyPostCounts.find(c => c.userId === userId)?._count.userId || 0;
      console.log(`[Schedule Checker] User ${userId} has only ${count} daily posts this week (need 3+), skipping`);
      return false;
    }
    
    if (usersWithJobs.has(userId)) {
      console.log(`[Schedule Checker] User ${userId} already has pending weekly job, skipping`);
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
    
    console.log(`[Schedule Checker] Created ${usersNeedingJobs.length} weekly generation jobs`);
  } else {
    console.log('[Schedule Checker] No weekly jobs needed');
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
  
  console.log(`[Schedule Checker] Found ${schedules.length} users with monthly generation enabled for day ${currentDate}`);
  
  // Filter schedules that match current time window
  const matchingSchedules = schedules.filter(schedule =>
    isTimeMatch(schedule.monthlyTime, currentHour, currentMinute, 15)
  );
  
  if (matchingSchedules.length === 0) {
    console.log('[Schedule Checker] No monthly schedules match current time');
    return;
  }
  
  console.log(`[Schedule Checker] ${matchingSchedules.length} schedules match current time`);
  
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
      console.log(`[Schedule Checker] User ${userId} already has this month's post, skipping`);
      return false;
    }
    
    if (!usersWithEnoughWeeklyPosts.has(userId)) {
      const count = weeklyPostCounts.find(c => c.userId === userId)?._count.userId || 0;
      console.log(`[Schedule Checker] User ${userId} has only ${count} weekly posts this month (need 3+), skipping`);
      return false;
    }
    
    if (usersWithJobs.has(userId)) {
      console.log(`[Schedule Checker] User ${userId} already has pending monthly job, skipping`);
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
    
    console.log(`[Schedule Checker] Created ${usersNeedingJobs.length} monthly generation jobs`);
  } else {
    console.log('[Schedule Checker] No monthly jobs needed');
  }
}