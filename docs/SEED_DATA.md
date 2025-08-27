# Seed Data Documentation

## Overview

The application includes seed data representing the Isomer brand content currently in use. This data serves as the baseline for development and testing.

## Current Seed Content

### Images (7 items)

All images are high-quality brand assets with automatic thumbnail generation:

1. **Team Photo - 2024**
   - Type: JPEG
   - Resolution: 5184x3456
   - Size: 5.0 MB
   - Purpose: Company team photo from 2024

2. **Isomer Brand Signature - Grey**
   - Type: PNG
   - Resolution: 1920x1080
   - Size: 60 KB
   - Purpose: Brand signature for grey backgrounds

3. **Isomer Brand Signature - Orange**
   - Type: PNG
   - Resolution: 1920x1080
   - Size: 68 KB
   - Purpose: Brand signature for orange backgrounds

4. **Isomer Brand Signature - White**
   - Type: PNG
   - Resolution: 1920x1080
   - Size: 60 KB
   - Purpose: Brand signature for white backgrounds

5. **Isomer Brandmark - Orange**
   - Type: PNG
   - Resolution: 1920x1080
   - Size: 26 KB
   - Purpose: Brandmark logo for orange backgrounds

6. **Isomer Brandmark - Grey**
   - Type: PNG
   - Resolution: 1920x1080
   - Size: 18 KB
   - Purpose: Brandmark logo for grey backgrounds

7. **Isomer Brandmark - White**
   - Type: PNG
   - Resolution: 1920x1080
   - Size: 18 KB
   - Purpose: Brandmark logo for white backgrounds

### Thumbnails

Each content item automatically generates 4 thumbnails:

- `small`: 200x200 WebP format
- `medium`: 800x800 WebP format
- `large`: 1920x1080 WebP format
- `display`: 640x360 JPEG format (16:9 aspect ratio for display)

## Seed Users

### Admin Account

- Email: `admin@isodisplay.local`
- Password: `admin123`
- Permissions: Full system access

### Editor Account

- Email: `editor@isodisplay.local`
- Password: `editor123`
- Permissions: Content creation and playlist assignment

### Viewer Account

- Email: `viewer@isodisplay.local`
- Password: `viewer123`
- Permissions: Playlist assignment only

## Sample Playlists

### Main Lobby Display

- Contains: Team photo and brand signatures
- Duration: 34 seconds total
- Transitions: Fade, Dissolve, Slide Over, Cut

### Restaurant Menu

- Contains: Brand marks in different colors
- Duration: 30 seconds total
- Transitions: Page Roll, Zoom, Fade

## Sample Displays

1. **Main Lobby Screen**
   - Resolution: 1920x1080 (Landscape)
   - Playlist: Main Lobby Display
   - Status: Online

2. **Restaurant Menu Display**
   - Resolution: 1080x1920 (Portrait)
   - Playlist: Restaurant Menu
   - Status: Offline

3. **Conference Room A**
   - Resolution: 3840x2160 (4K Landscape)
   - Playlist: None assigned
   - Status: Offline

## Using Seed Data

### Reset and Seed Database

```bash
# Reset database and apply migrations
npm run db:reset

# Seed the database
npm run db:seed
```

### Export Current Data as Seed

```bash
# Export current database content
node scripts/export-seed-data.mjs
```

This will create `prisma/seed-data.json` with the current database content.

## File Storage

Seed content references actual files in the uploads directory:

- Base path: `/uploads/2025/08/images/[user-id]/`
- Thumbnails: `/uploads/2025/08/images/[user-id]/thumbnails/[content-id]/`

## Notes

- All timestamps use the current date/time when seeding
- File sizes are preserved from actual uploads
- Thumbnails are generated automatically on first upload
- The seed data represents actual Isomer brand assets in production use
