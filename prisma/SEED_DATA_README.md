# IsoDisplay Seed Data

This directory contains seed data exported from a production IsoDisplay installation.

## Contents

- `seed-data.json` - Database records for users, content, playlists, and displays
- `seed.ts` - TypeScript seed script that imports the JSON data
- `/uploads` folder - Media files and thumbnails (must be copied separately)

## Using Seed Data in New Installations

### Quick Setup

1. **Install dependencies and setup database:**

   ```bash
   npm install
   npx prisma generate
   npx prisma migrate deploy
   ```

2. **Copy the uploads folder** from the source installation to the project root

3. **Run the seed script:**
   ```bash
   npm run db:seed
   ```

### What Gets Seeded

- **Users (3):**
  - admin@isodisplay.local / admin123
  - editor (with limited permissions)
  - viewer (read-only access)

- **Content (8 items):**
  - Team Photo - 2024
  - Isomer Brandmarks (White, Grey, Orange backgrounds)
  - Isomer Brand Signatures (White, Grey, Orange backgrounds)
  - We're #BuiltDifferent! (YouTube video)

- **Playlists (1):**
  - Main brand showcase playlist with all content

- **Displays (1):**
  - Primary display linked to the main playlist

- **Thumbnails:**
  - Display thumbnails (640x360, 16:9 aspect ratio)
  - Generated thumbnails for all content

## Updating Seed Data

To update the seed data with current database content:

1. **Export current data:**

   ```bash
   node scripts/export-seed-data.mjs
   ```

2. **Create distribution archive:**
   ```bash
   ./scripts/create-seed-archive.sh
   ```

This creates a tar.gz file with both the JSON data and uploads folder.

## File Structure

```
prisma/
├── seed-data.json       # Exported database records
├── seed.ts             # Seed script
└── SEED_DATA_README.md # This file

uploads/                 # Media files (separate)
├── 2025/
│   └── 08/
│       └── images/
│           └── [user-id]/
│               ├── *.jpg/png     # Original images
│               └── thumbnails/
│                   └── [id]/
│                       └── display-thumb.jpg
```

## Important Notes

- The uploads folder MUST be copied to preserve media files
- Thumbnails are linked in the database but files must exist
- User passwords in seed data are already hashed
- All timestamps are preserved from the original data
- Content IDs and relationships are maintained

## Troubleshooting

If seeding fails:

1. Ensure the database is clean: `npx prisma migrate reset`
2. Check that seed-data.json exists in the prisma folder
3. Verify uploads folder is in the project root
4. Check for any unique constraint violations in the data
