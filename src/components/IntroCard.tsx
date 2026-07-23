import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, INTRO, LAYOUT } from "../theme";

type Props = {
  voiceFile?: string;
  line2AtSec?: number;
};

/**
 * Cold open: brand + hook lines with ElevenLabs narration.
 */
export const IntroCard: React.FC<Props> = ({
  voiceFile = INTRO.voiceFile,
  line2AtSec = INTRO.line2AtSec,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const brandIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const line1In = spring({
    frame: Math.max(0, frame - Math.round(fps * 0.35)),
    fps,
    config: { damping: 16, stiffness: 110 },
  });

  const line2Start = Math.round(line2AtSec * fps);
  const line2In = spring({
    frame: Math.max(0, frame - line2Start),
    fps,
    config: { damping: 16, stiffness: 110 },
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: "Inter, sans-serif",
        color: colors.text,
      }}
    >
      <Audio src={staticFile(voiceFile)} volume={1} />

      <div
        style={{
          position: "absolute",
          top: LAYOUT.titleTop,
          left: 48,
          right: 48,
          textAlign: "center",
          fontSize: 92,
          fontWeight: 700,
          letterSpacing: -1.5,
          color: colors.text,
          opacity: interpolate(brandIn, [0, 1], [0, 1]),
          transform: `scale(${interpolate(brandIn, [0, 1], [0.92, 1])})`,
        }}
      >
        {INTRO.brand}
      </div>

      <div
        style={{
          position: "absolute",
          top: LAYOUT.cardTop + 24,
          left: 48,
          right: 48,
          height: LAYOUT.cardHeight,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
        }}
      >
        <div
          style={{
            width: "90%",
            maxWidth: 920,
            padding: "44px 40px",
            borderRadius: 36,
            background: colors.card,
            border: `2px solid ${colors.cardBorder}`,
            boxShadow: "0 14px 36px rgba(17,24,39,0.1)",
            textAlign: "center",
            fontSize: 48,
            fontWeight: 600,
            lineHeight: 1.3,
            opacity: interpolate(line1In, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(line1In, [0, 1], [24, 0])}px)`,
          }}
        >
          {INTRO.line1}
        </div>

        <div
          style={{
            width: "90%",
            maxWidth: 920,
            padding: "36px 40px",
            borderRadius: 36,
            background: "rgba(37,99,235,0.1)",
            border: `2px solid ${colors.accent}`,
            textAlign: "center",
            fontSize: 42,
            fontWeight: 700,
            lineHeight: 1.3,
            color: colors.accent,
            opacity: interpolate(line2In, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(line2In, [0, 1], [24, 0])}px)`,
          }}
        >
          {INTRO.line2}
        </div>
      </div>
    </AbsoluteFill>
  );
};
