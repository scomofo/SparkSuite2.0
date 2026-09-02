import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { B as require_jsx_runtime, d as useRouterState, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Button } from "./button-DYd0ZC_F.mjs";
import { c as Gauge, d as AudioLines, i as Music2, o as LayoutGrid, s as House } from "../_libs/lucide-react.mjs";
import { Q as formatFocus, St as useSpark, U as cn, n as DEFAULT_THEORY_SEARCH } from "./router-_2DnnNcg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-shell-Cn6Z2zyU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Visible time-box on labs and theory. Hyperfocus protection. */
function LabFocus() {
	const [left, setLeft] = (0, import_react.useState)(240);
	(0, import_react.useEffect)(() => {
		const t0 = Date.now();
		const id = window.setInterval(() => {
			setLeft(Math.max(0, 240 - Math.floor((Date.now() - t0) / 1e3)));
		}, 250);
		return () => window.clearInterval(id);
	}, []);
	const done = left <= 0;
	const pct = left / 240 * 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "sticky top-0 z-10 border-b border-border bg-surface/95 px-5 py-3 backdrop-blur-sm",
		children: done ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-pretty text-sm",
				children: "That's enough. The day is the loop."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				size: "sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/today",
					children: "Today"
				})
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] uppercase tracking-[0.16em] text-dim",
				children: "Four minutes. Then stop."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "tabular text-sm text-ember",
				children: formatFocus(left)
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 h-1 overflow-hidden rounded-full bg-raised",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full bg-accent transition-[width] duration-(--motion-quick)",
				style: { width: `${pct}%` }
			})
		})] })
	});
}
function labSearchFor(id) {
	switch (id) {
		case "bass": return {
			tab: "alt",
			chord: "Em"
		};
		case "drums": return {
			tab: "kick",
			chord: ""
		};
		case "piano": return {
			tab: "middlec",
			chord: "C"
		};
		case "ukulele": return {
			tab: "down",
			chord: "C"
		};
		case "vocals": return {
			tab: "drone",
			chord: "C"
		};
		default: return {
			tab: "down",
			chord: "Em"
		};
	}
}
function usesTechLab(id) {
	return id !== "guitar";
}
function labCardFor(id) {
	switch (id) {
		case "bass": return {
			kicker: "Bass lab",
			title: "Fingerstyle",
			body: "Alternating fingers, ghosts, thumb, rakes, hammer-ons. Four minutes. Then stop.",
			cta: "Four minutes"
		};
		case "drums": return {
			kicker: "Drums lab",
			title: "Groove",
			body: "Kick names one. Snare answers on two and four. Hats are the clock. Four minutes. Then stop.",
			cta: "Four minutes"
		};
		case "piano": return {
			kicker: "Piano lab",
			title: "Hands",
			body: "Find C, build a triad, invert it, feel G pull you home. Four minutes. Then stop.",
			cta: "Four minutes"
		};
		case "ukulele": return {
			kicker: "Ukulele lab",
			title: "Strum",
			body: "Downstrokes, island strum, chunks, fingerpicking. Four minutes. Then stop.",
			cta: "Four minutes"
		};
		case "vocals": return {
			kicker: "Voice lab",
			title: "Breath",
			body: "Match a C, hold it four beats, step to a neighbor. Four minutes. Then stop.",
			cta: "Four minutes"
		};
		default: return null;
	}
}
function AppShell({ children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const instrument = useSpark((s) => s.instrument);
	const third = usesTechLab(instrument) ? {
		to: "/techniques",
		label: "Tech",
		icon: AudioLines
	} : {
		to: "/theory",
		label: "Theory",
		icon: Music2
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-dvh max-w-lg flex-col bg-bg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 pb-24",
			children: [pathname === "/techniques" || pathname === "/theory" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LabFocus, {}) : null, children]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
			className: "fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2",
				children: [
					{
						to: "/",
						label: "Suite",
						icon: LayoutGrid
					},
					{
						to: "/today",
						label: "Today",
						icon: House
					},
					third,
					{
						to: "/tuner",
						label: "Tuner",
						icon: Gauge
					}
				].map((item) => {
					const active = pathname === item.to;
					const Icon = item.icon;
					const className = cn("flex min-h-11 flex-col items-center justify-center gap-1 rounded-md text-[11px] uppercase tracking-[0.14em]", active ? "text-accent" : "text-muted");
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "flex-1",
						children: item.to === "/theory" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/theory",
							search: DEFAULT_THEORY_SEARCH,
							className,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), item.label]
						}) : item.to === "/techniques" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/techniques",
							search: labSearchFor(instrument),
							className,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), item.label]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							className,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), item.label]
						})
					}, item.to);
				})
			})
		})]
	});
}
//#endregion
export { labCardFor as n, labSearchFor as r, AppShell as t };
