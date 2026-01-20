import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';

/**
 * Zod validation middleware with proper error handling
 * @param {z.ZodSchema} schema - Zod schema to validate against
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        
        throw new ValidationError(
          `Validation failed: ${errors.map(e => e.message).join(', ')}`
        );
      }
      
      next(error);
    }
  };
};

// Validation Schemas
export const schemas = {
  // Auth schemas
  signup: z.object({
    body: z.object({
      name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name must be less than 100 characters')
        .trim(),
      email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
      password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be less than 100 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
      password: z.string().min(1, 'Password is required'),
    }),
  }),

  // Check-in schemas
  createCheckIn: z.object({
    body: z.object({
      content: z.string()
        .min(1, 'Content is required')
        .max(1500, 'Content must be less than 1500 characters')
        .trim(),
    }),
  }),

  getCheckIns: z.object({
    query: z.object({
      date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    }),
  }),

  getCheckInStats: z.object({
    query: z.object({
      year: z.string()
        .regex(/^\d{4}$/, 'Year must be a 4-digit number')
        .optional(),
    }),
  }),

  // Generation schemas
  generateDaily: z.object({
    body: z.object({
      date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .optional(),
    }),
  }),

  generateWeekly: z.object({
    body: z.object({
      date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .optional(),
    }),
  }),

  generateMonthly: z.object({
    body: z.object({
      date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .optional(),
    }),
  }),

  getDaily: z.object({
    params: z.object({
      date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    }),
  }),

  getWeekly: z.object({
    params: z.object({
      date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    }),
  }),

  getMonthly: z.object({
    params: z.object({
      date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    }),
  }),

  getAllPosts: z.object({
    query: z.object({
      type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
      limit: z.string()
        .regex(/^\d+$/, 'Limit must be a positive number')
        .optional()
        .default('30'),
      offset: z.string()
        .regex(/^\d+$/, 'Offset must be a positive number')
        .optional()
        .default('0'),
    }),
  }),

  // Profile schemas
  updateProfile: z.object({
    body: z.object({
      name: z.string()
        .min(1, 'Name cannot be empty')
        .max(100, 'Name must be less than 100 characters')
        .trim()
        .optional(),
      bio: z.string()
        .max(500, 'Bio must be less than 500 characters')
        .trim()
        .optional(),
      email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim()
        .optional(),
    }),
  }),

  // Sample post schemas
  createSamplePost: z.object({
    body: z.object({
      content: z.string()
        .min(1, 'Content is required')
        .trim(),
    }),
  }),

  updateSamplePost: z.object({
    body: z.object({
      content: z.string()
        .min(1, 'Content is required')
        .trim(),
    }),
  }),

  // Platform settings schemas
  updatePlatformSettings: z.object({
    body: z.object({
      xEnabled: z.boolean().optional(),
      linkedinEnabled: z.boolean().optional(),
      redditEnabled: z.boolean().optional(),
    }),
  }),

  // Schedule settings schemas
  updateScheduleSettings: z.object({
    body: z.object({
      dailyEnabled: z.boolean().optional(),
      dailyTime: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format')
        .optional(),
      weeklyEnabled: z.boolean().optional(),
      weeklyDay: z.number()
        .int()
        .min(0, 'Day must be between 0-6')
        .max(6, 'Day must be between 0-6')
        .optional(),
      weeklyTime: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format')
        .optional(),
      monthlyEnabled: z.boolean().optional(),
      monthlyDay: z.number()
        .int()
        .min(1, 'Day must be between 1-28')
        .max(28, 'Day must be between 1-28')
        .optional(),
      monthlyTime: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format')
        .optional(),
    }),
  }),

  // Notification settings schemas
  updateNotificationSettings: z.object({
    body: z.object({
      emailDigest: z.boolean().optional(),
      postReminders: z.boolean().optional(),
      weeklyReport: z.boolean().optional(),
    }),
  }),

  // Tone profile schemas
  updateToneProfile: z.object({
    body: z.object({
      customVoice: z.string().optional(),
      customSentenceStyle: z.string().optional(),
      customEmotionalRange: z.string().optional(),
      writingGoals: z.array(z.string()).optional(),
      targetAudience: z.array(z.string()).optional(),
      contentPurpose: z.string().optional(),
      toneCharacteristics: z.record(z.number().int().min(1).max(10)).optional(),
      avoidTopics: z.array(z.string()).optional(),
      preferredLength: z.enum(['concise', 'moderate', 'detailed']).optional(),
      includeEmojis: z.boolean().optional(),
      includeHashtags: z.boolean().optional(),
    }),
  }),

  // Feedback schemas
  submitFeedback: z.object({
    body: z.object({
      postId: z.string().min(1, 'Post ID is required'),
      rating: z.number()
        .int()
        .min(1, 'Rating must be 1 or 2')
        .max(2, 'Rating must be 1 or 2'),
      issue: z.string().nullable().optional(),
    }),
  }),

  // Platform post schemas
  updateBasePost: z.object({
    body: z.object({
      content: z.string()
        .min(1, 'Content is required')
        .trim(),
    }),
  }),

  updatePlatformPost: z.object({
    body: z.object({
      content: z.string()
        .min(1, 'Content is required')
        .trim(),
    }),
  }),

  getPlatformPostsByDate: z.object({
    params: z.object({
      date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    }),
    query: z.object({
      type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
    }),
  }),
};