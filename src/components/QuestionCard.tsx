import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, LAYOUT } from "../theme";
import type { QuizQuestion, VoiceSegment } from "../types";
import {
  getDifficultyLabel,
  type QuestionTimeline,
} from "../utils/timing";
import { AnswerReveal } from "./AnswerReveal";
import { CircularTimer } from "./CircularTimer";
import { DefinitionRenderer } from "./DefinitionRenderer";
import { ProgressDots } from "./ProgressDots";

type Props = {
  question: QuizQuestion;
  index: number;
  total: number;
  title: string;
  timeline: QuestionTimeline;
};

/** Audio + definition text share one Sequence clock (frame 0 = voice start). */
const NarrationLayer: React.FC<{
  voice: string;
  segments: VoiceSegment[];
  fadeOut: number;
}> = ({ voice, segments, fadeOut }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <Audio src={staticFile(voice)} volume={1} />
      <DefinitionRenderer
        segments={segments}
        narrationFrame={frame}
        fadeOut={fadeOut}
        fixedHeight={LAYOUT.cardHeight}
      />
    </>
  );
};

/**
 * Full-screen layout for a single quiz question.
 */
export const QuestionCard: React.FC<Props> = ({
  question,
  index,
  total,
  title,
  timeline,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const difficultyLabel = getDifficultyLabel(question, index);

  const intro = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  const revealLocal = frame - timeline.offsets.reveal;
  const countdownLocal = frame - timeline.offsets.countdown;
  const inReveal = revealLocal >= 0;
  const inCountdown = countdownLocal >= 0 && !inReveal;

  const definitionFade = inReveal
    ? interpolate(revealLocal, [0, Math.round(fps * 0.28)], [0, 1], {
        extrapolateRight: "clamp",
      })
    : 0;

  const showDefinition = !inReveal || definitionFade < 1;

  const exit =
    frame > timeline.totalFrames - timeline.introFrames
      ? interpolate(
          frame,
          [
            timeline.totalFrames - timeline.introFrames,
            timeline.totalFrames,
          ],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      : 0;

  // Fade only — no vertical slide, so placements stay locked.
  const fade = interpolate(intro, [0, 1], [0, 1]) * (1 - exit);

  return (
    <AbsoluteFill
      style={{
        opacity: fade,
        fontFamily: "Inter, sans-serif",
        color: colors.text,
      }}
    >
      <Sequence from={timeline.offsets.reveal} layout="none">
        <Audio src={staticFile("success.mp3")} volume={0.7} />
      </Sequence>

      {Array.from({ length: 5 }).map((_, second) => (
        <Sequence
          key={`tick-${second}`}
          from={timeline.offsets.countdown + second * fps}
          durationInFrames={Math.round(fps * 0.4)}
          layout="none"
        >
          <Audio src={staticFile("tick.mp3")} volume={0.28} />
        </Sequence>
      ))}

      {/* Title — fixed */}
      <div
        style={{
          position: "absolute",
          top: LAYOUT.titleTop,
          left: 48,
          right: 48,
          fontSize: 84,
          fontWeight: 700,
          textAlign: "center",
          letterSpacing: -1.2,
          lineHeight: 1.05,
          color: colors.text,
        }}
      >
        {title}
      </div>

      {/* Difficulty — fixed under title */}
      <div
        style={{
          position: "absolute",
          top: LAYOUT.badgeTop,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: colors.difficulty,
            letterSpacing: 1,
            textTransform: "uppercase",
            backgroundColor: "rgba(37,99,235,0.1)",
            border: `2px solid ${colors.accent}`,
            borderRadius: 999,
            padding: "12px 32px",
          }}
        >
          {difficultyLabel}
        </div>
      </div>

      {/* Definition / answer slot — fixed size.
          Voice + words share one Sequence so their clocks cannot drift. */}
      <div
        style={{
          position: "absolute",
          top: LAYOUT.cardTop,
          left: 0,
          right: 0,
          height: LAYOUT.cardHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showDefinition ? (
          <Sequence from={timeline.offsets.narration} layout="none">
            <NarrationLayer
              voice={question.voice}
              segments={question.segments}
              fadeOut={definitionFade}
            />
          </Sequence>
        ) : null}

        {inReveal ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AnswerReveal answer={question.answer} frame={revealLocal} />
          </div>
        ) : null}
      </div>

      {/* Timer slot — always reserved so nothing jumps */}
      <div
        style={{
          position: "absolute",
          top: LAYOUT.timerTop,
          left: 0,
          right: 0,
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: inCountdown ? 1 : 0,
          pointerEvents: "none",
        }}
      >
        <CircularTimer frame={Math.max(0, countdownLocal)} visible={inCountdown} />
      </div>

      {/* Progress — fixed */}
      <div
        style={{
          position: "absolute",
          top: LAYOUT.progressTop,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ProgressDots
          total={total}
          currentIndex={index}
          difficultyLabel={`Question ${index + 1} / ${total}`}
        />
      </div>
    </AbsoluteFill>
  );
};
