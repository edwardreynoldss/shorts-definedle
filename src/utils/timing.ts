import { TIMING, VIDEO } from "../theme";
import type { QuizQuestion } from "../types";

const fps = VIDEO.fps;

export const secToFrames = (seconds: number): number =>
  Math.round(seconds * fps);

export const framesToSec = (frames: number): number => frames / fps;

/** Last segment time + buffer so narration feels finished before countdown. */
export const getNarrationDurationSec = (question: QuizQuestion): number => {
  if (question.segments.length === 0) {
    return 2.4;
  }

  const last = question.segments[question.segments.length - 1];
  // Hold the final phrase briefly after it appears, keeping the short under ~42s.
  return Math.max(last.time + 0.45, 2.1);
};

export type QuestionTimeline = {
  introFrames: number;
  narrationFrames: number;
  delayFrames: number;
  countdownFrames: number;
  revealFrames: number;
  totalFrames: number;
  isBonus: boolean;
  /** Frame offsets relative to the start of this question. */
  offsets: {
    narration: number;
    countdown: number;
    reveal: number;
  };
};

export const buildQuestionTimeline = (
  question: QuizQuestion,
  index: number,
  totalQuestions: number,
): QuestionTimeline => {
  const isBonus = question.isBonus ?? index === totalQuestions - 1;

  const introFrames = secToFrames(TIMING.transitionSec);
  const narrationFrames = secToFrames(getNarrationDurationSec(question));
  const delayFrames = secToFrames(TIMING.postNarrationDelaySec);
  const countdownFrames = secToFrames(TIMING.countdownSec);
  // Exit motion plays inside the reveal hold so transitions don't stack length.
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
    isBonus,
    offsets,
  };
};

export const buildQuizTimeline = (questions: QuizQuestion[]) => {
  const questionTimelines = questions.map((q, i) =>
    buildQuestionTimeline(q, i, questions.length),
  );

  let cursor = 0;
  const starts = questionTimelines.map((tl) => {
    const start = cursor;
    cursor += tl.totalFrames;
    return start;
  });

  return {
    questionTimelines,
    starts,
    totalFrames: cursor,
  };
};
