import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { U as cn } from "./router-_2DnnNcg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/instrument-mark-Dg6mzwUq.js
var import_jsx_runtime = require_jsx_runtime();
var SRC = {
	guitar: "/instruments/guitar.jpg",
	piano: "/instruments/piano.jpg",
	ukulele: "/instruments/ukulele.jpg",
	bass: "/instruments/bass.jpg",
	drums: "/instruments/drums.jpg",
	vocals: "/instruments/vocals.jpg"
};
function InstrumentMark({ id, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: SRC[id],
		alt: "",
		"aria-hidden": true,
		width: 128,
		height: 128,
		crossOrigin: "anonymous",
		className: cn("size-16 shrink-0 rounded-md object-cover ring-1 ring-border", className)
	});
}
//#endregion
export { InstrumentMark as t };
