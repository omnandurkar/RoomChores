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
    <div className="login-wrapper">
      {/* Animated Glowing Orbs Background */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <div className="login-container glass-panel animate-slide-up">
        <div style={{ marginBottom: '12px' }} className="float-animation">
          <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 12px rgba(143, 174, 139, 0.4))' }}>🫧</span>
        </div>
        <h1 className="login-title">RoomChores</h1>
        <p className="login-subtitle">Whose turn is it?</p>

        <div className="login-grid">
          {PEOPLE.map((person, index) => (
            <button
              key={person.id}
              className={`login-tile stagger-${index + 1}`}
              onClick={() => handleLogin(person.id)}
              id={`login-tile-${person.name.toLowerCase()}`}
            >
              <div
                className="login-tile-avatar pulse-on-hover"
                style={{ 
                  backgroundColor: person.color,
                  boxShadow: `0 0 20px ${person.color}40`,
                }}
              >
                {person.initial}
              </div>
              <span className="login-tile-name">{person.name}</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .login-wrapper {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background-color: #050505;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          animation: float 15s ease-in-out infinite alternate;
          z-index: 0;
        }

        .orb-1 {
          width: 300px;
          height: 300px;
          background: #8FAE8B; /* Sage green */
          top: -10%;
          left: -10%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: #7BA3C9; /* Soft blue */
          bottom: -20%;
          right: -10%;
          animation-delay: -5s;
        }

        .orb-3 {
          width: 250px;
          height: 250px;
          background: #E8B49B; /* Soft coral */
          top: 40%;
          left: 50%;
          transform: translateX(-50%);
          animation-delay: -10s;
          opacity: 0.3;
        }

        .glass-panel {
          position: relative;
          z-index: 10;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          padding: 48px 32px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          width: 90%;
          max-width: 420px;
        }

        .login-title {
          font-size: 2.25rem;
          font-weight: 700;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, #fff 0%, #a0a0a0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }

        .login-subtitle {
          color: rgba(255, 255, 255, 0.5);
          font-size: 1rem;
          margin-bottom: 36px;
          letter-spacing: 0.02em;
        }

        .login-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .login-tile {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 20px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .login-tile:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .login-tile:active {
          transform: translateY(2px) scale(0.98);
        }

        .login-tile-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 600;
          color: #000;
          transition: transform 0.3s ease;
        }

        .login-tile:hover .pulse-on-hover {
          transform: scale(1.1);
        }

        .login-tile-name {
          font-size: 0.95rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
        }

        .float-animation {
          animation: float-icon 4s ease-in-out infinite;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.1); }
          100% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes float-icon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
