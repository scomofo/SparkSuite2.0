import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { L as PROCESS_LABEL, M as CHECKINS, U as cn, ht as roleLabel, mt as rhythmRead } from "./router-_2DnnNcg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/udl-chrome-B3jlEpW1.js
var import_jsx_runtime = require_jsx_runtime();
function RoleTag({ role, process }) {
	const label = process && process !== "perform" ? PROCESS_LABEL[process] : roleLabel(role);
	if (!label) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("shrink-0 text-[11px] uppercase tracking-[0.18em]", role === "new" || process === "create" || process === "respond" ? "text-ember" : "text-dim"),
		children: label
	});
}
function RhythmRead({ pattern }) {
	const cells = rhythmRead(pattern);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full",
		"aria-label": "Rhythm notation",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-1 text-center text-[11px] uppercase tracking-[0.18em] text-dim",
			children: "Read"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "grid grid-cols-4 gap-1 sm:grid-cols-8",
			children: cells.slice(0, 8).map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "flex h-11 items-center justify-center rounded-md border border-border bg-raised font-display text-lg text-fg",
				children: c
			}, `${c}-${i}`))
		})]
	});
}
function HarmonyRead({ symbols }) {
	if (!symbols?.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "text-center font-display text-sm tabular text-muted",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mr-2 text-[11px] uppercase tracking-[0.18em] text-dim",
				children: "Harmony"
			}),
			" ",
			symbols.join(" → ")
		]
	});
}
function CriteriaList({ items }) {
	if (!items.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "w-full space-y-1 text-center",
		children: items.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
			className: "text-pretty text-muted",
			children: line
		}, line))
	});
}
function CheckinRow({ value, onPick }) {
	const picked = CHECKINS.find((c) => c.id === value);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] uppercase tracking-[0.18em] text-dim",
			children: "How did today sit?"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 grid grid-cols-3 gap-2",
			children: CHECKINS.map((c) => {
				const on = value === c.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": on,
					onClick: () => onPick(c.id),
					className: cn("min-h-11 rounded-md px-2 py-2 text-center text-sm font-medium transition-colors duration-(--motion-quick)", on ? "bg-accent text-accent-fg" : "border border-border bg-raised text-fg hover:border-ember/50"),
					children: c.title
				}, c.id);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: picked ? picked.body : "Optional. Skip it."
		})
	] });
}
//#endregion
export { RoleTag as a, RhythmRead as i, CriteriaList as n, HarmonyRead as r, CheckinRow as t };
