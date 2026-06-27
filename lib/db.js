/**
 * Database layer using Turso (@libsql/client) for cloud-hosted SQLite.
 * Server-side only — never import this in client components.
 * 
 * Falls back to a local file-based SQLite if TURSO_DATABASE_URL is not set
 * (for local development without Turso).
 */
import { createClient } from '@libsql/client';

let _db = null;

function getDb() {
  if (_db) return _db;

  if (process.env.TURSO_DATABASE_URL) {
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  } else {
    // Local file fallback for development
    _db = createClient({
      url: 'file:roomchores.db',
    });
  }

  return _db;
}

/**
 * Initialize tables and seed data. Must be called once on app startup.
 */
export async function initDb() {
  const db = getDb();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      rotation_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chores (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL DEFAULT '',
      display_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT NOT NULL,
      chore_id INTEGER NOT NULL,
      completed_at TEXT,
      completed_by INTEGER,
      FOREIGN KEY (chore_id) REFERENCES chores(id),
      FOREIGN KEY (completed_by) REFERENCES users(id),
      UNIQUE(week_start, chore_id)
    );

    CREATE TABLE IF NOT EXISTS swap_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT NOT NULL,
      requester_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY (requester_id) REFERENCES users(id),
      FOREIGN KEY (target_id) REFERENCES users(id)
    );
  `);

  // Seed users
  const userCount = await db.execute('SELECT COUNT(*) as count FROM users');
  if (userCount.rows[0].count === 0) {
    await db.execute({ sql: 'INSERT INTO users (id, name, rotation_order) VALUES (?, ?, ?)', args: [1, 'Sarvesh', 0] });
    await db.execute({ sql: 'INSERT INTO users (id, name, rotation_order) VALUES (?, ?, ?)', args: [2, 'Jayesh', 1] });
    await db.execute({ sql: 'INSERT INTO users (id, name, rotation_order) VALUES (?, ?, ?)', args: [3, 'Om', 2] });
    await db.execute({ sql: 'INSERT INTO users (id, name, rotation_order) VALUES (?, ?, ?)', args: [4, 'Saiprasad', 3] });
  }

  // Seed chores
  const choreCount = await db.execute('SELECT COUNT(*) as count FROM chores');
  if (choreCount.rows[0].count === 0) {
    await db.execute({ sql: 'INSERT INTO chores (id, name, icon, display_order) VALUES (?, ?, ?, ?)', args: [1, 'Clean the Bathroom', '🚿', 0] });
    await db.execute({ sql: 'INSERT INTO chores (id, name, icon, display_order) VALUES (?, ?, ?, ?)', args: [2, 'Clean the Commode/Toilet', '🚽', 1] });
    await db.execute({ sql: 'INSERT INTO chores (id, name, icon, display_order) VALUES (?, ?, ?, ?)', args: [3, 'Take the Trash Out', '🗑️', 2] });
    await db.execute({ sql: 'INSERT INTO chores (id, name, icon, display_order) VALUES (?, ?, ?, ?)', args: [4, 'Clean the Kitchen', '🍳', 3] });
  }
}

// ─── Ensure DB is initialized ───────────────────────────────────
let _initPromise = null;

async function ensureInit() {
  if (!_initPromise) {
    _initPromise = initDb();
  }
  await _initPromise;
}

// ─── Query Helpers ──────────────────────────────────────────────

/**
 * Get all users.
 */
export async function getUsers() {
  await ensureInit();
  const result = await getDb().execute('SELECT * FROM users ORDER BY rotation_order');
  return result.rows;
}

/**
 * Get a single user by ID.
 */
export async function getUserById(id) {
  await ensureInit();
  const result = await getDb().execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
  return result.rows[0] || null;
}

/**
 * Get chore completion states for a specific week.
 */
export async function getCompletions(weekStart) {
  await ensureInit();
  const db = getDb();
  const choresResult = await db.execute('SELECT * FROM chores ORDER BY display_order');
  const completionsResult = await db.execute({
    sql: 'SELECT * FROM weekly_completions WHERE week_start = ?',
    args: [weekStart],
  });

  return choresResult.rows.map((chore) => {
    const completion = completionsResult.rows.find((c) => c.chore_id === chore.id);
    return {
      ...chore,
      completed: !!completion?.completed_at,
      completedAt: completion?.completed_at || null,
      completedBy: completion?.completed_by || null,
    };
  });
}

/**
 * Toggle a chore's completion status for a week.
 */
export async function toggleChore(weekStart, choreId, userId) {
  await ensureInit();
  const db = getDb();

  const existing = await db.execute({
    sql: 'SELECT * FROM weekly_completions WHERE week_start = ? AND chore_id = ?',
    args: [weekStart, choreId],
  });

  if (existing.rows.length > 0 && existing.rows[0].completed_at) {
    // Un-mark
    await db.execute({
      sql: 'UPDATE weekly_completions SET completed_at = NULL, completed_by = NULL WHERE id = ?',
      args: [existing.rows[0].id],
    });
    return { completed: false, completedAt: null, completedBy: null };
  } else if (existing.rows.length > 0) {
    // Row exists but unchecked; mark done
    const now = new Date().toISOString();
    await db.execute({
      sql: 'UPDATE weekly_completions SET completed_at = ?, completed_by = ? WHERE id = ?',
      args: [now, userId, existing.rows[0].id],
    });
    return { completed: true, completedAt: now, completedBy: userId };
  } else {
    // Create new
    const now = new Date().toISOString();
    await db.execute({
      sql: 'INSERT INTO weekly_completions (week_start, chore_id, completed_at, completed_by) VALUES (?, ?, ?, ?)',
      args: [weekStart, choreId, now, userId],
    });
    return { completed: true, completedAt: now, completedBy: userId };
  }
}

/**
 * Get history of past weeks.
 */
export async function getHistory(weekStarts) {
  await ensureInit();
  const db = getDb();
  const choresResult = await db.execute('SELECT * FROM chores ORDER BY display_order');

  const results = [];
  for (const weekStart of weekStarts) {
    const completions = await db.execute({
      sql: `SELECT wc.*, u.name as completed_by_name 
            FROM weekly_completions wc 
            LEFT JOIN users u ON wc.completed_by = u.id 
            WHERE wc.week_start = ?`,
      args: [weekStart],
    });

    const choreStates = choresResult.rows.map((chore) => {
      const completion = completions.rows.find((c) => c.chore_id === chore.id);
      return {
        id: chore.id,
        name: chore.name,
        icon: chore.icon,
        completed: !!completion?.completed_at,
        completedAt: completion?.completed_at || null,
        completedByName: completion?.completed_by_name || null,
      };
    });

    results.push({
      weekStart,
      chores: choreStates,
      completedCount: choreStates.filter((c) => c.completed).length,
      totalCount: choresResult.rows.length,
    });
  }

  return results;
}

/**
 * Get the current streak.
 */
export async function getStreak(currentWeekStart) {
  await ensureInit();
  const db = getDb();
  const ROTATION_START_MS = Date.UTC(2026, 5, 22);
  const currentStartParts = currentWeekStart.split('-');
  const currentMs = Date.UTC(
    parseInt(currentStartParts[0]),
    parseInt(currentStartParts[1]) - 1,
    parseInt(currentStartParts[2])
  );

  let streak = 0;
  let checkMs = currentMs - 7 * 24 * 60 * 60 * 1000;

  while (checkMs >= ROTATION_START_MS) {
    const checkDate = new Date(checkMs);
    const y = checkDate.getUTCFullYear();
    const m = String(checkDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getUTCDate()).padStart(2, '0');
    const weekStartStr = `${y}-${m}-${d}`;

    const completions = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM weekly_completions WHERE week_start = ? AND completed_at IS NOT NULL',
      args: [weekStartStr],
    });

    if (completions.rows[0].count === 4) {
      streak++;
      checkMs -= 7 * 24 * 60 * 60 * 1000;
    } else {
      break;
    }
  }

  return streak;
}

// ─── Swap Request Helpers ───────────────────────────────────────

export async function createSwapRequest(weekStart, requesterId, targetId) {
  await ensureInit();
  const db = getDb();

  const existing = await db.execute({
    sql: 'SELECT * FROM swap_requests WHERE week_start = ? AND status = ?',
    args: [weekStart, 'pending'],
  });

  if (existing.rows.length > 0) {
    return { error: 'There is already a pending swap request for this week.' };
  }

  const now = new Date().toISOString();
  const result = await db.execute({
    sql: 'INSERT INTO swap_requests (week_start, requester_id, target_id, status, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [weekStart, requesterId, targetId, 'pending', now],
  });

  return { id: Number(result.lastInsertRowid), status: 'pending' };
}

export async function resolveSwapRequest(requestId, status) {
  await ensureInit();
  const now = new Date().toISOString();
  await getDb().execute({
    sql: 'UPDATE swap_requests SET status = ?, resolved_at = ? WHERE id = ?',
    args: [status, now, requestId],
  });
  return { status };
}

export async function getSwapRequests(weekStart) {
  await ensureInit();
  const result = await getDb().execute({
    sql: `SELECT sr.*, 
            r.name as requester_name, 
            t.name as target_name
     FROM swap_requests sr
     JOIN users r ON sr.requester_id = r.id
     JOIN users t ON sr.target_id = t.id
     WHERE sr.week_start = ?
     ORDER BY sr.created_at DESC`,
    args: [weekStart],
  });
  return result.rows;
}

export async function getAcceptedSwap(weekStart) {
  await ensureInit();
  const result = await getDb().execute({
    sql: `SELECT sr.*, 
            r.name as requester_name, 
            t.name as target_name
     FROM swap_requests sr
     JOIN users r ON sr.requester_id = r.id
     JOIN users t ON sr.target_id = t.id
     WHERE sr.week_start = ? AND sr.status = 'accepted'
     LIMIT 1`,
    args: [weekStart],
  });
  return result.rows[0] || null;
}

export default getDb;
