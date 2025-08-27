# Type Mapping Documentation

## Overview

This document maps the relationships between database schema (Prisma), API responses, and frontend types to ensure consistency across the application.

## Key Mismatches and Solutions

### 1. Playlist Types

| Database (Prisma)     | API Response        | Frontend                | Notes               |
| --------------------- | ------------------- | ----------------------- | ------------------- |
| `id: String`          | `id: string`        | `id: string`            | ✅ Consistent       |
| `name: String`        | `name: string`      | `name: string`          | ✅ Consistent       |
| ❌ Missing            | ❌ Missing          | `description?: string`  | ⚠️ Not in DB schema |
| `createdBy: String`   | `createdBy: string` | `createdBy: string`     | ✅ Consistent       |
| `isActive: Boolean`   | `isActive: boolean` | `isActive: boolean`     | ✅ Consistent       |
| `createdAt: DateTime` | `createdAt: string` | `createdAt: Date`       | 🔄 Needs conversion |
| `updatedAt: DateTime` | `updatedAt: string` | `updatedAt: Date`       | 🔄 Needs conversion |
| ❌ Missing            | ❌ Missing          | `sharedWith: string[]`  | ⚠️ Not implemented  |
| ❌ Missing            | ❌ Missing          | `tags?: string[]`       | ⚠️ Not implemented  |
| ❌ Missing            | ❌ Missing          | `totalDuration: number` | 📊 Calculated field |

### 2. PlaylistItem Types

| Database (Prisma)          | API Response                         | Frontend                     | Notes                     |
| -------------------------- | ------------------------------------ | ---------------------------- | ------------------------- |
| `id: String`               | `id: string`                         | `id: string`                 | ✅ Consistent             |
| `contentId: String`        | `contentId: string`                  | `contentId: string`          | ✅ Consistent             |
| `order: Int`               | `order: number`                      | `order: number`              | ✅ Consistent             |
| `duration: Int`            | `duration: number`                   | `duration: number`           | ✅ Consistent             |
| `transitionType: Enum`     | `transitionType: string`             | `transition: string`         | 🔄 Name + format mismatch |
| `transitionDuration: Int?` | `transitionDuration: number \| null` | `transitionDuration: number` | 🔄 ms vs seconds          |
| via `content.name`         | via `content.name`                   | `title: string`              | 🔄 Needs extraction       |
| via `content.thumbnails`   | via `content.thumbnailUrl`           | `thumbnail?: string`         | 🔄 Needs extraction       |
| via `content.type`         | via `content.type`                   | `contentType: string`        | 🔄 Needs extraction       |

### 3. Content Types

| Database (Prisma)          | API Response                      | Frontend               | Notes                |
| -------------------------- | --------------------------------- | ---------------------- | -------------------- |
| `id: String`               | `id: string`                      | -                      | Used via contentId   |
| `name: String`             | `name: string`                    | Becomes `title`        | 🔄 Field name change |
| `type: ContentType`        | `type: string`                    | `contentType: string`  | 🔄 Enum to string    |
| `filePath: String?`        | `filePath: string \| null`        | -                      | Used for thumbnails  |
| `metadata: Json?`          | `metadata: any`                   | -                      | Flexible JSON        |
| `backgroundColor: String?` | `backgroundColor: string \| null` | -                      | For image display    |
| `cropSettings: Json?`      | `cropSettings: any`               | `cropSettings?: any`   | Passed through       |
| `fileSize: BigInt?`        | `fileSize: string \| null`        | -                      | BigInt serialization |
| ❌ Missing                 | ❌ Missing                        | `description?: string` | ⚠️ Not in DB         |
| ❌ Missing                 | ❌ Missing                        | `duration?: number`    | ⚠️ Not in DB         |

### 4. Display Types

| Database (Prisma)     | API Response                 | Frontend              | Notes               |
| --------------------- | ---------------------------- | --------------------- | ------------------- |
| `id: String`          | `id: string`                 | `id: string`          | ✅ Consistent       |
| `name: String`        | `name: string`               | `name: string`        | ✅ Consistent       |
| `urlSlug: String`     | `urlSlug: string`            | `urlSlug: string`     | ✅ Consistent       |
| `playlistId: String?` | `playlistId: string \| null` | `playlistId?: string` | ✅ Consistent       |
| `resolution: String`  | `resolution: string`         | `resolution: string`  | ✅ Consistent       |
| `orientation: Enum`   | `orientation: string`        | `orientation: string` | 🔄 Enum to string   |
| `lastSeen: DateTime?` | `lastSeen: string \| null`   | `lastSeen?: Date`     | 🔄 Needs conversion |
| `isOnline: Boolean`   | `isOnline: boolean`          | `isOnline: boolean`   | ✅ Consistent       |
| `location: String?`   | `location: string \| null`   | `location?: string`   | ✅ Consistent       |

## Transformation Rules

### Date/Time Fields

- **Database**: `DateTime` (Prisma type)
- **API**: Serialized as ISO 8601 string
- **Frontend**: Convert to JavaScript `Date` object

### BigInt Fields

- **Database**: `BigInt` (for file sizes)
- **API**: Serialized as string to avoid precision loss
- **Frontend**: Parse as needed, display as formatted string

### Enum Fields

- **Database**: Prisma enums (UPPERCASE_SNAKE_CASE)
- **API**: String representation
- **Frontend**: lowercase-kebab-case or camelCase

### Transition Types Mapping

```typescript
Database (Enum) -> Frontend (string)
CUT -> cut
FADE -> fade
CROSSFADE -> crossfade
DISSOLVE -> dissolve
WIPE -> wipe
ZOOM -> zoom
PUSH -> push
SLIDE_OVER -> slide-over
IRIS -> iris
MORPH -> morph
BURN -> burn
BARN_DOORS -> barn-doors
PAGE_ROLL -> page-roll
PEEL -> peel
```

### Content Types Mapping

```typescript
Database (Enum) -> Frontend (string)
IMAGE -> image
VIDEO -> video
PDF -> pdf
```

## Implementation Checklist

### ✅ Completed

- [x] Created API type definitions (`/src/lib/types/api-types.ts`)
- [x] Created transformation utilities (`/src/lib/transformers/api-transformers.ts`)
- [x] Updated playlist edit page to use transformers

### 🔄 In Progress

- [ ] Update all API routes to use consistent response types
- [ ] Update all frontend components to use transformers
- [ ] Add runtime validation for API responses

### 📝 TODO

- [ ] Add `description` field to Playlist table in database
- [ ] Add `tags` table and many-to-many relationship for playlists
- [ ] Add `sharedWith` functionality (playlist sharing)
- [ ] Update Content API routes to use transformers
- [ ] Update Display API routes to use transformers
- [ ] Add comprehensive error handling for type mismatches
- [ ] Create unit tests for all transformers
- [ ] Add Zod or similar for runtime type validation

## Best Practices

1. **Always use transformers** when converting between API and frontend types
2. **Validate API responses** before transformation
3. **Handle null/undefined** values explicitly
4. **Use TypeScript strict mode** to catch type issues at compile time
5. **Document any new mismatches** in this file
6. **Update transformers** when adding new fields

## Migration Path

### Phase 1: Type Consistency (Current)

- Define all type interfaces
- Create transformation utilities
- Update critical paths (playlist editing)

### Phase 2: API Standardization

- Update all API routes to return consistent types
- Add response interceptors for transformation
- Implement request validation

### Phase 3: Database Schema Updates

- Add missing fields (description, tags, etc.)
- Create migration scripts
- Update Prisma schema

### Phase 4: Testing & Validation

- Add unit tests for transformers
- Add integration tests for API endpoints
- Add runtime validation with Zod

### Phase 5: Documentation

- Update API documentation
- Create developer guide
- Add inline code comments
