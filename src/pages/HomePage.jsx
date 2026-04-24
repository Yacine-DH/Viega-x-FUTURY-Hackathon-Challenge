import React, { useState, useCallback, useRef } from 'react';
import { FileText, Search, ChevronRight, User, UserPlus } from 'lucide-react';
import Logo from '../components/Logo';
import { YELLOW } from '../constants/styles';

const NEEDLE_MAX = 52;
const CX = 175;
const CY = 175;
const OUTER_R = 160;

function buildTicks() {
  const ticks = [];
  for (let i = 0; i < 72; i++) {
    const deg = i * 5;
    const major = i % 9 === 0;
    const inner = OUTER_R - (major ? 14 : 7);
    const rad = (deg - 90) * (Math.PI / 180);
    ticks.push({
      x1: CX + Math.cos(rad) * inner,
      y1: CY + Math.sin(rad) * inner,
      x2: CX + Math.cos(rad) * OUTER_R,
      y2: CY + Math.sin(rad) * OUTER_R,
      major,
    });
  }
  return ticks;
}

const TICKS = buildTicks();
const DIAG_DEGS = [45, 135, 225, 315];

function CompassSVG({ angle, anyActive }) {
  return (
    <svg viewBox="0 0 350 350" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <radialGradient id="hpFaceBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e1e20" />
          <stop offset="100%" stopColor="#0c0c0d" />
        </radialGradient>
        <filter id="hpNeedleGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="hpRingGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="hpNeedleFwd" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={YELLOW} />
          <stop offset="100%" stopColor="rgba(255,204,0,0.35)" />
        </linearGradient>
      </defs>

      <circle cx={CX} cy={CY} r={OUTER_R} fill="url(#hpFaceBg)" />

      {anyActive && (
        <circle
          cx={CX} cy={CY} r={OUTER_R}
          fill="none"
          stroke={YELLOW}
          strokeWidth="2.5"
          opacity="0.55"
          filter="url(#hpRingGlow)"
        />
      )}

      <circle
        cx={CX} cy={CY} r={OUTER_R}
        fill="none"
        stroke={anyActive ? 'rgba(255,204,0,0.35)' : 'rgba(255,255,255,0.13)'}
        strokeWidth="1.5"
        style={{ transition: 'stroke 0.4s ease' }}
      />

      {TICKS.map((t, i) => (
        <line
          key={i}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.major ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.09)'}
          strokeWidth={t.major ? 1.5 : 1}
        />
      ))}

      <circle cx={CX} cy={CY} r={138} fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r={112} fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />

      {/* Compass rose — static 8-point star */}
      <polygon points={`${CX},${CY-100} ${CX+8},${CY-8} ${CX},${CY+3} ${CX-8},${CY-8}`} fill="rgba(210,210,210,0.52)" />
      <polygon points={`${CX},${CY+100} ${CX+8},${CY+8} ${CX},${CY-3} ${CX-8},${CY+8}`} fill="rgba(110,110,110,0.32)" />
      <polygon points={`${CX+100},${CY} ${CX+8},${CY-8} ${CX-3},${CY} ${CX+8},${CY+8}`} fill="rgba(140,140,140,0.38)" />
      <polygon points={`${CX-100},${CY} ${CX-8},${CY-8} ${CX+3},${CY} ${CX-8},${CY+8}`} fill="rgba(140,140,140,0.38)" />
      {DIAG_DEGS.map((deg) => {
        const rad = (deg - 90) * (Math.PI / 180);
        const tipX = CX + Math.cos(rad) * 74;
        const tipY = CY + Math.sin(rad) * 74;
        const rA = (deg - 90 + 11) * (Math.PI / 180);
        const rB = (deg - 90 - 11) * (Math.PI / 180);
        const w = 9;
        return (
          <polygon
            key={deg}
            points={`${tipX},${tipY} ${CX + Math.cos(rA) * w},${CY + Math.sin(rA) * w} ${CX},${CY} ${CX + Math.cos(rB) * w},${CY + Math.sin(rB) * w}`}
            fill="rgba(170,170,170,0.18)"
          />
        );
      })}

      {/* Needle — rotates with mouse */}
      <g
        style={{
          transformOrigin: `${CX}px ${CY}px`,
          transform: `rotate(${angle}deg)`,
          transition: 'transform 0.11s ease-out',
        }}
      >
        <polygon
          points={`${CX},${CY-122} ${CX+9},${CY-8} ${CX},${CY+6} ${CX-9},${CY-8}`}
          fill={anyActive ? 'url(#hpNeedleFwd)' : 'rgba(220,220,220,0.35)'}
          filter={anyActive ? 'url(#hpNeedleGlow)' : undefined}
        />
        <polygon
          points={`${CX},${CY+122} ${CX+9},${CY+8} ${CX},${CY-6} ${CX-9},${CY+8}`}
          fill="rgba(55,55,58,0.85)"
        />
      </g>

      {/* Center cap */}
      <circle cx={CX} cy={CY} r={13} fill="#141416" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
      <circle
        cx={CX} cy={CY} r={6}
        fill={anyActive ? YELLOW : '#383838'}
        filter={anyActive ? 'url(#hpRingGlow)' : undefined}
        style={{ transition: 'fill 0.35s ease' }}
      />
      <circle cx={CX} cy={CY} r={2.5} fill={anyActive ? '#fff' : '#555'} opacity="0.55" style={{ transition: 'fill 0.35s ease' }} />
    </svg>
  );
}

function Panel({ side, icon: Icon, title, subtitle, lines, buttonLabel, active, onEnter }) {
  const isExpert = side === 'expert';
  const activeColor = isExpert ? YELLOW : '#ffffff';
  const dimBorder = 'rgba(255,255,255,0.08)';

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8" style={{ maxWidth: 320 }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1.5px solid ${active ? activeColor : dimBorder}`,
          backgroundColor: active ? (isExpert ? 'rgba(255,204,0,0.07)' : 'rgba(255,255,255,0.04)') : 'transparent',
          boxShadow: active ? (isExpert ? '0 0 28px rgba(255,204,0,0.18)' : '0 0 22px rgba(255,255,255,0.08)') : 'none',
          transition: 'border-color 0.35s ease, background-color 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        <Icon style={{ width: 30, height: 30, color: active ? activeColor : 'rgba(255,255,255,0.22)', transition: 'color 0.35s ease' }} />
      </div>

      <div className="text-center">
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: active ? activeColor : 'rgba(255,255,255,0.22)',
            transition: 'color 0.35s ease',
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 13, color: active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.14)', transition: 'color 0.35s ease' }}>
          {subtitle}
        </div>
      </div>

      <div
        style={{
          width: 52,
          height: 1,
          backgroundColor: active ? (isExpert ? 'rgba(255,204,0,0.45)' : 'rgba(255,255,255,0.35)') : dimBorder,
          transition: 'background-color 0.35s ease',
        }}
      />

      <div style={{ textAlign: 'center' }}>
        {lines.map((line) => (
          <p
            key={line}
            style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: active ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.1)',
              transition: 'color 0.35s ease',
              margin: 0,
            }}
          >
            {line}
          </p>
        ))}
      </div>

      <button
        onClick={onEnter}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 24px',
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          background: active && isExpert ? 'rgba(255,204,0,0.09)' : 'transparent',
          border: `1.5px solid ${active ? activeColor : dimBorder}`,
          color: active ? activeColor : 'rgba(255,255,255,0.16)',
          transition: 'all 0.35s ease',
        }}
      >
        {buttonLabel}
        <ChevronRight style={{ width: 15, height: 15 }} />
      </button>
    </div>
  );
}

export default function HomePage({ onSignIn, onSignUp }) {
  const [angle, setAngle] = useState(0);
  const [role, setRole] = useState(null);
  const containerRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.max(-1, Math.min(1, (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)));
    const dead = 0.09;
    if (Math.abs(ratio) < dead) {
      setAngle(0);
      setRole(null);
    } else if (ratio < 0) {
      setAngle(-NEEDLE_MAX * Math.min(1, (Math.abs(ratio) - dead) / (1 - dead)));
      setRole('co');
    } else {
      setAngle(NEEDLE_MAX * Math.min(1, (ratio - dead) / (1 - dead)));
      setRole('expert');
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setAngle(0);
    setRole(null);
  }, []);

  const coActive     = role === 'co';
  const expertActive = role === 'expert';
  const anyActive    = role !== null;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-zinc-950 text-white flex flex-col overflow-hidden relative"
      style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif', userSelect: 'none' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Directional background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: anyActive ? 1 : 0,
          transition: 'opacity 0.45s ease',
          background: coActive
            ? 'radial-gradient(ellipse 50% 75% at 12% 58%, rgba(150,115,0,0.16) 0%, transparent 68%)'
            : 'radial-gradient(ellipse 50% 75% at 88% 58%, rgba(150,115,0,0.16) 0%, transparent 68%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <Logo size={26} />
          <span className="text-white font-light" style={{ fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Intelligent Compass
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSignUp}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            <UserPlus style={{ width: 15, height: 15 }} />
            Sign up
          </button>
          <div className="w-px h-4 bg-zinc-700" />
          <button
            onClick={() => onSignIn(role)}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            <User style={{ width: 15, height: 15 }} />
            Sign in
            <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </header>

      {/* Headline */}
      <div className="relative z-10 text-center pt-3 pb-2">
        <h1 className="font-bold tracking-tight" style={{ fontSize: 40, marginBottom: 8 }}>
          Choose <span style={{ color: YELLOW }}>your</span> direction.
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15 }}>Two paths. One intelligent compass.</p>
      </div>

      {/* Main 3-column */}
      <main className="relative z-10 flex flex-1 items-center justify-center" style={{ gap: 0, padding: '0 32px' }}>

        <Panel
          side="co"
          icon={FileText}
          title="CO Page"
          subtitle="Executive Overview"
          lines={['High-level insights.', 'Strategic recommendations.', 'Fast. Focused. Clear.']}
          buttonLabel="Enter CO Page"
          active={coActive}
          onEnter={() => onSignIn('co')}
        />

        {/* Compass center */}
        <div className="flex flex-col items-center justify-center flex-shrink-0" style={{ width: 400 }}>
          <div className="relative flex items-center justify-center" style={{ width: 400, height: 400 }}>
            {/* Decorative concentric rings */}
            {[185, 212, 240, 268].map((r, idx) => (
              <div
                key={r}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: r * 2,
                  height: r * 2,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  border: `1px solid rgba(255,255,255,${0.028 - idx * 0.005})`,
                }}
              />
            ))}

            {/* Vertical axis line */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: 1,
                top: 0,
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                background: anyActive
                  ? 'linear-gradient(to bottom, transparent 2%, rgba(255,204,0,0.22) 18%, rgba(255,204,0,0.22) 82%, transparent 98%)'
                  : 'linear-gradient(to bottom, transparent 2%, rgba(255,255,255,0.07) 18%, rgba(255,255,255,0.07) 82%, transparent 98%)',
                transition: 'background 0.4s ease',
              }}
            />

            {/* Axis dots */}
            {[-OUTER_R, OUTER_R].map((offset) => (
              <div
                key={offset}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 6,
                  height: 6,
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, calc(-50% + ${offset}px))`,
                  backgroundColor: anyActive ? 'rgba(255,204,0,0.55)' : 'rgba(255,255,255,0.13)',
                  transition: 'background-color 0.4s ease',
                }}
              />
            ))}

            {/* Compass SVG */}
            <div
              className="absolute"
              style={{ width: 348, height: 348, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              <CompassSVG angle={angle} anyActive={anyActive} />
            </div>
          </div>

          {/* Mouse hint */}
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 20px',
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
              <rect x="1" y="1" width="18" height="26" rx="9" stroke="rgba(255,255,255,0.22)" strokeWidth="1.4" />
              <line x1="10" y1="1" x2="10" y2="11" stroke="rgba(255,255,255,0.22)" strokeWidth="1.4" />
              <circle cx="10" cy="6.5" r="2.2" fill={YELLOW} opacity="0.75" />
            </svg>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Move your mouse to steer the compass</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Click anywhere to sign in with selected mode</div>
            </div>
          </div>
        </div>

        <Panel
          side="expert"
          icon={Search}
          title="Expert Page"
          subtitle="Deep Dive Analysis"
          lines={['Detailed data. Debates.', 'Expert perspectives.', 'Comprehensive. In-depth.']}
          buttonLabel="Enter Expert Page"
          active={expertActive}
          onEnter={() => onSignIn('expert')}
        />
      </main>
    </div>
  );
}
