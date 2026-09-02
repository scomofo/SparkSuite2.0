import { B as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as Flame } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./app-shell-Cn6Z2zyU.mjs";
import { Ct as weekPulse, P as INSTRUMENTS, St as useSpark, U as cn, X as defaultProgress, ft as rankFor, gt as sparksFor, tt as instrumentById } from "./router-_2DnnNcg.mjs";
import { t as InstrumentMark } from "./instrument-mark-Dg6mzwUq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CYJghNPA.js
var import_jsx_runtime = require_jsx_runtime();
function SuiteHome() {
	const navigate = useNavigate();
	const active = useSpark((s) => s.instrument);
	const selectInstrument = useSpark((s) => s.selectInstrument);
	const apps = useSpark((s) => s.apps);
	const totalXp = useSpark((s) => s.suiteXp);
	const maxStreak = useSpark((s) => s.bestStreak);
	const featured = instrumentById(active);
	const featuredProgress = apps[featured.id] ?? defaultProgress();
	const featuredRank = rankFor(featuredProgress.level);
	const featuredWeek = weekPulse(featuredProgress);
	function open(id) {
		selectInstrument(id);
		navigate({ to: "/today" });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "px-5 pb-2 pt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.22em] text-dim",
					children: "Practice console"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl font-semibold tracking-tight",
					children: "SparkSuite"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-sm text-pretty text-muted",
					children: "One loop a day. Pick the instrument in your hands."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border bg-surface px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.16em] text-dim",
							children: "Suite XP"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "tabular font-display text-xl font-semibold",
							children: totalXp
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "size-4 text-ember" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.16em] text-dim",
							children: "Best streak"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "tabular font-display text-xl font-semibold",
							children: maxStreak
						})] })]
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-4 mt-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.18em] text-dim",
				children: "Continue"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => open(featured.id),
				className: "mt-2 flex w-full items-center gap-4 rounded-xl border border-accent bg-surface p-4 text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstrumentMark, {
					id: featured.id,
					className: "size-20"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xl font-semibold",
						children: featured.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-pretty text-sm text-muted",
						children: [featuredRank.title, featuredWeek.held ? " · week held" : ` · ${featuredWeek.count} / 3 this week`]
					})]
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "px-5 pt-8 pb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-lg font-semibold",
				children: "Collection"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-2",
				children: INSTRUMENTS.map((inst) => {
					const p = apps[inst.id];
					const played = (p?.history.length ?? 0) > 0;
					const rank = rankFor(p?.level ?? 1);
					const sparks = p ? sparksFor(p) : 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => open(inst.id),
						className: cn("flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors duration-(--motion-quick)", inst.id === active ? "border-accent bg-raised" : "border-border bg-surface hover:border-ember/40"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstrumentMark, { id: inst.id }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display font-semibold",
									children: inst.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm text-muted",
									children: played ? rank.title : inst.kicker
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "shrink-0 tabular text-xs text-dim",
								children: played ? `${sparks} spark${sparks === 1 ? "" : "s"}` : "New"
							})
						]
					}) }, inst.id);
				})
			})]
		})
	] });
}
//#endregion
export { SuiteHome as component };
