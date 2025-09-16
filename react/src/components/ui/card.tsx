export function Card({className="", ...p}: any){
  return (
    <div
      {...p}
      className={`rounded-2xl border shadow-sm ${className}`}
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--text)"
      }}
    />
  );
}
export const CardHeader = (p:any)=><div {...p} className={`p-4 ${p.className||""}`} />;
export const CardContent = (p:any)=><div {...p} className={`p-4 pt-0 ${p.className||""}`} />;
export const CardTitle = (p:any)=><h3 {...p} className={`font-semibold ${p.className||""}`} />;
