/**
 * Cookie-based session helpers for the simple 4-user auth.
 * Server-side only.
 */
import { cookies } from 'next/headers';

const COOKIE_NAME = 'roomchores_user';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Get the current session user ID from cookies.
 * @returns {number|null} User ID or null if not logged in
 */
export async function getSessionUserId() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return null;
  const id = parseInt(cookie.value, 10);
  return isNaN(id) ? null : id;
}

/**
 * Set the session cookie to a user ID.
 * @param {number} userId
 */
export async function setSession(userId) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, String(userId), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear the session cookie.
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
