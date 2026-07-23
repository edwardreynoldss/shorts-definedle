import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { TransitionManager } from "../components/TransitionManager";
import type { QuizData } from "../types";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

type Props = {
  data: QuizData;
};

/**
 * Root visual composition for a 1080×1920 YouTube Shorts quiz.
 */
export const QuizShort: React.FC<Props> = ({ data }) => {
  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: "#09090B" }}>
      <AnimatedBackground />
      <TransitionManager data={data} />
    </AbsoluteFill>
  );
};
