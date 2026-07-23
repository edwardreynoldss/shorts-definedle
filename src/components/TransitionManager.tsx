import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { INTRO } from "../theme";
import type { QuizData } from "../types";
import { buildQuizTimeline } from "../utils/timing";
import { QuestionCard } from "./QuestionCard";
import { ScoreOutro } from "./ScoreOutro";

type Props = {
  data: QuizData;
};

/**
 * Sequences questions → score CTA — fully data-driven.
 */
export const TransitionManager: React.FC<Props> = ({ data }) => {
  const {
    questionTimelines,
    starts,
    scoreOutroStart,
    scoreOutroFrames,
  } = buildQuizTimeline(data.questions);

  const title = data.title ?? INTRO.brand;
  const scorePrompt = data.scorePrompt ?? "Comment your score below 👇";
  const scoreSubtext =
    data.scoreSubtext ?? "Subscribe for daily word quizzes";

  return (
    <AbsoluteFill>
      {data.questions.map((question, index) => (
        <Sequence
          key={`q-${index}`}
          from={starts[index]}
          durationInFrames={questionTimelines[index].totalFrames}
          name={`Question ${index + 1}`}
          premountFor={30}
        >
          <QuestionCard
            question={question}
            index={index}
            total={data.questions.length}
            title={title}
            timeline={questionTimelines[index]}
          />
        </Sequence>
      ))}

      <Sequence
        from={scoreOutroStart}
        durationInFrames={scoreOutroFrames}
        name="Score outro"
        premountFor={20}
      >
        <ScoreOutro prompt={scorePrompt} subtext={scoreSubtext} />
      </Sequence>
    </AbsoluteFill>
  );
};
