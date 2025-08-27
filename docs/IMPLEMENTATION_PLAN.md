# Type Consistency Implementation Plan

## Overview

This document outlines the execution plan for completing the type consistency implementation across the IsoDisplay application.

---

## Phase 1: Update API Route Handlers ⚡

**Timeline: 2-3 hours**
**Priority: HIGH**

### Objective

Ensure all API routes return consistent, transformed data that matches frontend expectations.

### Tasks

#### 1.1 Playlist API Routes

- [ ] `/api/playlists/route.ts`
  - Add transformer to GET response
  - Transform POST request body validation
  - Return transformed created playlist
- [ ] `/api/playlists/[id]/route.ts`
  - Transform GET response
  - Validate and transform PUT request body
  - Return transformed updated playlist

#### 1.2 Content API Routes

- [ ] `/api/content/route.ts`
  - Transform GET response array
  - Validate POST request for uploads
  - Return transformed content items
- [ ] `/api/content/[id]/route.ts`
  - Transform GET single content response
  - Validate PUT request body
  - Return transformed updated content

#### 1.3 Display API Routes

- [ ] `/api/displays/route.ts`
  - Transform GET response array
  - Validate POST request body
  - Return transformed created display
- [ ] `/api/displays/[id]/route.ts`
  - Transform GET single display response
  - Validate PUT request body
  - Return transformed updated display

### Implementation Pattern

```typescript
// Example for API route handler
import { apiToFrontendPlaylist } from '@/lib/transformers/api-transformers';
import { validateApiRequest } from '@/lib/validators/api-validators'; // To be created

export async function GET(request: NextRequest) {
  try {
    // Fetch from database
    const playlists = await prisma.playlist.findMany({
      include: { items: true, creator: true },
    });

    // Transform to API format
    const apiResponse = playlists.map((playlist) => ({
      ...playlist,
      createdAt: playlist.createdAt.toISOString(),
      updatedAt: playlist.updatedAt.toISOString(),
      // ... other transformations
    }));

    // Return consistent response
    return NextResponse.json(apiResponse);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

---

## Phase 2: Add Zod Runtime Validation 🛡️

**Timeline: 3-4 hours**
**Priority: HIGH**

### Objective

Add runtime type validation to catch errors before they reach the database or frontend.

### Tasks

#### 2.1 Install Dependencies

```bash
npm install zod @anatine/zod-prisma
```

#### 2.2 Create Validation Schemas

- [ ] Create `/src/lib/validators/playlist-schemas.ts`
  - CreatePlaylistSchema
  - UpdatePlaylistSchema
  - PlaylistItemSchema
- [ ] Create `/src/lib/validators/content-schemas.ts`
  - CreateContentSchema
  - UpdateContentSchema
  - ContentMetadataSchema
- [ ] Create `/src/lib/validators/display-schemas.ts`
  - CreateDisplaySchema
  - UpdateDisplaySchema
  - DisplayConfigSchema

#### 2.3 Create Validation Utilities

- [ ] Create `/src/lib/validators/api-validators.ts`
  - Generic validation function
  - Error formatting utilities
  - Type guards

### Implementation Example

```typescript
// /src/lib/validators/playlist-schemas.ts
import { z } from 'zod';
import { TransitionType } from '@/generated/prisma';

export const PlaylistItemSchema = z.object({
  contentId: z.string().uuid(),
  order: z.number().int().min(0),
  duration: z.number().int().min(1),
  transitionType: z.nativeEnum(TransitionType),
  transitionDuration: z.number().int().min(0).optional(),
});

export const CreatePlaylistSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  items: z.array(PlaylistItemSchema).optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdatePlaylistSchema = CreatePlaylistSchema.partial();

// Validation function
export function validateCreatePlaylist(data: unknown) {
  return CreatePlaylistSchema.safeParse(data);
}
```

#### 2.4 Integrate Validation in API Routes

```typescript
// In API route
import { validateCreatePlaylist } from '@/lib/validators/playlist-schemas';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate request
  const validation = validateCreatePlaylist(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: validation.error.flatten(),
      },
      { status: 400 }
    );
  }

  // Use validated data
  const playlist = await createPlaylist(validation.data);
  // ...
}
```

---

## Phase 3: Update Database Schema 🗄️

**Timeline: 2-3 hours**
**Priority: MEDIUM**

### Objective

Add missing fields to the database schema to support all frontend features.

### Tasks

#### 3.1 Schema Updates

- [ ] Add missing fields to Playlist model

  ```prisma
  model Playlist {
    // ... existing fields
    description String?
    tags        Tag[]      @relation("PlaylistTags")
    sharedWith  User[]     @relation("SharedPlaylists")
  }
  ```

- [ ] Create Tag model

  ```prisma
  model Tag {
    id        String     @id @default(uuid())
    name      String     @unique
    playlists Playlist[] @relation("PlaylistTags")
    createdAt DateTime   @default(now())
  }
  ```

- [ ] Add sharing relationship

  ```prisma
  model User {
    // ... existing fields
    sharedPlaylists Playlist[] @relation("SharedPlaylists")
  }
  ```

- [ ] Add duration to Content (for videos)
  ```prisma
  model Content {
    // ... existing fields
    duration Int? // Duration in seconds for video content
  }
  ```

#### 3.2 Create Migration

```bash
# Create migration
npx prisma migrate dev --name add_missing_fields

# Generate new Prisma client
npx prisma generate
```

#### 3.3 Update Seed Data

- [ ] Update `/prisma/seed.ts` to include new fields
  - Add descriptions to playlists
  - Create sample tags
  - Add duration to video content

#### 3.4 Update Type Definitions

- [ ] Update API types to include new fields
- [ ] Update transformers to handle new fields
- [ ] Update validation schemas

### Migration Script

```sql
-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN "description" TEXT;

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PlaylistTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_SharedPlaylists" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- AddForeignKey
ALTER TABLE "_PlaylistTags" ADD CONSTRAINT "_PlaylistTags_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Playlist"("id") ON DELETE CASCADE;
ALTER TABLE "_PlaylistTags" ADD CONSTRAINT "_PlaylistTags_B_fkey"
  FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE;
```

---

## Phase 4: Run and Fix Tests 🧪

**Timeline: 1-2 hours**
**Priority: HIGH**

### Objective

Verify all transformations work correctly and fix any issues found.

### Tasks

#### 4.1 Prepare Test Environment

- [ ] Install test dependencies

  ```bash
  npm install --save-dev ts-node @types/node
  ```

- [ ] Create test configuration
  ```json
  // tsconfig.test.json
  {
    "extends": "./tsconfig.json",
    "compilerOptions": {
      "module": "commonjs"
    }
  }
  ```

#### 4.2 Run Type Consistency Tests

```bash
# Run the test script
npx ts-node --project tsconfig.test.json scripts/test-type-consistency.ts
```

#### 4.3 Create Additional Tests

- [ ] Create `/scripts/test-api-endpoints.ts`
  - Test all GET endpoints
  - Test all POST endpoints
  - Test all PUT endpoints
  - Test error handling

- [ ] Create `/scripts/test-validation.ts`
  - Test Zod schemas
  - Test edge cases
  - Test error messages

#### 4.4 Fix Issues Found

- [ ] Document all issues in `/docs/TEST_RESULTS.md`
- [ ] Fix transformer bugs
- [ ] Update validation rules
- [ ] Adjust database queries

### Test Script Structure

```typescript
// /scripts/test-api-endpoints.ts
async function testPlaylistEndpoints() {
  console.log('Testing Playlist Endpoints...');

  // Test GET /api/playlists
  const response = await fetch('http://localhost:3000/api/playlists');
  const data = await response.json();

  // Validate response structure
  for (const playlist of data) {
    assert(typeof playlist.id === 'string', 'ID should be string');
    assert(typeof playlist.name === 'string', 'Name should be string');
    assert(typeof playlist.isActive === 'boolean', 'IsActive should be boolean');
    // ... more assertions
  }

  console.log('✅ Playlist endpoints passed');
}
```

---

## Execution Schedule

### Day 1 (4-6 hours)

- **Morning**: Phase 1 - Update API Route Handlers
- **Afternoon**: Phase 2 - Add Zod Validation (Part 1)

### Day 2 (4-5 hours)

- **Morning**: Phase 2 - Add Zod Validation (Part 2)
- **Afternoon**: Phase 3 - Update Database Schema

### Day 3 (2-3 hours)

- **Morning**: Phase 4 - Run and Fix Tests
- **Afternoon**: Final testing and documentation

---

## Success Criteria

### Phase 1 ✅

- All API routes return consistent data format
- No type errors in browser console
- Frontend receives expected data structure

### Phase 2 ✅

- All API inputs are validated
- Clear error messages for invalid data
- No invalid data reaches database

### Phase 3 ✅

- Database schema supports all features
- Migrations run successfully
- No data loss during migration

### Phase 4 ✅

- All tests pass
- No runtime type errors
- Performance is acceptable

---

## Rollback Plan

### If Issues Occur:

1. **API Routes**: Revert to previous commit
2. **Validation**: Disable validation temporarily
3. **Database**: Keep migration rollback script ready
4. **Tests**: Mark failing tests as pending

### Database Rollback Script

```bash
# Rollback last migration
npx prisma migrate rollback

# Or reset to specific migration
npx prisma migrate reset --to migration_name
```

---

## Monitoring & Maintenance

### After Implementation:

1. **Monitor Error Logs**: Check for validation failures
2. **Performance Metrics**: Ensure no degradation
3. **User Feedback**: Watch for UI issues
4. **Type Coverage**: Run `npx tsc --noEmit` regularly

### Regular Checks:

- Weekly: Review error logs
- Monthly: Update validation rules
- Quarterly: Audit type definitions

---

## Resources & References

### Documentation

- [Zod Documentation](https://zod.dev)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### Internal Docs

- `/docs/TYPE_MAPPING.md` - Type mapping reference
- `/docs/AUDIT_SUMMARY.md` - Audit results
- `/src/lib/transformers/api-transformers.ts` - Transformation functions

---

## Questions to Consider

1. **Should we version the API?** (e.g., `/api/v1/playlists`)
2. **Should we add request/response logging?**
3. **Should we implement caching for transformed data?**
4. **Should we add OpenAPI/Swagger documentation?**

---

## Risk Assessment

| Risk                         | Likelihood | Impact | Mitigation                     |
| ---------------------------- | ---------- | ------ | ------------------------------ |
| Breaking changes to frontend | Medium     | High   | Gradual rollout, feature flags |
| Database migration issues    | Low        | High   | Backup before migration        |
| Performance degradation      | Low        | Medium | Monitor and optimize           |
| Validation too strict        | Medium     | Low    | Adjustable validation rules    |

---

## Notes

- Keep the old code commented during implementation for quick rollback
- Test each phase thoroughly before moving to the next
- Document any deviations from this plan
- Consider using feature flags for gradual rollout
