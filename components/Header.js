'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PEOPLE } from '@/lib/rotation';

export default function Header({ user }) {
  const [showSwitch, setShowSwitch] = useState(false);
  const router = useRouter();

  if (!user) return null;

  const personColor = PEOPLE.find((p) => p.id === user.id)?.color || '#8FAE8B';

  async function handleSwitchUser(userId) {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    setShowSwitch(false);
    router.refresh();
    window.location.reload();
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    setShowSwitch(false);
    router.push('/login');
  }

  return (
    <>
      <header className="app-header" id="app-header">
        <div className="header-greeting">
          Hey {user.name} 👋
        </div>
        <button
          className="header-user-btn"
          onClick={() => setShowSwitch(true)}
          id="switch-user-btn"
          aria-label="Switch user"
        >
          <div
            className="header-avatar"
            style={{ backgroundColor: personColor }}
          >
            {user.name.charAt(0)}
          </div>
        </button>
      </header>

      {showSwitch && (
        <div
          className="switch-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSwitch(false);
          }}
        >
          <div className="switch-modal">
            <div className="switch-modal-title">Switch User</div>
            <div className="switch-modal-grid">
              {PEOPLE.map((person) => (
                <button
                  key={person.id}
                  className="login-tile"
                  onClick={() => handleSwitchUser(person.id)}
                  style={{ animationDelay: '0s' }}
                >
                  <div
                    className="login-tile-avatar"
                    style={{ backgroundColor: person.color }}
                  >
                    {person.initial}
                  </div>
                  <span className="login-tile-name">{person.name}</span>
                </button>
              ))}
            </div>
            <button
              className="btn btn-ghost"
              onClick={handleLogout}
              style={{ width: '100%', marginTop: '8px' }}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
