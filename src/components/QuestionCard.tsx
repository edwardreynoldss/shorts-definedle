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
import { colors } from "../theme";
import type { QuizQuestion } from "../types";
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
    ? interpolate(revealLocal, [0, Math.round(fps * 0.35)], [0, 1], {
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

  const slideY = interpolate(intro, [0, 1], [80, 0]);
  const fade = interpolate(intro, [0, 1], [0, 1]) * (1 - exit);
  const scale =
    interpolate(intro, [0, 1], [0.96, 1]) *
    interpolate(exit, [0, 1], [1, 0.97]);

  return (
    <AbsoluteFill
      style={{
        opacity: fade,
        transform: `translateY(${slideY + exit * -40}px) scale(${scale})`,
        fontFamily: "Inter, sans-serif",
        color: colors.text,
      }}
    >
      <Sequence from={timeline.offsets.narration} layout="none">
        <Audio src={staticFile(question.voice)} volume={1} />
      </Sequence>

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
          <Audio src={staticFile("tick.mp3")} volume={0.55} />
        </Sequence>
      ))}

      {/* Center the whole stack so title sits lower and progress sits higher */}
      <AbsoluteFill
        style={{
          padding: "0 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        <div
          style={{
            fontSize: 54,
            fontWeight: 700,
            marginBottom: 20,
            textAlign: "center",
            letterSpacing: -0.5,
            lineHeight: 1.18,
            maxWidth: 940,
            color: colors.text,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: colors.difficulty,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 44,
            backgroundColor: "rgba(37,99,235,0.1)",
            border: `2px solid ${colors.accent}`,
            borderRadius: 999,
            padding: "12px 32px",
          }}
        >
          {difficultyLabel}
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            marginBottom: inCountdown ? 36 : 44,
            minHeight: 360,
          }}
        >
          {showDefinition ? (
            <div
              style={{
                position: inReveal ? "absolute" : "relative",
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <DefinitionRenderer
                segments={question.segments}
                frame={frame}
                narrationStart={timeline.offsets.narration}
                fadeOut={definitionFade}
              />
            </div>
          ) : null}

          {inReveal ? (
            <AnswerReveal answer={question.answer} frame={revealLocal} />
          ) : null}
        </div>

        {inCountdown ? (
          <div
            style={{
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 28,
            }}
          >
            <CircularTimer frame={countdownLocal} visible />
          </div>
        ) : null}

        <ProgressDots
          total={total}
          currentIndex={index}
          difficultyLabel={`Question ${index + 1} / ${total}`}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
