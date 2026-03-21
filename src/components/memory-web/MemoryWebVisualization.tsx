/**
 * MemoryWebVisualization
 *
 * An animated, organic "neural web" that renders memory nodes as glowing orbs
 * connected by luminous strands.  Each node's colour maps to its fact category
 * and pulses according to its temperature (hot = fast pulse, cold = slow).
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { MemoryWebFact, FactCategory, Temperature } from '@/types/memory';

// ── Colour palette per category ──────────────────────────────────────────────
const CATEGORY_COLORS: Record<FactCategory, { fill: string; rgb: string }> = {
  identity:   { fill: '#8b5cf6', rgb: '139,92,246' },
  business:   { fill: '#3b82f6', rgb: '59,130,246' },
  objective:  { fill: '#10b981', rgb: '16,185,129' },
  blocker:    { fill: '#ef4444', rgb: '239,68,68'  },
  preference: { fill: '#f59e0b', rgb: '245,158,11' },
};

const TEMP_PULSE: Record<Temperature, number> = { hot: 1.6, warm: 2.8, cold: 5 };

// ── Stable seeded random (avoids layout thrash on re-renders) ────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ── Types ────────────────────────────────────────────────────────────────────
interface NodePosition {
  x: number;
  y: number;
  fact: MemoryWebFact;
  radius: number;
  orbitAngle: number;
  orbitRadius: number;
  driftSpeed: number;
  driftAmplitude: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTemp(fact: MemoryWebFact): Temperature {
  if (fact.temperature === 'hot' || fact.temperature === 'warm' || fact.temperature === 'cold') {
    return fact.temperature;
  }
  return 'warm'; // default for facts without temperature
}

function layoutNodes(
  facts: MemoryWebFact[],
  cx: number,
  cy: number,
  maxRadius: number,
): NodePosition[] {
  if (facts.length === 0 || maxRadius <= 0) return [];

  const tempOrder: Record<Temperature, number> = { hot: 0, warm: 1, cold: 2 };
  const sorted = [...facts].sort(
    (a, b) => tempOrder[getTemp(a)] - tempOrder[getTemp(b)],
  );

  return sorted.map((fact, i) => {
    const rng = seededRandom(hashString(fact.id));
    const temp = getTemp(fact);
    const ring = temp === 'hot' ? 0.25 : temp === 'warm' ? 0.55 : 0.82;
    const orbitRadius = ring * maxRadius + (rng() * 0.12 - 0.06) * maxRadius;
    const angleOffset = (i * 137.508 * Math.PI) / 180; // golden-angle spiral
    const nodeSize = temp === 'hot' ? 8 : temp === 'warm' ? 6 : 4;

    return {
      x: cx + Math.cos(angleOffset) * orbitRadius,
      y: cy + Math.sin(angleOffset) * orbitRadius,
      fact,
      radius: nodeSize,
      orbitAngle: angleOffset,
      orbitRadius,
      driftSpeed: 0.3 + rng() * 0.4,
      driftAmplitude: 2 + rng() * 4,
    };
  });
}

function buildEdges(nodes: NodePosition[]): [number, number][] {
  if (nodes.length < 2) return [];
  const edges: [number, number][] = [];
  const edgeSet = new Set<string>();
  const key = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;

  for (let i = 0; i < nodes.length; i++) {
    const dists = nodes
      .map((n, j) => ({
        j,
        d: Math.hypot(n.x - nodes[i].x, n.y - nodes[i].y),
      }))
      .filter(({ j }) => j !== i)
      .sort((a, b) => a.d - b.d);

    for (const { j } of dists.slice(0, 2)) {
      const k = key(i, j);
      if (!edgeSet.has(k)) {
        edgeSet.add(k);
        edges.push([i, j]);
      }
    }
  }
  return edges;
}

// ── Ambient particles ────────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
}

function generateParticles(seed: number, count: number, w: number, h: number): Particle[] {
  const rng = seededRandom(seed);
  const colors = ['139,92,246', '59,130,246', '16,185,129', '245,158,11'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rng() * w,
    y: rng() * h,
    size: 1 + rng() * 2.5,
    opacity: 0.15 + rng() * 0.35,
    duration: 4 + rng() * 6,
    delay: rng() * 4,
    color: colors[i % colors.length],
  }));
}

// Stable midpoint offset for edge curves
function edgeMidpoint(a: NodePosition, b: NodePosition): { mx: number; my: number } {
  const seed = hashString(a.fact.id + b.fact.id);
  const rng = seededRandom(seed);
  return {
    mx: (a.x + b.x) / 2 + (rng() - 0.5) * 20,
    my: (a.y + b.y) / 2 + (rng() - 0.5) * 20,
  };
}

// ── Component ────────────────────────────────────────────────────────────────

interface MemoryWebVisualizationProps {
  facts: MemoryWebFact[];
  className?: string;
  onNodeTap?: (fact: MemoryWebFact) => void;
  showEmptyState?: boolean;
}

export function MemoryWebVisualization({
  facts,
  className,
  onNodeTap,
  showEmptyState = false,
}: MemoryWebVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 360, h: 400 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cx = dims.w / 2;
  const cy = dims.h / 2;
  const maxR = Math.min(cx, cy) - 20;

  // Stable fact IDs string to avoid re-layout unless facts actually change
  const factIds = useMemo(() => facts.map((f) => f.id).join(','), [facts]);

  const nodes = useMemo(
    () => layoutNodes(facts, cx, cy, maxR),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [factIds, cx, cy, maxR],
  );
  const edges = useMemo(() => buildEdges(nodes), [nodes]);
  const particles = useMemo(
    () => generateParticles(42, facts.length > 0 ? 18 : 10, dims.w, dims.h),
    [facts.length, dims.w, dims.h],
  );

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full overflow-hidden', className)}
    >
      {/* Radial gradient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 70%)`,
        }}
      />

      <svg
        width={dims.w}
        height={dims.h}
        className="absolute inset-0"
        style={{ filter: 'url(#web-glow)' }}
      >
        <defs>
          <filter id="web-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Concentric orbit rings */}
        {[0.25, 0.55, 0.82].map((ring) => (
          <circle
            key={ring}
            cx={cx}
            cy={cy}
            r={ring * maxR}
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={0.5}
            strokeDasharray="4 8"
          />
        ))}

        {/* Edges */}
        {edges.map(([i, j], idx) => {
          const a = nodes[i];
          const b = nodes[j];
          const { mx, my } = edgeMidpoint(a, b);
          const col = CATEGORY_COLORS[a.fact.fact_category] || CATEGORY_COLORS.identity;
          return (
            <motion.path
              key={`edge-${a.fact.id}-${b.fact.id}`}
              d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
              fill="none"
              stroke={`rgba(${col.rgb},0.15)`}
              strokeWidth={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: idx * 0.05 }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const col = CATEGORY_COLORS[node.fact.fact_category] || CATEGORY_COLORS.identity;
          const temp = getTemp(node.fact);
          const pulseDur = TEMP_PULSE[temp];
          return (
            <motion.g
              key={node.fact.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.04, type: 'spring', stiffness: 200 }}
              style={{ cursor: onNodeTap ? 'pointer' : 'default' }}
              onClick={() => onNodeTap?.(node.fact)}
            >
              {/* Outer glow ring */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.radius * 2.5}
                fill={`rgba(${col.rgb},0.08)`}
                animate={{
                  r: [node.radius * 2.2, node.radius * 3, node.radius * 2.2],
                  opacity: [0.08, 0.15, 0.08],
                }}
                transition={{ repeat: Infinity, duration: pulseDur, ease: 'easeInOut' }}
              />
              {/* Core orb */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={col.fill}
                filter="url(#node-glow)"
                animate={{
                  r: [node.radius, node.radius * 1.15, node.radius],
                }}
                transition={{ repeat: Infinity, duration: pulseDur, ease: 'easeInOut' }}
              />
              {/* Bright inner dot */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius * 0.35}
                fill="rgba(255,255,255,0.7)"
              />
            </motion.g>
          );
        })}
      </svg>

      {/* Floating ambient particles */}
      {particles.map((p) => (
        <motion.div
          key={`particle-${p.id}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
            background: `rgba(${p.color},${p.opacity})`,
            boxShadow: `0 0 ${p.size * 3}px rgba(${p.color},${p.opacity * 0.5})`,
          }}
          animate={{
            y: [0, -30 - p.id * 2, 0],
            x: [0, (p.id % 2 === 0 ? 1 : -1) * 15, 0],
            opacity: [p.opacity, p.opacity * 0.3, p.opacity],
          }}
          transition={{
            repeat: Infinity,
            duration: p.duration,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Empty state */}
      {showEmptyState && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="rounded-full border border-accent/20"
            animate={{
              width: [80, 100, 80],
              height: [80, 100, 80],
              borderColor: [
                'rgba(16,185,129,0.15)',
                'rgba(139,92,246,0.3)',
                'rgba(16,185,129,0.15)',
              ],
              boxShadow: [
                '0 0 20px rgba(16,185,129,0.05)',
                '0 0 40px rgba(139,92,246,0.15)',
                '0 0 20px rgba(16,185,129,0.05)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          />
          <motion.p
            className="text-xs text-muted-foreground/60 mt-4"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            Your memories will appear here
          </motion.p>
        </div>
      )}

      {/* Centre core */}
      {facts.length > 0 && (
        <div className="absolute pointer-events-none" style={{ left: cx - 12, top: cy - 12 }}>
          <motion.div
            className="w-6 h-6 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(16,185,129,0.3) 60%, transparent 100%)',
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          />
        </div>
      )}
    </div>
  );
}
