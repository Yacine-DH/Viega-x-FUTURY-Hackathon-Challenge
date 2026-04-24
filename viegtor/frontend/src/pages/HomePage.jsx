import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { FileText, Search, ChevronRight } from 'lucide-react';
import { YELLOW } from '../constants/styles';
import Logo from '../components/Logo';
import CompassScene from '../components/CompassScene';

export default function HomePage({ onEnterCO, onEnterExpert }) {
  const wrapRef = useRef(null);
  const [side, setSide] = useState(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

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

      <nav className="relative z-20 flex items-center justify-center px-8 py-6">
        <Logo size={34} />
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
          <CompassScene mx={mx} my={my} side={side} size={390} />
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

      <div className="w-24 h-px mb-5" style={{ backgroundColor: '#27272a' }} />

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
