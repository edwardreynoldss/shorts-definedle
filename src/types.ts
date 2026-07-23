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
   * Difficulty badge, e.g. "70% Question".
   * Falls back to the default ladder by index when omitted.
   */
  difficultyLabel?: string;
  /** Stable id from input/question-bank.csv */
  bankId?: string;
};

export type QuizData = {
  title?: string;
  /** End-screen CTA prompting viewers to comment scores. */
  scorePrompt?: string;
  scoreSubtext?: string;
  /** Shared cold-open voice file under /public. */
  introVoice?: string;
  /** Override intro length (seconds), usually set by `npm run voices`. */
  introDurationSec?: number;
  /** When the second intro line appears. */
  introLine2AtSec?: number;
  questions: QuizQuestion[];
};

export type QuestionPhase =
  | "intro"
  | "narration"
  | "countdown"
  | "reveal"
  | "score";
