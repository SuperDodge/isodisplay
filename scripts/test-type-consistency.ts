#!/usr/bin/env ts-node

/**
 * Test script to verify type consistency across the application
 * Run with: npx ts-node scripts/test-type-consistency.ts
 */

import { PrismaClient } from '@/generated/prisma';
import {
  apiToFrontendPlaylist,
  apiToFrontendContent,
  apiToFrontendDisplay,
  frontendToApiCreatePlaylist,
  frontendToApiUpdatePlaylist,
  validateApiPlaylistResponse,
} from '../src/lib/transformers/api-transformers';

const prisma = new PrismaClient();

async function testPlaylistTransformation() {
  console.log('🧪 Testing Playlist Transformation...');
  
  try {
    // Fetch a playlist from database
    const dbPlaylist = await prisma.playlist.findFirst({
      include: {
        items: {
          include: {
            content: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!dbPlaylist) {
      console.log('❌ No playlist found in database');
      return;
    }

    console.log('📦 Database Playlist:', {
      id: dbPlaylist.id,
      name: dbPlaylist.name,
      itemCount: dbPlaylist.items.length,
    });

    // Simulate API response format
    const apiResponse = {
      ...dbPlaylist,
      createdAt: dbPlaylist.createdAt.toISOString(),
      updatedAt: dbPlaylist.updatedAt.toISOString(),
      items: dbPlaylist.items.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        content: item.content ? {
          ...item.content,
          fileSize: item.content.fileSize?.toString() || null,
          createdAt: item.content.createdAt.toISOString(),
          updatedAt: item.content.updatedAt.toISOString(),
          deletedAt: item.content.deletedAt?.toISOString() || null,
        } : undefined,
      })),
    };

    // Validate API response
    if (validateApiPlaylistResponse(apiResponse)) {
      console.log('✅ API response validation passed');
    } else {
      console.log('❌ API response validation failed');
    }

    // Transform to frontend format
    const frontendPlaylist = apiToFrontendPlaylist(apiResponse as any);
    console.log('🎨 Frontend Playlist:', {
      id: frontendPlaylist.id,
      name: frontendPlaylist.name,
      itemCount: frontendPlaylist.items.length,
      totalDuration: frontendPlaylist.totalDuration,
    });

    // Transform back to API format
    const apiRequest = frontendToApiUpdatePlaylist(frontendPlaylist);
    console.log('📤 API Update Request:', {
      name: apiRequest.name,
      itemCount: apiRequest.items?.length,
    });

    console.log('✅ Playlist transformation test completed');
  } catch (error) {
    console.error('❌ Playlist transformation test failed:', error);
  }
}

async function testContentTransformation() {
  console.log('\n🧪 Testing Content Transformation...');
  
  try {
    // Fetch content from database
    const dbContent = await prisma.content.findFirst({
      include: {
        thumbnails: true,
      },
    });

    if (!dbContent) {
      console.log('❌ No content found in database');
      return;
    }

    console.log('📦 Database Content:', {
      id: dbContent.id,
      name: dbContent.name,
      type: dbContent.type,
    });

    // Simulate API response format
    const apiResponse = {
      ...dbContent,
      fileSize: dbContent.fileSize?.toString() || null,
      createdAt: dbContent.createdAt.toISOString(),
      updatedAt: dbContent.updatedAt.toISOString(),
      deletedAt: dbContent.deletedAt?.toISOString() || null,
      thumbnails: dbContent.thumbnails.map(thumb => ({
        ...thumb,
        fileSize: thumb.fileSize.toString(),
        createdAt: thumb.createdAt.toISOString(),
      })),
    };

    // Transform to frontend format
    const frontendContent = apiToFrontendContent(apiResponse as any);
    console.log('🎨 Frontend Content:', {
      id: frontendContent.id,
      name: frontendContent.name,
      type: frontendContent.type,
      thumbnailUrl: frontendContent.thumbnailUrl,
    });

    console.log('✅ Content transformation test completed');
  } catch (error) {
    console.error('❌ Content transformation test failed:', error);
  }
}

async function testDisplayTransformation() {
  console.log('\n🧪 Testing Display Transformation...');
  
  try {
    // Fetch display from database
    const dbDisplay = await prisma.display.findFirst({
      include: {
        playlist: true,
      },
    });

    if (!dbDisplay) {
      console.log('❌ No display found in database');
      return;
    }

    console.log('📦 Database Display:', {
      id: dbDisplay.id,
      name: dbDisplay.name,
      urlSlug: dbDisplay.urlSlug,
      orientation: dbDisplay.orientation,
    });

    // Simulate API response format
    const apiResponse = {
      ...dbDisplay,
      lastSeen: dbDisplay.lastSeen?.toISOString() || null,
      createdAt: dbDisplay.createdAt.toISOString(),
      updatedAt: dbDisplay.updatedAt.toISOString(),
    };

    // Transform to frontend format
    const frontendDisplay = apiToFrontendDisplay(apiResponse as any);
    console.log('🎨 Frontend Display:', {
      id: frontendDisplay.id,
      name: frontendDisplay.name,
      urlSlug: frontendDisplay.urlSlug,
      orientation: frontendDisplay.orientation,
      isOnline: frontendDisplay.isOnline,
    });

    console.log('✅ Display transformation test completed');
  } catch (error) {
    console.error('❌ Display transformation test failed:', error);
  }
}

async function main() {
  console.log('🚀 Starting Type Consistency Tests\n');
  
  try {
    await testPlaylistTransformation();
    await testContentTransformation();
    await testDisplayTransformation();
    
    console.log('\n✨ All tests completed!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();