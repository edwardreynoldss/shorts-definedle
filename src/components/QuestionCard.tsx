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
import type { QuestionTimeline } from "../utils/timing";
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

      {!timeline.isBonus ? (
        <Sequence from={timeline.offsets.reveal} layout="none">
          <Audio src={staticFile("success.mp3")} volume={0.7} />
        </Sequence>
      ) : null}

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

      <AbsoluteFill
        style={{
          padding: "96px 48px 72px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: colors.textMuted,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          Question {index + 1} / {total}
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            marginBottom: 56,
            textAlign: "center",
            letterSpacing: -0.5,
          }}
        >
          {title}
        </div>

        <div
          style={{
            flex: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
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
            <AnswerReveal
              answer={question.answer}
              frame={revealLocal}
              isBonus={timeline.isBonus}
            />
          ) : null}
        </div>

        <div
          style={{
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          <CircularTimer frame={countdownLocal} visible={inCountdown} />
        </div>

        <ProgressDots total={total} currentIndex={index} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
