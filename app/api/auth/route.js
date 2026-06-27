import { NextResponse } from 'next/server';
import { getUsers, getUserById } from '@/lib/db';
import { setSession, getSessionUserId, clearSession } from '@/lib/session';

/** GET /api/auth — Get current session */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ user: null });
  }
  const user = await getUserById(userId);
  return NextResponse.json({ user: user || null });
}

/** POST /api/auth — Login (set session cookie) */
export async function POST(request) {
  const { userId } = await request.json();
  const user = await getUserById(userId);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await setSession(userId);
  return NextResponse.json({ user });
}

/** DELETE /api/auth — Logout */
export async function DELETE() {
  await clearSession();
  return NextResponse.json({ success: true });
}
