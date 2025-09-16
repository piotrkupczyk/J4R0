type Props = React.InputHTMLAttributes<HTMLInputElement>;
export function Input({className="", ...p}: Props){
  return (
    <input
      {...p}
      className={`w-full rounded-xl px-3 py-2 text-sm outline-none ${className}`}
      style={{
        background: "var(--surface)",
        color: "var(--text)",
        border: "1px solid var(--border)"
      }}
    />
  );
}
