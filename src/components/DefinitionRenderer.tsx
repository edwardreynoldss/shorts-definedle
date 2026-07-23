import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { colors } from "../theme";
import type { VoiceSegment } from "../types";
import { VoiceSyncText } from "./VoiceSyncText";

type Props = {
  segments: VoiceSegment[];
  /** Frame relative to question start. */
  frame: number;
  /** Narration start frame within the question. */
  narrationStart: number;
  /** 0–1 fade-out when revealing the answer. */
  fadeOut?: number;
};

/**
 * Clean definition card with voice-synced phrase reveal.
 */
export const DefinitionRenderer: React.FC<Props> = ({
  segments,
  frame,
  narrationStart,
  fadeOut = 0,
}) => {
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: { damping: 16, stiffness: 110 },
  });

  const opacity =
    interpolate(enter, [0, 1], [0, 1]) * interpolate(fadeOut, [0, 1], [1, 0]);
  const y = interpolate(enter, [0, 1], [48, 0]);
  const scale = interpolate(enter, [0, 1], [0.94, 1]);

  return (
    <div
      style={{
        width: "86%",
        maxWidth: 860,
        minHeight: 300,
        padding: "48px 44px",
        borderRadius: 32,
        background: colors.card,
        border: `2px solid ${colors.cardBorder}`,
        boxShadow: "0 14px 36px rgba(17,24,39,0.1)",
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <VoiceSyncText
        segments={segments}
        frame={Math.max(0, frame - narrationStart)}
      />
    </div>
  );
};
