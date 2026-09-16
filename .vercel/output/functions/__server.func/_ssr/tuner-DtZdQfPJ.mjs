import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TunerPanel } from "./tuner-panel-BbNOOGJL.mjs";
import { t as AppShell } from "./app-shell-Cn6Z2zyU.mjs";
import { St as useSpark, tt as instrumentById } from "./router-_2DnnNcg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tuner-DtZdQfPJ.js
var import_jsx_runtime = require_jsx_runtime();
function TunerPage() {
	const instrument = useSpark((s) => s.instrument);
	const inst = instrumentById(instrument);
	const kicker = inst.surface === "pads" ? "Kick · snare · hat · tom" : inst.surface === "keys" || inst.surface === "voice" ? "C3 · C4 · C5" : inst.stringNames.join(" ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "px-5 pb-6 pt-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.22em] text-dim",
				children: kicker
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl font-semibold tracking-tight",
				children: inst.surface === "pads" ? "Kit" : "Tuner"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-muted",
				children: inst.surface === "pads" ? "Reference hits for the four pads. Tap to hear the kit." : inst.surface === "voice" ? "YIN pitch on the mic, or tap C for a drone." : "YIN pitch on the mic, or tap a reference pitch."
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "px-5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TunerPanel, {})
	})] });
}
//#endregion
export { TunerPage as component };
