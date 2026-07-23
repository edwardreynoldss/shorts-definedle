import { DEFAULT_DIFFICULTY_LABELS, INTRO, TIMING, VIDEO } from "../theme";
import type { QuizQuestion } from "../types";

const fps = VIDEO.fps;

export const secToFrames = (seconds: number): number =>
  Math.round(seconds * fps);

export const framesToSec = (frames: number): number => frames / fps;

/** Last segment time + buffer so narration feels finished before countdown.
 *  Prefer finishing the read-along before the voice ends. */
export const getNarrationDurationSec = (question: QuizQuestion): number => {
  if (question.segments.length === 0) {
    return 2.4;
  }

  const last = question.segments[question.segments.length - 1];
  // Hold a beat after the final word so viewers can read it, then countdown.
  return Math.max(last.time + 0.55, 2.1);
};

export const getDifficultyLabel = (
  question: QuizQuestion,
  index: number,
): string => {
  if (question.difficultyLabel) {
    return question.difficultyLabel;
  }

  return (
    DEFAULT_DIFFICULTY_LABELS[index] ??
    `${Math.max(1, 70 - index * 20)}% Question`
  );
};

export type QuestionTimeline = {
  introFrames: number;
  narrationFrames: number;
  delayFrames: number;
  countdownFrames: number;
  revealFrames: number;
  totalFrames: number;
  /** Frame offsets relative to the start of this question. */
  offsets: {
    narration: number;
    countdown: number;
    reveal: number;
  };
};

export const buildQuestionTimeline = (
  question: QuizQuestion,
): QuestionTimeline => {
  const introFrames = secToFrames(TIMING.transitionSec);
  const narrationFrames = secToFrames(getNarrationDurationSec(question));
  const delayFrames = secToFrames(TIMING.postNarrationDelaySec);
  const countdownFrames = secToFrames(TIMING.countdownSec);
  const revealFrames = secToFrames(TIMING.revealHoldSec);

  const offsets = {
    narration: introFrames,
    countdown: introFrames + narrationFrames + delayFrames,
    reveal: introFrames + narrationFrames + delayFrames + countdownFrames,
  };

  const totalFrames = offsets.reveal + revealFrames;

  return {
    introFrames,
    narrationFrames,
    delayFrames,
    countdownFrames,
    revealFrames,
    totalFrames,
    offsets,
  };
};

export type QuizTimeline = {
  questionTimelines: QuestionTimeline[];
  starts: number[];
  /** Cold-open intro before question 1. */
  videoIntroFrames: number;
  videoIntroStart: number;
  scoreOutroStart: number;
  scoreOutroFrames: number;
  totalFrames: number;
};

export const buildQuizTimeline = (
  questions: QuizQuestion[],
  introDurationSec: number = INTRO.durationSec,
): QuizTimeline => {
  const questionTimelines = questions.map((q) => buildQuestionTimeline(q));
  const videoIntroFrames = secToFrames(introDurationSec);
  const scoreOutroFrames = secToFrames(TIMING.scoreOutroSec);

  let cursor = 0;
  const videoIntroStart = cursor;
  cursor += videoIntroFrames;

  const starts = questionTimelines.map((tl) => {
    const start = cursor;
    cursor += tl.totalFrames;
    return start;
  });

  const scoreOutroStart = cursor;
  cursor += scoreOutroFrames;

  return {
    questionTimelines,
    starts,
    videoIntroFrames,
    videoIntroStart,
    scoreOutroStart,
    scoreOutroFrames,
    totalFrames: cursor,
  };
};
