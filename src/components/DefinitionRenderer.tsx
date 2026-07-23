import React from "react";
import { interpolate } from "remotion";
import { colors } from "../theme";
import type { VoiceSegment } from "../types";
import { VoiceSyncText } from "./VoiceSyncText";

type Props = {
  segments: VoiceSegment[];
  /** Frame relative to narration / audio start. */
  narrationFrame: number;
  /** 0–1 fade-out when revealing the answer. */
  fadeOut?: number;
  /** Locked card height so layout never jumps. */
  fixedHeight?: number;
};

/**
 * Definition card with voice-synced word-by-word reveal (fixed size).
 * Stays fully opaque during narration so text is never gated by a spring.
 */
export const DefinitionRenderer: React.FC<Props> = ({
  segments,
  narrationFrame,
  fadeOut = 0,
  fixedHeight = 400,
}) => {
  const opacity = interpolate(fadeOut, [0, 1], [1, 0]);

  return (
    <div
      style={{
        width: "90%",
        maxWidth: 920,
        height: fixedHeight,
        padding: "48px 48px",
        borderRadius: 36,
        background: colors.card,
        border: `2px solid ${colors.cardBorder}`,
        boxShadow: "0 14px 36px rgba(17,24,39,0.1)",
        opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        overflow: "visible",
      }}
    >
      <VoiceSyncText
        segments={segments}
        frame={Math.max(0, narrationFrame)}
        fontSize={58}
      />
    </div>
  );
};
