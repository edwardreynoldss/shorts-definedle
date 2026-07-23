import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { colors } from "../theme";

type Props = {
  answer: string;
  /** Frame relative to reveal start. */
  frame: number;
};

/**
 * Answer card expand + marker-green emphasis on the whiteboard.
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

  const scale = interpolate(enter, [0, 1], [0.72, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: "relative",
        width: "86%",
        maxWidth: 860,
        minHeight: 320,
        padding: "56px 40px",
        borderRadius: 32,
        background: "rgba(240,253,244,0.95)",
        border: `3px solid ${colors.correct}`,
        boxShadow: "0 16px 40px rgba(21,128,61,0.16)",
        opacity,
        transform: `scale(${scale})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 92,
          fontWeight: 700,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: colors.correct,
          transform: `scale(${interpolate(answerPop, [0, 1], [0.6, 1])})`,
        }}
      >
        {answer}
      </div>
    </div>
  );
};
