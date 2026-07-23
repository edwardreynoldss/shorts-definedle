import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "../theme";

type Props = {
  prompt: string;
  subtext: string;
};

/**
 * Final CTA: ask viewers to comment their score.
 */
export const ScoreOutro: React.FC<Props> = ({ prompt, subtext }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const pulse = interpolate(Math.sin(frame / 8), [-1, 1], [0.98, 1.03]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 56,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 900,
          padding: "64px 48px",
          borderRadius: 36,
          background: colors.card,
          border: `2px solid ${colors.accent}`,
          boxShadow: "0 18px 50px rgba(37,99,235,0.14), 0 4px 0 rgba(37,99,235,0.08)",
          opacity: interpolate(enter, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(enter, [0, 1], [50, 0])}px) scale(${pulse})`,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: colors.accent,
          }}
        >
          Quiz complete
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: colors.text,
            lineHeight: 1.2,
          }}
        >
          {prompt}
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 500,
            color: colors.textMuted,
            lineHeight: 1.35,
            maxWidth: 720,
          }}
        >
          {subtext}
        </div>
      </div>
    </AbsoluteFill>
  );
};
