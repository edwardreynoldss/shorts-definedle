import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import quizData from "./data/questions.json";
import { QuizShort } from "./compositions/QuizShort";
import { VIDEO } from "./theme";
import type { QuizData } from "./types";
import { buildQuizTimeline } from "./utils/timing";

type QuizProps = {
  data: QuizData;
};

const calculateMetadata: CalculateMetadataFunction<QuizProps> = ({
  props,
}) => {
  const { totalFrames } = buildQuizTimeline(props.data.questions);

  return {
    durationInFrames: totalFrames,
    fps: VIDEO.fps,
    width: VIDEO.width,
    height: VIDEO.height,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="QuizShort"
        component={QuizShort}
        durationInFrames={1200}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{
          data: quizData as QuizData,
        }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
