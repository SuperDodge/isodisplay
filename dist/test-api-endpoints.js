#!/usr/bin/env ts-node
"use strict";
/**
 * Test script to verify API endpoints with transformers
 * Run with: npx ts-node scripts/test-api-endpoints.ts
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPlaylistEndpoints = testPlaylistEndpoints;
exports.testContentEndpoints = testContentEndpoints;
exports.testDisplayEndpoints = testDisplayEndpoints;
var API_BASE = 'http://localhost:3001';
// Get cookies from login
function getCookies() {
    return __awaiter(this, void 0, void 0, function () {
        var loginResponse, cookies, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/api/auth/signin/credentials"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                username: 'admin',
                                password: 'admin',
                                json: true,
                            }),
                        })];
                case 1:
                    loginResponse = _a.sent();
                    if (!loginResponse.ok) {
                        throw new Error("Login failed: ".concat(loginResponse.status));
                    }
                    cookies = loginResponse.headers.get('set-cookie');
                    return [2 /*return*/, cookies];
                case 2:
                    error_1 = _a.sent();
                    console.error('Failed to login:', error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function testPlaylistEndpoints(cookies) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, playlist_1, requiredFields, missingFields, item, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n🧪 Testing Playlist Endpoints...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/api/playlists"), {
                            headers: {
                                'Cookie': cookies || '',
                            },
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch playlists: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    console.log("  \u2713 GET /api/playlists - Retrieved ".concat(data.length, " playlists"));
                    // Validate response structure
                    if (data.length > 0) {
                        playlist_1 = data[0];
                        requiredFields = ['id', 'name', 'isActive', 'createdAt', 'updatedAt'];
                        missingFields = requiredFields.filter(function (field) { return !(field in playlist_1); });
                        if (missingFields.length > 0) {
                            console.error("  \u2717 Missing fields: ".concat(missingFields.join(', ')));
                        }
                        else {
                            console.log('  ✓ All required fields present');
                        }
                        // Check date format (should be ISO strings)
                        if (typeof playlist_1.createdAt === 'string' && playlist_1.createdAt.includes('T')) {
                            console.log('  ✓ Date fields are ISO strings');
                        }
                        else {
                            console.error('  ✗ Date fields are not ISO strings');
                        }
                        // Check for items array
                        if (Array.isArray(playlist_1.items)) {
                            console.log("  \u2713 Items array present with ".concat(playlist_1.items.length, " items"));
                            if (playlist_1.items.length > 0) {
                                item = playlist_1.items[0];
                                // Check item structure
                                if (item.transitionType && item.duration && item.content) {
                                    console.log('  ✓ Item structure is correct');
                                }
                                else {
                                    console.error('  ✗ Item structure is incorrect');
                                }
                            }
                        }
                    }
                    console.log('✅ Playlist endpoints test completed');
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error('❌ Playlist endpoints test failed:', error_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function testContentEndpoints(cookies) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, content_1, requiredFields, missingFields, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n🧪 Testing Content Endpoints...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/api/content"), {
                            headers: {
                                'Cookie': cookies || '',
                            },
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch content: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    console.log("  \u2713 GET /api/content - Retrieved ".concat(data.length, " content items"));
                    // Validate response structure
                    if (data.length > 0) {
                        content_1 = data[0];
                        requiredFields = ['id', 'name', 'type', 'createdAt', 'updatedAt'];
                        missingFields = requiredFields.filter(function (field) { return !(field in content_1); });
                        if (missingFields.length > 0) {
                            console.error("  \u2717 Missing fields: ".concat(missingFields.join(', ')));
                        }
                        else {
                            console.log('  ✓ All required fields present');
                        }
                        // Check fileSize is string (BigInt serialization)
                        if (content_1.fileSize === null || typeof content_1.fileSize === 'string') {
                            console.log('  ✓ FileSize is properly serialized');
                        }
                        else {
                            console.error('  ✗ FileSize is not properly serialized');
                        }
                        // Check for thumbnailUrl
                        if ('thumbnailUrl' in content_1) {
                            console.log('  ✓ ThumbnailUrl field present');
                        }
                        else {
                            console.error('  ✗ ThumbnailUrl field missing');
                        }
                    }
                    console.log('✅ Content endpoints test completed');
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    console.error('❌ Content endpoints test failed:', error_3);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function testDisplayEndpoints(cookies) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, display_1, requiredFields, missingFields, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n🧪 Testing Display Endpoints...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/api/displays"), {
                            headers: {
                                'Cookie': cookies || '',
                            },
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch displays: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    console.log("  \u2713 GET /api/displays - Retrieved ".concat(data.length, " displays"));
                    // Validate response structure
                    if (data.length > 0) {
                        display_1 = data[0];
                        requiredFields = ['id', 'name', 'resolution', 'orientation', 'status'];
                        missingFields = requiredFields.filter(function (field) { return !(field in display_1); });
                        if (missingFields.length > 0) {
                            console.error("  \u2717 Missing fields: ".concat(missingFields.join(', ')));
                        }
                        else {
                            console.log('  ✓ All required fields present');
                        }
                        // Check status field
                        if (['online', 'offline', 'error', 'unknown'].includes(display_1.status)) {
                            console.log('  ✓ Status field has valid value');
                        }
                        else {
                            console.error('  ✗ Status field has invalid value:', display_1.status);
                        }
                    }
                    console.log('✅ Display endpoints test completed');
                    return [3 /*break*/, 5];
                case 4:
                    error_4 = _a.sent();
                    console.error('❌ Display endpoints test failed:', error_4);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var cookies, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Starting API Endpoint Tests\n');
                    console.log('   Testing against:', API_BASE);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    // Wait a moment for server to be ready
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 2:
                    // Wait a moment for server to be ready
                    _a.sent();
                    // Get authentication cookies
                    console.log('🔐 Authenticating...');
                    return [4 /*yield*/, getCookies()];
                case 3:
                    cookies = _a.sent();
                    console.log('✅ Authentication successful');
                    // Test each endpoint group
                    return [4 /*yield*/, testPlaylistEndpoints(cookies || '')];
                case 4:
                    // Test each endpoint group
                    _a.sent();
                    return [4 /*yield*/, testContentEndpoints(cookies || '')];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, testDisplayEndpoints(cookies || '')];
                case 6:
                    _a.sent();
                    console.log('\n✨ All API endpoint tests completed!');
                    return [3 /*break*/, 8];
                case 7:
                    error_5 = _a.sent();
                    console.error('\n💥 Test suite failed:', error_5);
                    process.exit(1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Check if running directly
if (require.main === module) {
    main();
}
