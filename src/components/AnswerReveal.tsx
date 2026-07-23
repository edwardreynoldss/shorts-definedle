import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { colors } from "../theme";

type Props = {
  answer: string;
  /** Frame relative to reveal start. */
  frame: number;
};

/**
 * Answer card — same footprint as the definition card.
 */
export const AnswerReveal: React.FC<Props> = ({ answer, frame }) => {
  const { fps } = useVideoConfig();

  if (frame < 0) {
    return null;
  }

  const enter = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 120 },
  });

  const answerPop = spring({
    frame,
    fps,
    config: { damping: 11, stiffness: 160 },
  });

  const scale = interpolate(enter, [0, 1], [0.92, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: "relative",
        width: "90%",
        maxWidth: 920,
        height: 430,
        padding: "48px 48px",
        borderRadius: 36,
        background: "rgba(240,253,244,0.95)",
        border: `3px solid ${colors.correct}`,
        boxShadow: "0 16px 40px rgba(21,128,61,0.16)",
        opacity,
        transform: `scale(${scale})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: 100,
          fontWeight: 700,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: colors.correct,
          transform: `scale(${interpolate(answerPop, [0, 1], [0.75, 1])})`,
          textAlign: "center",
        }}
      >
        {answer}
      </div>
    </div>
  );
};
