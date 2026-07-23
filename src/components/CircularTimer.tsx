import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { colors, TIMING } from "../theme";

type Props = {
  /** Frame relative to countdown start. */
  frame: number;
  /** Hide instantly when reveal begins. */
  visible: boolean;
};

/**
 * Large circular countdown with shrinking ring.
 */
export const CircularTimer: React.FC<Props> = ({ frame, visible }) => {
  const { fps } = useVideoConfig();
  const duration = TIMING.countdownSec;
  const totalFrames = duration * fps;

  if (!visible || frame < 0) {
    return null;
  }

  const progress = interpolate(frame, [0, totalFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const secondsLeft = Math.max(1, Math.ceil(duration - frame / fps));

  const numberPulse = spring({
    frame: frame % fps,
    fps,
    config: { damping: 12, stiffness: 180 },
    durationInFrames: Math.round(fps * 0.35),
  });

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 130 },
  });

  const size = 280;
  const stroke = 15;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const warn = secondsLeft <= 2;
  const ringColor = warn ? colors.warning : colors.accent;

  return (
    <div
      style={{
        width: size,
        height: size,
        opacity: interpolate(enter, [0, 1], [0, 1]),
        transform: `scale(${interpolate(enter, [0, 1], [0.85, 1])})`,
        position: "relative",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="rgba(255,255,255,0.92)"
          stroke="rgba(17,24,39,0.1)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: colors.text,
            transform: `scale(${0.92 + numberPulse * 0.08})`,
          }}
        >
          {secondsLeft}
        </div>
      </AbsoluteFill>
    </div>
  );
};
