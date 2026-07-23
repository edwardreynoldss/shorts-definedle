import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { INTRO } from "../theme";
import type { QuizData } from "../types";
import { buildQuizTimeline } from "../utils/timing";
import { IntroCard } from "./IntroCard";
import { QuestionCard } from "./QuestionCard";
import { ScoreOutro } from "./ScoreOutro";

type Props = {
  data: QuizData;
};

/**
 * Sequences intro → questions → score CTA — fully data-driven.
 */
export const TransitionManager: React.FC<Props> = ({ data }) => {
  const introDurationSec = data.introDurationSec ?? INTRO.durationSec;
  const {
    questionTimelines,
    starts,
    videoIntroStart,
    videoIntroFrames,
    scoreOutroStart,
    scoreOutroFrames,
  } = buildQuizTimeline(data.questions, introDurationSec);

  const title = data.title ?? INTRO.brand;
  const scorePrompt = data.scorePrompt ?? "Comment your score below 👇";
  const scoreSubtext =
    data.scoreSubtext ?? "Subscribe for daily word quizzes";
  const introVoice = data.introVoice ?? INTRO.voiceFile;

  return (
    <AbsoluteFill>
      <Sequence
        from={videoIntroStart}
        durationInFrames={videoIntroFrames}
        name="Intro"
        premountFor={20}
      >
        <IntroCard
          voiceFile={introVoice}
          line2AtSec={data.introLine2AtSec ?? INTRO.line2AtSec}
        />
      </Sequence>

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
