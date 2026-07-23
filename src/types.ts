/** A timed phrase shown in sync with narration audio. */
export type VoiceSegment = {
  /** Phrase text to append when this segment becomes active. */
  text: string;
  /** Seconds from the start of the question voice track. */
  time: number;
};

export type QuizQuestion = {
  definition: string;
  answer: string;
  /** Filename under /public (e.g. voice1.mp3). */
  voice: string;
  segments: VoiceSegment[];
  /**
   * When true, skips the answer reveal and shows the comment CTA instead.
   * Defaults to true for the final question when omitted.
   */
  isBonus?: boolean;
};

export type QuizData = {
  title?: string;
  questions: QuizQuestion[];
};

export type QuestionPhase =
  | "intro"
  | "narration"
  | "countdown"
  | "reveal"
  | "bonus";
