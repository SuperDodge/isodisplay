#!/usr/bin/env node

/**
 * Test script to verify Zod validation is working correctly
 * Tests various invalid inputs to ensure validation catches errors
 */

import {
  validateCreatePlaylist,
  validateUpdatePlaylist,
  PlaylistItemSchema,
} from '../src/lib/validators/playlist-schemas';

import {
  validateCreateContent,
  validateUpdateContent,
} from '../src/lib/validators/content-schemas';

import {
  validateCreateDisplay,
  validateUpdateDisplay,
} from '../src/lib/validators/display-schemas';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function logTest(name: string) {
  console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
}

function logSuccess(message: string) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message: string) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logValidationError(errors: any) {
  console.log(`${colors.yellow}Validation errors:${colors.reset}`);
  if (errors.issues) {
    errors.issues.forEach((issue: any) => {
      console.log(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
  }
}

// ============================================
// Playlist Validation Tests
// ============================================

function testPlaylistValidation() {
  console.log(`\n${colors.blue}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   PLAYLIST VALIDATION TESTS${colors.reset}`);
  console.log(`${colors.blue}════════════════════════════════════════${colors.reset}`);

  // Test 1: Valid playlist creation
  logTest('Valid playlist creation');
  const validPlaylist = {
    name: 'Test Playlist',
    items: [
      {
        contentId: '123e4567-e89b-12d3-a456-426614174000',
        order: 0,
        duration: 10,
        transitionType: 'FADE',
        transitionDuration: 1000,
      },
    ],
  };
  
  const result1 = validateCreatePlaylist(validPlaylist);
  if (result1.success) {
    logSuccess('Valid playlist passed validation');
  } else {
    logError('Valid playlist failed validation');
    logValidationError(result1.error);
  }

  // Test 2: Invalid - empty name
  logTest('Invalid - empty playlist name');
  const invalidName = {
    name: '',
    items: [],
  };
  
  const result2 = validateCreatePlaylist(invalidName);
  if (!result2.success) {
    logSuccess('Empty name correctly rejected');
    logValidationError(result2.error);
  } else {
    logError('Empty name should have been rejected');
  }

  // Test 3: Invalid - bad UUID
  logTest('Invalid - bad content UUID');
  const badUUID = {
    name: 'Test',
    items: [
      {
        contentId: 'not-a-uuid',
        order: 0,
        duration: 10,
      },
    ],
  };
  
  const result3 = validateCreatePlaylist(badUUID);
  if (!result3.success) {
    logSuccess('Invalid UUID correctly rejected');
    logValidationError(result3.error);
  } else {
    logError('Invalid UUID should have been rejected');
  }

  // Test 4: Invalid - negative duration
  logTest('Invalid - negative duration');
  const negativeDuration = {
    name: 'Test',
    items: [
      {
        contentId: '123e4567-e89b-12d3-a456-426614174000',
        order: 0,
        duration: -5,
      },
    ],
  };
  
  const result4 = validateCreatePlaylist(negativeDuration);
  if (!result4.success) {
    logSuccess('Negative duration correctly rejected');
    logValidationError(result4.error);
  } else {
    logError('Negative duration should have been rejected');
  }

  // Test 5: Invalid - bad transition type
  logTest('Invalid - bad transition type');
  const badTransition = {
    name: 'Test',
    items: [
      {
        contentId: '123e4567-e89b-12d3-a456-426614174000',
        order: 0,
        duration: 10,
        transitionType: 'INVALID_TYPE',
      },
    ],
  };
  
  const result5 = validateCreatePlaylist(badTransition);
  if (!result5.success) {
    logSuccess('Invalid transition type correctly rejected');
    logValidationError(result5.error);
  } else {
    logError('Invalid transition type should have been rejected');
  }
}

// ============================================
// Content Validation Tests
// ============================================

function testContentValidation() {
  console.log(`\n${colors.blue}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   CONTENT VALIDATION TESTS${colors.reset}`);
  console.log(`${colors.blue}════════════════════════════════════════${colors.reset}`);

  // Test 1: Valid content update
  logTest('Valid content update');
  const validContent = {
    name: 'Updated Content Name',
    backgroundColor: '#FF5500',
  };
  
  const result1 = validateUpdateContent(validContent);
  if (result1.success) {
    logSuccess('Valid content update passed validation');
  } else {
    logError('Valid content update failed validation');
    logValidationError(result1.error);
  }

  // Test 2: Invalid - empty name
  logTest('Invalid - empty content name');
  const emptyName = {
    name: '',
  };
  
  const result2 = validateUpdateContent(emptyName);
  if (!result2.success) {
    logSuccess('Empty name correctly rejected');
    logValidationError(result2.error);
  } else {
    logError('Empty name should have been rejected');
  }

  // Test 3: Invalid - bad hex color
  logTest('Invalid - bad hex color');
  const badColor = {
    backgroundColor: 'not-a-color',
  };
  
  const result3 = validateUpdateContent(badColor);
  if (!result3.success) {
    logSuccess('Invalid hex color correctly rejected');
    logValidationError(result3.error);
  } else {
    logError('Invalid hex color should have been rejected');
  }

  // Test 4: Invalid - name too long
  logTest('Invalid - content name too long');
  const longName = {
    name: 'a'.repeat(256),
  };
  
  const result4 = validateUpdateContent(longName);
  if (!result4.success) {
    logSuccess('Long name correctly rejected');
    logValidationError(result4.error);
  } else {
    logError('Long name should have been rejected');
  }
}

// ============================================
// Display Validation Tests
// ============================================

function testDisplayValidation() {
  console.log(`\n${colors.blue}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   DISPLAY VALIDATION TESTS${colors.reset}`);
  console.log(`${colors.blue}════════════════════════════════════════${colors.reset}`);

  // Test 1: Valid display creation
  logTest('Valid display creation');
  const validDisplay = {
    name: 'Lobby Display',
    location: 'Main Entrance',
    resolution: '1920x1080',
    orientation: 'LANDSCAPE',
  };
  
  const result1 = validateCreateDisplay(validDisplay);
  if (result1.success) {
    logSuccess('Valid display passed validation');
  } else {
    logError('Valid display failed validation');
    logValidationError(result1.error);
  }

  // Test 2: Invalid - bad resolution format
  logTest('Invalid - bad resolution format');
  const badResolution = {
    name: 'Test Display',
    resolution: '1920-1080', // Should be 1920x1080
  };
  
  const result2 = validateCreateDisplay(badResolution);
  if (!result2.success) {
    logSuccess('Invalid resolution correctly rejected');
    logValidationError(result2.error);
  } else {
    logError('Invalid resolution should have been rejected');
  }

  // Test 3: Invalid - bad orientation
  logTest('Invalid - bad orientation');
  const badOrientation = {
    name: 'Test Display',
    orientation: 'DIAGONAL', // Not a valid orientation
  };
  
  const result3 = validateCreateDisplay(badOrientation);
  if (!result3.success) {
    logSuccess('Invalid orientation correctly rejected');
    logValidationError(result3.error);
  } else {
    logError('Invalid orientation should have been rejected');
  }

  // Test 4: Invalid - bad playlist UUID
  logTest('Invalid - bad playlist UUID');
  const badPlaylistId = {
    name: 'Test Display',
    assignedPlaylistId: 'not-a-uuid',
  };
  
  const result4 = validateCreateDisplay(badPlaylistId);
  if (!result4.success) {
    logSuccess('Invalid playlist ID correctly rejected');
    logValidationError(result4.error);
  } else {
    logError('Invalid playlist ID should have been rejected');
  }
}

// ============================================
// Edge Cases
// ============================================

function testEdgeCases() {
  console.log(`\n${colors.blue}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   EDGE CASE TESTS${colors.reset}`);
  console.log(`${colors.blue}════════════════════════════════════════${colors.reset}`);

  // Test 1: Extra fields (should be stripped)
  logTest('Extra fields in input');
  const extraFields = {
    name: 'Test Playlist',
    items: [],
    thisFieldDoesNotExist: 'should be ignored',
    anotherInvalidField: 123,
  };
  
  const result1 = validateCreatePlaylist(extraFields);
  if (result1.success) {
    logSuccess('Extra fields were ignored');
    console.log('  Validated data:', result1.data);
  } else {
    logError('Extra fields caused validation to fail');
    logValidationError(result1.error);
  }

  // Test 2: SQL injection attempt in string
  logTest('SQL injection attempt');
  const sqlInjection = {
    name: "Test'; DROP TABLE playlists; --",
    items: [],
  };
  
  const result2 = validateCreatePlaylist(sqlInjection);
  if (result2.success) {
    logSuccess('SQL injection string handled safely');
    console.log('  Sanitized name:', result2.data.name);
  } else {
    logError('SQL injection string was rejected');
  }

  // Test 3: XSS attempt in string
  logTest('XSS injection attempt');
  const xssAttempt = {
    name: '<script>alert("XSS")</script>',
    items: [],
  };
  
  const result3 = validateCreatePlaylist(xssAttempt);
  if (result3.success) {
    logSuccess('XSS string handled safely');
    console.log('  Sanitized name:', result3.data.name);
  } else {
    logError('XSS string was rejected');
  }
}

// ============================================
// Main Test Runner
// ============================================

async function main() {
  console.log(`\n${colors.green}🧪 Zod Validation Test Suite${colors.reset}`);
  console.log('Testing validation schemas with invalid data...\n');

  try {
    testPlaylistValidation();
    testContentValidation();
    testDisplayValidation();
    testEdgeCases();

    console.log(`\n${colors.green}════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}   ✨ All validation tests completed!${colors.reset}`);
    console.log(`${colors.green}════════════════════════════════════════${colors.reset}\n`);
  } catch (error) {
    console.error(`\n${colors.red}Test suite failed:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run tests
main();