/**
 * API Validation Utilities
 * 
 * Generic validation functions and error formatting
 * for use across all API routes
 */

import { NextResponse } from 'next/server';
import { ZodError, ZodIssue } from 'zod';

// ============================================
// Error Formatting
// ============================================

/**
 * Format Zod validation errors for API responses
 */
export function formatZodError(error: ZodError): {
  message: string;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
} {
  const errors = error.issues.map((issue: ZodIssue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  const message = errors.length === 1 
    ? errors[0].message 
    : `Validation failed: ${errors.length} errors found`;

  return {
    message,
    errors,
  };
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(error: ZodError) {
  const formatted = formatZodError(error);
  
  return NextResponse.json(
    {
      error: 'Validation failed',
      message: formatted.message,
      details: formatted.errors,
      code: 'VALIDATION_ERROR',
    },
    { status: 400 }
  );
}

// ============================================
// Request Validation
// ============================================

/**
 * Generic request body validator
 * @param schema Zod schema to validate against
 * @param data Request body data
 * @returns Validated data or validation error response
 */
export async function validateRequestBody<T>(
  schema: { safeParse: (data: unknown) => any },
  data: unknown
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  const validation = schema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      response: validationErrorResponse(validation.error),
    };
  }

  return {
    success: true,
    data: validation.data as T,
  };
}

/**
 * Validate query parameters
 * @param schema Zod schema to validate against
 * @param params URLSearchParams
 * @returns Validated params or validation error response
 */
export function validateQueryParams<T>(
  schema: { safeParse: (data: unknown) => any },
  params: URLSearchParams
): { success: true; data: T } | { success: false; response: NextResponse } {
  const query = Object.fromEntries(params.entries());
  const validation = schema.safeParse(query);

  if (!validation.success) {
    return {
      success: false,
      response: validationErrorResponse(validation.error),
    };
  }

  return {
    success: true,
    data: validation.data as T,
  };
}

// ============================================
// Response Validation (Development Only)
// ============================================

/**
 * Validate API response format in development
 * Helps catch issues with transformation layer
 */
export function validateApiResponse<T>(
  schema: { safeParse: (data: unknown) => any },
  data: unknown,
  logErrors = true
): boolean {
  // Only validate in development
  if (process.env.NODE_ENV === 'production') {
    return true;
  }

  const validation = schema.safeParse(data);

  if (!validation.success && logErrors) {
    console.error('API Response Validation Failed:');
    console.error('Data:', JSON.stringify(data, null, 2));
    console.error('Errors:', formatZodError(validation.error));
  }

  return validation.success;
}

// ============================================
// Type Guards
// ============================================

/**
 * Type guard for checking if error is a Zod error
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

/**
 * Type guard for UUID validation
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// ============================================
// Common Validators
// ============================================

/**
 * Validate pagination parameters
 */
export function validatePagination(params: URLSearchParams): {
  limit: number;
  offset: number;
} {
  const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(params.get('offset') || '0', 10));

  return { limit, offset };
}

/**
 * Validate sort parameters
 */
export function validateSort<T extends string>(
  params: URLSearchParams,
  allowedFields: readonly T[],
  defaultField: T,
  defaultOrder: 'asc' | 'desc' = 'desc'
): {
  sortBy: T;
  sortOrder: 'asc' | 'desc';
} {
  const sortBy = params.get('sortBy') as T;
  const sortOrder = params.get('sortOrder') as 'asc' | 'desc';

  return {
    sortBy: allowedFields.includes(sortBy) ? sortBy : defaultField,
    sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : defaultOrder,
  };
}

// ============================================
// Error Response Helpers
// ============================================

/**
 * Standard error responses
 */
export const ErrorResponses = {
  unauthorized: () => 
    NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    ),
    
  forbidden: () =>
    NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    ),
    
  notFound: (resource = 'Resource') =>
    NextResponse.json(
      { error: `${resource} not found`, code: 'NOT_FOUND' },
      { status: 404 }
    ),
    
  badRequest: (message = 'Bad request') =>
    NextResponse.json(
      { error: message, code: 'BAD_REQUEST' },
      { status: 400 }
    ),
    
  internalError: (message = 'Internal server error') =>
    NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    ),
    
  conflict: (message = 'Conflict') =>
    NextResponse.json(
      { error: message, code: 'CONFLICT' },
      { status: 409 }
    ),
};

// ============================================
// Success Response Helpers
// ============================================

/**
 * Standard success responses
 */
export const SuccessResponses = {
  ok: <T>(data: T) =>
    NextResponse.json(data, { status: 200 }),
    
  created: <T>(data: T) =>
    NextResponse.json(data, { status: 201 }),
    
  noContent: () =>
    new NextResponse(null, { status: 204 }),
    
  accepted: <T>(data?: T) =>
    NextResponse.json(data || { message: 'Accepted' }, { status: 202 }),
};

// ============================================
// Middleware Helpers
// ============================================

/**
 * Wrap API route handler with validation
 */
export function withValidation<TBody = any, TQuery = any>(
  handler: (
    request: Request,
    context: {
      body?: TBody;
      query?: TQuery;
      params?: any;
    }
  ) => Promise<NextResponse>,
  options?: {
    bodySchema?: { safeParse: (data: unknown) => any };
    querySchema?: { safeParse: (data: unknown) => any };
  }
) {
  return async (request: Request, context: any) => {
    try {
      const validatedContext: any = { params: context.params };

      // Validate request body if schema provided
      if (options?.bodySchema && request.method !== 'GET') {
        const body = await request.json();
        const validation = await validateRequestBody<TBody>(options.bodySchema, body);
        
        if (!validation.success) {
          return validation.response;
        }
        
        validatedContext.body = validation.data;
      }

      // Validate query params if schema provided
      if (options?.querySchema) {
        const url = new URL(request.url);
        const validation = validateQueryParams<TQuery>(options.querySchema, url.searchParams);
        
        if (!validation.success) {
          return validation.response;
        }
        
        validatedContext.query = validation.data;
      }

      return await handler(request, validatedContext);
    } catch (error) {
      console.error('API Route Error:', error);
      
      if (isZodError(error)) {
        return validationErrorResponse(error);
      }
      
      return ErrorResponses.internalError();
    }
  };
}