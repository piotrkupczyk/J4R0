type Props = React.HTMLAttributes<HTMLSpanElement> & { variant?: "default"|"secondary"|"outline" };
export function Badge({ variant="default", className="", ...p }: Props){
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs";
  const style:any = {};
  if (variant === "default") {
    style.background = "var(--accent)";
    style.color = "#fff";
  } else if (variant === "secondary") {
    style.background = "var(--surface)";
    style.color = "var(--text)";
  } else if (variant === "outline") {
    style.border = "1px solid var(--border)";
    style.color = "var(--text)";
  }
  return <span {...p} style={style} className={`${base} ${className}`} />;
}
