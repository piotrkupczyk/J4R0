type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default"|"secondary"|"ghost", size?: "sm"|"md" };
export function Button({ className="", variant="default", size="md", ...p }: Props){
  const base = "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm border transition";
  const variants:any = {
    default: "text-white hover:opacity-90",
    secondary: "bg-transparent hover:opacity-80",
    ghost: "bg-transparent border-transparent hover:opacity-80",
  };
  const sizes:any = { sm:"px-3 py-1.5 text-sm", md:"px-4 py-2 text-sm" };
  const style:any = {};
  if (variant === "default") {
    style.background = "var(--accent)";
    style.borderColor = "var(--accent)";
  } else if (variant === "secondary") {
    style.background = "var(--surface)";
    style.borderColor = "var(--border)";
    style.color = "var(--text)";
  }
  return <button {...p} style={style} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} />;
}
