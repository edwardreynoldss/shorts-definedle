import React from "react";
import { useVideoConfig } from "remotion";
import { colors } from "../theme";
import type { VoiceSegment } from "../types";

type Props = {
  segments: VoiceSegment[];
  /** Local frame relative to narration / audio start (0 = first audio frame). */
  frame: number;
  fontSize?: number;
};

/**
 * Karaoke-style reveal: only spoken words are mounted, timed to the voice
 * track. Real space characters are required so the line wraps (margin-only
 * gaps do not create wrap opportunities and get clipped by AbsoluteFill).
 */
export const VoiceSyncText: React.FC<Props> = ({
  segments,
  frame,
  fontSize = 64,
}) => {
  const { fps } = useVideoConfig();
  // Pull words forward so they land as the voice hits them, not after.
  const TEXT_LEAD_SEC = 0.45;
  const t = frame / fps + TEXT_LEAD_SEC;

  let visibleCount = 0;
  for (let i = 0; i < segments.length; i++) {
    if (t >= segments[i].time) visibleCount = i + 1;
    else break;
  }

  // First audio frame: always show the first word immediately.
  if (frame >= 0 && visibleCount === 0 && segments.length > 0) {
    visibleCount = 1;
  }

  const shown = segments.slice(0, visibleCount);

  return (
    <div
      style={{
        color: colors.text,
        fontSize,
        fontWeight: 500,
        lineHeight: 1.35,
        textAlign: "center",
        width: "100%",
        whiteSpace: "normal",
        overflowWrap: "break-word",
      }}
    >
      {shown.map((segment, i) => (
        <React.Fragment key={`${i}-${segment.text}`}>
          {i > 0 ? " " : null}
          <span style={{ display: "inline" }}>{segment.text}</span>
        </React.Fragment>
      ))}
    </div>
  );
};
