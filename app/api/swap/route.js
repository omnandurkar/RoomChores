import { NextResponse } from 'next/server';
import { createSwapRequest, resolveSwapRequest, getSwapRequests, getAcceptedSwap } from '@/lib/db';
import { getWeekInfo } from '@/lib/rotation';
import { getSessionUserId } from '@/lib/session';

/** GET /api/swap — Get swap requests for current week */
export async function GET() {
  const weekInfo = getWeekInfo(new Date());
  if (!weekInfo) {
    return NextResponse.json({ requests: [] });
  }

  const requests = await getSwapRequests(weekInfo.weekStartISO);
  const acceptedSwap = await getAcceptedSwap(weekInfo.weekStartISO);

  return NextResponse.json({ requests, acceptedSwap });
}

/** POST /api/swap — Create a swap request */
export async function POST(request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  const { targetId } = await request.json();
  const weekInfo = getWeekInfo(new Date());
  if (!weekInfo) {
    return NextResponse.json({ error: 'Rotation has not started yet' }, { status: 400 });
  }

  const result = await createSwapRequest(weekInfo.weekStartISO, userId, targetId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}

/** PATCH /api/swap — Accept or decline a swap request */
export async function PATCH(request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  const { requestId, status } = await request.json();
  if (!['accepted', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const result = await resolveSwapRequest(requestId, status);
  return NextResponse.json(result);
}
