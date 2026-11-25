import { z } from 'zod';
import { PLAN_TIERS } from '../utils/plans.js';

export const contentType = z.enum(['video', 'article', 'quiz'], {
  errorMap: () => ({ message: 'Type must be one of: video, article, quiz' }),
});

export const contentPlanTier = z.enum(
  [
    PLAN_TIERS.FREE,
    PLAN_TIERS.BASICO,
    PLAN_TIERS.PRO,
    PLAN_TIERS.MASTER,
  ],
  {
    errorMap: () => ({
      message: 'Plan tier must be one of: free, basico, pro, master',
    }),
  }
);

const normalizeString = (label) =>
  z
    .string()
    .min(1, { message: `${label} is required` })
    .transform((value) => value.trim());

const optionalTag = z
  .string()
  .min(1, { message: 'Each tag must contain at least one character' })
  .transform((value) => value.trim());

const bodyOrDescription = z
  .object({
    body: z
      .string()
      .min(10, { message: 'Body must be at least 10 characters long' })
      .optional(),
    description: z
      .string()
      .min(10, { message: 'Description must be at least 10 characters long' })
      .optional(),
  })
  .refine((value) => Boolean(value.body || value.description), {
    message: 'Body or description is required',
    path: ['body'],
  })
  .transform((value) => ({
    description: (value.body || value.description || '').trim(),
  }));

export const createContent = z.object({
  title: z
    .string()
    .min(1, { message: 'Title is required' })
    .min(3, { message: 'Title must be at least 3 characters long' })
    .max(120, { message: 'Title cannot exceed 120 characters' })
    .transform((value) => value.trim()),
  type: contentType,
  plan_tier: contentPlanTier.optional(),
  ...bodyOrDescription.shape,
  url: z.string().min(1).max(2048).optional(),
  tags: z.array(optionalTag).optional(),
});

export const createContentUploadUrl = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(255).refine(
    (value) => /^(video|audio|image)\//i.test(value) || value === 'application/pdf' || value === 'application/octet-stream',
    { message: 'Only video, audio, image, and PDF uploads are allowed' }
  ),
  uploadId: z.string().uuid().optional(),
});

export const updateContent = z
  .object({
    title: z
      .string()
      .min(3, { message: 'Title must be at least 3 characters long' })
      .max(120, { message: 'Title cannot exceed 120 characters' })
      .transform((value) => value.trim())
      .optional(),
    type: contentType.optional(),
    body: z
      .string()
      .min(10, { message: 'Body must be at least 10 characters long' })
      .optional(),
    description: z
      .string()
      .min(10, { message: 'Description must be at least 10 characters long' })
      .optional(),
    tags: z.array(optionalTag).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  })
  .transform((value) => {
    if (value.body) {
      value.description = value.body;
      delete value.body;
    }
    return value;
  });

export const listContent = z.object({
  page: z.preprocess((value) => {
    if (typeof value === 'string' && value.trim() !== '') {
      return Number(value);
    }
    return value;
  }, z.number().int().min(1, { message: 'Page must be an integer greater than or equal to 1' }).default(1)),
  limit: z.preprocess((value) => {
    if (typeof value === 'string' && value.trim() !== '') {
      return Number(value);
    }
    return value;
  }, z.number().int().min(1, { message: 'Limit must be at least 1' }).max(50, { message: 'Limit cannot exceed 50' }).default(20)),
  type: contentType.optional(),
});

export const contentId = z.object({
  id: z.string().min(1, { message: 'Content id is required' }),
});