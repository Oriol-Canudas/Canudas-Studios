import { useState } from "react";

interface PortraitProps {
  name: string;
  accentColor: string;
  image?: string;
  size?: "sm" | "md" | "lg";
  /** A consistent, character-independent "this needs your attention" ring — used for a witness with an undelivered proactive contact. Deliberately amber regardless of accentColor, so it reads as one universal signal, not per-character styling. */
  glow?: boolean;
}

const sizeMap = {
  sm: "h-11 w-11 text-sm",
  md: "h-16 w-16 text-xl",
  lg: "h-28 w-28 text-3xl",
};

export default function Portrait({ name, accentColor, image, size = "md", glow = false }: PortraitProps) {
  const [errored, setErrored] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const glowClass = glow ? "ring-2 ring-amber-400/70 ring-offset-2 ring-offset-[#0a0a0d] animate-pulse" : "";

  if (image && !errored) {
    return (
      <img
        src={image}
        alt={name}
        onError={() => setErrored(true)}
        className={`${sizeMap[size]} ${glowClass} shrink-0 rounded-full border object-cover object-top`}
        style={{ borderColor: `${accentColor}55` }}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} ${glowClass} shrink-0 rounded-full flex items-center justify-center font-semibold border`}
      style={{
        background: `linear-gradient(145deg, ${accentColor}33, ${accentColor}11)`,
        borderColor: `${accentColor}55`,
        color: accentColor,
      }}
    >
      {initials}
    </div>
  );
}
