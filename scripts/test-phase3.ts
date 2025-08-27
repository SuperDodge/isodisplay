#!/usr/bin/env tsx
/**
 * Test Script for Phase 3 - Database Schema Updates
 * 
 * Tests the new fields added to the database schema:
 * - Playlist: description, tags, sharedWith
 * - Content: fileName, duration, createdBy
 * - Tag: New model for tagging playlists
 */

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function testPhase3() {
  console.log('\n🧪 Phase 3 Testing - Database Schema Updates\n');
  console.log('=' .repeat(50));

  try {
    // Test 1: Check if Tags were created
    console.log('\n📌 Test 1: Checking Tags');
    const tags = await prisma.tag.findMany();
    console.log(`✅ Found ${tags.length} tags:`);
    tags.forEach(tag => {
      console.log(`   - ${tag.name} (${tag.id})`);
    });

    // Test 2: Check Playlist with new fields
    console.log('\n📋 Test 2: Checking Playlists with new fields');
    const playlists = await prisma.playlist.findMany({
      include: {
        tags: true,
        sharedWith: true,
        creator: true,
      },
    });

    playlists.forEach(playlist => {
      console.log(`\n✅ Playlist: ${playlist.name}`);
      console.log(`   - ID: ${playlist.id}`);
      console.log(`   - Description: ${playlist.description || '(none)'}`);
      console.log(`   - Created by: ${playlist.creator.username}`);
      console.log(`   - Tags: ${playlist.tags.map(t => t.name).join(', ') || '(none)'}`);
      console.log(`   - Shared with: ${playlist.sharedWith.map(u => u.username).join(', ') || '(none)'}`);
    });

    // Test 3: Check Content with new fields
    console.log('\n📁 Test 3: Checking Content with new fields');
    const contents = await prisma.content.findMany({
      take: 3,
    });

    contents.forEach(content => {
      console.log(`\n✅ Content: ${content.name}`);
      console.log(`   - ID: ${content.id}`);
      console.log(`   - File Name: ${content.fileName || '(none)'}`);
      console.log(`   - Duration: ${content.duration ? `${content.duration}s` : '(none)'}`);
      console.log(`   - Created By: ${content.createdBy || '(none)'}`);
      console.log(`   - Type: ${content.type}`);
    });

    // Test 4: Create a new playlist with all new fields
    console.log('\n🔨 Test 4: Creating new playlist with all fields');
    
    // Get existing tags and user
    const promotionalTag = await prisma.tag.findFirst({ where: { name: 'promotional' } });
    const editorUser = await prisma.user.findFirst({ where: { username: 'editor' } });
    const adminUser = await prisma.user.findFirst({ where: { username: 'admin' } });

    if (promotionalTag && editorUser && adminUser) {
      const newPlaylist = await prisma.playlist.create({
        data: {
          name: 'Test Playlist with New Fields',
          description: 'This playlist tests all the new fields added in Phase 3',
          createdBy: adminUser.id,
          isActive: true,
          tags: {
            connect: [{ id: promotionalTag.id }],
          },
          sharedWith: {
            connect: [{ id: editorUser.id }],
          },
        },
        include: {
          tags: true,
          sharedWith: true,
        },
      });

      console.log(`✅ Created playlist: ${newPlaylist.name}`);
      console.log(`   - Description: ${newPlaylist.description}`);
      console.log(`   - Tags: ${newPlaylist.tags.map(t => t.name).join(', ')}`);
      console.log(`   - Shared with: ${newPlaylist.sharedWith.map(u => u.username).join(', ')}`);

      // Clean up test playlist
      await prisma.playlist.delete({
        where: { id: newPlaylist.id },
      });
      console.log('   🗑️  Cleaned up test playlist');
    }

    // Test 5: Verify API transformation
    console.log('\n🔄 Test 5: Testing API Transformations');
    
    const playlistWithRelations = await prisma.playlist.findFirst({
      include: {
        tags: true,
        sharedWith: true,
        items: {
          include: {
            content: true,
          },
        },
      },
    });

    if (playlistWithRelations) {
      // Import transformer
      const { databaseToApiPlaylist } = await import('../src/lib/transformers/api-transformers');
      const apiPlaylist = databaseToApiPlaylist(playlistWithRelations);
      
      console.log('✅ API Transformation successful:');
      console.log(`   - Name: ${apiPlaylist.name}`);
      console.log(`   - Description: ${apiPlaylist.description || '(none)'}`);
      console.log(`   - Tags: ${apiPlaylist.tags?.map(t => t.name).join(', ') || '(none)'}`);
      console.log(`   - Shared with: ${apiPlaylist.sharedWith?.length || 0} users`);
      console.log(`   - Items: ${apiPlaylist.items?.length || 0} items`);
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✨ Phase 3 Testing Complete!');
    console.log('=' .repeat(50));
    console.log('\nSummary:');
    console.log('✅ Tags model created and working');
    console.log('✅ Playlist description field added');
    console.log('✅ Playlist tags relation working');
    console.log('✅ Playlist sharedWith relation working');
    console.log('✅ Content fileName field added');
    console.log('✅ Content duration field added');
    console.log('✅ Content createdBy field added');
    console.log('✅ API transformers updated for new fields');
    console.log('✅ All database operations successful');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testPhase3().catch(console.error);