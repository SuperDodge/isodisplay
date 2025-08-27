import { PrismaClient } from '../src/generated/prisma';
import * as seedData from './seed-data.json';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed with exported data...');

  // Clean existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...');
  await prisma.playlistItem.deleteMany();
  await prisma.display.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.fileThumbnail.deleteMany();
  await prisma.content.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('👤 Creating users...');
  for (const userData of seedData.users) {
    await prisma.user.create({
      data: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        permissions: userData.permissions,
        status: userData.status,
        createdAt: new Date(userData.createdAt),
        updatedAt: new Date(userData.updatedAt),
      },
    });
  }
  console.log(`✅ Created ${seedData.users.length} users`);

  // Create content and thumbnails
  console.log('📁 Creating content...');
  for (const contentData of seedData.content) {
    // Create content without thumbnails first
    const { thumbnails, fileSize, ...contentWithoutRelations } = contentData;
    
    await prisma.content.create({
      data: {
        ...contentWithoutRelations,
        fileSize: fileSize ? BigInt(fileSize) : null,
        createdAt: new Date(contentWithoutRelations.createdAt),
        updatedAt: new Date(contentWithoutRelations.updatedAt),
      },
    });

    // Create thumbnails for this content
    if (thumbnails && thumbnails.length > 0) {
      for (const thumbnail of thumbnails) {
        const { fileSize: thumbSize, ...thumbnailData } = thumbnail;
        await prisma.fileThumbnail.create({
          data: {
            ...thumbnailData,
            fileSize: thumbSize ? BigInt(thumbSize) : BigInt(0),
            createdAt: new Date(thumbnailData.createdAt),
          },
        });
      }
    }
  }
  console.log(`✅ Created ${seedData.content.length} content items with thumbnails`);

  // Create playlists and playlist items
  console.log('📝 Creating playlists...');
  for (const playlistData of seedData.playlists) {
    const { items, ...playlistWithoutItems } = playlistData;
    
    // Create playlist
    await prisma.playlist.create({
      data: {
        ...playlistWithoutItems,
        createdAt: new Date(playlistWithoutItems.createdAt),
        updatedAt: new Date(playlistWithoutItems.updatedAt),
      },
    });

    // Create playlist items
    if (items && items.length > 0) {
      for (const item of items) {
        await prisma.playlistItem.create({
          data: {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
        });
      }
    }
  }
  console.log(`✅ Created ${seedData.playlists.length} playlists`);

  // Create displays
  console.log('📺 Creating displays...');
  for (const displayData of seedData.displays) {
    await prisma.display.create({
      data: {
        ...displayData,
        lastSeen: displayData.lastSeen ? new Date(displayData.lastSeen) : null,
        createdAt: new Date(displayData.createdAt),
        updatedAt: new Date(displayData.updatedAt),
      },
    });
  }
  console.log(`✅ Created ${seedData.displays.length} displays`);

  // Check if uploads directory exists and has files
  const uploadsPath = path.join(process.cwd(), 'uploads', '2025', '08', 'images');
  try {
    const files = await fs.readdir(uploadsPath, { recursive: true });
    console.log(`📂 Found ${files.length} files in uploads directory`);
  } catch (error) {
    console.log('⚠️  Uploads directory not found. Make sure to copy the uploads folder from the source installation.');
  }

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('  Admin: admin@isodisplay.local / admin123');
  console.log('\n⚠️  Important: Make sure to copy the /uploads folder from the source installation');
  console.log('  to preserve all media files and thumbnails.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });