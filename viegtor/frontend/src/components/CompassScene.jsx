import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { YELLOW } from '../constants/styles';

const YELLOW_HEX = 0xffcc00;

function shortestAngleDelta(current, target) {
  return ((target - current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}

function buildStarShape(points, outer, inner, rotation = 0) {
  const shape = new THREE.Shape();
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / total) * Math.PI * 2 + rotation;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function buildPointShape(outer, halfWidth, rotation = 0) {
  const shape = new THREE.Shape();
  const ca = Math.cos(rotation);
  const sa = Math.sin(rotation);
  const rot = (x, y) => [x * ca - y * sa, x * sa + y * ca];
  const p1 = rot(0, outer);
  const p2 = rot(halfWidth, 0);
  const p3 = rot(0, -halfWidth * 0.2);
  const p4 = rot(-halfWidth, 0);
  shape.moveTo(p1[0], p1[1]);
  shape.lineTo(p2[0], p2[1]);
  shape.lineTo(p3[0], p3[1]);
  shape.lineTo(p4[0], p4[1]);
  shape.closePath();
  return shape;
}

function CompassRose({ mx, my }) {
  const group = useRef();

  useFrame(() => {
    if (!group.current) return;
    const x = mx.get();
    const y = my.get();
    if (x === 0 && y === 0) return;
    const target = -(Math.atan2(y, x) + Math.PI / 2);
    const diff = shortestAngleDelta(group.current.rotation.z, target);
    group.current.rotation.z += diff * 0.16;
  });

  const majorStar = useMemo(
    () => buildStarShape(4, 1.1, 0.18, Math.PI / 2),
    []
  );
  const minorStar = useMemo(
    () => buildStarShape(4, 0.62, 0.11, Math.PI / 4),
    []
  );
  const northPoint = useMemo(() => buildPointShape(1.1, 0.18, 0), []);

  const extrudeSettings = { depth: 0.12, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.015, bevelThickness: 0.015 };
  const minorExtrude = { depth: 0.08, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.01, bevelThickness: 0.01 };

  return (
    <group ref={group} position={[0, 0, 0.12]}>
      <mesh>
        <extrudeGeometry args={[minorStar, minorExtrude]} />
        <meshStandardMaterial color={0x2e2e32} metalness={0.85} roughness={0.35} />
      </mesh>

      <mesh position={[0, 0, 0.02]}>
        <extrudeGeometry args={[majorStar, extrudeSettings]} />
        <meshStandardMaterial color={0x3a3a40} metalness={0.9} roughness={0.25} />
      </mesh>

      <mesh position={[0, 0, 0.04]}>
        <extrudeGeometry args={[northPoint, extrudeSettings]} />
        <meshStandardMaterial
          color={YELLOW_HEX}
          emissive={YELLOW_HEX}
          emissiveIntensity={0.55}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, 0, 0.16]}>
        <sphereGeometry args={[0.14, 48, 48]} />
        <meshStandardMaterial color={0xd4d4d8} metalness={1} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 32]} />
        <meshStandardMaterial color={0x18181b} metalness={0.4} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Dial({ side }) {
  const outerRing = useRef();
  const glowRing = useRef();

  useFrame(({ clock }) => {
    if (!glowRing.current) return;
    const t = clock.getElapsedTime();
    const base = side === 'expert' ? 2.4 : 1.2;
    glowRing.current.material.emissiveIntensity = base + Math.sin(t * 2.2) * 0.35;
  });

  const ticks = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 120; i++) {
      const angle = (i / 120) * Math.PI * 2;
      arr.push({ angle, major: i % 15 === 0, medium: i % 5 === 0 });
    }
    return arr;
  }, []);

  const cardinals = [
    { label: 'N', angle: Math.PI / 2, accent: true, size: 0.22 },
    { label: 'E', angle: 0, size: 0.18 },
    { label: 'S', angle: -Math.PI / 2, size: 0.18 },
    { label: 'W', angle: Math.PI, size: 0.18 },
  ];

  return (
    <group>
      <mesh position={[0, 0, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.98, 1.98, 0.16, 96]} />
        <meshStandardMaterial color={0x141418} metalness={0.6} roughness={0.35} />
      </mesh>

      <mesh ref={outerRing} position={[0, 0, 0.02]}>
        <torusGeometry args={[1.92, 0.08, 32, 128]} />
        <meshStandardMaterial color={0x202026} metalness={1} roughness={0.2} />
      </mesh>

      <mesh position={[0, 0, 0.055]}>
        <torusGeometry args={[1.92, 0.025, 16, 128]} />
        <meshStandardMaterial color={0x3a3a42} metalness={1} roughness={0.1} />
      </mesh>

      <mesh ref={glowRing} position={[0, 0, 0.04]}>
        <torusGeometry args={[2.04, 0.015, 12, 128]} />
        <meshStandardMaterial
          color={YELLOW_HEX}
          emissive={YELLOW_HEX}
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[1.84, 96]} />
        <meshStandardMaterial color={0x0d0d10} metalness={0.15} roughness={0.9} />
      </mesh>

      <mesh position={[0, 0, 0.015]}>
        <circleGeometry args={[1.72, 96]} />
        <meshStandardMaterial color={0x0a0a0c} metalness={0.2} roughness={0.85} />
      </mesh>

      {[1.55, 1.25, 0.9, 0.55].map((r, i) => (
        <mesh key={r} position={[0, 0, 0.02]}>
          <ringGeometry args={[r, r + 0.006, 96]} />
          <meshBasicMaterial color={i === 0 ? 0x52525b : 0x2a2a30} transparent opacity={0.75} />
        </mesh>
      ))}

      {ticks.map((t, i) => {
        const rOuter = 1.66;
        const len = t.major ? 0.16 : t.medium ? 0.08 : 0.04;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(t.angle) * (rOuter - len / 2),
              Math.sin(t.angle) * (rOuter - len / 2),
              0.025,
            ]}
            rotation={[0, 0, t.angle - Math.PI / 2]}
          >
            <boxGeometry args={[t.major ? 0.02 : 0.012, len, 0.008]} />
            <meshBasicMaterial color={t.major ? 0xfafafa : t.medium ? 0x71717a : 0x3f3f46} />
          </mesh>
        );
      })}

      {cardinals.map(({ label, angle, accent, size }) => (
        <Text
          key={label}
          position={[Math.cos(angle) * 1.43, Math.sin(angle) * 1.43, 0.03]}
          fontSize={size}
          color={accent ? YELLOW : '#e4e4e7'}
          anchorX="center"
          anchorY="middle"
          fontWeight={600}
          letterSpacing={0.05}
          outlineWidth={accent ? 0.003 : 0}
          outlineColor={accent ? YELLOW : '#000'}
        >
          {label}
        </Text>
      ))}

      {[
        { a: Math.PI / 4, label: 'NE' },
        { a: (Math.PI * 3) / 4, label: 'NW' },
        { a: (-Math.PI * 3) / 4, label: 'SW' },
        { a: -Math.PI / 4, label: 'SE' },
      ].map(({ a, label }) => (
        <Text
          key={label}
          position={[Math.cos(a) * 1.44, Math.sin(a) * 1.44, 0.03]}
          fontSize={0.08}
          color="#71717a"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          {label}
        </Text>
      ))}
    </group>
  );
}

function HaloRings({ side }) {
  const group = useRef();
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.z = clock.getElapsedTime() * 0.04;
  });

  return (
    <group ref={group} position={[0, 0, -0.1]}>
      {[2.35, 2.65, 2.95, 3.25].map((r, i) => (
        <mesh key={r}>
          <ringGeometry args={[r, r + 0.005, 128]} />
          <meshBasicMaterial
            color={side === 'expert' ? YELLOW_HEX : 0x52525b}
            transparent
            opacity={0.08 + (3 - i) * 0.04}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ mx, my, side }) {
  const keyLight = useRef();

  useFrame(({ clock }) => {
    if (!keyLight.current) return;
    const t = clock.getElapsedTime();
    keyLight.current.intensity =
      (side === 'expert' ? 3.4 : 1.8) + Math.sin(t * 2) * 0.3;
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight ref={keyLight} position={[2.5, 2.5, 4]} color={YELLOW_HEX} intensity={2.2} />
      <pointLight position={[-3.5, -2, 3]} color={0x9aa8ff} intensity={0.8} />
      <directionalLight position={[0, 4, 3]} intensity={0.5} />
      <spotLight
        position={[0, 0, 5]}
        angle={0.5}
        penumbra={0.8}
        intensity={1.2}
        color={0xffffff}
      />

      <HaloRings side={side} />
      <Dial side={side} />
      <CompassRose mx={mx} my={my} />

      <ContactShadows
        position={[0, 0, -0.25]}
        opacity={0.55}
        scale={7}
        blur={2.8}
        far={3}
        resolution={512}
      />
      <Environment preset="city" />
    </>
  );
}

export default function CompassScene({ mx, my, side, size = 390 }) {
  const dim = typeof size === 'number' ? `${size}px` : size;
  return (
    <div style={{ width: dim, height: dim }}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <Scene mx={mx} my={my} side={side} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export { YELLOW };
