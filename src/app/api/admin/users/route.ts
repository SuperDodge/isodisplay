import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { userDb } from '@/lib/db/users';
import { Permission } from '@/generated/prisma';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  permissions: z.array(z.nativeEnum(Permission)).optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    console.log('Current user in users API:', user);
    console.log('User permissions:', user?.permissions);
    
    if (!user || !user.permissions?.includes(Permission.USER_CONTROL)) {
      console.log('User lacks USER_CONTROL permission');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await userDb.findMany();
    console.log('Found users:', users.length);
    console.log('Users data:', JSON.stringify(users, null, 2));
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.permissions?.includes(Permission.USER_CONTROL)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await userDb.findByEmail(validatedData.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create the user
    const newUser = await userDb.create({
      email: validatedData.email,
      username: validatedData.username,
      password: validatedData.password,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      permissions: validatedData.permissions,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}