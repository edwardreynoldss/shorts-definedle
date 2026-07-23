import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { colors } from "../theme";
import { ParticleSystem } from "./ParticleSystem";

type Props = {
  answer: string;
  /** Frame relative to reveal start. */
  frame: number;
  isBonus: boolean;
};

/**
 * Answer card expand + glow (or bonus comment CTA for question 4).
 */
export const AnswerReveal: React.FC<Props> = ({
  answer,
  frame,
  isBonus,
}) => {
  const { fps } = useVideoConfig();

  if (frame < 0) {
    return null;
  }

  const enter = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 120 },
  });

  const glow = interpolate(Math.sin(frame / 6), [-1, 1], [0.35, 0.85]);
  const scale = interpolate(enter, [0, 1], [0.72, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const expand = interpolate(enter, [0, 1], [0.9, 1.05]);

  if (isBonus) {
    return (
      <div
        style={{
          width: "86%",
          maxWidth: 860,
          minHeight: 360,
          padding: "56px 40px",
          borderRadius: 40,
          background: colors.card,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow:
            "0 28px 90px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
          backdropFilter: "blur(22px)",
          opacity,
          transform: `scale(${scale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: colors.text,
            lineHeight: 1.25,
          }}
        >
          Comment your answer below 👇
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 500,
            color: colors.textMuted,
          }}
        >
          Answer revealed tomorrow.
        </div>
      </div>
    );
  }

  const answerPop = spring({
    frame,
    fps,
    config: { damping: 11, stiffness: 160 },
  });

  return (
    <div
      style={{
        position: "relative",
        width: "86%",
        maxWidth: 860,
        minHeight: 360,
        padding: "56px 40px",
        borderRadius: 40,
        background: "rgba(34,197,94,0.12)",
        border: `1px solid rgba(34,197,94,${0.35 + glow * 0.35})`,
        boxShadow: `
          0 0 ${40 + glow * 40}px rgba(34,197,94,${0.25 + glow * 0.35}),
          0 28px 90px rgba(0,0,0,0.5),
          inset 0 1px 0 rgba(255,255,255,0.14)
        `,
        backdropFilter: "blur(22px)",
        opacity,
        transform: `scale(${scale * expand})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <ParticleSystem count={36} confetti seed={91} />
      </AbsoluteFill>

      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: colors.correct,
          textShadow: `0 0 ${24 + glow * 30}px rgba(34,197,94,0.75)`,
          transform: `scale(${interpolate(answerPop, [0, 1], [0.6, 1])})`,
          zIndex: 2,
        }}
      >
        {answer}
      </div>
    </div>
  );
};
