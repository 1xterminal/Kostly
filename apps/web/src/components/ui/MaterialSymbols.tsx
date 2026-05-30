export function Symbols({
  name,
  className,
  style
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return <span className={`material-symbols-rounded ${className}`} style={style}>{name}</span>;
}
