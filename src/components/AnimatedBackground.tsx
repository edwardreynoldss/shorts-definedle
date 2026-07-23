import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "../theme";
import { ParticleSystem } from "./ParticleSystem";

/**
 * Dark premium backdrop: drifting gradient, floating particles, vignette.
 */
export const AnimatedBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const driftX = interpolate(frame, [0, fps * 40], [0, 80], {
    extrapolateRight: "extend",
  });
  const driftY = interpolate(frame, [0, fps * 40], [0, -60], {
    extrapolateRight: "extend",
  });
  const pulse = interpolate(Math.sin(frame / 28), [-1, 1], [0.55, 0.9]);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(circle at ${38 + driftX * 0.15}% ${28 + driftY * 0.1}%, rgba(59,130,246,${0.22 * pulse}) 0%, transparent 42%),
            radial-gradient(circle at ${72 - driftX * 0.1}% ${68 + driftY * 0.08}%, rgba(34,197,94,0.12) 0%, transparent 38%),
            radial-gradient(circle at 50% 100%, rgba(245,158,11,0.08) 0%, transparent 45%),
            linear-gradient(165deg, #0c0c10 0%, ${colors.background} 48%, #07070a 100%)
          `,
          transform: `translate(${Math.sin(frame / 45) * 6}px, ${Math.cos(frame / 55) * 4}px)`,
        }}
      />

      <ParticleSystem count={28} />

      {/* Soft vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.72) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
