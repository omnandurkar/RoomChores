'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PEOPLE, getWeekInfo } from '@/lib/rotation';
import Header from '@/components/Header';

export default function SwapPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [acceptedSwap, setAcceptedSwap] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const weekInfo = getWeekInfo(new Date());

  useEffect(() => {
    async function fetchData() {
      try {
        const [authRes, swapRes] = await Promise.all([
          fetch('/api/auth'),
          fetch('/api/swap'),
        ]);
        const authData = await authRes.json();
        const swapData = await swapRes.json();

        if (!authData.user) {
          router.push('/login');
          return;
        }

        setUser(authData.user);
        setRequests(swapData.requests || []);
        setAcceptedSwap(swapData.acceptedSwap || null);
      } catch (err) {
        console.error('Failed to fetch swap data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  async function handleCreateRequest() {
    if (!selectedTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: selectedTarget }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        // Refresh data
        const swapRes = await fetch('/api/swap');
        const swapData = await swapRes.json();
        setRequests(swapData.requests || []);
        setSelectedTarget(null);
      }
    } catch (err) {
      console.error('Failed to create swap request:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(requestId, status) {
    try {
      await fetch('/api/swap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status }),
      });
      // Refresh data
      const swapRes = await fetch('/api/swap');
      const swapData = await swapRes.json();
      setRequests(swapData.requests || []);
      setAcceptedSwap(swapData.acceptedSwap || null);
    } catch (err) {
      console.error('Failed to resolve swap:', err);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  const isCurrentOwner = user && weekInfo && weekInfo.person.id === user.id;
  const otherPeople = PEOPLE.filter((p) => p.id !== user?.id);
  const hasPendingRequest = requests.some((r) => r.status === 'pending');
  const pendingForMe = requests.find(
    (r) => r.status === 'pending' && r.target_id === user?.id
  );

  return (
    <div className="page-container page-enter">
      <Header user={user} />

      <h1 className="page-title">Swap</h1>
      <p className="page-subtitle">
        Need someone to cover your week? Request a swap.
      </p>

      {/* Accepted swap notice */}
      {acceptedSwap && (
        <div
          className="card animate-slide-up"
          style={{
            marginBottom: '24px',
            borderColor: 'var(--color-accent)',
            background: 'var(--color-accent-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>🔄</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                Swap Active This Week
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {acceptedSwap.requester_name} swapped with {acceptedSwap.target_name}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending request for current user to respond */}
      {pendingForMe && (
        <div className="swap-request-card animate-slide-up" id="pending-swap-request">
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '1.2rem' }}>📩</span>
            <span style={{ fontWeight: 600, marginLeft: '8px' }}>
              {pendingForMe.requester_name} wants to swap with you
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            They're asking if you'd take over this week's chores. What do you say?
          </p>
          <div className="swap-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleResolve(pendingForMe.id, 'accepted')}
              id="accept-swap-btn"
            >
              Accept
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleResolve(pendingForMe.id, 'declined')}
              id="decline-swap-btn"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Create swap request form (only for current week's owner) */}
      {isCurrentOwner && !hasPendingRequest && !acceptedSwap && (
        <div className="swap-form animate-slide-up">
          <div style={{ marginBottom: '8px' }}>
            <span className="text-h3">Request a Swap</span>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Pick who you'd like to swap this week with.
            </p>
          </div>

          <div className="swap-select-grid">
            {otherPeople.map((person) => (
              <button
                key={person.id}
                className={`swap-select-tile ${
                  selectedTarget === person.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedTarget(person.id)}
                id={`swap-target-${person.name.toLowerCase()}`}
              >
                <div
                  className="swap-select-avatar"
                  style={{ backgroundColor: person.color }}
                >
                  {person.initial}
                </div>
                <span className="swap-select-name">{person.name}</span>
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleCreateRequest}
            disabled={!selectedTarget || submitting}
            style={{
              width: '100%',
              opacity: !selectedTarget || submitting ? 0.5 : 1,
              cursor: !selectedTarget || submitting ? 'not-allowed' : 'pointer',
            }}
            id="submit-swap-btn"
          >
            {submitting ? 'Sending...' : 'Send Swap Request'}
          </button>
        </div>
      )}

      {/* Not the current owner message */}
      {!isCurrentOwner && !pendingForMe && !acceptedSwap && (
        <div className="empty-state">
          <div className="empty-state-icon">🔄</div>
          <h2 className="empty-state-title">Not your week</h2>
          <p className="empty-state-text">
            Only this week's owner ({weekInfo?.person?.name}) can request a swap.
            {hasPendingRequest && ' A swap request is pending.'}
          </p>
        </div>
      )}

      {/* Request history */}
      {requests.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 className="text-h3" style={{ marginBottom: '16px' }}>
            This Week's Requests
          </h3>
          {requests.map((req) => (
            <div key={req.id} className="swap-request-card">
              <div className="swap-request-header">
                <div
                  className="swap-select-avatar"
                  style={{
                    backgroundColor: PEOPLE.find((p) => p.id === req.requester_id)?.color || '#555',
                    width: '28px',
                    height: '28px',
                    fontSize: '0.7rem',
                  }}
                >
                  {PEOPLE.find((p) => p.id === req.requester_id)?.initial || '?'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  {req.requester_name}
                </span>
                <span className="swap-request-arrow">→</span>
                <div
                  className="swap-select-avatar"
                  style={{
                    backgroundColor: PEOPLE.find((p) => p.id === req.target_id)?.color || '#555',
                    width: '28px',
                    height: '28px',
                    fontSize: '0.7rem',
                  }}
                >
                  {PEOPLE.find((p) => p.id === req.target_id)?.initial || '?'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  {req.target_name}
                </span>
                <span className={`swap-request-status ${req.status}`}>
                  {req.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
