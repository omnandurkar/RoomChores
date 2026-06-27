import { NextResponse } from 'next/server';
import { getHistory, getAcceptedSwap } from '@/lib/db';
import { getWeekInfo, PEOPLE, formatDateISO } from '@/lib/rotation';

/** GET /api/history — Get past weeks' completion data */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '12', 10);

  const currentWeek = getWeekInfo(new Date());
  if (!currentWeek) {
    return NextResponse.json({ weeks: [] });
  }

  const ROTATION_START_MS = Date.UTC(2026, 5, 22);
  const weekStarts = [];
  for (let i = 1; i <= limit; i++) {
    const pastMs = Date.UTC(2026, 5, 22) + (currentWeek.weekIndex - i) * 7 * 24 * 60 * 60 * 1000;
    if (pastMs < ROTATION_START_MS) break;
    const pastDate = new Date(pastMs);
    weekStarts.push(formatDateISO(pastDate));
  }

  if (weekStarts.length === 0) {
    return NextResponse.json({ weeks: [] });
  }

  const historyData = await getHistory(weekStarts);

  const weeks = [];
  for (const week of historyData) {
    const weekInfo = getWeekInfo(new Date(week.weekStart + 'T00:00:00Z'));
    const swap = await getAcceptedSwap(week.weekStart);
    let owner = weekInfo?.person || null;
    if (swap) {
      const swappedPerson = PEOPLE.find((p) => p.id === swap.target_id);
      if (swappedPerson) owner = swappedPerson;
    }

    const sunday = new Date(new Date(week.weekStart + 'T00:00:00Z').getTime() + 6 * 24 * 60 * 60 * 1000);

    weeks.push({
      ...week,
      owner,
      swapped: !!swap,
      originalOwner: swap ? weekInfo?.person : null,
      sundayISO: formatDateISO(sunday),
    });
  }

  return NextResponse.json({ weeks });
}
