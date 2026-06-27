'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [authRes, historyRes] = await Promise.all([
          fetch('/api/auth'),
          fetch('/api/history?limit=20'),
        ]);
        const authData = await authRes.json();
        const historyData = await historyRes.json();

        if (!authData.user) {
          router.push('/login');
          return;
        }

        setUser(authData.user);
        setWeeks(historyData.weeks || []);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  function formatTimestamp(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    const hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${h}:${mins} ${ampm}`;
  }

  function formatWeekDates(weekStart, sundayISO) {
    const start = new Date(weekStart + 'T00:00:00Z');
    const end = new Date(sundayISO + 'T00:00:00Z');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[start.getUTCMonth()]} ${start.getUTCDate()} – ${months[end.getUTCMonth()]} ${end.getUTCDate()}`;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="page-container page-enter">
      <Header user={user} />

      <h1 className="page-title">History</h1>
      <p className="page-subtitle">
        The paper trail — who did what, and when.
      </p>

      {weeks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h2 className="empty-state-title">No history yet</h2>
          <p className="empty-state-text">
            Past weeks will show up here as the rotation progresses.
          </p>
        </div>
      ) : (
        weeks.map((week, index) => (
          <div
            key={week.weekStart}
            className={`history-card stagger-${(index % 4) + 1}`}
            id={`history-week-${week.weekStart}`}
          >
            <div className="history-header">
              <div className="history-owner">
                <div
                  className="history-avatar"
                  style={{ backgroundColor: week.owner?.color || '#555' }}
                >
                  {week.owner?.initial || '?'}
                </div>
                <div>
                  <div className="history-name">
                    {week.owner?.name || 'Unknown'}
                    {week.swapped && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-nudge)', marginLeft: '6px' }}>
                        🔄
                      </span>
                    )}
                  </div>
                  <div className="history-dates">
                    {formatWeekDates(week.weekStart, week.sundayISO)}
                  </div>
                </div>
              </div>
              <span
                className={`history-badge ${
                  week.completedCount === week.totalCount ? 'complete' : 'incomplete'
                }`}
              >
                {week.completedCount}/{week.totalCount}
              </span>
            </div>

            <div className="history-chores">
              {week.chores.map((chore) => (
                <div key={chore.id} className="history-chore">
                  <div
                    className={`history-chore-status ${
                      chore.completed ? 'done' : 'missed'
                    }`}
                  >
                    {chore.completed ? '✓' : '✗'}
                  </div>
                  <span className="history-chore-icon">{chore.icon}</span>
                  <span
                    className={`history-chore-name ${
                      !chore.completed ? 'missed-name' : ''
                    }`}
                  >
                    {chore.name}
                  </span>
                  {chore.completed && chore.completedAt && (
                    <span className="history-chore-time">
                      {formatTimestamp(chore.completedAt)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
