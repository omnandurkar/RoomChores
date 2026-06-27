'use client';

import { useRouter } from 'next/navigation';
import { PEOPLE } from '@/lib/rotation';

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin(userId) {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    router.push('/');
  }

  return (
    <div className="login-container">
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '2.5rem' }}>🏠</span>
      </div>
      <h1 className="login-title">RoomChores</h1>
      <p className="login-subtitle">Who's checking in?</p>

      <div className="login-grid">
        {PEOPLE.map((person, index) => (
          <button
            key={person.id}
            className={`login-tile stagger-${index + 1}`}
            onClick={() => handleLogin(person.id)}
            id={`login-tile-${person.name.toLowerCase()}`}
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
    </div>
  );
}
