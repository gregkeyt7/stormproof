import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
};

export function SectionCard({
  title,
  description,
  icon,
  children,
}: SectionCardProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
      <header className="mb-4 flex items-start gap-3">
        {icon ? (
          <span className="mt-1 rounded-md border border-cyan-400/30 bg-cyan-400/10 p-1.5 text-cyan-300">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          ) : null}
        </div>
      </header>
      {children}
    </section>
  );
}
