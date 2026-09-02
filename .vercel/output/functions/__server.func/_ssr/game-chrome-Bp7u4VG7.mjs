import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { U as cn, ct as markById } from "./router-_2DnnNcg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/game-chrome-Bp7u4VG7.js
var import_jsx_runtime = require_jsx_runtime();
function WeekPulseRow({ pulse, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex items-center gap-3", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex gap-1",
			"aria-label": `${pulse.count} of 7 days this week`,
			children: pulse.days.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2.5 rounded-full", d.on ? "bg-ember" : "border border-border") }, d.key))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] uppercase tracking-[0.16em] text-dim",
			children: pulse.held ? "Week held" : `${pulse.count} / 3 this week`
		})]
	});
}
function XpBar({ into, need, label }) {
	const pct = Math.max(0, Math.min(100, Math.round(into / need * 100)));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [label ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-1 flex justify-between text-[11px] uppercase tracking-[0.16em] text-dim",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "tabular",
			children: [
				into,
				" / ",
				need
			]
		})]
	}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-1.5 overflow-hidden rounded-full bg-raised",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-full bg-accent",
			style: { width: `${pct}%` }
		})
	})] });
}
function MarkList({ ids }) {
	if (!ids.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-3",
		children: ids.map((id) => {
			const mark = markById(id);
			if (!mark) return null;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: mark.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: mark.body
			})] }, id);
		})
	});
}
//#endregion
export { WeekPulseRow as n, XpBar as r, MarkList as t };
