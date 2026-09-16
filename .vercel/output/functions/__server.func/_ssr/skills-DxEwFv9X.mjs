import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as ChordDiagram } from "./chord-diagram-C6Re10Bn.mjs";
import { t as AppShell } from "./app-shell-Cn6Z2zyU.mjs";
import { St as useSpark, U as cn, it as isUnlockedFor, ot as lessonsFor, tt as instrumentById, xt as tracksFor, z as UKE_CHORDS } from "./router-_2DnnNcg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/skills-DxEwFv9X.js
var import_jsx_runtime = require_jsx_runtime();
function SkillsPage() {
	const instrument = useSpark((s) => s.instrument);
	const mastery = useSpark((s) => s.progress.mastery);
	const inst = instrumentById(instrument);
	const tracks = tracksFor(instrument);
	const lessons = lessonsFor(instrument);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "px-5 pb-2 pt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[11px] uppercase tracking-[0.22em] text-dim",
					children: [inst.name, " path"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl font-semibold tracking-tight",
					children: "Skills"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-muted",
					children: "Play, make, listen. Mastery on the work — not songs collected."
				})
			]
		}),
		instrument === "guitar" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex gap-3 overflow-x-auto px-5 py-2",
			children: [
				"Em",
				"G",
				"C",
				"D",
				"Am"
			].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "shrink-0 rounded-lg border border-border bg-surface px-2 pt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChordDiagram, {
					chordId: c,
					compact: true
				})
			}, c))
		}) : null,
		instrument === "ukulele" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex gap-3 overflow-x-auto px-5 py-2",
			children: [
				"C",
				"G",
				"Am",
				"F"
			].map((c) => {
				const shape = UKE_CHORDS[c];
				if (!shape) return null;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "shrink-0 rounded-lg border border-border bg-surface px-2 pt-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChordDiagram, {
						shape: {
							id: c,
							name: c,
							...shape
						},
						compact: true
					})
				}, c);
			})
		}) : null,
		tracks.map((track) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "px-5 pt-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-lg font-semibold",
				children: track.name
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-2",
				children: lessons.filter((l) => l.trackId === track.id).map((lesson) => {
					const m = mastery[lesson.id] ?? 0;
					const open = isUnlockedFor(instrument, lesson.id, mastery);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: cn("rounded-lg border border-border bg-surface px-4 py-3", !open && "opacity-50"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-baseline justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: lesson.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "tabular text-xs text-muted",
									children: open ? `${Math.round(m * 100)}%` : "locked"
								})]
							}),
							lesson.repertoire || lesson.process ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-dim",
								children: [lesson.process === "create" ? "Make" : lesson.process === "respond" ? "Listen" : lesson.process === "perform" ? "Play" : null, lesson.repertoire].filter(Boolean).join(" · ")
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 h-1 overflow-hidden rounded-full bg-raised",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full bg-accent",
									style: { width: `${Math.round(m * 100)}%` }
								})
							})
						]
					}, lesson.id);
				})
			})]
		}, track.id))
	] });
}
//#endregion
export { SkillsPage as component };
