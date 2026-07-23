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
 * Reveal phrases in sync with narration.
 * All phrases stay laid out (invisible until spoken) so the card never reflows.
 * Uses a short fade — not a slow spring — so text doesn't lag the voice.
 */
export const VoiceSyncText: React.FC<Props> = ({
  segments,
  frame,
  fontSize = 64,
}) => {
  const { fps } = useVideoConfig();
  // Slight lead so text appears as the phrase starts, not after it.
  const TEXT_LEAD_SEC = 0.06;
  const t = framesToSec(frame) + TEXT_LEAD_SEC;
  const fadeFrames = 3;

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
            key={`${segment.time}-${i}`}
            style={{
              display: "inline",
              opacity,
              marginRight: i < segments.length - 1 ? 12 : 0,
            }}
          >
            {segment.text}
          </span>
        );
      })}
    </div>
  );
};
