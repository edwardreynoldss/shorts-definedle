import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../theme";

type Props = {
  total: number;
  currentIndex: number;
  difficultyLabel: string;
};

/**
 * Progress marker: Question N / total + dots.
 */
export const ProgressDots: React.FC<Props> = ({
  total,
  currentIndex,
  difficultyLabel,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        opacity: interpolate(enter, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
      }}
    >
      <div
        style={{
          color: colors.textMuted,
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: 0.5,
        }}
      >
        {difficultyLabel}
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {Array.from({ length: total }).map((_, i) => {
          const active = i === currentIndex;
          const done = i < currentIndex;
          const pulse = active
            ? spring({
                frame,
                fps,
                config: { damping: 12, stiffness: 140 },
              })
            : 1;

          return (
            <div
              key={i}
              style={{
                width: active ? 22 : 16,
                height: active ? 22 : 16,
                borderRadius: "50%",
                backgroundColor:
                  active || done ? colors.accent : "rgba(17,24,39,0.18)",
                transform: `scale(${active ? 0.9 + pulse * 0.15 : 1})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
