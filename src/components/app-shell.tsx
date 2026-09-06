import { Link, useRouterState } from "@tanstack/react-router";
import {
  AudioLines,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  Flame,
  Gauge,
  Home,
  LayoutGrid,
  Music2,
} from "lucide-react";
import { LabFocus } from "@/components/lab-focus";
import { InstrumentMark } from "@/components/instrument-mark";
import { instrumentById } from "@/lib/spark/instruments";
import { labSearchFor, usesTechLab } from "@/lib/spark/labs";
import { DEFAULT_THEORY_SEARCH } from "@/lib/spark/theory";
import { useSpark } from "@/store/spark";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  wide = false,
  focusTimer = true,
}: {
  children: React.ReactNode;
  wide?: boolean;
  focusTimer?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const instrument = useSpark((s) => s.instrument);
  const third = usesTechLab(instrument)
    ? { to: "/techniques" as const, label: "Tech", icon: AudioLines }
    : { to: "/theory" as const, label: "Theory", icon: Music2 };
  const items = [
    { to: "/" as const, label: "Studio", icon: LayoutGrid },
    { to: "/today" as const, label: "Today", icon: Home },
    { to: "/learn" as const, label: "Learn", icon: BookOpen },
    third,
    { to: "/progress" as const, label: "Progress", icon: ChartNoAxesColumnIncreasing },
    { to: "/tuner" as const, label: "Tuner", icon: Gauge },
  ];
  const onFocusLab = pathname === "/techniques" || pathname === "/theory";
  return (
    <div className="min-h-dvh bg-bg lg:pl-56">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-border bg-surface p-5 lg:flex">
        <Link
          to="/"
          className="flex min-h-11 items-center gap-2 font-display text-xl font-semibold"
        >
          <Flame className="size-6 text-accent" aria-hidden="true" /> SparkSuite
        </Link>
        <p className="mt-1 text-xs uppercase tracking-widest text-muted">
          Your daily practice studio
        </p>
        <div className="mt-10 flex items-center gap-3 border-y border-border py-5">
          <InstrumentMark id={instrument} className="size-11" />
          <div>
            <p className="text-xs text-muted">On your stand</p>
            <p className="font-medium">{instrumentById(instrument).name}</p>
          </div>
        </div>
        <p className="mt-auto pb-4 text-sm leading-relaxed text-muted">
          A little practice.
          <br />A little more you.
        </p>
      </aside>
      <main
        id="main-content"
        tabIndex={-1}
        className={cn("mx-auto min-h-dvh pb-28 lg:pb-10", wide ? "max-w-6xl" : "max-w-lg")}
      >
        {onFocusLab && focusTimer ? <LabFocus /> : null}
        {children}
      </main>
      <nav
        aria-label="Main navigation"
        className="studio-nav fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface lg:inset-x-auto lg:bottom-auto lg:left-0 lg:top-64 lg:w-56 lg:border-t-0 lg:bg-transparent"
      >
        <ul className="mx-auto flex max-w-lg items-stretch px-2 pt-2 lg:flex-col lg:gap-1 lg:px-4">
          {items.map((item) => {
            const active =
              pathname === item.to || (item.to === "/progress" && pathname === "/skills");
            const Icon = item.icon;
            const props = {
              className: cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs font-medium transition-colors lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:text-sm",
                active ? "bg-raised text-accent" : "text-muted hover:bg-raised hover:text-fg",
              ),
              "aria-current": active ? ("page" as const) : undefined,
              children: (
                <>
                  <Icon className="size-5" aria-hidden="true" />
                  {item.label}
                </>
              ),
            };
            return (
              <li key={item.to} className="flex-1">
                {item.to === "/theory" ? (
                  <Link to="/theory" search={DEFAULT_THEORY_SEARCH} {...props} />
                ) : item.to === "/techniques" ? (
                  <Link to="/techniques" search={labSearchFor(instrument)} {...props} />
                ) : (
                  <Link to={item.to} {...props} />
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
