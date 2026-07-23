import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "../theme";

/**
 * Educational whiteboard backdrop with subtle motion and soft overlays.
 */
export const AnimatedBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drift = interpolate(Math.sin(frame / (fps * 2.2)), [-1, 1], [-8, 8]);
  const scale = interpolate(Math.sin(frame / (fps * 3.4)), [-1, 1], [1.02, 1.05]);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translate(${drift}px, ${drift * -0.4}px)`,
        }}
      >
        <Img
          src={staticFile("whiteboard.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>

      {/* Soft wash: keep the board readable without hiding the marker tray */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.18) 82%, rgba(255,255,255,0.28) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
