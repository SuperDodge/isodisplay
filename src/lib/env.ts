import { z } from 'zod';

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
  // Database - supports both PostgreSQL and Prisma dev formats
  DATABASE_URL: z.string().refine(
    (url) => url.startsWith('postgresql://') || url.startsWith('prisma+postgres://'),
    { message: 'DATABASE_URL must be a valid PostgreSQL or Prisma connection string' }
  ),
  POSTGRES_DB: z.string().min(1).optional(),
  POSTGRES_USER: z.string().min(1).optional(),
  POSTGRES_PASSWORD: z.string().min(1).optional(),

  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  // File Storage
  FILE_STORAGE_PATH: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().transform(Number).default('104857600'),

  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),

  // Feature Flags
  ENABLE_REGISTRATION: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  ENABLE_PUBLIC_DISPLAYS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),

  // Security
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  CSRF_TOKEN_LENGTH: z.string().transform(Number).default('32'),
  SESSION_MAX_AGE: z.string().transform(Number).default('2592000'), // 30 days in seconds

  // Optional External APIs
  YOUTUBE_API_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
});

/**
 * Parse and validate environment variables
 */
const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
};

/**
 * Validated environment variables
 * Access these throughout the application
 */
export const env = parseEnv();

// Type for environment variables
export type Env = z.infer<typeof envSchema>;