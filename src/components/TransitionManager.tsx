import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { QuizData } from "../types";
import { buildQuizTimeline } from "../utils/timing";
import { QuestionCard } from "./QuestionCard";

type Props = {
  data: QuizData;
};

/**
 * Sequences each question with calculated offsets — fully data-driven.
 */
export const TransitionManager: React.FC<Props> = ({ data }) => {
  const { questionTimelines, starts } = buildQuizTimeline(data.questions);
  const title = data.title ?? "Guess the Word";

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
    </AbsoluteFill>
  );
};
