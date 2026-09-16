import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { B as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Button } from "./button-DYd0ZC_F.mjs";
import { l as markSting } from "./audio-DIq8nkMh.mjs";
import { t as CheckinRow } from "./udl-chrome-B3jlEpW1.mjs";
import { t as AppShell } from "./app-shell-Cn6Z2zyU.mjs";
import { n as WeekPulseRow, r as XpBar, t as MarkList } from "./game-chrome-Bp7u4VG7.mjs";
import { Ct as weekPulse, H as closingCopy, St as useSpark, Tt as xpProgress, _t as streakTone, ft as rankFor, gt as sparksFor, st as localDayKey, tt as instrumentById } from "./router-_2DnnNcg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/results-C2nvRzhm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function prettyLesson(id) {
	return id.replace(/^lesson_[a-z]+_/, "").replace(/_/g, " ").replace(/\s+\d+$/, "");
}
function ResultsPage() {
	const result = useSpark((s) => s.lastResult);
	const progress = useSpark((s) => s.progress);
	const instrument = useSpark((s) => s.instrument);
	const noteCheckin = useSpark((s) => s.noteCheckin);
	const inst = instrumentById(instrument);
	const tone = streakTone(progress, localDayKey());
	const rank = rankFor(progress.level);
	const xp = xpProgress(progress.xp);
	const week = weekPulse(progress);
	const sparks = sparksFor(progress);
	const newMarks = result?.newMarks ?? [];
	(0, import_react.useEffect)(() => {
		if (!result) return;
		if (result.leveledUp || newMarks.length) markSting();
	}, [result, newMarks.length]);
	if (!result) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-5 pt-16 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted",
			children: "No session yet."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/today",
				children: "Back to today"
			})
		})]
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "px-5 pb-2 pt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[11px] uppercase tracking-[0.22em] text-dim",
					children: [
						inst.name,
						" · ",
						rank.title
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl font-semibold tracking-tight",
					children: result.leveledUp ? `Level ${progress.level}` : "That's the day"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-sm text-pretty text-muted",
					children: result.leveledUp ? rank.line : closingCopy(result)
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-4 mt-4 rounded-xl border border-border bg-surface p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-3 gap-3 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "stars",
							value: String(result.stars)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "xp",
							value: `+${result.xp}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "combo",
							value: String(result.peakCombo ?? 0)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(XpBar, {
						into: xp.into,
						need: xp.need,
						label: `Level ${xp.level} · ${rank.title}`
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeekPulseRow, { pulse: week }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 tabular text-xs text-dim",
						children: [
							sparks,
							" spark",
							sparks === 1 ? "" : "s"
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-center text-sm text-muted",
					children: [
						"Streak ",
						progress.streak,
						tone === "held" ? " held" : ""
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 border-t border-border pt-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckinRow, {
						value: progress.lastCheckin,
						onPick: noteCheckin
					})
				}),
				newMarks.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 border-t border-border pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-[11px] uppercase tracking-[0.18em] text-dim",
						children: "Marks"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarkList, { ids: newMarks })]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-6 space-y-2",
					children: result.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex justify-between text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: prettyLesson(item.lessonId)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "tabular",
							children: [
								item.stars,
								"★ · ",
								Math.round(item.accuracy * 100),
								"%"
							]
						})]
					}, item.itemId))
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-5 pt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				size: "lg",
				className: "w-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/today",
					children: "Back to today"
				})
			})
		})
	] });
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "font-display text-2xl font-semibold tabular",
		children: value
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-[11px] uppercase tracking-[0.16em] text-dim",
		children: label
	})] });
}
//#endregion
export { ResultsPage as component };
