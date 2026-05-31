interface AvatarProps {
  src?: string;
  name?: string;
  size?: number;
}

const colorPalettes = [
  "#F45712",
  "#F3D42A",
  "#11E468",
  "#0E9AF1",
  "#5724EF",
  "#9A13D9",
  "#EA0EA8"
]

export default function Avatar({ src, name, size = 64 }: AvatarProps) {
  const label = name?.trim() || "User";
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const paletteIndex = Array.from(label).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  ) % colorPalettes.length;
  const backgroundColor = colorPalettes[paletteIndex];

  if (src) {
    return (
      <img
        src={src}
        alt={`${label}'s avatar`}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />
    );
  }

  return (
    <div
      aria-label={`${label}'s avatar`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor,
        color: "white",
        display: "grid",
        placeItems: "center",
        fontSize: Math.max(12, Math.round(size * 0.34)),
        fontWeight: 700,
      }}
    >
      {initials || "U"}
    </div>
  );
}
