import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../theme";

type Props = {
  total: number;
  currentIndex: number;
  difficultyLabel: string;
};

/**
 * Progress marker: Question N / total + dots (no positional animation).
 */
export const ProgressDots: React.FC<Props> = ({
  total,
  currentIndex,
  difficultyLabel,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
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
          // Soft pulse from frame only — no layout shift.
          const pulse = active
            ? 1 + 0.06 * Math.sin((frame / fps) * Math.PI * 2)
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
                transform: `scale(${pulse})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
