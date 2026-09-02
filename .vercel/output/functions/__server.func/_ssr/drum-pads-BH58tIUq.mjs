import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { U as cn } from "./router-_2DnnNcg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/drum-pads-BH58tIUq.js
var import_jsx_runtime = require_jsx_runtime();
var PADS = [
	{
		i: 0,
		label: "Kick"
	},
	{
		i: 1,
		label: "Snare"
	},
	{
		i: 2,
		label: "Hat"
	},
	{
		i: 3,
		label: "Tom"
	}
];
function DrumPads({ active, expected, onHit, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-2 gap-3",
		role: "group",
		"aria-label": "Drum pads",
		children: PADS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			disabled,
			onPointerDown: (e) => {
				e.preventDefault();
				onHit(p.i);
			},
			className: cn("flex h-24 items-center justify-center rounded-lg border font-display text-lg font-semibold transition-colors duration-(--motion-quick)", active === p.i ? "border-accent bg-accent text-accent-fg" : expected === p.i ? "border-ember bg-raised text-ember" : "border-border bg-raised text-fg"),
			children: p.label
		}, p.i))
	});
}
//#endregion
export { DrumPads as t };
