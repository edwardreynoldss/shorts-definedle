import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import batchesManifest from "./data/batches.json";
import legacyQuizData from "./data/questions.json";
import { QuizShort } from "./compositions/QuizShort";
import { VIDEO } from "./theme";
import type { QuizData } from "./types";
import { buildQuizTimeline } from "./utils/timing";

type QuizProps = {
  data: QuizData;
};

type BatchFile = {
  batches?: Array<
    QuizData & {
      id: string;
    }
  >;
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

const manifest = batchesManifest as BatchFile;
const batches =
  manifest.batches && manifest.batches.length > 0
    ? manifest.batches
    : [
        {
          id: "QuizShort",
          ...(legacyQuizData as QuizData),
        },
      ];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {batches.map((batch) => {
        const data: QuizData = {
          title: batch.title,
          scorePrompt: batch.scorePrompt,
          scoreSubtext: batch.scoreSubtext,
          questions: batch.questions,
        };

        return (
          <Composition
            key={batch.id}
            id={batch.id}
            component={QuizShort}
            durationInFrames={1200}
            fps={VIDEO.fps}
            width={VIDEO.width}
            height={VIDEO.height}
            defaultProps={{ data }}
            calculateMetadata={calculateMetadata}
          />
        );
      })}
    </>
  );
};
