'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PEOPLE } from '@/lib/rotation';
import { getUrgencyTier, getUrgencyMessage, getUrgencySubtext } from '@/lib/urgency';
import Header from '@/components/Header';
import ProgressRing from '@/components/ProgressRing';
import ConfettiCelebration from '@/components/ConfettiCelebration';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [overridePrompt, setOverridePrompt] = useState({ active: false, step: 0, choreId: null });
  const prevAllDone = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const [authRes, choresRes] = await Promise.all([
        fetch('/api/auth'),
        fetch('/api/chores'),
      ]);
      const authData = await authRes.json();
      const choresData = await choresRes.json();

      if (!authData.user) {
        router.push('/login');
        return;
      }

      setUser(authData.user);
      setData(choresData);

      // Trigger confetti when transitioning to allDone
      if (choresData.allDone && !prevAllDone.current) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
      prevAllDone.current = choresData.allDone;
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleToggleChore(choreId, force = false) {
    // Find the chore to see if it's currently completed
    const chore = data.chores.find(c => c.id === choreId);
    if (!chore) return;

    const isOwner = user.id === data.weekInfo.person.id;
    
    // If not the owner and trying to mark as completed (not undoing)
    if (!isOwner && !chore.completed && !force) {
      setOverridePrompt({ active: true, step: 1, choreId });
      return;
    }

    try {
      const res = await fetch('/api/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choreId }),
      });
      const result = await res.json();

      setData((prev) => ({
        ...prev,
        chores: result.chores,
        completedCount: result.completedCount,
        allDone: result.allDone,
      }));

      // Trigger confetti when completing all chores
      if (result.allDone && !prevAllDone.current) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
      prevAllDone.current = result.allDone;
      setOverridePrompt({ active: false, step: 0, choreId: null });
    } catch (err) {
      console.error('Failed to toggle chore:', err);
    }
  }

  function handleOverrideResponse(confirmed) {
    if (!confirmed) {
      setOverridePrompt({ active: false, step: 0, choreId: null });
      return;
    }

    if (overridePrompt.step === 1) {
      setOverridePrompt(prev => ({ ...prev, step: 2 }));
    } else if (overridePrompt.step === 2) {
      handleToggleChore(overridePrompt.choreId, true);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!data || !data.weekInfo) {
    return (
      <div className="page-container page-enter">
        <Header user={user} />
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h2 className="empty-state-title">Rotation hasn't started yet</h2>
          <p className="empty-state-text">
            The chore rotation begins on June 22, 2026. Check back then!
          </p>
        </div>
      </div>
    );
  }

  const { weekInfo, chores, completedCount, totalCount, streak, allDone } = data;
  const urgencyTier = getUrgencyTier(new Date(), totalCount - completedCount);
  const urgencyMessage = getUrgencyMessage(urgencyTier);
  const urgencySubtext = getUrgencySubtext(urgencyTier);

  // Get next week's person
  const nextPersonIndex = (weekInfo.personIndex + 1) % 4;
  const nextPerson = PEOPLE[nextPersonIndex];

  // Format chore timestamp
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

  return (
    <div className="page-container page-enter">
      <ConfettiCelebration trigger={showConfetti} />
      <Header user={user} />

      {/* Streak Badge */}
      {streak > 0 && (
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <span className="streak-badge animate-fade-in">
            🔥 {streak} week{streak !== 1 ? 's' : ''} fully cleared
          </span>
        </div>
      )}

      {/* Hero Card */}
      <div className="hero-card animate-slide-up" id="hero-card">
        <div className="hero-label">This Week's Owner</div>
        <div
          className="hero-avatar"
          style={{
            backgroundColor: weekInfo.person.color,
            borderColor: weekInfo.person.color,
          }}
        >
          {weekInfo.person.initial}
        </div>
        <h1 className="hero-name">{weekInfo.person.name}</h1>
        <p className="hero-dates">
          {weekInfo.mondayDisplay} – {weekInfo.sundayDisplay}
        </p>
        {weekInfo.swapped && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-nudge)', marginTop: '8px' }}>
            🔄 Swapped from {weekInfo.originalPerson?.name}
          </p>
        )}
      </div>

      {/* All Done Banner */}
      {allDone ? (
        <div className="all-done-banner animate-fade-in" id="all-done-banner">
          <div className="all-done-emoji">✨</div>
          <h2 className="all-done-title">All done this week!</h2>
          <p className="all-done-subtitle">
            Sit back and relax, you've earned it.
          </p>
        </div>
      ) : (
        /* Urgency Banner */
        <div
          className={`urgency-banner urgency-${urgencyTier} animate-slide-up stagger-1`}
          id="urgency-banner"
        >
          <div className="urgency-dot" />
          <div className="urgency-text">
            <div className="urgency-message">{urgencyMessage}</div>
            <div className="urgency-subtext">{urgencySubtext}</div>
          </div>
        </div>
      )}

      {/* Progress Section */}
      <div className="progress-section animate-slide-up stagger-2">
        <div>
          <div className="progress-label">Progress</div>
          <div className="progress-count">
            {completedCount} of {totalCount}
          </div>
        </div>
        <ProgressRing completed={completedCount} total={totalCount} />
      </div>

      {/* Chore Cards */}
      <div className="chores-grid" id="chores-grid">
        {chores.map((chore, index) => (
          <button
            key={chore.id}
            className={`chore-card ${chore.completed ? 'done' : ''} ${
              !chore.completed ? `urgency-${urgencyTier}` : ''
            } stagger-${index + 1}`}
            onClick={() => handleToggleChore(chore.id)}
            id={`chore-card-${chore.id}`}
          >
            <div className="chore-checkbox">
              {chore.completed && (
                <svg viewBox="0 0 24 24">
                  <polyline points="6 12 10 16 18 8" />
                </svg>
              )}
            </div>
            <span className="chore-icon">{chore.icon}</span>
            <div className="chore-info">
              <div className="chore-name">{chore.name}</div>
              {chore.completed && chore.completedAt && (
                <div className="chore-timestamp">
                  {chore.completedBy !== weekInfo.person.id ? (
                    <>Done by <strong>{PEOPLE.find(p => p.id === chore.completedBy)?.name}</strong> at {formatTimestamp(chore.completedAt)}</>
                  ) : (
                    <>Done {formatTimestamp(chore.completedAt)}</>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Override Prompt Modal */}
      {overridePrompt.active && (
        <div className="switch-modal-overlay">
          <div className="switch-modal" style={{ textAlign: 'center' }}>
            <div className="switch-modal-title" style={{ marginBottom: '16px', fontSize: '1.25rem' }}>
              {overridePrompt.step === 1 ? "Wait a second..." : "Are you sure?"}
            </div>
            <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
              {overridePrompt.step === 1 
                ? "This isn't your week. Do you still want to do the job?" 
                : "Just confirming you actually want to mark this as done for them."}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => handleOverrideResponse(false)}
                style={{ flex: 1 }}
              >
                No
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleOverrideResponse(true)}
                style={{ flex: 1 }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Up Next */}
      <div className="up-next-card animate-slide-up" style={{ animationDelay: '0.25s' }} id="up-next-card">
        <div
          className="up-next-avatar"
          style={{ backgroundColor: nextPerson.color }}
        >
          {nextPerson.initial}
        </div>
        <div>
          <div className="up-next-label">Up Next</div>
          <div className="up-next-name">{nextPerson.name}</div>
        </div>
      </div>
    </div>
  );
}
