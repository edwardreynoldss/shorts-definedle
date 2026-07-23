/**
 * Shared quiz defaults + helpers for batching questions into Shorts.
 */

import { DEFAULT_DIFFICULTY_LABELS } from "../theme";
import type { QuizData, QuizQuestion } from "../types";

export const QUESTIONS_PER_VIDEO = 4;

export const DEFAULT_QUIZ_META = {
  title: "Guess the word from the definition",
  scorePrompt: "Comment your score below 👇",
  scoreSubtext: "How many did you get right? 4/4? 3/4? Be honest!",
} as const;

export type QuizBatch = QuizData & {
  /** Remotion composition id, e.g. QuizShort-01 */
  id: string;
};

export type QuizManifest = {
  title: string;
  scorePrompt: string;
  scoreSubtext: string;
  questionsPerVideo: number;
  batches: QuizBatch[];
};

export const padBatch = (index: number): string =>
  String(index + 1).padStart(2, "0");

export const batchCompositionId = (index: number): string =>
  `QuizShort-${padBatch(index)}`;

export const voiceFileFor = (batchIndex: number, questionIndex: number): string =>
  `v${padBatch(batchIndex)}-q${questionIndex + 1}.mp3`;

export const withDefaultDifficulty = (
  question: QuizQuestion,
  indexInBatch: number,
): QuizQuestion => ({
  ...question,
  difficultyLabel:
    question.difficultyLabel ??
    DEFAULT_DIFFICULTY_LABELS[indexInBatch] ??
    `${Math.max(1, 70 - indexInBatch * 20)}% Question`,
});

export const chunkQuestions = (
  questions: QuizQuestion[],
  size = QUESTIONS_PER_VIDEO,
): QuizQuestion[][] => {
  const chunks: QuizQuestion[][] = [];
  for (let i = 0; i < questions.length; i += size) {
    chunks.push(questions.slice(i, i + size));
  }
  return chunks;
};
