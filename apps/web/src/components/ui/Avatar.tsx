import { useState } from "react";

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
  let [randomizedColor, _] = useState(colorPalettes[Math.floor(Math.random() * colorPalettes.length)]);

  return <div style={{
    width: size, height: size,
    borderRadius: '50%', backgroundColor: randomizedColor,
  }} />
}