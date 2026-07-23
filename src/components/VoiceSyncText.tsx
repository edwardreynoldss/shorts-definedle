import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { colors } from "../theme";
import type { VoiceSegment } from "../types";
import { framesToSec } from "../utils/timing";

type Props = {
  segments: VoiceSegment[];
  /** Local frame relative to narration start. */
  frame: number;
  fontSize?: number;
};

/**
 * Reveals definition text phrase-by-phrase in sync with narration timing.
 */
export const VoiceSyncText: React.FC<Props> = ({
  segments,
  frame,
  fontSize = 44,
}) => {
  const { fps } = useVideoConfig();
  const t = framesToSec(frame);

  const visibleCount = segments.filter((s) => t >= s.time).length;
  const shown = segments.slice(0, Math.max(visibleCount, 0));

  if (shown.length === 0) {
    return (
      <div
        style={{
          color: colors.textMuted,
          fontSize,
          fontWeight: 400,
          lineHeight: 1.35,
          textAlign: "center",
          minHeight: fontSize * 3.2,
        }}
      />
    );
  }

  return (
    <div
      style={{
        color: colors.text,
        fontSize,
        fontWeight: 400,
        lineHeight: 1.35,
        textAlign: "center",
        minHeight: fontSize * 3.2,
      }}
    >
      {shown.map((segment, i) => {
        const localFrame = Math.max(0, frame - Math.round(segment.time * fps));
        const enter = spring({
          frame: localFrame,
          fps,
          config: { damping: 18, stiffness: 140 },
        });
        const opacity = interpolate(enter, [0, 1], [0, 1]);
        const y = interpolate(enter, [0, 1], [14, 0]);

        return (
          <span
            key={`${segment.time}-${i}`}
            style={{
              display: "inline",
              opacity,
              transform: `translateY(${y}px)`,
              marginRight: 10,
            }}
          >
            {segment.text}
          </span>
        );
      })}
    </div>
  );
};
