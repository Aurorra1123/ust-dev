export function QuickWorkspaceCard({
  title,
  description,
  action,
  onClick
}: {
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded-[24px] border border-navy/10 bg-gradient-to-br from-white to-sand px-5 py-5 text-left transition hover:-translate-y-1 hover:border-moss"
      onClick={onClick}
    >
      <p className="text-lg font-semibold text-ink">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate">{description}</p>
      <p className="mt-5 text-sm font-medium text-ember">{action} →</p>
    </button>
  );
}
