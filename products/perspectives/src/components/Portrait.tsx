interface PortraitProps {
  name: string;
  accentColor: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-xl",
  lg: "h-24 w-24 text-3xl",
};

export default function Portrait({ name, accentColor, size = "md" }: PortraitProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
