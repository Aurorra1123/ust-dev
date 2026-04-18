import type { ReactNode } from "react";

export function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-navy/10 bg-gradient-to-br from-white to-sand px-5 py-5">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate">{detail}</p>
    </div>
  );
}

export function GuidancePanel({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-navy/10 bg-gradient-to-br from-sand to-mist px-5 py-5">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function EmptyPanel({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-navy/15 bg-sand px-5 py-6">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate">{description}</p>
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "success" | "danger";
}) {
  const toneClass =
    tone === "brand"
      ? "bg-ember/12 text-ember"
      : tone === "success"
        ? "bg-moss/12 text-moss"
        : tone === "danger"
          ? "bg-danger/12 text-danger"
          : "bg-white text-slate";

  return (
    <span className={`rounded-full px-3 py-1 text-xs ${toneClass}`}>
      {children}
    </span>
  );
}
