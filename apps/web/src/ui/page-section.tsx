import type { ReactNode } from "react";

export function PageSection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-6 rounded-[28px] bg-white px-6 py-6 shadow-panel lg:px-8">
      <h3 className="text-xl font-semibold text-ink">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}
