import { useState } from "react";

interface PortraitProps {
  name: string;
  accentColor: string;
  image?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-11 w-11 text-sm",
  md: "h-16 w-16 text-xl",
  lg: "h-28 w-28 text-3xl",
};

export default function Portrait({ name, accentColor, image, size = "md" }: PortraitProps) {
  const [errored, setErrored] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (image && !errored) {
    return (
      <img
        src={image}
        alt={name}
        onError={() => setErrored(true)}
        className={`${sizeMap[size]} shrink-0 rounded-full border object-cover object-top`}
        style={{ borderColor: `${accentColor}55` }}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} shrink-0 rounded-full flex items-center justify-center font-semibold border`}
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
