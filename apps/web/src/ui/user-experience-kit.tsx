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
    <div className="relative overflow-hidden rounded-[26px] border border-navy/10 bg-gradient-to-br from-white via-white to-sand px-5 py-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy via-moss to-gold" />
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-moss/8 blur-2xl" />
      <p className="relative text-xs uppercase tracking-[0.22em] text-moss">{label}</p>
      <p className="relative mt-3 text-3xl font-semibold text-ink">{value}</p>
      <p className="relative mt-2 text-sm leading-6 text-slate">{detail}</p>
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
    <div className="rounded-[26px] border border-navy/10 bg-gradient-to-br from-sand via-white to-mist px-5 py-5">
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

export function StatePanel({
  title,
  description,
  tone = "neutral"
}: {
  title: string;
  description: string;
  tone?: "neutral" | "loading" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "border-danger/18 bg-danger/8"
      : tone === "success"
        ? "border-moss/18 bg-moss/8"
        : tone === "loading"
          ? "border-moss/15 bg-mist"
          : "border-navy/10 bg-sand";

  return (
    <div className={`rounded-[24px] border px-5 py-5 ${toneClass}`}>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate">{description}</p>
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

export function HighlightPanel({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-navy via-[#0d3f82] to-moss px-6 py-6 text-white">
      <div className="absolute inset-y-0 right-0 w-40 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),transparent_62%)]" />
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.28em] text-white/65">{eyebrow}</p>
        <h3 className="mt-3 font-serif text-3xl leading-tight">{title}</h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82">{description}</p>
        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </div>
  );
}

export function StepList({
  items
}: {
  items: Array<{
    title: string;
    description: string;
  }>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {items.map((item, index) => (
        <div
          key={item.title}
          className="rounded-[24px] border border-navy/10 bg-white px-5 py-5"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ember text-sm font-semibold text-white">
              {index + 1}
            </span>
            <p className="text-base font-semibold text-ink">{item.title}</p>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
