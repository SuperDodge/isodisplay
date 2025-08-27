import { PrismaClient, Permission, ContentType, TransitionType, DisplayOrientation } from '../src/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.display.deleteMany();
  await prisma.playlistItem.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.content.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user with full permissions
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@isodisplay.local',
      password: adminPassword,
      permissions: [
        Permission.USER_CONTROL,
        Permission.CONTENT_CREATE,
        Permission.CONTENT_DELETE,
        Permission.PLAYLIST_CREATE,
        Permission.PLAYLIST_ASSIGN,
        Permission.PLAYLIST_DELETE,
        Permission.DISPLAY_CONTROL,
        Permission.SYSTEM_SETTINGS,
      ],
      lastLogin: new Date(),
    },
  });
  console.log('✅ Created admin user');

  // Create demo users with varying permissions
  const editorPassword = await bcrypt.hash('editor123', 10);
  const editorUser = await prisma.user.create({
    data: {
      username: 'editor',
      email: 'editor@isodisplay.local',
      password: editorPassword,
      permissions: [Permission.CONTENT_CREATE, Permission.PLAYLIST_ASSIGN],
    },
  });

  const viewerPassword = await bcrypt.hash('viewer123', 10);
  const viewerUser = await prisma.user.create({
    data: {
      username: 'viewer',
      email: 'viewer@isodisplay.local',
      password: viewerPassword,
      permissions: [Permission.PLAYLIST_ASSIGN],
    },
  });
  console.log('✅ Created demo users');

  // Create sample content items
  const image1 = await prisma.content.create({
    data: {
      name: 'Welcome Banner',
      fileName: 'welcome-banner.jpg',
      type: ContentType.IMAGE,
      filePath: '/uploads/welcome-banner.jpg',
      fileSize: BigInt(524288),
      mimeType: 'image/jpeg',
      originalName: 'welcome-banner.jpg',
      metadata: {
        width: 1920,
        height: 1080,
        fileSize: 524288,
        mimeType: 'image/jpeg',
      },
      backgroundColor: '#ffffff',
      uploadedBy: adminUser.id,
      createdBy: adminUser.id,
    },
  });

  const image2 = await prisma.content.create({
    data: {
      name: 'Company Logo',
      fileName: 'company-logo.png',
      type: ContentType.IMAGE,
      filePath: '/uploads/company-logo.png',
      fileSize: BigInt(102400),
      mimeType: 'image/png',
      originalName: 'company-logo.png',
      metadata: {
        width: 800,
        height: 600,
        fileSize: 102400,
        mimeType: 'image/png',
      },
      backgroundColor: '#f0f0f0',
      uploadedBy: editorUser.id,
      createdBy: editorUser.id,
    },
  });

  const video1 = await prisma.content.create({
    data: {
      name: 'Product Demo',
      fileName: 'product-demo.mp4',
      type: ContentType.VIDEO,
      filePath: '/uploads/product-demo.mp4',
      fileSize: BigInt(10485760),
      mimeType: 'video/mp4',
      originalName: 'product-demo.mp4',
      duration: 120,
      metadata: {
        width: 1920,
        height: 1080,
        duration: 120,
        fileSize: 10485760,
        mimeType: 'video/mp4',
      },
      uploadedBy: editorUser.id,
      createdBy: editorUser.id,
    },
  });

  const pdf1 = await prisma.content.create({
    data: {
      name: 'Menu Display',
      fileName: 'menu.pdf',
      type: ContentType.PDF,
      filePath: '/uploads/menu.pdf',
      fileSize: BigInt(2097152),
      mimeType: 'application/pdf',
      originalName: 'menu.pdf',
      metadata: {
        pageCount: 5,
        fileSize: 2097152,
        mimeType: 'application/pdf',
      },
      cropSettings: {
        cropX: 0,
        cropY: 0,
        cropWidth: 1920,
        cropHeight: 1080,
        zoom: 1.0,
      },
      uploadedBy: adminUser.id,
      createdBy: adminUser.id,
    },
  });

  const youtube1 = await prisma.content.create({
    data: {
      name: 'Company Introduction',
      fileName: 'youtube-dQw4w9WgXcQ',
      type: ContentType.YOUTUBE,
      filePath: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      mimeType: 'video/youtube',
      duration: 213,
      metadata: {
        videoId: 'dQw4w9WgXcQ',
        duration: 213,
        title: 'Company Introduction Video',
      },
      uploadedBy: editorUser.id,
      createdBy: editorUser.id,
    },
  });

  const text1 = await prisma.content.create({
    data: {
      name: 'Welcome Message',
      fileName: 'welcome-message.txt',
      type: ContentType.TEXT,
      mimeType: 'text/plain',
      metadata: {
        content: 'Welcome to our digital signage system!',
        fontSize: 48,
        fontFamily: 'Arial',
        color: '#333333',
        alignment: 'center',
      },
      backgroundColor: '#ffffff',
      uploadedBy: adminUser.id,
      createdBy: adminUser.id,
    },
  });
  console.log('✅ Created sample content');

  // Create thumbnails for seed content
  const thumbnailData = [
    { contentId: image1.id, fileName: 'display-logo.png' },
    { contentId: image2.id, fileName: 'display-background.jpg' },
    { contentId: video1.id, fileName: 'display-video.mp4.jpg' },
    { contentId: pdf1.id, fileName: 'display-menu.pdf.jpg' },
  ];

  for (const thumb of thumbnailData) {
    await prisma.fileThumbnail.create({
      data: {
        contentId: thumb.contentId,
        size: 'display',
        width: 640,
        height: 360,
        filePath: `uploads/thumbnails/${thumb.fileName}`,
        fileSize: BigInt(50000), // Approximate size
        format: 'jpeg',
      },
    });
  }
  console.log('✅ Created thumbnails for seed content');

  // Create tags for playlists
  const lobbyTag = await prisma.tag.create({
    data: { name: 'lobby' },
  });
  const restaurantTag = await prisma.tag.create({
    data: { name: 'restaurant' },
  });
  const promotionalTag = await prisma.tag.create({
    data: { name: 'promotional' },
  });
  const informationalTag = await prisma.tag.create({
    data: { name: 'informational' },
  });
  console.log('✅ Created sample tags');

  // Create sample playlists
  const mainPlaylist = await prisma.playlist.create({
    data: {
      name: 'Main Lobby Display',
      description: 'Welcome content and promotional materials for the main lobby display screen',
      createdBy: adminUser.id,
      isActive: true,
      tags: {
        connect: [{ id: lobbyTag.id }, { id: promotionalTag.id }],
      },
      sharedWith: {
        connect: [{ id: editorUser.id }],
      },
      items: {
        create: [
          {
            contentId: image1.id,
            duration: 10,
            order: 1,
            transitionType: TransitionType.FADE,
            transitionDuration: 1000,
          },
          {
            contentId: video1.id,
            duration: 120,
            order: 2,
            transitionType: TransitionType.DISSOLVE,
            transitionDuration: 500,
          },
          {
            contentId: youtube1.id,
            duration: 213,
            order: 3,
            transitionType: TransitionType.SLIDE_OVER,
            transitionDuration: 750,
          },
          {
            contentId: text1.id,
            duration: 5,
            order: 4,
            transitionType: TransitionType.CUT,
          },
        ],
      },
    },
  });

  const menuPlaylist = await prisma.playlist.create({
    data: {
      name: 'Restaurant Menu',
      description: 'Daily menu and specials for the restaurant display',
      createdBy: editorUser.id,
      isActive: true,
      tags: {
        connect: [{ id: restaurantTag.id }, { id: informationalTag.id }],
      },
      items: {
        create: [
          {
            contentId: pdf1.id,
            duration: 30,
            order: 1,
            transitionType: TransitionType.PAGE_ROLL,
            transitionDuration: 1500,
          },
          {
            contentId: image2.id,
            duration: 5,
            order: 2,
            transitionType: TransitionType.ZOOM,
            transitionDuration: 1000,
          },
        ],
      },
    },
  });
  console.log('✅ Created sample playlists');

  // Create sample displays
  const display1 = await prisma.display.create({
    data: {
      name: 'Main Lobby Screen',
      urlSlug: 'main-lobby',
      playlistId: mainPlaylist.id,
      resolution: '1920x1080',
      orientation: DisplayOrientation.LANDSCAPE,
      isOnline: true,
      lastSeen: new Date(),
    },
  });

  const display2 = await prisma.display.create({
    data: {
      name: 'Restaurant Menu Display',
      urlSlug: 'restaurant-menu',
      playlistId: menuPlaylist.id,
      resolution: '1080x1920',
      orientation: DisplayOrientation.PORTRAIT,
      isOnline: false,
      lastSeen: new Date(Date.now() - 86400000), // 1 day ago
    },
  });

  const display3 = await prisma.display.create({
    data: {
      name: 'Conference Room A',
      urlSlug: 'conference-a',
      resolution: '3840x2160',
      orientation: DisplayOrientation.LANDSCAPE,
      isOnline: false,
    },
  });
  console.log('✅ Created sample displays');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('  Admin: admin@isodisplay.local / admin123');
  console.log('  Editor: editor@isodisplay.local / editor123');
  console.log('  Viewer: viewer@isodisplay.local / viewer123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });