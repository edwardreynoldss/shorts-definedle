import React from "react";
import { interpolate, useVideoConfig } from "remotion";
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
 * Reveal definition text one word at a time, locked to narration timing.
 * All words stay in layout (opacity 0 until spoken) so the card never reflows.
 */
export const VoiceSyncText: React.FC<Props> = ({
  segments,
  frame,
  fontSize = 64,
}) => {
  const { fps } = useVideoConfig();
  // Slight lead so each word pops as speech begins (not after it ends).
  const TEXT_LEAD_SEC = 0.18;
  const t = framesToSec(frame) + TEXT_LEAD_SEC;
  const fadeFrames = 2;

  return (
    <div
      style={{
        color: colors.text,
        fontSize,
        fontWeight: 500,
        lineHeight: 1.35,
        textAlign: "center",
        width: "100%",
      }}
    >
      {segments.map((segment, i) => {
        const startFrame = Math.round(segment.time * fps);
        const localFrame = frame - startFrame + Math.round(TEXT_LEAD_SEC * fps);
        const visible = t >= segment.time;
        const opacity = visible
          ? interpolate(localFrame, [0, fadeFrames], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;

        return (
          <span
            key={`${segment.time}-${i}-${segment.text}`}
            style={{
              display: "inline",
              opacity,
              marginRight: i < segments.length - 1 ? 14 : 0,
            }}
          >
            {segment.text}
          </span>
        );
      })}
    </div>
  );
};
