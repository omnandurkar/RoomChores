import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';

/** GET /api/users — Get all users */
export async function GET() {
  const users = await getUsers();
  return NextResponse.json({ users });
}
