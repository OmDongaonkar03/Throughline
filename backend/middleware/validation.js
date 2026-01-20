import { z } from 'zod';

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
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
  };
};

export const schemas = {
  signup: z.object({
    body: z.object({
      name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
      email: z.string().email('Invalid email format'),
      password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password too long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required'),
    }),
  }),

  createCheckIn: z.object({
    body: z.object({
      content: z.string()
        .min(1, 'Content is required')
        .max(1500, 'Content exceeds maximum length of 1500 characters')
        .trim(),
    }),
  }),

  getCheckIns: z.object({
    query: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
    }),
  }),

  getCheckInStats: z.object({
    query: z.object({
      year: z.string().regex(/^\d{4}$/, 'Invalid year format').optional(),
    }),
  }),

  generateDaily: z.object({
    body: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
    }),
  }),

  generateWeekly: z.object({
    body: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
    }),
  }),

  generateMonthly: z.object({
    body: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
    }),
  }),

  getDaily: z.object({
    params: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
    }),
  }),

  getWeekly: z.object({
    params: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
    }),
  }),

  getMonthly: z.object({
    params: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
    }),
  }),

  getAllPosts: z.object({
    query: z.object({
      type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
      limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
      offset: z.string().regex(/^\d+$/, 'Offset must be a number').optional(),
    }),
  }),

  updateProfile: z.object({
    body: z.object({
      name: z.string().min(1).max(100).optional(),
      bio: z.string().max(500).optional(),
      email: z.string().email('Invalid email format').optional(),
    }),
  }),

  createSamplePost: z.object({
    body: z.object({
      content: z.string().min(1, 'Content is required').trim(),
    }),
  }),

  updateSamplePost: z.object({
    body: z.object({
      content: z.string().min(1, 'Content is required').trim(),
    }),
  }),

  updatePlatformSettings: z.object({
    body: z.object({
      xEnabled: z.boolean().optional(),
      linkedinEnabled: z.boolean().optional(),
      redditEnabled: z.boolean().optional(),
    }),
  }),

  updateScheduleSettings: z.object({
    body: z.object({
      dailyEnabled: z.boolean().optional(),
      dailyTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:MM').optional(),
      weeklyEnabled: z.boolean().optional(),
      weeklyDay: z.number().int().min(0).max(6).optional(),
      weeklyTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:MM').optional(),
      monthlyEnabled: z.boolean().optional(),
      monthlyDay: z.number().int().min(1).max(28).optional(),
      monthlyTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:MM').optional(),
    }),
  }),

  updateNotificationSettings: z.object({
    body: z.object({
      emailDigest: z.boolean().optional(),
      postReminders: z.boolean().optional(),
      weeklyReport: z.boolean().optional(),
    }),
  }),

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

  submitFeedback: z.object({
    body: z.object({
      postId: z.string().min(1, 'Post ID is required'),
      rating: z.number().int().min(1).max(2, 'Rating must be 1 or 2'),
      issue: z.string().optional(),
    }),
  }),

  updateBasePost: z.object({
    body: z.object({
      content: z.string().min(1, 'Content is required').trim(),
    }),
  }),

  updatePlatformPost: z.object({
    body: z.object({
      content: z.string().min(1, 'Content is required').trim(),
    }),
  }),

  getPlatformPostsByDate: z.object({
    params: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
    }),
    query: z.object({
      type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
    }),
  }),
};