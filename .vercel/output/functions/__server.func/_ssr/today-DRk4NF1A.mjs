import { B as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Button } from "./button-DYd0ZC_F.mjs";
import { g as unlockAudio } from "./audio-DIq8nkMh.mjs";
import { t as ChordDiagram } from "./chord-diagram-C6Re10Bn.mjs";
import { t as DrumPads } from "./drum-pads-BH58tIUq.mjs";
import { t as PianoKeyboard } from "./piano-keyboard-hXDcveFZ.mjs";
import { a as RoleTag } from "./udl-chrome-B3jlEpW1.mjs";
import { l as Flame, r as Play } from "../_libs/lucide-react.mjs";
import { n as labCardFor, r as labSearchFor, t as AppShell } from "./app-shell-Cn6Z2zyU.mjs";
import { n as WeekPulseRow, r as XpBar, t as MarkList } from "./game-chrome-Bp7u4VG7.mjs";
import { Ct as weekPulse, I as PIANO_VOICINGS, St as useSpark, Tt as xpProgress, Y as dayCue, Z as feelCue, _t as streakTone, ft as rankFor, gt as sparksFor, n as DEFAULT_THEORY_SEARCH, ot as lessonsFor, st as localDayKey, tt as instrumentById, ut as newThingLine, xt as tracksFor, z as UKE_CHORDS } from "./router-_2DnnNcg.mjs";
import { t as InstrumentMark } from "./instrument-mark-Dg6mzwUq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/today-DRk4NF1A.js
var import_jsx_runtime = require_jsx_runtime();
function TodayPage() {
	const navigate = useNavigate();
	const instrument = useSpark((s) => s.instrument);
	const plan = useSpark((s) => s.plan);
	const progress = useSpark((s) => s.progress);
	const beginDay = useSpark((s) => s.beginDay);
	const markAudioReady = useSpark((s) => s.markAudioReady);
	const inst = instrumentById(instrument);
	const today = localDayKey();
	const done = Boolean(progress.dailyComplete[today]);
	const firstChord = plan.items.find((i) => i.chords[0])?.chords[0] ?? inst.firstChords[0];
	const tracks = tracksFor(instrument);
	const lessons = lessonsFor(instrument);
	const lab = labCardFor(instrument);
	const tone = streakTone(progress, today);
	const rank = rankFor(progress.level);
	const xp = xpProgress(progress.xp);
	const week = weekPulse(progress, today);
	const sparks = sparksFor(progress);
	const newThing = !done ? newThingLine(plan) : null;
	const slower = !done ? feelCue(progress) : null;
	const uke = instrument === "ukulele" && firstChord && UKE_CHORDS[firstChord] ? {
		id: firstChord,
		name: firstChord,
		...UKE_CHORDS[firstChord]
	} : null;
	const pianoPcs = firstChord && PIANO_VOICINGS[firstChord] ? PIANO_VOICINGS[firstChord].map((m) => m % 12) : [0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "px-5 pb-2 pt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstrumentMark, {
						id: instrument,
						className: "size-16"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] uppercase tracking-[0.22em] text-dim",
						children: [
							inst.kicker,
							" · ",
							rank.title
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-display text-4xl font-semibold tracking-tight text-balance",
						children: "Today"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-sm text-pretty text-muted",
					children: plan.promise
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-dim",
					children: dayCue(plan, done)
				}),
				!done && newThing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: newThing
				}) : null,
				!done && slower ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-ember",
					children: slower
				}) : null
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-4 mt-4 rounded-xl border border-border bg-surface p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] uppercase tracking-[0.18em] text-dim",
						children: [plan.minutes, " min plan"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-display text-xl font-semibold",
						children: done ? "Done for today" : "Your loop"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1 text-ember",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "size-4" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular font-medium",
								children: progress.streak
							}),
							tone === "held" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-dim",
								children: "held"
							}) : null
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeekPulseRow, {
					pulse: week,
					className: "mt-4"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-5 space-y-3",
					children: plan.items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-8 items-center justify-center rounded-sm bg-raised tabular text-sm text-muted",
								children: i + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-baseline gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate font-medium",
										children: item.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleTag, {
										role: item.role,
										process: item.process
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm text-muted",
									children: item.why ?? item.repertoire ?? item.subtitle
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular text-xs text-dim",
								children: item.durationSec < 60 ? `${item.durationSec}s` : `${Math.round(item.durationSec / 60)}m`
							})
						]
					}, item.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-col items-center gap-4",
					children: [
						instrument === "guitar" && firstChord ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChordDiagram, {
							chordId: firstChord,
							compact: true
						}) : null,
						uke ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChordDiagram, {
							shape: uke,
							compact: true
						}) : null,
						instrument === "piano" || instrument === "vocals" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PianoKeyboard, {
							activeMidi: null,
							chordPcs: pianoPcs,
							onPlay: () => void 0,
							disabled: true
						}) : null,
						instrument === "drums" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DrumPads, {
							active: null,
							onHit: () => void 0,
							disabled: true
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "xl",
							className: "w-full",
							onClick: () => {
								unlockAudio();
								markAudioReady();
								beginDay();
								navigate({ to: "/practice" });
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), done ? "Play it again" : "Start today's loop"]
						})
					]
				})
			]
		}),
		done ? lab ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-4 mt-4 rounded-xl border border-border bg-surface p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.18em] text-dim",
					children: lab.kicker
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-display text-xl font-semibold",
					children: lab.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-pretty text-sm text-muted",
					children: lab.body
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					className: "mt-4 w-full",
					onClick: () => void navigate({
						to: "/techniques",
						search: labSearchFor(instrument)
					}),
					children: lab.cta
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-4 mt-4 rounded-xl border border-border bg-surface p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.18em] text-dim",
					children: "Chord lab"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-display text-xl font-semibold",
					children: "Why a chord sounds like that"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-pretty text-sm text-muted",
					children: "Harmony is shared. Four minutes. Then stop."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					className: "mt-4 w-full",
					onClick: () => void navigate({
						to: "/theory",
						search: DEFAULT_THEORY_SEARCH
					}),
					children: "Four minutes"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					className: "mt-2 w-full",
					onClick: () => void navigate({
						to: "/techniques",
						search: labSearchFor("guitar")
					}),
					children: "Right-hand lab"
				})
			]
		}) : null,
		done ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "px-5 pt-8 pb-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-baseline justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: rank.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "tabular text-sm text-muted",
						children: [
							sparks,
							" spark",
							sparks === 1 ? "" : "s"
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: rank.line
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(XpBar, {
						into: xp.into,
						need: xp.need,
						label: `Level ${xp.level}`
					})
				}),
				progress.marks.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-[11px] uppercase tracking-[0.18em] text-dim",
						children: "Marks"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarkList, { ids: progress.marks })]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex items-baseline justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "Path"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "tabular text-sm text-muted",
						children: [
							"Lv ",
							progress.level,
							" · ",
							progress.xp,
							" xp"
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-3",
					children: tracks.map((track) => {
						const ids = lessons.filter((l) => l.trackId === track.id).map((l) => l.id);
						const avg = ids.length ? ids.reduce((s, id) => s + (progress.mastery[id] ?? 0), 0) / ids.length : 0;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-1 flex justify-between text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: track.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular text-muted",
								children: [Math.round(avg * 100), "%"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-1.5 overflow-hidden rounded-full bg-raised",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full bg-accent",
								style: { width: `${Math.round(avg * 100)}%` }
							})
						})] }, track.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					className: "mt-4 w-full",
					onClick: () => void navigate({ to: "/skills" }),
					children: "Full path"
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-5 pt-6 pb-4 text-sm text-dim",
			children: "Three days this week is a held week. Miss a day. The streak holds."
		})
	] });
}
//#endregion
export { TodayPage as component };
