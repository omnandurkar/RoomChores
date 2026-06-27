import { NextResponse } from 'next/server';
import { getCompletions, toggleChore, getStreak, getAcceptedSwap } from '@/lib/db';
import { getWeekInfo, PEOPLE } from '@/lib/rotation';
import { getSessionUserId } from '@/lib/session';

/** GET /api/chores — Get current week's chores + state */
export async function GET() {
  const weekInfo = getWeekInfo(new Date());
  if (!weekInfo) {
    return NextResponse.json({ error: 'Rotation has not started yet' }, { status: 400 });
  }

  // Check for accepted swap that overrides ownership
  const swap = await getAcceptedSwap(weekInfo.weekStartISO);
  let effectiveOwner = weekInfo.person;
  if (swap) {
    const swappedPerson = PEOPLE.find((p) => p.id === swap.target_id);
    if (swappedPerson) {
      effectiveOwner = swappedPerson;
    }
  }

  const chores = await getCompletions(weekInfo.weekStartISO);
  const completedCount = chores.filter((c) => c.completed).length;
  const streak = await getStreak(weekInfo.weekStartISO);

  const currentWeekCleared = completedCount === 4;

  return NextResponse.json({
    weekInfo: {
      ...weekInfo,
      person: effectiveOwner,
      swapped: !!swap,
      originalPerson: swap ? weekInfo.person : null,
    },
    chores,
    completedCount,
    totalCount: 4,
    streak: currentWeekCleared ? streak + 1 : streak,
    allDone: completedCount === 4,
  });
}

/** POST /api/chores — Toggle a chore */
export async function POST(request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  const { choreId } = await request.json();
  const weekInfo = getWeekInfo(new Date());
  if (!weekInfo) {
    return NextResponse.json({ error: 'Rotation has not started yet' }, { status: 400 });
  }

  const result = await toggleChore(weekInfo.weekStartISO, choreId, userId);
  const chores = await getCompletions(weekInfo.weekStartISO);
  const completedCount = chores.filter((c) => c.completed).length;

  return NextResponse.json({
    toggled: result,
    chores,
    completedCount,
    totalCount: 4,
    allDone: completedCount === 4,
  });
}
