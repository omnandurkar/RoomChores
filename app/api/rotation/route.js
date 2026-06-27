import { NextResponse } from 'next/server';
import { getRotationSchedule } from '@/lib/rotation';
import { getHistory, getAcceptedSwap } from '@/lib/db';
import { PEOPLE } from '@/lib/rotation';

/** GET /api/rotation — Get rotation schedule with completion data */
export async function GET() {
  const schedule = getRotationSchedule(8, 12);

  const pastWeekStarts = schedule.filter((w) => w.isPast).map((w) => w.weekStartISO);
  const historyData = pastWeekStarts.length > 0 ? await getHistory(pastWeekStarts) : [];

  const enriched = [];
  for (const week of schedule) {
    const history = historyData.find((h) => h.weekStart === week.weekStartISO);
    const swap = await getAcceptedSwap(week.weekStartISO);

    let effectivePerson = week.person;
    if (swap) {
      const swappedPerson = PEOPLE.find((p) => p.id === swap.target_id);
      if (swappedPerson) effectivePerson = swappedPerson;
    }

    enriched.push({
      ...week,
      person: effectivePerson,
      swapped: !!swap,
      originalPerson: swap ? week.person : null,
      completedCount: history?.completedCount ?? null,
      totalCount: history?.totalCount ?? 4,
    });
  }

  return NextResponse.json({ schedule: enriched });
}
