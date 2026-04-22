import type { ReactNode } from "react";

export function ActivityFieldBlock({
  label,
  hint,
  children
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-1 text-xs leading-6 text-slate">{hint}</p>
      </div>
      {children}
    </div>
  );
}
