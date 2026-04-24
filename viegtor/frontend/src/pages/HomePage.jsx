import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FileText, Search, ChevronRight, Mouse } from 'lucide-react';
import { YELLOW } from '../constants/styles';
import Logo from '../components/Logo';

export default function HomePage({ onEnterCO, onEnterExpert }) {
  const wrapRef = useRef(null);
  const [side, setSide] = useState(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rot = useTransform([mx, my], ([x, y]) => (Math.atan2(y, x) * 180) / Math.PI + 90);
  const smoothRot = useSpring(rot, { stiffness: 80, damping: 18, mass: 0.6 });

  const leftGlow = useTransform(mx, [-600, 0, 600], [0.35, 0.12, 0]);
  const rightGlow = useTransform(mx, [-600, 0, 600], [0, 0.12, 0.45]);

  useEffect(() => {
    const onMove = (e) => {
      const r = wrapRef.current?.getBoundingClientRect();
      if (!r) return;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      mx.set(e.clientX - cx);
      my.set(e.clientY - cy);
      setSide(e.clientX < cx ? 'co' : 'expert');
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mx, my]);

  return (
    <div
      ref={wrapRef}
      className="relative min-h-screen overflow-hidden text-white"
      style={{
        background: '#000',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
      }}
    >
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 pointer-events-none"
        style={{
          background: useTransform(leftGlow, (v) => `radial-gradient(circle at 70% 50%, rgba(255,255,255,${v * 0.15}) 0%, transparent 60%)`),
        }}
      />
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2 pointer-events-none"
        style={{
          background: useTransform(rightGlow, (v) => `radial-gradient(circle at 30% 50%, rgba(255,204,0,${v}) 0%, transparent 60%)`),
        }}
      />
      <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-zinc-800 to-transparent pointer-events-none" />

      <nav className="relative z-20 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <div className="uppercase tracking-[0.25em] text-zinc-400" style={{ fontSize: 11 }}>
            Intelligent Compass
          </div>
        </div>
      </nav>

      <div className="relative z-10 text-center pt-6 pb-4">
        <h1 className="text-5xl md:text-6xl font-light tracking-tight">
          Choose <span className="font-semibold" style={{ color: YELLOW }}>your</span> direction.
        </h1>
        <p className="mt-3 text-zinc-500 text-sm md:text-base tracking-wide">
          Two paths. One intelligent compass.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-12 items-center px-8 pt-6">
        <SidePanel
          align="left"
          icon={FileText}
          eyebrow="CEO PAGE"
          title="Executive Overview"
          lines={['High-level insights.', 'Strategic recommendations.', 'Fast. Focused. Clear.']}
          cta="Enter CEO Page"
          active={side === 'co'}
          onClick={onEnterCO}
        />

        <div className="col-span-4 flex items-center justify-center">
          <CompassDial rotation={smoothRot} side={side} />
        </div>

        <SidePanel
          align="right"
          icon={Search}
          eyebrow="EXPERT PAGE"
          title="Deep Dive Analysis"
          lines={['Detailed data. Debates.', 'Expert perspectives.', 'Comprehensive. In-depth.']}
          cta="Enter Expert Page"
          accent
          active={side === 'expert'}
          onClick={onEnterExpert}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-zinc-800"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
        >
          <Mouse className="w-4 h-4" style={{ color: YELLOW }} />
          <div className="text-xs text-zinc-400 leading-tight">
            Move your mouse<br />to steer the compass
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SidePanel({ align, icon: Icon, eyebrow, title, lines, cta, accent, active, onClick }) {
  const isLeft = align === 'left';
  return (
    <motion.div
      className={`col-span-4 ${isLeft ? 'pr-8 text-right items-end' : 'pl-8 text-left items-start'} flex flex-col`}
      animate={{ opacity: active ? 1 : 0.55, scale: active ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 140, damping: 20 }}
    >
      <motion.div
        className="w-14 h-14 rounded-full border flex items-center justify-center mb-6"
        style={{ borderColor: accent ? YELLOW : '#3f3f46' }}
        animate={{ boxShadow: active ? `0 0 32px ${accent ? 'rgba(255,204,0,0.4)' : 'rgba(255,255,255,0.15)'}` : '0 0 0 rgba(0,0,0,0)' }}
      >
        <Icon className="w-5 h-5" style={{ color: accent ? YELLOW : '#e4e4e7' }} />
      </motion.div>

      <div className="uppercase tracking-[0.4em] font-light mb-2" style={{ fontSize: 22, color: accent ? YELLOW : '#fff' }}>
        {eyebrow}
      </div>
      <div className="text-zinc-400 text-sm mb-5">{title}</div>

      <div className={`w-24 h-px mb-5 ${isLeft ? '' : ''}`} style={{ backgroundColor: '#27272a' }} />

      <div className="text-zinc-400 text-sm leading-relaxed mb-8">
        {lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border transition-colors"
        style={{
          borderColor: accent ? YELLOW : '#52525b',
          color: accent ? YELLOW : '#fff',
          backgroundColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = accent ? 'rgba(255,204,0,0.08)' : 'rgba(255,255,255,0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span className="text-sm font-medium">{cta}</span>
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}

function CompassDial({ rotation, side }) {
  return (
    <div className="relative" style={{ width: 440, height: 440 }}>
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border"
          style={{
            borderColor: 'rgba(113,113,122,0.15)',
            transform: `scale(${1 + i * 0.18})`,
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}

      <motion.div
        className="absolute rounded-full"
        style={{
          inset: 40,
          background: 'radial-gradient(circle at 50% 40%, #2a2a2e 0%, #0a0a0c 70%)',
          boxShadow: 'inset 0 2px 20px rgba(255,255,255,0.08), inset 0 -4px 24px rgba(0,0,0,0.8), 0 30px 80px rgba(0,0,0,0.6)',
          border: '2px solid #1a1a1d',
        }}
      >
        <div
          className="absolute inset-4 rounded-full"
          style={{
            border: '1px solid rgba(255,255,255,0.04)',
            background: 'radial-gradient(circle at 50% 40%, #1a1a1d 0%, #0a0a0c 80%)',
          }}
        />

        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{
            boxShadow: side === 'expert'
              ? '0 0 60px 4px rgba(255,204,0,0.35), inset 0 0 40px rgba(255,204,0,0.15)'
              : '0 0 30px rgba(255,255,255,0.06)',
          }}
          transition={{ duration: 0.4 }}
        />

        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ rotate: rotation }}
        >
          <svg width="100%" height="100%" viewBox="-100 -100 200 200">
            <defs>
              <linearGradient id="needleN" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor={YELLOW} stopOpacity="0.2" />
                <stop offset="1" stopColor={YELLOW} />
              </linearGradient>
              <linearGradient id="needleS" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3f3f46" />
                <stop offset="1" stopColor="#18181b" />
              </linearGradient>
            </defs>
            <polygon points="0,-70 8,0 -8,0" fill="url(#needleN)" />
            <polygon points="0,70 8,0 -8,0" fill="url(#needleS)" />
            <circle cx="0" cy="0" r="7" fill="#e4e4e7" stroke="#18181b" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="2.5" fill="#18181b" />
          </svg>
        </motion.div>

        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <div
            key={deg}
            className="absolute left-1/2 top-1/2"
            style={{ transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-150px)` }}
          >
            <div className="w-px h-3" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
