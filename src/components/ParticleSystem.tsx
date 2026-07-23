import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  drift: number;
};

type Props = {
  count?: number;
  /** Accent particles used during answer reveal. */
  confetti?: boolean;
  seed?: number;
};

const seeded = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

/**
 * Subtle floating particles (and optional confetti burst) for premium motion.
 */
export const ParticleSystem: React.FC<Props> = ({
  count = 24,
  confetti = false,
  seed = 42,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const particles = useMemo(() => {
    const rand = seeded(seed);
    const list: Particle[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: rand() * width,
        y: rand() * height,
        size: confetti ? 6 + rand() * 10 : 2 + rand() * 4,
        speed: 0.25 + rand() * 0.7,
        opacity: confetti ? 0.55 + rand() * 0.4 : 0.12 + rand() * 0.28,
        drift: (rand() - 0.5) * 1.4,
      });
    }
    return list;
  }, [count, confetti, height, seed, width]);

  const confettiColors = ["#22C55E", "#3B82F6", "#F59E0B", "#FFFFFF"];

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const life = confetti
          ? interpolate(frame, [0, fps * 1.6], [0, 1], {
              extrapolateRight: "clamp",
            })
          : (frame * p.speed) / fps;

        const y = confetti
          ? p.y * 0.35 + life * height * 0.55
          : (p.y + life * 40) % (height + 40) - 20;
        const x = confetti
          ? p.x + Math.sin(frame / 8 + i) * 40 + p.drift * frame * 2
          : p.x + Math.sin(frame / 40 + i) * 18 * p.drift;

        const opacity = confetti
          ? interpolate(frame, [0, 8, fps * 1.2, fps * 1.6], [0, p.opacity, p.opacity, 0], {
              extrapolateRight: "clamp",
            })
          : p.opacity;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.size,
              height: confetti ? p.size * (0.6 + (i % 3) * 0.3) : p.size,
              borderRadius: confetti ? 3 : "50%",
              backgroundColor: confetti
                ? confettiColors[i % confettiColors.length]
                : "rgba(255,255,255,0.85)",
              opacity,
              transform: confetti
                ? `rotate(${frame * (2 + (i % 5)) + i * 20}deg)`
                : undefined,
              boxShadow: confetti
                ? undefined
                : "0 0 10px rgba(59,130,246,0.25)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
