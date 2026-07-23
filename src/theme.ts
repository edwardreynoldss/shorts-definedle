/** Design tokens from the product brief. */
export const colors = {
  background: "#09090B",
  card: "rgba(255,255,255,0.08)",
  cardBorder: "rgba(255,255,255,0.14)",
  accent: "#3B82F6",
  correct: "#22C55E",
  warning: "#F59E0B",
  text: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.72)",
} as const;

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
  revealHoldSec: 1.85,
  /** Duration of the question enter / exit transition. */
  transitionSec: 0.3,
} as const;
