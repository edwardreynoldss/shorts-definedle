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

/** Brand copy shown on every question screen. */
export const INTRO = {
  brand: "Definedle",
  tagline: "Guess the word from the definition",
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

/** Fixed 1080×1920 slots matching the target Short spacing. */
export const LAYOUT = {
  titleTop: 96,
  /** Tagline directly under the brand. */
  subtitleTop: 210,
  /** Difficulty badge sits just above the definition card. */
  badgeTop: 560,
  /** Card sits slightly above vertical center (center ≈ 860 on 1920). */
  cardTop: 660,
  cardHeight: 400,
  /** Keep the same gaps under the card as before. */
  timerTop: 1160,
  progressTop: 1520,
} as const;
