/** Educational whiteboard design tokens. */
export const colors = {
  background: "#F5F7FA",
  card: "rgba(255,255,255,0.88)",
  cardBorder: "rgba(37,99,235,0.18)",
  accent: "#2563EB",
  correct: "#15803D",
  warning: "#D97706",
  text: "#111827",
  textMuted: "rgba(17,24,39,0.62)",
  difficulty: "#1D4ED8",
} as const;

/** Default difficulty labels from easy → hardest. */
export const DEFAULT_DIFFICULTY_LABELS = [
  "70% Question",
  "40% Question",
  "10% Question",
  "1% Question",
] as const;

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/** Timing knobs shared across the quiz engine. */
export const TIMING = {
  /** Pause after narration before the countdown starts. */
  postNarrationDelaySec: 0.3,
  /** Countdown length in seconds. */
  countdownSec: 5,
  /** Hold on the answer / CTA before transitioning. */
  revealHoldSec: 1.7,
  /** Duration of the question enter / exit transition. */
  transitionSec: 0.3,
  /** Final “comment your score” outro length. */
  scoreOutroSec: 3.2,
} as const;
