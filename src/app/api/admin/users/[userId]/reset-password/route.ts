import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// Removed authOptions import
import { userDb } from '@/lib/db/users';
import * as bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

function generateTemporaryPassword(): string {
  // Generate a secure temporary password with uppercase, lowercase, numbers, and symbols
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each category
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Symbol
  
  // Fill the rest with random characters
  for (let i = 4; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.permissions?.includes('USER_CONTROL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    
    // Check if the user exists
    const targetUser = await userDb.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent resetting own password through admin interface
    const currentUser = await userDb.findByEmail(user.email!);
    if (currentUser?.id === userId) {
      return NextResponse.json(
        { error: 'Cannot reset your own password through admin interface' },
        { status: 403 }
      );
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    
    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    
    // Update user's password
    await userDb.update(userId, {
      password: hashedPassword,
    });

    // Log the password reset action (you might want to add an audit log table)
    console.log(`Admin ${user.email} reset password for user ${targetUser.email} (ID: ${targetUser.id})`);
    
    return NextResponse.json({ 
      message: 'Password reset successfully',
      temporaryPassword: temporaryPassword,
      username: targetUser.username,
      email: targetUser.email
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}