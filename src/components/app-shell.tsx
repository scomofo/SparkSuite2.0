import { Link, useRouterState } from "@tanstack/react-router";
import { AudioLines, Gauge, Home, LayoutGrid, Music2 } from "lucide-react";
import { LabFocus } from "@/components/lab-focus";
import { labSearchFor, usesTechLab } from "@/lib/spark/labs";
import { DEFAULT_THEORY_SEARCH } from "@/lib/spark/theory";
import { useSpark } from "@/store/spark";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const instrument = useSpark((s) => s.instrument);
  const tech = usesTechLab(instrument);
  const third = tech
    ? { to: "/techniques" as const, label: "Tech", icon: AudioLines }
    : { to: "/theory" as const, label: "Theory", icon: Music2 };
  const onFocusLab = pathname === "/techniques" || pathname === "/theory";

  const items = [
    { to: "/" as const, label: "Suite", icon: LayoutGrid },
    { to: "/today" as const, label: "Today", icon: Home },
    third,
    { to: "/tuner" as const, label: "Tuner", icon: Gauge },
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg">
      <div className="flex-1 pb-24">
        {onFocusLab ? <LabFocus /> : null}
        {children}
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur-sm">
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {items.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            const className = cn(
              "flex min-h-11 flex-col items-center justify-center gap-1 rounded-md text-[11px] uppercase tracking-[0.14em]",
              active ? "text-accent" : "text-muted",
            );
            return (
              <li key={item.to} className="flex-1">
                {item.to === "/theory" ? (
                  <Link to="/theory" search={DEFAULT_THEORY_SEARCH} className={className}>
                    <Icon className="size-5" />
                    {item.label}
                  </Link>
                ) : item.to === "/techniques" ? (
                  <Link to="/techniques" search={labSearchFor(instrument)} className={className}>
                    <Icon className="size-5" />
                    {item.label}
                  </Link>
                ) : (
                  <Link to={item.to} className={className}>
                    <Icon className="size-5" />
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
