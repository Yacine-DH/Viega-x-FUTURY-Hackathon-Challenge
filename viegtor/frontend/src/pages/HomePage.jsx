import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { YELLOW } from '../constants/styles';
import Logo from '../components/Logo';
import CompassScene from '../components/CompassScene';

export default function HomePage({ onEnter }) {
  const wrapRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  useEffect(() => {
    const onMove = (e) => {
      const r = wrapRef.current?.getBoundingClientRect();
      if (!r) return;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      mx.set(e.clientX - cx);
      my.set(e.clientY - cy);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mx, my]);

  const glowOpacity = useTransform(mx, [-800, 0, 800], [0.15, 0.35, 0.5]);

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
        className="absolute pointer-events-none"
        style={{
          right: '-10%',
          top: '-10%',
          width: '70vw',
          height: '70vw',
          background: useTransform(
            glowOpacity,
            (v) => `radial-gradient(circle at center, rgba(255,204,0,${v * 0.35}) 0%, rgba(255,204,0,${v * 0.08}) 30%, transparent 60%)`
          ),
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <nav className="relative z-20 flex items-center justify-between px-10 py-6">
        <Logo size={34} />
        <div className="flex items-center gap-6 text-xs uppercase tracking-[0.3em] text-zinc-500">
          <span className="hidden md:inline">Viega × Futury</span>
          <span className="hidden md:inline">·</span>
          <span>Intelligent Compass</span>
        </div>
      </nav>

      <div className="relative z-10 grid grid-cols-12 items-center px-10 lg:px-20 min-h-[calc(100vh-120px)]">
        <motion.div
          className="col-span-12 lg:col-span-6 max-w-2xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="flex items-center gap-2 mb-8">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: YELLOW, boxShadow: `0 0 12px ${YELLOW}` }}
            />
            <span className="uppercase tracking-[0.4em] text-[10px] text-zinc-400">
              Strategic Intelligence · Live
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[0.95] mb-8">
            Find
            <br />
            <span className="font-semibold" style={{ color: YELLOW }}>your</span> north.
          </h1>

          <p className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-md mb-10">
            Every patent, regulation, tender and competitor move — distilled into one decision:
            <span className="text-white font-medium"> build, invest, or ignore.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12">
            <motion.button
              onClick={onEnter}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-sm tracking-wide overflow-hidden"
              style={{ backgroundColor: YELLOW, color: '#000' }}
            >
              <motion.span
                className="absolute inset-0 pointer-events-none"
                animate={{ opacity: hovered ? 1 : 0 }}
                style={{
                  background:
                    'linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.5) 50%, transparent 80%)',
                  transform: hovered ? 'translateX(100%)' : 'translateX(-100%)',
                  transition: 'transform 0.9s ease',
                }}
              />
              <Sparkles className="w-4 h-4 relative z-10" />
              <span className="relative z-10 uppercase tracking-[0.15em]">Enter Viegtor</span>
              <motion.div
                className="relative z-10"
                animate={{ x: hovered ? 4 : 0 }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </motion.button>

            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <div className="flex -space-x-1">
                <div className="w-5 h-5 rounded-full border border-zinc-700" style={{ backgroundColor: '#18181b' }} />
                <div className="w-5 h-5 rounded-full border border-zinc-700" style={{ backgroundColor: '#27272a' }} />
                <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: YELLOW, borderColor: '#000' }} />
              </div>
              <span>5 AI personas · Live debate</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-md pt-8 border-t border-zinc-900">
            <Stat value="7" label="Source categories" />
            <Stat value="72h" label="Freshness guarantee" />
            <Stat value="3" label="Clear decisions" accent />
          </div>
        </motion.div>

        <div className="col-span-12 lg:col-span-6 relative h-[70vh] lg:h-auto">
          <motion.div
            className="absolute pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              right: '-10vw',
              top: '-20vw',
              transform: 'translateY(-1200%)',
              width: 'min(110vh, 75vw)',
              height: 'min(110vh, 75vw)',
            }}
          >
            <CompassScene mx={mx} my={my} side="expert" size="100%" />
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-6 left-10 z-10 text-[10px] uppercase tracking-[0.4em] text-zinc-600">
        Hack-510 · 2026
      </div>
      <div className="absolute bottom-6 right-10 z-10 flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-zinc-600">
        <span>Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          ↓
        </motion.div>
      </div>
    </div>
  );
}

function Stat({ value, label, accent }) {
  return (
    <div>
      <div
        className="text-2xl font-semibold mb-1"
        style={{ color: accent ? YELLOW : '#fff' }}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 leading-tight">{label}</div>
    </div>
  );
}
