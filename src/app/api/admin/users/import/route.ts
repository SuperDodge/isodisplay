import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';
// Removed authOptions import
import { userDb } from '@/lib/db/users';
import { Permission } from '@/generated/prisma';
import { z } from 'zod';

const csvUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  permissions: z.array(z.nativeEnum(Permission)).optional(),
});

type CSVUserInput = z.infer<typeof csvUserSchema>;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.permissions?.includes('USER_CONTROL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must have header and at least one data row' }, { status: 400 });
    }

    // Parse CSV header
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    // Validate required columns
    const requiredColumns = ['username', 'email', 'password'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}` 
      }, { status: 400 });
    }

    // Parse data rows
    const users: CSVUserInput[] = [];
    const errors: string[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const rowData: any = {};
      
      headers.forEach((header, index) => {
        rowData[header] = values[index] || '';
      });
      
      try {
        // Parse permissions if provided
        if (rowData.permissions) {
          const permissionStrings = rowData.permissions.split(';').map((p: string) => p.trim()).filter(Boolean);
          rowData.permissions = permissionStrings.filter((p: string) => 
            Object.values(Permission).includes(p as Permission)
          );
        } else {
          rowData.permissions = [];
        }
        
        // Validate user data
        const validatedUser = csvUserSchema.parse(rowData);
        users.push(validatedUser);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(`Row ${i + 1}: ${error.errors.map(e => e.message).join(', ')}`);
        } else {
          errors.push(`Row ${i + 1}: Invalid data format`);
        }
      }
    }
    
    if (errors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation errors found',
        details: errors 
      }, { status: 400 });
    }

    // Check for duplicate emails in CSV
    const emails = users.map(u => u.email);
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    
    if (duplicateEmails.length > 0) {
      return NextResponse.json({ 
        error: `Duplicate emails found in CSV: ${[...new Set(duplicateEmails)].join(', ')}` 
      }, { status: 400 });
    }

    // Check for existing users
    const existingUsersPromises = users.map(user => userDb.findByEmail(user.email));
    const existingUsers = await Promise.all(existingUsersPromises);
    const existingEmails = existingUsers
      .filter(user => user !== null)
      .map(user => user!.email);
    
    if (existingEmails.length > 0) {
      return NextResponse.json({ 
        error: `Users with these emails already exist: ${existingEmails.join(', ')}` 
      }, { status: 400 });
    }

    // Create users
    const createdUsers = [];
    const creationErrors = [];
    
    for (const userData of users) {
      try {
        const user = await userDb.create({
          email: userData.email,
          username: userData.username,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          permissions: userData.permissions || [],
        });
        createdUsers.push(user);
      } catch (error) {
        creationErrors.push(`Failed to create user ${userData.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    if (creationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Some users could not be created',
        details: creationErrors,
        created: createdUsers.length
      }, { status: 207 }); // Partial success
    }

    return NextResponse.json({ 
      message: `Successfully imported ${createdUsers.length} user(s)`,
      count: createdUsers.length 
    });
  } catch (error) {
    console.error('Error importing users:', error);
    return NextResponse.json(
      { error: 'Failed to import users' },
      { status: 500 }
    );
  }
}