'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function RotationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [authRes, rotationRes] = await Promise.all([
          fetch('/api/auth'),
          fetch('/api/rotation'),
        ]);
        const authData = await authRes.json();
        const rotationData = await rotationRes.json();

        if (!authData.user) {
          router.push('/login');
          return;
        }

        setUser(authData.user);
        setSchedule(rotationData.schedule || []);
      } catch (err) {
        console.error('Failed to fetch rotation:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  // Scroll to current week on load
  useEffect(() => {
    if (currentRef.current) {
      setTimeout(() => {
        currentRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 300);
    }
  }, [schedule]);

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

      <h1 className="page-title">Rotation</h1>
      <p className="page-subtitle">
        See who's up — past, present, and future.
      </p>

      <div className="timeline" id="rotation-timeline">
        {schedule.map((week, index) => (
          <div
            key={week.weekStartISO}
            className={`timeline-item ${
              week.isCurrent ? 'current' : week.isPast ? 'past' : 'future'
            } stagger-${(index % 4) + 1}`}
            ref={week.isCurrent ? currentRef : null}
          >
            <div className="timeline-dot" />
            <div className="timeline-content">
              {week.isCurrent && (
                <div className="timeline-week-badge">This Week</div>
              )}
              <div className="timeline-name" style={{ color: week.person?.color }}>
                {week.person?.name}
                {week.swapped && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-nudge)', marginLeft: '8px' }}>
                    🔄 swapped
                  </span>
                )}
              </div>
              <div className="timeline-dates">
                {week.mondayDisplay} – {week.sundayDisplay}
              </div>

              {/* Show completion dots for past weeks */}
              {week.isPast && week.completedCount !== null && (
                <div className="timeline-completion">
                  <div className="timeline-completion-dots">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`timeline-completion-dot ${
                          i < week.completedCount
                            ? 'filled'
                            : 'missed'
                        }`}
                      />
                    ))}
                  </div>
                  <span>
                    {week.completedCount}/{week.totalCount} done
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
