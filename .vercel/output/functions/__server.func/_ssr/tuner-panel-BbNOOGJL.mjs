import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Button } from "./button-DYd0ZC_F.mjs";
import { a as drumHit, f as pianoTone, g as unlockAudio, p as pluck } from "./audio-DIq8nkMh.mjs";
import { t as DrumPads } from "./drum-pads-BH58tIUq.mjs";
import { F as OPEN_FREQ, R as STRING_NAMES, St as useSpark, U as cn, lt as midiToFreq, tt as instrumentById } from "./router-_2DnnNcg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tuner-panel-BbNOOGJL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** YIN pitch detection. Returns Hz or -1. */
function yinPitch(buf, sampleRate, threshold = .12) {
	const n = buf.length;
	const half = Math.floor(n / 2);
	const d = new Float32Array(half);
	for (let tau = 1; tau < half; tau++) {
		let sum = 0;
		for (let i = 0; i < half; i++) {
			const diff = buf[i] - buf[i + tau];
			sum += diff * diff;
		}
		d[tau] = sum;
	}
	const cmnd = new Float32Array(half);
	cmnd[0] = 1;
	let running = 0;
	for (let tau = 1; tau < half; tau++) {
		running += d[tau];
		cmnd[tau] = d[tau] * tau / running;
	}
	let tau = 2;
	for (; tau < half; tau++) if (cmnd[tau] < threshold) {
		while (tau + 1 < half && cmnd[tau + 1] < cmnd[tau]) tau++;
		break;
	}
	if (tau === half || cmnd[tau] >= threshold) return -1;
	const x0 = tau < 1 ? tau : tau - 1;
	const x2 = tau + 1 < half ? tau + 1 : tau;
	const s0 = cmnd[x0];
	const s1 = cmnd[tau];
	const s2 = cmnd[x2];
	return sampleRate / (tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0)));
}
function nearestString(freq, freqs = OPEN_FREQ, names = STRING_NAMES) {
	let best = 0;
	let bestC = Infinity;
	for (let i = 0; i < freqs.length; i++) {
		const cents = 1200 * Math.log2(freq / freqs[i]);
		if (Math.abs(cents) < Math.abs(bestC)) {
			bestC = cents;
			best = i;
		}
	}
	return {
		index: best,
		name: names[best] ?? "-",
		cents: bestC,
		target: freqs[best]
	};
}
async function startMicAnalyser() {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: {
			echoCancellation: false,
			noiseSuppression: false,
			autoGainControl: false
		} });
		const ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
		if (ctx.state === "suspended") await ctx.resume();
		const src = ctx.createMediaStreamSource(stream);
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 2048;
		src.connect(analyser);
		return {
			analyser,
			ctx,
			stream,
			stop() {
				stream.getTracks().forEach((t) => t.stop());
				ctx.close();
			}
		};
	} catch {
		return null;
	}
}
function refsFor(id) {
	const inst = instrumentById(id);
	if (id === "piano" || id === "vocals") return {
		names: [
			"C3",
			"C4",
			"C5"
		],
		freqs: [
			130.81,
			261.63,
			523.25
		]
	};
	return {
		names: inst.stringNames,
		freqs: inst.openFreq
	};
}
function TunerPanel() {
	const instrument = useSpark((s) => s.instrument);
	const inst = instrumentById(instrument);
	const refs = refsFor(instrument);
	const [cents, setCents] = (0, import_react.useState)(0);
	const [name, setName] = (0, import_react.useState)("-");
	const [live, setLive] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const stopRef = (0, import_react.useRef)(null);
	const raf = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => () => stopRef.current?.(), []);
	async function listen() {
		unlockAudio();
		const mic = await startMicAnalyser();
		if (!mic) {
			setError("Microphone blocked. Use the reference pitches below.");
			return;
		}
		setError(null);
		setLive(true);
		stopRef.current = () => {
			cancelAnimationFrame(raf.current);
			mic.stop();
			setLive(false);
		};
		const buf = new Float32Array(mic.analyser.fftSize);
		const loop = () => {
			mic.analyser.getFloatTimeDomainData(buf);
			const hz = yinPitch(buf, mic.ctx.sampleRate);
			if (hz > 40 && hz < 1200) {
				const n = nearestString(hz, refs.freqs, refs.names);
				setName(n.name);
				setCents(Math.max(-50, Math.min(50, n.cents)));
			}
			raf.current = requestAnimationFrame(loop);
		};
		loop();
	}
	const inTune = Math.abs(cents) < 8;
	const cols = Math.min(6, Math.max(2, refs.names.length));
	if (inst.surface === "pads") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-center text-sm text-muted",
			children: "Tap a pad for a reference hit. No mic needed."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DrumPads, {
			active: null,
			onHit: (i) => drumHit(i)
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-36 w-full max-w-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-6 top-1/2 h-px bg-border" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-1/2 top-6 h-20 w-px bg-accent" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("absolute top-10 size-4 -translate-x-1/2 rounded-full", inTune ? "bg-good" : "bg-accent"),
						style: { left: `${50 + cents * .8}%` }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "absolute inset-x-0 bottom-0 text-center font-display text-4xl font-semibold",
						children: name
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "tabular text-sm text-muted",
				children: [cents > 0 ? `+${cents.toFixed(0)}` : cents.toFixed(0), " cents"]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-sm text-warn",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: live ? "secondary" : "primary",
				onClick: () => live ? stopRef.current?.() : void listen(),
				children: live ? "Stop mic" : "Listen with mic"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid w-full gap-1",
				style: { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` },
				children: refs.names.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						unlockAudio();
						const f = refs.freqs[i] ?? 261.63;
						if (instrument === "piano" || instrument === "vocals") pianoTone(f, void 0, .4);
						else pluck(f, void 0, .55);
						setName(n);
						setCents(0);
					},
					className: "flex h-12 flex-col items-center justify-center rounded-sm bg-raised text-sm hover:bg-border",
					children: n
				}, `${n}-${i}`))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-xs text-dim",
				children: instrument === "vocals" ? "Hum the reference, then listen. Mic is optional." : "Reference pitches play even without the instrument. Mic is optional."
			})
		]
	});
}
/** Compact live cents vs a target pitch — used in the vocal session. */
function PitchMatch({ targetFreq, targetName }) {
	const [cents, setCents] = (0, import_react.useState)(null);
	const [live, setLive] = (0, import_react.useState)(false);
	const stopRef = (0, import_react.useRef)(null);
	const raf = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => () => stopRef.current?.(), []);
	async function listen() {
		unlockAudio();
		const mic = await startMicAnalyser();
		if (!mic) return;
		setLive(true);
		stopRef.current = () => {
			cancelAnimationFrame(raf.current);
			mic.stop();
			setLive(false);
			setCents(null);
		};
		const buf = new Float32Array(mic.analyser.fftSize);
		const loop = () => {
			mic.analyser.getFloatTimeDomainData(buf);
			const hz = yinPitch(buf, mic.ctx.sampleRate);
			if (hz > 80 && hz < 900) setCents(Math.max(-50, Math.min(50, 1200 * Math.log2(hz / targetFreq))));
			raf.current = requestAnimationFrame(loop);
		};
		loop();
	}
	const inTune = cents != null && Math.abs(cents) < 20;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[11px] uppercase tracking-[0.18em] text-dim",
				children: [
					"Target ",
					targetName,
					" · ",
					inTune ? "in tune" : live ? "listen" : "mic off"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-10 w-full max-w-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-4 top-1/2 h-px bg-border" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-1/2 top-1 h-8 w-px bg-accent" }),
					cents != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("absolute top-2 size-3 -translate-x-1/2 rounded-full", inTune ? "bg-good" : "bg-ember"),
						style: { left: `${50 + cents * .8}%` }
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: live ? "secondary" : "ghost",
				onClick: () => live ? stopRef.current?.() : void listen(),
				children: live ? "Stop mic" : "Match with mic"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => pianoTone(midiToFreq(60), void 0, .35),
				className: "text-xs text-muted underline-offset-2 hover:text-fg hover:underline",
				children: "Hear the drone"
			})
		]
	});
}
//#endregion
export { TunerPanel as n, PitchMatch as t };
