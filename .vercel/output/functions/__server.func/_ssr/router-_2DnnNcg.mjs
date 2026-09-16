import { t as create } from "../_libs/zustand.mjs";
import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { i as router_exports } from "./router-_2DnnNcg2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/spark-5CuDos9a.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function localDayKey(d = /* @__PURE__ */ new Date()) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
var STRING_NAMES = [
	"E",
	"A",
	"D",
	"G",
	"B",
	"e"
];
/** Frequencies for open strings, low E → high e. */
var OPEN_FREQ = [
	82.41,
	110,
	146.83,
	196,
	246.94,
	329.63
];
var CHORDS = {
	Em: {
		id: "Em",
		name: "Em",
		frets: [
			0,
			2,
			2,
			0,
			0,
			0
		],
		fingers: [
			0,
			2,
			3,
			0,
			0,
			0
		],
		notes: [
			"E",
			"B",
			"E",
			"G",
			"B",
			"E"
		]
	},
	G: {
		id: "G",
		name: "G",
		frets: [
			3,
			2,
			0,
			0,
			0,
			3
		],
		fingers: [
			2,
			1,
			0,
			0,
			0,
			3
		],
		notes: [
			"G",
			"B",
			"D",
			"G",
			"B",
			"G"
		]
	},
	C: {
		id: "C",
		name: "C",
		frets: [
			null,
			3,
			2,
			0,
			1,
			0
		],
		fingers: [
			null,
			3,
			2,
			0,
			1,
			0
		],
		notes: [
			"C",
			"E",
			"G",
			"C",
			"E"
		]
	},
	D: {
		id: "D",
		name: "D",
		frets: [
			null,
			null,
			0,
			2,
			3,
			2
		],
		fingers: [
			null,
			null,
			0,
			1,
			3,
			2
		],
		notes: [
			"D",
			"A",
			"D",
			"F#"
		]
	},
	Am: {
		id: "Am",
		name: "Am",
		frets: [
			null,
			0,
			2,
			2,
			1,
			0
		],
		fingers: [
			null,
			0,
			2,
			3,
			1,
			0
		],
		notes: [
			"A",
			"E",
			"A",
			"C",
			"E"
		]
	},
	E: {
		id: "E",
		name: "E",
		frets: [
			0,
			2,
			2,
			1,
			0,
			0
		],
		fingers: [
			0,
			2,
			3,
			1,
			0,
			0
		],
		notes: [
			"E",
			"B",
			"E",
			"G#",
			"B",
			"E"
		]
	},
	A: {
		id: "A",
		name: "A",
		frets: [
			null,
			0,
			2,
			2,
			2,
			0
		],
		fingers: [
			null,
			0,
			1,
			2,
			3,
			0
		],
		notes: [
			"A",
			"E",
			"A",
			"C#",
			"E"
		]
	}
};
var TRACKS$1 = [
	{
		id: "track_guitar_foundations",
		name: "Foundations"
	},
	{
		id: "track_guitar_open_chords",
		name: "Open chords"
	},
	{
		id: "track_guitar_chord_switching",
		name: "Switching"
	},
	{
		id: "track_guitar_rhythm",
		name: "Rhythm"
	},
	{
		id: "track_guitar_performance",
		name: "Songs"
	}
];
var LESSONS = [
	{
		id: "lesson_guitar_orientation_01",
		title: "Meet the guitar",
		skill: "guitar_orientation",
		trackId: "track_guitar_foundations",
		order: 1,
		type: "skill",
		objectives: ["Name the six strings", "Find the neck, frets, and body"],
		chords: [],
		pattern: "D",
		bars: 4,
		bpm: 70,
		prerequisites: [],
		masteryRequired: .7
	},
	{
		id: "lesson_guitar_tuning_01",
		title: "Tune without panic",
		skill: "guitar_tuning",
		trackId: "track_guitar_foundations",
		order: 2,
		type: "warmup",
		objectives: ["Hear low-to-high string order", "Match a reference pitch"],
		chords: [],
		pattern: "D",
		bars: 8,
		bpm: 60,
		prerequisites: ["lesson_guitar_orientation_01"],
		masteryRequired: .7
	},
	{
		id: "lesson_guitar_open_strings_01",
		title: "Open string sound check",
		skill: "open_strings",
		trackId: "track_guitar_foundations",
		order: 3,
		type: "warmup",
		objectives: ["Pluck each string cleanly", "Mute the rest"],
		chords: [],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: ["lesson_guitar_tuning_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_guitar_pick_downstrokes_01",
		title: "Downstrokes on the beat",
		skill: "pick_downstrokes",
		trackId: "track_guitar_foundations",
		order: 4,
		type: "rhythm",
		objectives: ["Steady downstrokes", "Stay with a slow click"],
		chords: ["Em"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_guitar_open_strings_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_guitar_count_quarters_01",
		title: "Count 1-2-3-4",
		skill: "quarter_counting",
		trackId: "track_guitar_foundations",
		order: 5,
		type: "rhythm",
		objectives: ["Count four beats", "Land on one"],
		chords: ["Em"],
		pattern: "D",
		bars: 8,
		bpm: 76,
		prerequisites: ["lesson_guitar_pick_downstrokes_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_guitar_em_chord_01",
		title: "Your first chord: Em",
		skill: "em_chord",
		trackId: "track_guitar_open_chords",
		order: 6,
		type: "chord",
		objectives: ["Build the Em shape", "Strum only intended strings"],
		chords: ["Em"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_guitar_count_quarters_01"],
		masteryRequired: .75,
		why: "First chord in Night Bus.",
		criteria: ["The shape is down before the strum"]
	},
	{
		id: "lesson_guitar_g_chord_01",
		title: "Big G chord",
		skill: "g_chord",
		trackId: "track_guitar_open_chords",
		order: 7,
		type: "chord",
		objectives: ["Build G", "Land fingers together"],
		chords: ["G"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_guitar_em_chord_01"],
		masteryRequired: .75,
		why: "The other half of Night Bus.",
		criteria: ["The shape is down before the strum"]
	},
	{
		id: "lesson_guitar_c_chord_01",
		title: "C without tension",
		skill: "c_chord",
		trackId: "track_guitar_open_chords",
		order: 8,
		type: "chord",
		objectives: ["Build C", "Keep the wrist soft"],
		chords: ["C"],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: ["lesson_guitar_g_chord_01"],
		masteryRequired: .75,
		why: "Lives in Kitchen Radio.",
		criteria: ["The shape is down before the strum"]
	},
	{
		id: "lesson_guitar_d_chord_01",
		title: "D and small strums",
		skill: "d_chord",
		trackId: "track_guitar_open_chords",
		order: 9,
		type: "chord",
		objectives: ["Build D", "Aim at the top four strings"],
		chords: ["D"],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: ["lesson_guitar_g_chord_01"],
		masteryRequired: .75,
		why: "The V in Kitchen Radio.",
		criteria: ["The shape is down before the strum"]
	},
	{
		id: "lesson_guitar_am_chord_01",
		title: "A minor shape",
		skill: "am_chord",
		trackId: "track_guitar_open_chords",
		order: 10,
		type: "chord",
		objectives: ["Build Am", "Hear the minor colour"],
		chords: ["Am"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_guitar_c_chord_01"],
		masteryRequired: .75,
		why: "The dark colour next to C.",
		criteria: ["The shape is down before the strum"]
	},
	{
		id: "lesson_guitar_respond_colour_01",
		title: "Bright or dark",
		skill: "harmonic_colour",
		trackId: "track_guitar_open_chords",
		order: 11,
		type: "skill",
		objectives: ["Hear C, then Am", "Name same colour or different"],
		chords: ["C", "Am"],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: ["lesson_guitar_am_chord_01"],
		masteryRequired: .7,
		process: "respond",
		repertoire: "Kitchen Radio",
		listenPrompt: {
			a: "C",
			b: "Am",
			ask: "Same colour or different?",
			answer: "different"
		},
		criteria: ["You listened first", "You named one thing"],
		why: "C is bright. Am is the same neighbourhood, darker."
	},
	{
		id: "lesson_guitar_em_g_switch_01",
		title: "Em ↔ G switch",
		skill: "open_chord_switching",
		trackId: "track_guitar_chord_switching",
		order: 11,
		type: "transition",
		objectives: ["Switch without stopping the pulse", "Prepare two beats early"],
		chords: ["Em", "G"],
		pattern: "D",
		bars: 16,
		bpm: 68,
		prerequisites: ["lesson_guitar_g_chord_01"],
		masteryRequired: .75,
		process: "perform",
		repertoire: "Night Bus",
		criteria: ["The pulse doesn't stop", "Prepare two beats early"],
		why: "This switch is Night Bus.",
		interpret: "Keep the pulse. The bus doesn't wait."
	},
	{
		id: "lesson_guitar_respond_bus_01",
		title: "The two colours",
		skill: "harmonic_colour",
		trackId: "track_guitar_open_chords",
		order: 11,
		type: "skill",
		objectives: ["Hear Em, then G", "Name same colour or different"],
		chords: ["Em", "G"],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: ["lesson_guitar_song_first_two_chord_01"],
		masteryRequired: .7,
		process: "respond",
		repertoire: "Night Bus",
		listenPrompt: {
			a: "Em",
			b: "G",
			ask: "Same colour or different?",
			answer: "different"
		},
		criteria: ["You listened first", "You named one thing"],
		why: "Night Bus uses both. Name the difference."
	},
	{
		id: "lesson_guitar_create_hang_01",
		title: "Your hang",
		skill: "create_hang",
		trackId: "track_guitar_performance",
		order: 12,
		type: "song",
		objectives: ["Pick stay on Em, or switch to G", "Play the one you picked"],
		chords: ["Em", "G"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_guitar_song_first_two_chord_01"],
		masteryRequired: .7,
		process: "create",
		repertoire: "Your hang",
		createOptions: ["Em", "Em–G"],
		criteria: ["You picked it", "You played it through"],
		why: "You pick the idea. That's the piece.",
		interpret: "Play the one you picked like you meant it."
	},
	{
		id: "lesson_guitar_c_g_switch_01",
		title: "C ↔ G switch",
		skill: "open_chord_switching",
		trackId: "track_guitar_chord_switching",
		order: 12,
		type: "transition",
		objectives: ["Move shared fingers efficiently", "Keep the count alive"],
		chords: ["C", "G"],
		pattern: "D",
		bars: 16,
		bpm: 68,
		prerequisites: ["lesson_guitar_c_chord_01"],
		masteryRequired: .75,
		process: "perform",
		repertoire: "Kitchen Radio",
		criteria: ["The pulse doesn't stop", "Shared fingers travel together"],
		why: "This switch lives in Kitchen Radio."
	},
	{
		id: "lesson_guitar_g_d_switch_01",
		title: "G ↔ D switch",
		skill: "open_chord_switching",
		trackId: "track_guitar_chord_switching",
		order: 13,
		type: "transition",
		objectives: ["Target the D strings", "Don't restart after a miss"],
		chords: ["G", "D"],
		pattern: "D",
		bars: 16,
		bpm: 68,
		prerequisites: ["lesson_guitar_d_chord_01"],
		masteryRequired: .75,
		process: "perform",
		repertoire: "Kitchen Radio",
		criteria: ["The pulse doesn't stop", "Don't restart after a miss"],
		why: "G to D is the radio's lift."
	},
	{
		id: "lesson_guitar_am_c_switch_01",
		title: "Am ↔ C switch",
		skill: "open_chord_switching",
		trackId: "track_guitar_chord_switching",
		order: 14,
		type: "transition",
		objectives: ["Use an anchor finger", "Hear the close movement"],
		chords: ["Am", "C"],
		pattern: "D",
		bars: 16,
		bpm: 70,
		prerequisites: ["lesson_guitar_am_chord_01"],
		masteryRequired: .75,
		process: "perform",
		repertoire: "Kitchen Radio",
		criteria: ["The pulse doesn't stop", "Keep an anchor finger"],
		why: "Am to C is the dark-to-bright move."
	},
	{
		id: "lesson_guitar_four_chord_loop_01",
		title: "Kitchen Radio",
		skill: "four_chord_loop",
		trackId: "track_guitar_performance",
		order: 16,
		type: "song",
		objectives: ["Play G–D–Em–C", "Finish an 8-bar cycle"],
		chords: [
			"G",
			"D",
			"Em",
			"C"
		],
		pattern: "D",
		bars: 16,
		bpm: 72,
		prerequisites: [
			"lesson_guitar_c_g_switch_01",
			"lesson_guitar_g_d_switch_01",
			"lesson_guitar_am_c_switch_01"
		],
		masteryRequired: .75,
		process: "perform",
		repertoire: "Kitchen Radio",
		criteria: ["The loop finishes", "One chord per two bars"],
		why: "The four chords the radio already uses.",
		interpret: "Play it like it's on in the other room."
	},
	{
		id: "lesson_guitar_strum_eighths_01",
		title: "Eighth-note engine",
		skill: "eighth_strumming",
		trackId: "track_guitar_rhythm",
		order: 16,
		type: "rhythm",
		objectives: ["Feel 1-and-2-and", "Keep the hand moving"],
		chords: ["Em"],
		pattern: "DUDU",
		bars: 8,
		bpm: 80,
		prerequisites: ["lesson_guitar_count_quarters_01"],
		masteryRequired: .75,
		why: "The hand is the drummer.",
		criteria: ["The hand keeps moving", "Land on one"],
		interpret: "Don't freeze. Misses get absorbed."
	},
	{
		id: "lesson_guitar_strum_down_up_01",
		title: "Down-up strum",
		skill: "down_up_strumming",
		trackId: "track_guitar_rhythm",
		order: 17,
		type: "rhythm",
		objectives: ["Alternate down and up", "Don't freeze on a miss"],
		chords: ["Em", "G"],
		pattern: "DUDU",
		bars: 16,
		bpm: 84,
		prerequisites: ["lesson_guitar_strum_eighths_01"],
		masteryRequired: .75,
		repertoire: "Night Bus",
		why: "Night Bus with a moving hand.",
		criteria: ["The hand keeps moving", "Don't freeze on a miss"]
	},
	{
		id: "lesson_guitar_strum_pattern_pop_01",
		title: "Pop pattern",
		skill: "down_up_strumming",
		trackId: "track_guitar_rhythm",
		order: 18,
		type: "rhythm",
		objectives: ["Play D DU UDU", "Loop it across chords"],
		chords: [
			"G",
			"D",
			"Em",
			"C"
		],
		pattern: "D-DU-UDU",
		bars: 16,
		bpm: 88,
		prerequisites: ["lesson_guitar_strum_down_up_01", "lesson_guitar_four_chord_loop_01"],
		masteryRequired: .75,
		process: "perform",
		repertoire: "Kitchen Radio",
		why: "The radio pattern on the four-chord loop.",
		interpret: "Keep the hand like a drummer who won't stop.",
		criteria: ["The hand keeps moving", "Land on one"]
	},
	{
		id: "lesson_guitar_song_first_two_chord_01",
		title: "Night Bus",
		skill: "two_chord_song",
		trackId: "track_guitar_performance",
		order: 21,
		type: "song",
		objectives: ["Play an Em–G loop", "Keep the pulse through the change"],
		chords: ["Em", "G"],
		pattern: "D",
		bars: 16,
		bpm: 76,
		prerequisites: ["lesson_guitar_em_g_switch_01"],
		masteryRequired: .75,
		process: "perform",
		repertoire: "Night Bus",
		criteria: ["The loop finishes", "The pulse holds through the change"],
		why: "Two chords that sit under a slow song.",
		interpret: "Play it like the last bus home."
	}
];
var FIRST_PROMISE = "In the first real session, you play Night Bus — two chords, a clean down-strum pulse.";
var FOUNDATION_LESSONS = [
	"lesson_guitar_orientation_01",
	"lesson_guitar_tuning_01",
	"lesson_guitar_open_strings_01"
];
function lessonById(id) {
	return LESSONS.find((l) => l.id === id) ?? null;
}
function isUnlocked(id, mastery) {
	const lesson = lessonById(id);
	if (!lesson) return false;
	return lesson.prerequisites.every((p) => (mastery[p] ?? 0) >= (lessonById(p)?.masteryRequired ?? .7));
}
function nextLesson(mastery) {
	return LESSONS.find((l) => isUnlocked(l.id, mastery) && (mastery[l.id] ?? 0) < l.masteryRequired) ?? LESSONS[LESSONS.length - 1];
}
function fretToFreq(stringIndex, fret) {
	return OPEN_FREQ[stringIndex] * Math.pow(2, fret / 12);
}
var INSTRUMENTS = [
	{
		id: "guitar",
		name: "Guitar",
		kicker: "6-string",
		promise: "In the first real session, you play Night Bus — two chords, a clean down-strum pulse.",
		family: "strings",
		surface: "strings",
		stringNames: [
			"E",
			"A",
			"D",
			"G",
			"B",
			"e"
		],
		openFreq: [
			82.41,
			110,
			146.83,
			196,
			246.94,
			329.63
		],
		openPc: [
			4,
			9,
			2,
			7,
			11,
			4
		],
		firstChords: ["Em", "G"],
		theoryNeck: "guitar"
	},
	{
		id: "piano",
		name: "Piano",
		kicker: "Keys",
		promise: "Find middle C, then play a C–G cadence. Two chords. Home and gravity.",
		family: "keys",
		surface: "keys",
		stringNames: [
			"C",
			"D",
			"E",
			"F",
			"G",
			"A",
			"B"
		],
		openFreq: [261.63],
		openPc: [0],
		firstChords: ["C", "G"],
		theoryNeck: "piano"
	},
	{
		id: "ukulele",
		name: "Ukulele",
		kicker: "GCEA",
		promise: "Four strings, one C chord, then a C–G loop you can actually sing over.",
		family: "strings",
		surface: "strings",
		stringNames: [
			"G",
			"C",
			"E",
			"A"
		],
		openFreq: [
			392,
			261.63,
			329.63,
			440
		],
		openPc: [
			7,
			0,
			4,
			9
		],
		firstChords: ["C", "G"],
		theoryNeck: "four"
	},
	{
		id: "bass",
		name: "Bass",
		kicker: "EADG",
		promise: "Roots on the pulse. Em to G, one note at a time, locked to the kick.",
		family: "strings",
		surface: "strings",
		stringNames: [
			"E",
			"A",
			"D",
			"G"
		],
		openFreq: [
			41.2,
			55,
			73.42,
			98
		],
		openPc: [
			4,
			9,
			2,
			7
		],
		firstChords: ["Em", "G"],
		theoryNeck: "four"
	},
	{
		id: "drums",
		name: "Drums",
		kicker: "Kit",
		promise: "Kick on one. Snare on two and four. That’s a backbeat — the whole song sits on it.",
		family: "rhythm",
		surface: "pads",
		stringNames: [
			"Kick",
			"Snare",
			"Hat",
			"Tom"
		],
		openFreq: [
			60,
			180,
			8e3,
			120
		],
		openPc: [
			0,
			0,
			0,
			0
		],
		firstChords: [],
		theoryNeck: "none"
	},
	{
		id: "vocals",
		name: "Vocals",
		kicker: "Pitch",
		promise: "Match a C, hold it for four beats. Breath is the instrument.",
		family: "voice",
		surface: "voice",
		stringNames: ["C"],
		openFreq: [261.63],
		openPc: [0],
		firstChords: ["C"],
		theoryNeck: "piano"
	}
];
function instrumentById(id) {
	return INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0];
}
function isInstrumentId(id) {
	return typeof id === "string" && INSTRUMENTS.some((i) => i.id === id);
}
var PIANO_LESSONS = [
	{
		id: "lesson_piano_middle_c_01",
		title: "Find middle C",
		skill: "middle_c",
		trackId: "track_piano_foundations",
		order: 1,
		type: "warmup",
		objectives: ["Find C below the two black keys"],
		chords: [],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: [],
		masteryRequired: .7
	},
	{
		id: "lesson_piano_c_triad_01",
		title: "C major triad",
		skill: "c_triad",
		trackId: "track_piano_triads",
		order: 2,
		type: "chord",
		objectives: ["Play C–E–G together", "Hear the bright third"],
		chords: ["C"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_piano_middle_c_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_piano_g_triad_01",
		title: "G major triad",
		skill: "g_triad",
		trackId: "track_piano_triads",
		order: 3,
		type: "chord",
		objectives: ["Play G–B–D", "Keep the hand quiet"],
		chords: ["G"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_piano_c_triad_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_piano_cg_cadence_01",
		title: "Home and gravity",
		skill: "cg_cadence",
		trackId: "track_piano_cadences",
		order: 4,
		type: "song",
		objectives: ["I to V and back", "Feel G pull home"],
		chords: ["C", "G"],
		pattern: "D",
		bars: 16,
		bpm: 76,
		prerequisites: ["lesson_piano_g_triad_01"],
		masteryRequired: .75,
		process: "perform",
		repertoire: "Home and gravity",
		criteria: ["The loop finishes", "G pulls home"],
		why: "I to V. Home, then gravity.",
		interpret: "Let G pull you back."
	},
	{
		id: "lesson_piano_am_01",
		title: "A minor colour",
		skill: "am_triad",
		trackId: "track_piano_triads",
		order: 5,
		type: "chord",
		objectives: ["Play A–C–E", "Hear the flattened third"],
		chords: ["Am"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_piano_c_triad_01"],
		masteryRequired: .75,
		why: "The dark colour next to C."
	},
	{
		id: "lesson_piano_f_01",
		title: "F major triad",
		skill: "f_triad",
		trackId: "track_piano_triads",
		order: 6,
		type: "chord",
		objectives: ["Play F–A–C", "The IV before the loop"],
		chords: ["F"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_piano_c_triad_01"],
		masteryRequired: .75,
		why: "The IV before Kitchen Radio."
	},
	{
		id: "lesson_piano_respond_cadence_01",
		title: "Home or gravity",
		skill: "piano_listen",
		trackId: "track_piano_cadences",
		order: 7,
		type: "skill",
		objectives: ["Hear C, then G", "Name same chord or different"],
		chords: ["C", "G"],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: ["lesson_piano_cg_cadence_01"],
		masteryRequired: .7,
		process: "respond",
		repertoire: "Home and gravity",
		listenPrompt: {
			a: "C",
			b: "G",
			ask: "Same chord or different?",
			answer: "different"
		},
		criteria: ["You listened first", "You named one thing"],
		why: "Home and gravity. Name which one moved."
	},
	{
		id: "lesson_piano_respond_colour_01",
		title: "Bright or dark",
		skill: "piano_colour",
		trackId: "track_piano_triads",
		order: 8,
		type: "skill",
		objectives: ["Hear C, then Am", "Name same colour or different"],
		chords: ["C", "Am"],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: ["lesson_piano_am_01"],
		masteryRequired: .7,
		process: "respond",
		repertoire: "Kitchen Radio",
		listenPrompt: {
			a: "C",
			b: "Am",
			ask: "Same colour or different?",
			answer: "different"
		},
		criteria: ["You listened first", "You named one thing"],
		why: "C is bright. Am is the same neighbourhood, darker."
	},
	{
		id: "lesson_piano_four_01",
		title: "Kitchen Radio",
		skill: "piano_four",
		trackId: "track_piano_cadences",
		order: 9,
		type: "song",
		objectives: ["C–G–Am–F", "One chord per two bars"],
		chords: [
			"C",
			"G",
			"Am",
			"F"
		],
		pattern: "D",
		bars: 16,
		bpm: 80,
		prerequisites: [
			"lesson_piano_cg_cadence_01",
			"lesson_piano_am_01",
			"lesson_piano_f_01"
		],
		masteryRequired: .75,
		process: "perform",
		repertoire: "Kitchen Radio",
		criteria: ["The loop finishes", "One chord per two bars"],
		why: "The four chords the radio already uses.",
		interpret: "Play it like it's on in the other room."
	},
	{
		id: "lesson_piano_create_hang_01",
		title: "Your hang",
		skill: "piano_create",
		trackId: "track_piano_cadences",
		order: 10,
		type: "song",
		objectives: ["Stay on C, or walk to G", "Play the one you picked"],
		chords: ["C", "G"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_piano_cg_cadence_01"],
		masteryRequired: .7,
		process: "create",
		repertoire: "Your hang",
		createOptions: ["C", "C–G"],
		criteria: ["You picked it", "You played it through"],
		why: "You pick the idea. That's the piece.",
		interpret: "Play the one you picked like you meant it."
	}
];
var UKE_LESSONS = [
	{
		id: "lesson_uke_open_01",
		title: "Open GCEA",
		skill: "uke_open",
		trackId: "track_uke_foundations",
		order: 1,
		type: "warmup",
		objectives: ["Pluck G C E A in order"],
		chords: [],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: [],
		masteryRequired: .7
	},
	{
		id: "lesson_uke_c_01",
		title: "C on four strings",
		skill: "uke_c",
		trackId: "track_uke_chords",
		order: 2,
		type: "chord",
		objectives: ["Ring finger, third fret, A string"],
		chords: ["C"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_uke_open_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_uke_g_01",
		title: "G shape",
		skill: "uke_g",
		trackId: "track_uke_chords",
		order: 3,
		type: "chord",
		objectives: ["Three fingers, one beat of setup"],
		chords: ["G"],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: ["lesson_uke_c_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_uke_cg_01",
		title: "Dock Loop",
		skill: "uke_cg",
		trackId: "track_uke_songs",
		order: 4,
		type: "song",
		objectives: ["Switch without stopping the pulse"],
		chords: ["C", "G"],
		pattern: "D",
		bars: 16,
		bpm: 76,
		prerequisites: ["lesson_uke_g_01"],
		masteryRequired: .75,
		process: "perform",
		repertoire: "Dock Loop",
		criteria: ["The loop finishes", "The pulse holds through the change"],
		why: "The porch loop you can sing over.",
		interpret: "Play it like you're outside."
	},
	{
		id: "lesson_uke_respond_dock_01",
		title: "Same chord or different",
		skill: "uke_listen",
		trackId: "track_uke_songs",
		order: 5,
		type: "skill",
		objectives: ["Hear C, then G", "Name same chord or different"],
		chords: ["C", "G"],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: ["lesson_uke_cg_01"],
		masteryRequired: .7,
		process: "respond",
		repertoire: "Dock Loop",
		listenPrompt: {
			a: "C",
			b: "G",
			ask: "Same chord or different?",
			answer: "different"
		},
		criteria: ["You listened first", "You named one thing"],
		why: "Dock Loop uses both. Name the difference."
	},
	{
		id: "lesson_uke_am_01",
		title: "Am on four",
		skill: "uke_am",
		trackId: "track_uke_chords",
		order: 5,
		type: "chord",
		objectives: ["Second fret, G string", "Hear the minor colour"],
		chords: ["Am"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_uke_c_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_uke_f_01",
		title: "F shape",
		skill: "uke_f",
		trackId: "track_uke_chords",
		order: 6,
		type: "chord",
		objectives: ["Two fingers, light squeeze"],
		chords: ["F"],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: ["lesson_uke_am_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_uke_respond_colour_01",
		title: "Bright or dark",
		skill: "uke_colour",
		trackId: "track_uke_chords",
		order: 7,
		type: "skill",
		objectives: ["Hear C, then Am", "Name same colour or different"],
		chords: ["C", "Am"],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: ["lesson_uke_am_01"],
		masteryRequired: .7,
		process: "respond",
		repertoire: "Dock Loop",
		listenPrompt: {
			a: "C",
			b: "Am",
			ask: "Same colour or different?",
			answer: "different"
		},
		criteria: ["You listened first", "You named one thing"],
		why: "C is bright. Am is the same neighbourhood, darker."
	},
	{
		id: "lesson_uke_island_01",
		title: "Island strum",
		skill: "uke_island",
		trackId: "track_uke_songs",
		order: 8,
		type: "rhythm",
		objectives: ["Play D DU UDU", "Keep the hand moving"],
		chords: ["C", "G"],
		pattern: "D-DU-UDU",
		bars: 8,
		bpm: 80,
		prerequisites: ["lesson_uke_cg_01"],
		masteryRequired: .75,
		process: "perform",
		repertoire: "Island strum",
		criteria: ["The hand keeps moving", "Land on one"],
		why: "Dock Loop with a moving hand.",
		interpret: "Keep the hand like a wave."
	},
	{
		id: "lesson_uke_create_hang_01",
		title: "Your hang",
		skill: "uke_create",
		trackId: "track_uke_songs",
		order: 9,
		type: "song",
		objectives: ["Stay on C, or switch to G", "Play the one you picked"],
		chords: ["C", "G"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_uke_cg_01"],
		masteryRequired: .7,
		process: "create",
		repertoire: "Your hang",
		createOptions: ["C", "C–G"],
		criteria: ["You picked it", "You played it through"],
		why: "You pick the idea. That's the piece.",
		interpret: "Play the one you picked like you meant it."
	}
];
var BASS_LESSONS = [
	{
		id: "lesson_bass_e_pulse_01",
		title: "E-string pulse",
		skill: "bass_pulse",
		trackId: "track_bass_foundations",
		order: 1,
		type: "warmup",
		objectives: ["One note, dead on the click"],
		chords: [],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: [],
		masteryRequired: .7
	},
	{
		id: "lesson_bass_em_root_01",
		title: "Em root",
		skill: "bass_em",
		trackId: "track_bass_roots",
		order: 2,
		type: "chord",
		objectives: ["Open E is the root of Em"],
		chords: ["Em"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_bass_e_pulse_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_bass_g_root_01",
		title: "G root",
		skill: "bass_g",
		trackId: "track_bass_roots",
		order: 3,
		type: "chord",
		objectives: ["Third fret, E string"],
		chords: ["G"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_bass_em_root_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_bass_em_g_01",
		title: "The Floor",
		skill: "bass_groove",
		trackId: "track_bass_grooves",
		order: 4,
		type: "song",
		objectives: ["Change on bar one, stay fat"],
		chords: ["Em", "G"],
		pattern: "D",
		bars: 16,
		bpm: 76,
		prerequisites: ["lesson_bass_g_root_01"],
		masteryRequired: .75,
		process: "perform",
		repertoire: "The Floor",
		criteria: ["The loop finishes", "Stay fat on the change"],
		why: "What the kick sits on.",
		interpret: "Play it fat. Don't thin out on the change."
	},
	{
		id: "lesson_bass_fifth_01",
		title: "Root and fifth",
		skill: "bass_fifth",
		trackId: "track_bass_techniques",
		order: 5,
		type: "skill",
		objectives: ["Next string, two frets up", "Skip the third"],
		chords: ["Em"],
		pattern: "D",
		bars: 8,
		bpm: 76,
		prerequisites: ["lesson_bass_em_g_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_bass_octave_01",
		title: "Octave punch",
		skill: "bass_octave",
		trackId: "track_bass_techniques",
		order: 6,
		type: "skill",
		objectives: ["Skip a string, two frets up", "Same letter, higher floor"],
		chords: ["Em"],
		pattern: "D",
		bars: 8,
		bpm: 80,
		prerequisites: ["lesson_bass_fifth_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_bass_walk_01",
		title: "Walk into G",
		skill: "bass_walk",
		trackId: "track_bass_techniques",
		order: 7,
		type: "song",
		objectives: ["E, F♯, G", "Arrive from underneath"],
		chords: ["Em", "G"],
		pattern: "D",
		bars: 16,
		bpm: 72,
		prerequisites: ["lesson_bass_octave_01"],
		masteryRequired: .75,
		process: "perform",
		repertoire: "Walk into G",
		criteria: ["Arrive from underneath", "Land fat on G"],
		why: "The walk is how bass players change rooms.",
		interpret: "Arrive. Don't jump."
	},
	{
		id: "lesson_bass_respond_root_01",
		title: "Same floor or different",
		skill: "bass_listen",
		trackId: "track_bass_roots",
		order: 8,
		type: "skill",
		objectives: ["Hear Em, then G", "Name same root or different"],
		chords: ["Em", "G"],
		pattern: "D",
		bars: 8,
		bpm: 70,
		prerequisites: ["lesson_bass_em_g_01"],
		masteryRequired: .7,
		process: "respond",
		repertoire: "The Floor",
		listenPrompt: {
			a: "Em",
			b: "G",
			ask: "Same root or different?",
			answer: "different"
		},
		criteria: ["You listened first", "You named one thing"],
		why: "The Floor uses both. Name the difference."
	},
	{
		id: "lesson_bass_create_hang_01",
		title: "Your hang",
		skill: "bass_create",
		trackId: "track_bass_grooves",
		order: 9,
		type: "song",
		objectives: ["Stay on Em, or walk to G", "Play the one you picked"],
		chords: ["Em", "G"],
		pattern: "D",
		bars: 8,
		bpm: 72,
		prerequisites: ["lesson_bass_em_g_01"],
		masteryRequired: .7,
		process: "create",
		repertoire: "Your hang",
		createOptions: ["Em", "Em–G"],
		criteria: ["You picked it", "You played it through"],
		why: "You pick the idea. That's the piece.",
		interpret: "Play the one you picked like you meant it."
	}
];
var DRUM_LESSONS = [
	{
		id: "lesson_drums_kick_01",
		title: "Kick on one",
		skill: "kick",
		trackId: "track_drums_foundations",
		order: 1,
		type: "warmup",
		objectives: ["Foot or pad, beat 1 only"],
		chords: [],
		pattern: "D",
		bars: 8,
		bpm: 80,
		prerequisites: [],
		masteryRequired: .7
	},
	{
		id: "lesson_drums_backbeat_01",
		title: "Backbeat",
		skill: "backbeat",
		trackId: "track_drums_groove",
		order: 2,
		type: "rhythm",
		objectives: ["Snare on 2 and 4"],
		chords: [],
		pattern: "D",
		bars: 8,
		bpm: 84,
		prerequisites: ["lesson_drums_kick_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_drums_four_01",
		title: "The Backbeat",
		skill: "four_floor",
		trackId: "track_drums_groove",
		order: 3,
		type: "song",
		objectives: ["Kick every beat, snare 2 and 4"],
		chords: [],
		pattern: "D",
		bars: 16,
		bpm: 88,
		prerequisites: ["lesson_drums_backbeat_01"],
		masteryRequired: .75,
		process: "perform",
		repertoire: "The Backbeat",
		criteria: ["Snare on 2 and 4", "The loop finishes"],
		why: "The whole song sits on 2 and 4.",
		interpret: "The snare is the conversation."
	},
	{
		id: "lesson_drums_respond_snare_01",
		title: "Where's the snare",
		skill: "drums_listen",
		trackId: "track_drums_groove",
		order: 4,
		type: "skill",
		objectives: ["Hear kick-only, then backbeat", "Name same groove or different"],
		chords: [],
		pattern: "D",
		bars: 8,
		bpm: 80,
		prerequisites: ["lesson_drums_four_01"],
		masteryRequired: .7,
		process: "respond",
		repertoire: "The Backbeat",
		listenPrompt: {
			a: "kick",
			b: "backbeat",
			ask: "Same groove or different?",
			answer: "different"
		},
		criteria: ["You listened first", "You named one thing"],
		why: "Find the snare. That's the conversation."
	},
	{
		id: "lesson_drums_create_hang_01",
		title: "Your hang",
		skill: "drums_create",
		trackId: "track_drums_groove",
		order: 5,
		type: "song",
		objectives: ["Kick on one, or four on the floor", "Play the one you picked"],
		chords: [],
		pattern: "D",
		bars: 8,
		bpm: 84,
		prerequisites: ["lesson_drums_four_01"],
		masteryRequired: .7,
		process: "create",
		repertoire: "Your hang",
		createOptions: ["Kick on one", "Four on the floor"],
		criteria: ["You picked it", "You played it through"],
		why: "You pick the idea. That's the piece.",
		interpret: "Play the one you picked like you meant it."
	}
];
var VOCAL_LESSONS = [
	{
		id: "lesson_vocals_drone_01",
		title: "Hum the drone",
		skill: "drone",
		trackId: "track_vocals_foundations",
		order: 1,
		type: "warmup",
		objectives: ["Match the reference C"],
		chords: ["C"],
		pattern: "D",
		bars: 8,
		bpm: 60,
		prerequisites: [],
		masteryRequired: .7
	},
	{
		id: "lesson_vocals_match_c_01",
		title: "Match C",
		skill: "match_c",
		trackId: "track_vocals_pitch",
		order: 2,
		type: "chord",
		objectives: ["Land inside 20 cents"],
		chords: ["C"],
		pattern: "D",
		bars: 8,
		bpm: 60,
		prerequisites: ["lesson_vocals_drone_01"],
		masteryRequired: .75
	},
	{
		id: "lesson_vocals_hold_01",
		title: "The held C",
		skill: "hold",
		trackId: "track_vocals_pitch",
		order: 3,
		type: "song",
		objectives: ["One breath, one pitch, four counts"],
		chords: ["C"],
		pattern: "D",
		bars: 8,
		bpm: 60,
		prerequisites: ["lesson_vocals_match_c_01"],
		masteryRequired: .75,
		process: "perform",
		repertoire: "The held C",
		criteria: ["One breath", "Four counts"],
		why: "Breath is the instrument.",
		interpret: "Don't push. One breath."
	},
	{
		id: "lesson_vocals_respond_pitch_01",
		title: "Same pitch or different",
		skill: "voice_listen",
		trackId: "track_vocals_pitch",
		order: 4,
		type: "skill",
		objectives: ["Hear C, then G", "Name same pitch or different"],
		chords: ["C", "G"],
		pattern: "D",
		bars: 8,
		bpm: 60,
		prerequisites: ["lesson_vocals_hold_01"],
		masteryRequired: .7,
		process: "respond",
		repertoire: "The held C",
		listenPrompt: {
			a: "C",
			b: "G",
			ask: "Same pitch or different?",
			answer: "different"
		},
		criteria: ["You listened first", "You named one thing"],
		why: "Name the move. That's listening, not a test."
	},
	{
		id: "lesson_vocals_create_hang_01",
		title: "Your hang",
		skill: "voice_create",
		trackId: "track_vocals_pitch",
		order: 5,
		type: "song",
		objectives: ["Stay on C, or step to G", "Hold the one you picked"],
		chords: ["C", "G"],
		pattern: "D",
		bars: 8,
		bpm: 60,
		prerequisites: ["lesson_vocals_hold_01"],
		masteryRequired: .7,
		process: "create",
		repertoire: "Your hang",
		createOptions: ["C", "C–G"],
		criteria: ["You picked it", "You held it through"],
		why: "You pick the idea. That's the piece.",
		interpret: "Hold the one you picked like you meant it."
	}
];
var TRACKS = {
	guitar: [...TRACKS$1],
	piano: [
		{
			id: "track_piano_foundations",
			name: "Foundations"
		},
		{
			id: "track_piano_triads",
			name: "Triads"
		},
		{
			id: "track_piano_cadences",
			name: "Cadences"
		}
	],
	ukulele: [
		{
			id: "track_uke_foundations",
			name: "Foundations"
		},
		{
			id: "track_uke_chords",
			name: "Open chords"
		},
		{
			id: "track_uke_songs",
			name: "Songs"
		}
	],
	bass: [
		{
			id: "track_bass_foundations",
			name: "Foundations"
		},
		{
			id: "track_bass_roots",
			name: "Roots"
		},
		{
			id: "track_bass_grooves",
			name: "Grooves"
		},
		{
			id: "track_bass_techniques",
			name: "Techniques"
		}
	],
	drums: [{
		id: "track_drums_foundations",
		name: "Foundations"
	}, {
		id: "track_drums_groove",
		name: "Groove"
	}],
	vocals: [{
		id: "track_vocals_foundations",
		name: "Foundations"
	}, {
		id: "track_vocals_pitch",
		name: "Pitch"
	}]
};
var ALL = {
	guitar: LESSONS,
	piano: PIANO_LESSONS,
	ukulele: UKE_LESSONS,
	bass: BASS_LESSONS,
	drums: DRUM_LESSONS,
	vocals: VOCAL_LESSONS
};
function lessonsFor(id) {
	return ALL[id];
}
function tracksFor(id) {
	return TRACKS[id];
}
function foundationsFor(id) {
	return {
		guitar: [
			"lesson_guitar_orientation_01",
			"lesson_guitar_tuning_01",
			"lesson_guitar_open_strings_01"
		],
		piano: ["lesson_piano_middle_c_01"],
		ukulele: ["lesson_uke_open_01"],
		bass: ["lesson_bass_e_pulse_01"],
		drums: ["lesson_drums_kick_01"],
		vocals: ["lesson_vocals_drone_01"]
	}[id];
}
function promiseFor(id) {
	if (id === "guitar") return FIRST_PROMISE;
	return instrumentById(id).promise;
}
function firstLessonIds(id) {
	return {
		guitar: [
			"lesson_guitar_open_strings_01",
			"lesson_guitar_em_chord_01",
			"lesson_guitar_song_first_two_chord_01"
		],
		piano: [
			"lesson_piano_middle_c_01",
			"lesson_piano_c_triad_01",
			"lesson_piano_cg_cadence_01"
		],
		ukulele: [
			"lesson_uke_open_01",
			"lesson_uke_c_01",
			"lesson_uke_cg_01"
		],
		bass: [
			"lesson_bass_e_pulse_01",
			"lesson_bass_em_root_01",
			"lesson_bass_em_g_01"
		],
		drums: [
			"lesson_drums_kick_01",
			"lesson_drums_backbeat_01",
			"lesson_drums_four_01"
		],
		vocals: [
			"lesson_vocals_drone_01",
			"lesson_vocals_match_c_01",
			"lesson_vocals_hold_01"
		]
	}[id];
}
function lessonByIdFor(id, lessonId) {
	return lessonsFor(id).find((l) => l.id === lessonId) ?? lessonsFor(id)[0];
}
function isUnlockedFor(id, lessonId, mastery) {
	const lesson = lessonsFor(id).find((l) => l.id === lessonId);
	if (!lesson) return false;
	return lesson.prerequisites.every((p) => {
		const req = lessonsFor(id).find((l) => l.id === p)?.masteryRequired ?? .7;
		return (mastery[p] ?? 0) >= req;
	});
}
function nextLessonFor(id, mastery) {
	const list = lessonsFor(id);
	return list.find((l) => isUnlockedFor(id, l.id, mastery) && (mastery[l.id] ?? 0) < l.masteryRequired) ?? list[list.length - 1];
}
var UKE_CHORDS = {
	C: {
		frets: [
			0,
			0,
			0,
			3
		],
		fingers: [
			0,
			0,
			0,
			3
		],
		notes: [
			"G",
			"C",
			"E",
			"C"
		]
	},
	G: {
		frets: [
			0,
			2,
			3,
			2
		],
		fingers: [
			0,
			1,
			3,
			2
		],
		notes: [
			"G",
			"D",
			"G",
			"B"
		]
	},
	Am: {
		frets: [
			2,
			0,
			0,
			0
		],
		fingers: [
			2,
			0,
			0,
			0
		],
		notes: [
			"A",
			"C",
			"E",
			"A"
		]
	},
	F: {
		frets: [
			2,
			0,
			1,
			0
		],
		fingers: [
			2,
			0,
			1,
			0
		],
		notes: [
			"A",
			"C",
			"F",
			"A"
		]
	}
};
var PIANO_VOICINGS = {
	C: [
		60,
		64,
		67
	],
	G: [
		67,
		71,
		74
	],
	Am: [
		57,
		60,
		64
	],
	F: [
		53,
		57,
		60
	],
	Em: [
		52,
		55,
		59
	],
	D: [
		62,
		66,
		69
	],
	E: [
		52,
		56,
		59
	],
	A: [
		57,
		61,
		64
	]
};
function midiToFreq(midi) {
	return 440 * Math.pow(2, (midi - 69) / 12);
}
function stringFreq(inst, stringIndex, fret) {
	return (inst.openFreq[stringIndex] ?? inst.openFreq[0] ?? 110) * Math.pow(2, fret / 12);
}
function withSurface(item, inst) {
	return {
		...item,
		surface: inst.surface,
		stringCount: inst.stringNames.length
	};
}
/** Don't stall on "what now" after an item. */
var AUTO_ADVANCE_MS = 1800;
/**
* HOW the day is delivered. Never owns curriculum.
*
* Adult ADHD methods this engine is supposed to keep:
* 1. Externalize the plan — they don't choose what to practise.
* 2. Closed loop — 3–4 items, ~10 minutes, then stop.
* 3. Load follows yesterday — slower, wider window, extra warmup if it went badly.
* 4. Immediate feedback, not lectures.
* 5. Streak freeze — missing a day is expected, not a moral event.
* 6. Skip without punishment.
* 7. Time-box optional exploration so the lab can't eat the evening.
*/
function feelFor(progress) {
	const acc = progress.lastAccuracy;
	if (progress.history.length === 0) return {
		bpmScale: .95,
		itemCount: 3,
		extraWarmup: true,
		challenge: false,
		windowMs: 240
	};
	if (progress.lastCheckin === "enough" && progress.lastPlayedDay !== localDayKey()) return {
		bpmScale: .88,
		itemCount: 3,
		extraWarmup: true,
		challenge: false,
		windowMs: 260
	};
	if (acc < .45) return {
		bpmScale: .85,
		itemCount: 3,
		extraWarmup: true,
		challenge: false,
		windowMs: 260
	};
	if (acc > .85 && progress.streak >= 2) return {
		bpmScale: 1.08,
		itemCount: 4,
		extraWarmup: false,
		challenge: true,
		windowMs: 180
	};
	return {
		bpmScale: 1,
		itemCount: 4,
		extraWarmup: false,
		challenge: true,
		windowMs: 210
	};
}
function scaledBpm(base, feel) {
	return Math.round(Math.max(56, Math.min(110, base * feel.bpmScale)));
}
function dayGap(from, to = localDayKey()) {
	if (!from) return Number.POSITIVE_INFINITY;
	const a = /* @__PURE__ */ new Date(`${from}T12:00:00`);
	const b = /* @__PURE__ */ new Date(`${to}T12:00:00`);
	return Math.round((b.getTime() - a.getTime()) / 864e5);
}
function streakTone(progress, today = localDayKey()) {
	if (!progress.lastPlayedDay || progress.streak <= 0) return "fresh";
	const gap = dayGap(progress.lastPlayedDay, today);
	if (gap <= 1) return "live";
	if (gap <= 3) return "held";
	return "fresh";
}
function nextStreak(progress, today = localDayKey()) {
	if (progress.lastPlayedDay === today) return progress.streak;
	if (!progress.lastPlayedDay) return 1;
	const gap = dayGap(progress.lastPlayedDay, today);
	if (gap === 1) return progress.streak + 1;
	if (gap <= 3) return progress.streak;
	return 1;
}
function dayCue(plan, done) {
	if (done) return "The loop is done. Lab is optional.";
	return `${plan.items.length} things. Then you're done.`;
}
function closingCopy(result) {
	if (result.items.length === 0) return "You opened the instrument. That counts.";
	if (result.accuracy >= .75) return "That's the day. Same time tomorrow.";
	if (result.accuracy >= .4) return "You showed up. The groove is in there.";
	return "Showing up counts. Tomorrow's loop is waiting.";
}
function itemCloseCopy(stars, last) {
	if (last) return "That's the day.";
	if (stars >= 2) return "That's one.";
	return "That's one. Next.";
}
function formatFocus(sec) {
	const m = Math.floor(Math.max(0, sec) / 60);
	const s = Math.max(0, sec) % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}
/**
* WHAT the artistic process asks — never owns the 10-minute loop.
*
* NAfME 2014 Harmonizing Instruments, Novice (H.5a), ADHD-sized:
* 1. The unit of work is a piece, not a drill — repertoire has a name.
* 2. Teacher-provided criteria (Pr5). They don't write the rubric.
* 3. Create is two options, not a blank page (Cr1 Imagine).
* 4. Respond is one listen + one name (Re7). No quiz shame.
* 5. Notation is a second picture, not a gate (Pr4.2 "at least some").
* 6. Select stays with the plan. They name why, they don't pick the day.
* 7. Interpret is a play-as line during the piece (Pr4.3 / Pr6).
* 8. Connecting is one everyday sentence, not a worksheet (Cn10 / Cn11).
*/
var PROCESS_LABEL = {
	create: "Make",
	perform: "Play",
	respond: "Listen"
};
var HARMONY = {
	"G-D-Em-C": [
		"I",
		"V",
		"vi",
		"IV"
	],
	"C-G-Am-F": [
		"I",
		"V",
		"vi",
		"IV"
	],
	"Em-G": ["i", "III"],
	"C-G": ["I", "V"],
	"C-Am": ["I", "vi"],
	"Am-C": ["vi", "I"],
	"G-D": ["I", "V"],
	"C-F": ["I", "IV"],
	"F-C": ["IV", "I"],
	"G-C": ["V", "I"],
	"Em-C": ["i", "VI"]
};
function defaultCriteria(type, process) {
	if (process === "create") return ["You picked it", "You played it through"];
	if (process === "respond") return ["You listened first", "You named one thing"];
	switch (type) {
		case "transition": return ["The pulse doesn't stop", "Prepare two beats early"];
		case "song": return ["The loop finishes", "The pulse holds through the change"];
		case "rhythm": return ["The hand keeps moving", "Land on one"];
		case "chord": return ["The shape is down before the strum"];
		default: return [];
	}
}
function criteriaFor(item) {
	if (item.criteria?.length) return item.criteria;
	return defaultCriteria(item.type, item.process);
}
function rhythmRead(pattern) {
	const cells = [...pattern.replace(/-/g, ".")].map((ch) => {
		if (ch === "D") return "↓";
		if (ch === "U") return "↑";
		return "·";
	});
	if (cells.length <= 1) return [
		"↓",
		"↓",
		"↓",
		"↓"
	];
	return cells;
}
function analysisFor(chords, explicit) {
	if (explicit?.length) return explicit;
	if (chords.length < 2) return void 0;
	return HARMONY[chords.join("-")];
}
function whyThisPiece(item) {
	if (item.why) return item.why;
	if (item.repertoire) return `This one's called ${item.repertoire}.`;
	return null;
}
function isProcessLesson(lesson) {
	return lesson.process === "create" || lesson.process === "respond";
}
function chordsFromCreatePick(pick, fallback) {
	if (pick.includes("–")) return pick.split("–").map((s) => s.trim()).filter(Boolean);
	if (/^[A-G]/.test(pick) && !pick.includes(" ")) return [pick];
	return fallback;
}
/** First Make/Listen that's unlocked and not yet done — skip locked ones. */
function nextUnlockedProcess(lessons, mastery, exceptId) {
	return lessons.find((l) => {
		if (!isProcessLesson(l)) return false;
		if (l.id === exceptId) return false;
		if ((mastery[l.id] ?? 0) >= l.masteryRequired) return false;
		return l.prerequisites.every((p) => {
			const req = lessons.find((x) => x.id === p)?.masteryRequired ?? .7;
			return (mastery[p] ?? 0) >= req;
		});
	}) ?? null;
}
function processPromise(title, process, minutes) {
	return `Today: ${title}. ${process === "create" ? "Make" : process === "respond" ? "Listen" : "Play"}. ${minutes} minutes.`;
}
/** Pr5 — teacher criteria after the pass. Never a quiz. */
function refineLine(item, stars) {
	if (item.process === "respond") return "You listened. That counts.";
	if (item.process === "create") return stars >= 2 ? "You played the one you picked." : "The idea is yours. Another pass still counts.";
	if (stars >= 2 && item.criteria?.[0]) return item.criteria[0];
	if (stars >= 2) return "Ready enough for today.";
	return "Another pass still counts.";
}
function warmupItem(progress, bpm, firstDay, windowMs) {
	const needsTune = !firstDay && (progress.mastery["lesson_guitar_tuning_01"] ?? 0) < .7;
	const lesson = lessonById(needsTune ? "lesson_guitar_tuning_01" : "lesson_guitar_open_strings_01");
	return {
		id: "warmup",
		type: "warmup",
		title: needsTune ? "Tune + open strings" : "Open-string pulse",
		subtitle: "Low E to high e, on the beat",
		durationSec: 90,
		lessonId: lesson.id,
		chords: [],
		pattern: "D",
		bars: 8,
		bpm,
		windowMs,
		objectives: lesson.objectives,
		role: "warmup",
		criteria: criteriaFor(lesson)
	};
}
function fromLesson(lessonId, feel, extra, instrument = "guitar") {
	const lesson = instrument === "guitar" ? lessonById(lessonId) ?? LESSONS[0] : lessonByIdFor(instrument, lessonId);
	const bpm = scaledBpm(lesson.bpm, feel);
	const inst = instrumentById(instrument);
	const process = lesson.process;
	const criteria = criteriaFor(lesson);
	const analysis = analysisFor(lesson.chords, lesson.analysis);
	return withSurface({
		id: lesson.id,
		type: lesson.type,
		title: lesson.title,
		subtitle: lesson.why ?? lesson.objectives[0] ?? "",
		durationSec: Math.round(lesson.bars * 4 * 60 / bpm),
		lessonId: lesson.id,
		chords: lesson.chords,
		pattern: lesson.pattern,
		bars: lesson.bars,
		bpm,
		windowMs: feel.windowMs,
		objectives: lesson.objectives,
		role: lesson.type === "warmup" ? "warmup" : "new",
		repertoire: lesson.repertoire,
		criteria,
		process,
		createOptions: lesson.createOptions,
		listenPrompt: lesson.listenPrompt,
		why: lesson.why,
		interpret: lesson.interpret,
		analysis,
		...extra
	}, inst);
}
function weakestSkill(progress, instrument) {
	const started = (instrument === "guitar" ? LESSONS : lessonsFor(instrument)).filter((l) => (progress.mastery[l.id] ?? 0) > 0 && (progress.mastery[l.id] ?? 0) < l.masteryRequired);
	if (!started.length) return null;
	return started.sort((a, b) => (progress.mastery[a.id] ?? 0) - (progress.mastery[b.id] ?? 0))[0];
}
function firstSessionPlan(progress, date, feel, instrument) {
	const inst = instrumentById(instrument);
	const ids = firstLessonIds(instrument);
	const items = ids.map((id, i) => {
		if (i === 0) return fromLesson(id, feel, {
			id: "warmup",
			type: "warmup",
			role: "warmup"
		}, instrument);
		if (i === ids.length - 1) return fromLesson(id, feel, {
			id: "groove",
			type: "song",
			role: "challenge"
		}, instrument);
		return fromLesson(id, feel, { role: "new" }, instrument);
	});
	return {
		date,
		minutes: 10,
		promise: promiseFor(instrument),
		items: items.map((it) => withSurface(it, inst))
	};
}
function guitarFirst(progress, date, feel) {
	return {
		date,
		minutes: 10,
		promise: FIRST_PROMISE,
		items: [
			warmupItem(progress, scaledBpm(70, feel), true, feel.windowMs),
			fromLesson("lesson_guitar_em_chord_01", feel, {
				subtitle: "Two fingers. Strum when the note hits the line.",
				role: "new"
			}),
			fromLesson("lesson_guitar_song_first_two_chord_01", feel, {
				id: "groove",
				type: "song",
				title: "Night Bus",
				subtitle: "Em → G. Stay with the pulse.",
				bars: 8,
				durationSec: 64,
				role: "challenge",
				repertoire: "Night Bus"
			})
		].map((it) => withSurface(it, instrumentById("guitar")))
	};
}
/** WHAT to practise today. Curriculum decides the lesson; psychology decides length/tempo. */
function generateDailyPlan(progress, date = localDayKey(), instrument = "guitar") {
	const feel = feelFor(progress);
	if (progress.history.length === 0) return instrument === "guitar" ? guitarFirst(progress, date, feel) : firstSessionPlan(progress, date, feel, instrument);
	const next = instrument === "guitar" ? nextLesson(progress.mastery) : nextLessonFor(instrument, progress.mastery);
	const weak = weakestSkill(progress, instrument);
	const inst = instrumentById(instrument);
	const items = [instrument === "guitar" ? withSurface(warmupItem(progress, scaledBpm(70, feel), false, feel.windowMs), inst) : fromLesson(firstLessonIds(instrument)[0], feel, {
		id: "warmup",
		type: "warmup"
	}, instrument)];
	if (feel.extraWarmup) items[0] = {
		...items[0],
		durationSec: 120,
		bars: 12
	};
	if (weak && weak.id !== next.id) items.push(fromLesson(weak.id, feel, {
		id: `review-${weak.id}`,
		title: `Review · ${weak.title}`,
		subtitle: "Yesterday's sticky spot",
		role: "review"
	}, instrument));
	items.push(fromLesson(next.id, feel, {}, instrument));
	const processPick = nextUnlockedProcess(lessonsFor(instrument), progress.mastery, next.id);
	if (feel.challenge && processPick) items.push(fromLesson(processPick.id, feel, {
		id: "challenge",
		role: "challenge",
		bars: Math.min(8, processPick.bars)
	}, instrument));
	else if (feel.challenge && (next.chords.length || instrument === "drums")) items.push(fromLesson(next.id, feel, {
		id: "challenge",
		type: next.chords.length > 1 ? "song" : "rhythm",
		title: next.repertoire ?? (next.chords.length > 1 ? "Groove challenge" : "Clean four-beat hold"),
		subtitle: next.chords.length > 1 ? next.chords.join(" → ") : "Stay locked to the click",
		bars: Math.min(16, next.bars + 4),
		bpm: scaledBpm(next.bpm + 6, feel),
		role: "challenge"
	}, instrument));
	const trimmed = items.slice(0, feel.itemCount);
	const minutes = Math.max(8, Math.round(trimmed.reduce((s, i) => s + i.durationSec, 0) / 60));
	return {
		date,
		minutes,
		promise: processPromise(next.repertoire ?? next.title, next.process, minutes),
		items: trimmed
	};
}
/**
* HOW the same lesson is shown and answered.
* Never owns curriculum. Never adds a menu.
*
* CAST UDL, baked in (not a settings page) so adult ADHD still gets a closed loop:
* 1. Clarify the goal — both objectives, a success line, a role on the plan.
* 2. Multiple representations — diagram + words + hear-it-once.
* 3. Multiple ways in — tap, space, numbered keys, pad. Same hit.
* 4. Graduated support — a model bar before play; pattern in words.
* 5. Monitor — “the new thing is X”; what the score is not (a grade).
* 6. Emotional capacity — one-tap check-in after the day. Optional. Auto-skip.
* 7. No extra choice — supports are on. The day is still chosen for you.
*/
var CHECKINS = [
	{
		id: "locked",
		title: "Locked in",
		body: "The pulse sat."
	},
	{
		id: "through",
		title: "Got through",
		body: "Messy is still a day."
	},
	{
		id: "enough",
		title: "That was enough",
		body: "Tomorrow can be smaller."
	}
];
var ROLE_LABEL = {
	warmup: "Warmup",
	new: "New",
	review: "Review",
	challenge: "Groove"
};
function roleLabel(role) {
	return role ? ROLE_LABEL[role] : null;
}
function patternInWords(pattern) {
	const words = [...pattern.replace(/-/g, ".")].map((ch) => {
		if (ch === "D") return "down";
		if (ch === "U") return "up";
		return "rest";
	});
	if (words.length <= 1) return "down on each beat";
	return words.join(" · ");
}
function successLine(item) {
	switch (item.type) {
		case "warmup": return "You'll know it when each note is clean.";
		case "chord": return "You'll know it when the shape holds through the bar.";
		case "transition": return "You'll know it when the pulse doesn't stop.";
		case "rhythm": return "You'll know it when the hand keeps moving.";
		case "song": return "You'll know it when the loop finishes.";
		default:
			if (item.process === "create") return "You'll know it when you play the one you picked.";
			if (item.process === "respond") return "You'll know it when you name one thing.";
			return "You'll know it when the move lands on the click.";
	}
}
function coachCue(item) {
	const second = item.objectives?.[1];
	if (second) return second;
	return item.subtitle;
}
function howYouPlay(item) {
	const surface = item.surface;
	if (surface === "pads") return "Tap the pad, or Hit. Or 1–4.";
	if (surface === "keys") return "Tap a key, Play, or 1–7.";
	if (surface === "voice") return "Sing toward C, or tap Match.";
	return "Strum, or space.";
}
function newThingLine(plan) {
	const next = plan.items.find((i) => i.role === "new") ?? plan.items.find((i) => i.role !== "warmup" && i.type !== "warmup");
	if (!next) return null;
	return `The new thing is ${next.title}.`;
}
function feelCue(progress) {
	if (progress.history.length === 0) return null;
	if (feelFor(progress).extraWarmup) return "Today is slower. That's the point.";
	return null;
}
function isCheckin(id) {
	return id === "locked" || id === "through" || id === "enough";
}
var JUDGE_WINDOWS = {
	perfect: 70,
	good: 140,
	ok: 220
};
var KEY = "sparksuite.v2";
var LEGACY = "sparksuite.v1";
var BACKUP = "sparksuite.v2.bak";
var defaultProgress = () => ({
	version: 4,
	xp: 0,
	level: 1,
	streak: 0,
	lastPlayedDay: null,
	mastery: {},
	lastAccuracy: 0,
	history: [],
	dailyComplete: {},
	bestCombo: 0,
	marks: [],
	lastCheckin: null
});
var defaultSuite = () => ({
	version: 4,
	active: "guitar",
	apps: { guitar: defaultProgress() }
});
function canUseStorage() {
	return typeof localStorage !== "undefined";
}
function migrateProgress(raw) {
	const base = defaultProgress();
	if (!raw || typeof raw !== "object") return base;
	return {
		...base,
		...raw,
		version: 4,
		mastery: raw.mastery ?? {},
		history: raw.history ?? [],
		dailyComplete: raw.dailyComplete ?? {},
		bestCombo: typeof raw.bestCombo === "number" ? raw.bestCombo : 0,
		marks: Array.isArray(raw.marks) ? raw.marks.filter((id) => typeof id === "string") : [],
		lastCheckin: isCheckin(raw.lastCheckin) ? raw.lastCheckin : null
	};
}
function migrateSuite(raw) {
	const base = defaultSuite();
	if (!raw || typeof raw !== "object") return base;
	const obj = raw;
	if (obj.apps && typeof obj.apps === "object") {
		const apps = {};
		for (const [k, v] of Object.entries(obj.apps)) if (isInstrumentId(k)) apps[k] = migrateProgress(v);
		return {
			version: 4,
			active: isInstrumentId(obj.active) ? obj.active : "guitar",
			apps: {
				...base.apps,
				...apps
			}
		};
	}
	return {
		version: 4,
		active: "guitar",
		apps: { guitar: migrateProgress(obj) }
	};
}
function loadSuite() {
	if (!canUseStorage()) return defaultSuite();
	try {
		const text = localStorage.getItem(KEY);
		if (text) return migrateSuite(JSON.parse(text));
		const legacy = localStorage.getItem(LEGACY);
		if (legacy) {
			const migrated = migrateSuite(JSON.parse(legacy));
			saveSuite(migrated);
			return migrated;
		}
		return defaultSuite();
	} catch {
		try {
			const bak = localStorage.getItem(BACKUP);
			if (bak) return migrateSuite(JSON.parse(bak));
		} catch {}
		return defaultSuite();
	}
}
function saveSuite(state) {
	if (!canUseStorage()) return;
	try {
		const prev = localStorage.getItem(KEY);
		if (prev) localStorage.setItem(BACKUP, prev);
		localStorage.setItem(KEY, JSON.stringify(state));
	} catch {}
}
function suiteTotals(suite) {
	const apps = Object.values(suite.apps);
	return {
		xp: apps.reduce((s, p) => s + (p?.xp ?? 0), 0),
		streak: apps.reduce((s, p) => Math.max(s, p?.streak ?? 0), 0)
	};
}
function progressFor(suite, id) {
	return suite.apps[id] ?? defaultProgress();
}
function saveProgress(state) {
	const suite = loadSuite();
	suite.apps[suite.active] = state;
	suite.version = 4;
	saveSuite(suite);
}
function applyStreak(state, today = localDayKey()) {
	if (state.lastPlayedDay === today) return state;
	return {
		...state,
		streak: nextStreak(state, today),
		lastPlayedDay: today
	};
}
/** Thin composition root. Engines stay pure; this is the only app-facing barrel. */
function createSpark(initial = defaultProgress(), instrument = "guitar") {
	let progress = initial;
	let active = instrument;
	let plan = generateDailyPlan(progress, void 0, active);
	return {
		getProgress: () => progress,
		getPlan: () => plan,
		getInstrument: () => active,
		refreshPlan() {
			plan = generateDailyPlan(progress, void 0, active);
			return plan;
		},
		setProgress(next) {
			progress = next;
			const suite = loadSuite();
			suite.active = active;
			suite.apps[active] = next;
			saveSuite(suite);
			plan = generateDailyPlan(progress, void 0, active);
			return progress;
		},
		setInstrument(next, nextProgress) {
			active = next;
			progress = nextProgress;
			const suite = loadSuite();
			suite.active = next;
			suite.apps[next] = nextProgress;
			saveSuite(suite);
			plan = generateDailyPlan(progress, void 0, active);
			return {
				progress,
				plan,
				instrument: active
			};
		}
	};
}
function patternBeats(pattern) {
	const raw = pattern.replace(/-/g, ".");
	const out = [];
	for (const ch of raw) if (ch === "D") out.push("down");
	else if (ch === "U") out.push("up");
	else out.push("rest");
	return out.length ? out : ["down"];
}
/** Build an abstract exercise timeline in seconds from bar 0. */
function buildTimeline(item) {
	if (item.surface === "pads") return drumTimeline(item);
	if ((item.surface === "keys" || item.surface === "voice") && (item.type === "warmup" || item.type === "skill") && item.process !== "respond" && item.process !== "create") return keyWarmup(item);
	const steps = patternBeats(item.pattern);
	const beatSec = 60 / item.bpm;
	const events = [];
	const chordEveryBars = item.type === "transition" ? 2 : item.chords.length ? Math.max(1, Math.floor(item.bars / item.chords.length) || 2) : 2;
	if (item.type === "warmup" || item.type === "skill") {
		const n = Math.max(1, item.stringCount ?? 6);
		for (let bar = 0; bar < item.bars; bar++) for (let beat = 0; beat < 4; beat++) {
			const string = n - 1 - (bar * 4 + beat) % n;
			events.push({
				t: (bar * 4 + beat) * beatSec,
				kind: "pluck",
				string,
				bar,
				beat
			});
		}
		return events;
	}
	const subdiv = steps.length;
	for (let bar = 0; bar < item.bars; bar++) {
		const chord = item.chords.length ? item.chords[Math.floor(bar / chordEveryBars) % item.chords.length] : void 0;
		for (let i = 0; i < subdiv; i++) {
			const step = steps[i];
			if (step === "rest") continue;
			const beat = i / subdiv * 4;
			events.push({
				t: bar * 4 * beatSec + i * (4 * beatSec / subdiv),
				kind: step === "up" ? "up" : "down",
				chord,
				bar,
				beat
			});
		}
	}
	return events;
}
function drumTimeline(item) {
	const beatSec = 60 / item.bpm;
	const events = [];
	const id = item.lessonId;
	const createPick = item.createPick ?? "";
	const kickOnly = id.includes("kick") && !id.includes("backbeat") && !id.includes("four") || createPick.toLowerCase().includes("kick on one");
	const four = id.includes("four") || item.type === "song" || createPick.toLowerCase().includes("four");
	for (let bar = 0; bar < item.bars; bar++) for (let beat = 0; beat < 4; beat++) {
		let pad = 0;
		if (kickOnly) pad = beat === 0 ? 0 : null;
		else if (id.includes("backbeat") && !four) pad = beat % 2 === 0 ? 0 : 1;
		else if (four) pad = beat === 1 || beat === 3 ? 1 : 0;
		if (pad == null) continue;
		events.push({
			t: (bar * 4 + beat) * beatSec,
			kind: "pluck",
			string: pad,
			bar,
			beat
		});
	}
	return events;
}
function keyWarmup(item) {
	const beatSec = 60 / item.bpm;
	const events = [];
	const holdC = item.surface === "voice" || item.lessonId.includes("middle_c") || item.lessonId.includes("drone") || item.lessonId.includes("match") || item.lessonId.includes("hold");
	const whites = [
		60,
		62,
		64,
		65,
		67,
		69,
		71
	];
	for (let bar = 0; bar < item.bars; bar++) for (let beat = 0; beat < 4; beat++) {
		const midi = holdC ? 60 : whites[(bar * 4 + beat) % whites.length];
		events.push({
			t: (bar * 4 + beat) * beatSec,
			kind: "pluck",
			string: midi,
			bar,
			beat
		});
	}
	return events;
}
function judgeHit(deltaMs, windowMs = 220) {
	const abs = Math.abs(deltaMs);
	if (abs <= JUDGE_WINDOWS.perfect) return "perfect";
	if (abs <= JUDGE_WINDOWS.good) return "good";
	if (abs <= Math.min(JUDGE_WINDOWS.ok, windowMs)) return "ok";
	return "miss";
}
function consumeHit(notes, now, windowMs = 220) {
	let best = -1;
	let bestAbs = Infinity;
	for (let i = 0; i < notes.length; i++) {
		const d = Math.abs((notes[i].t - now) * 1e3);
		if (d < bestAbs) {
			bestAbs = d;
			best = i;
		}
	}
	if (best < 0 || bestAbs > windowMs) return {
		hit: false,
		judge: "miss",
		deltaMs: bestAbs,
		note: null
	};
	const note = notes[best];
	const deltaMs = (now - note.t) * 1e3;
	return {
		hit: true,
		judge: judgeHit(deltaMs, windowMs),
		deltaMs,
		note,
		index: best
	};
}
function starsFor(accuracy) {
	if (accuracy >= .9) return 3;
	if (accuracy >= .7) return 2;
	if (accuracy >= .4) return 1;
	return 0;
}
function xpFor(accuracy, hits) {
	return Math.round(hits * 8 + accuracy * 40);
}
function summarizeItem(item, hits, misses) {
	const total = hits + misses;
	const accuracy = total === 0 ? 0 : hits / total;
	return {
		itemId: item.id,
		lessonId: item.lessonId,
		hits,
		misses,
		accuracy,
		stars: starsFor(accuracy),
		xp: xpFor(accuracy, hits)
	};
}
function countInBeats() {
	return 4;
}
function levelForXp(xp) {
	return 1 + Math.floor(xp / 500);
}
var RANKS = [
	{
		min: 1,
		id: "pulse",
		title: "Pulse",
		line: "The click is the whole song."
	},
	{
		min: 2,
		id: "groove",
		title: "Groove",
		line: "You can sit on a pulse now."
	},
	{
		min: 3,
		id: "pocket",
		title: "Pocket",
		line: "Late, fat, unhurried."
	},
	{
		min: 5,
		id: "sideman",
		title: "Sideman",
		line: "You make the other parts sit."
	},
	{
		min: 8,
		id: "player",
		title: "Player",
		line: "The instrument is a habit."
	}
];
var MARKS = [
	{
		id: "opened",
		title: "Opened",
		body: "You picked it up."
	},
	{
		id: "groove",
		title: "Groove",
		body: "A loop, all the way through."
	},
	{
		id: "pocket",
		title: "Pocket",
		body: "Eight in a row. That's the pocket."
	},
	{
		id: "week",
		title: "Week held",
		body: "Three days this week. The unit that matters."
	},
	{
		id: "clean",
		title: "Clean",
		body: "A three-star pass. Keep that feel."
	},
	{
		id: "heat",
		title: "Heat",
		body: "Seven days of showing up. It can still pause."
	}
];
function rankFor(level) {
	let found = RANKS[0];
	for (const r of RANKS) if (level >= r.min) found = r;
	return found;
}
function xpProgress(xp) {
	const level = levelForXp(xp);
	const into = xp % 500;
	return {
		level,
		into,
		need: 500,
		pct: Math.round(into / 500 * 100)
	};
}
function sparksFor(progress) {
	return Object.values(progress.dailyComplete).filter(Boolean).length;
}
function recentDays(today = localDayKey(), n = 7) {
	const end = /* @__PURE__ */ new Date(`${today}T12:00:00`);
	const days = [];
	for (let i = n - 1; i >= 0; i--) {
		const d = new Date(end);
		d.setDate(end.getDate() - i);
		days.push(localDayKey(d));
	}
	return days;
}
function weekPulse(progress, today = localDayKey()) {
	const days = recentDays(today).map((key) => ({
		key,
		on: Boolean(progress.dailyComplete[key])
	}));
	const count = days.filter((d) => d.on).length;
	return {
		days,
		count,
		held: count >= 3
	};
}
function comboCue(combo) {
	if (combo >= 12) return "locked in";
	if (combo >= 8) return "pocket";
	if (combo >= 4) return "heat";
	return "combo";
}
function isComboGate(combo) {
	return combo === 4 || combo === 8 || combo === 12;
}
function evaluateMarks(progress, result, peakCombo) {
	const have = new Set(progress.marks);
	const add = (id) => have.add(id);
	add("opened");
	if (result.items.some((i) => i.lessonId.includes("_song_") || i.itemId.includes("groove"))) add("groove");
	if (peakCombo >= 8) add("pocket");
	if (weekPulse(progress).held) add("week");
	if (result.items.some((i) => i.stars >= 3)) add("clean");
	if (progress.streak >= 7) add("heat");
	return MARKS.map((m) => m.id).filter((id) => have.has(id));
}
function markById(id) {
	return MARKS.find((m) => m.id === id);
}
function grantFoundations(state, instrument = "guitar") {
	const ids = instrument === "guitar" ? FOUNDATION_LESSONS : foundationsFor(instrument);
	const mastery = { ...state.mastery };
	for (const id of ids) mastery[id] = Math.max(mastery[id] ?? 0, .85);
	return {
		...state,
		mastery
	};
}
function applyItemMastery(state, result) {
	const prev = state.mastery[result.lessonId] ?? 0;
	const next = Math.min(1, prev * .55 + result.accuracy * .45 + (result.stars >= 2 ? .08 : 0));
	return {
		...state,
		mastery: {
			...state.mastery,
			[result.lessonId]: next
		}
	};
}
function finalizeSession(state, result, instrument = "guitar") {
	let next = grantFoundations(applyStreak(state, result.date), instrument);
	for (const item of result.items) next = applyItemMastery(next, item);
	const xp = next.xp + result.xp;
	const history = [...next.history, {
		date: result.date,
		accuracy: result.accuracy,
		xp: result.xp
	}].slice(-24);
	const peakCombo = Math.max(next.bestCombo, result.peakCombo ?? 0);
	next = {
		...next,
		xp,
		level: levelForXp(xp),
		lastAccuracy: result.accuracy,
		history,
		dailyComplete: {
			...next.dailyComplete,
			[result.date]: true
		},
		bestCombo: peakCombo,
		lastCheckin: state.lastPlayedDay === result.date ? state.lastCheckin : null
	};
	next = {
		...next,
		marks: evaluateMarks(next, result, peakCombo)
	};
	saveProgress(next);
	return next;
}
function startSession(progress, plan) {
	return {
		plan: plan ?? generateDailyPlan(progress),
		index: 0,
		itemHits: 0,
		itemMisses: 0,
		results: [],
		startedAt: performance.now(),
		currentCombo: 0,
		peakCombo: 0
	};
}
function currentItem(session) {
	return session.plan.items[session.index] ?? null;
}
function recordHit(session) {
	const currentCombo = session.currentCombo + 1;
	return {
		...session,
		itemHits: session.itemHits + 1,
		currentCombo,
		peakCombo: Math.max(session.peakCombo, currentCombo)
	};
}
function recordMiss(session) {
	return {
		...session,
		itemMisses: session.itemMisses + 1,
		currentCombo: 0
	};
}
function completeItem(session) {
	const item = currentItem(session);
	if (!item) return session;
	const result = summarizeItem(item, session.itemHits, session.itemMisses);
	return {
		...session,
		results: [...session.results, result],
		index: session.index + 1,
		itemHits: 0,
		itemMisses: 0
	};
}
/** Advance without a zero-accuracy result. Stuck is not failure. */
function skipItem(session) {
	if (!currentItem(session)) return session;
	return {
		...session,
		index: session.index + 1,
		itemHits: 0,
		itemMisses: 0,
		currentCombo: 0
	};
}
function isSessionDone(session) {
	return session.index >= session.plan.items.length;
}
function closeSession(progress, session, instrument = "guitar") {
	let s = session;
	if (currentItem(s) && s.itemHits + s.itemMisses > 0) s = completeItem(s);
	const acc = s.results.length === 0 ? 0 : s.results.reduce((n, r) => n + r.accuracy, 0) / s.results.length;
	const prevLevel = progress.level;
	const prevMarks = progress.marks;
	const result = {
		date: localDayKey(),
		accuracy: acc,
		stars: Math.round(s.results.reduce((n, r) => n + r.stars, 0) / Math.max(1, s.results.length)),
		xp: s.results.reduce((n, r) => n + r.xp, 0) + (s.results.length === s.plan.items.length ? 80 : 0),
		items: s.results,
		peakCombo: s.peakCombo,
		prevLevel
	};
	const next = finalizeSession(progress, result, instrument);
	result.leveledUp = next.level > prevLevel;
	result.newMarks = next.marks.filter((id) => !prevMarks.includes(id));
	return {
		progress: next,
		result
	};
}
var spark = createSpark(defaultProgress(), "guitar");
function fromSuite(suite) {
	const totals = suiteTotals(suite);
	return {
		apps: suite.apps,
		suiteXp: totals.xp,
		bestStreak: totals.streak
	};
}
var useSpark = create((set, get) => ({
	instrument: "guitar",
	progress: spark.getProgress(),
	plan: spark.getPlan(),
	session: null,
	lastResult: null,
	audioReady: false,
	hydrated: false,
	apps: { guitar: defaultProgress() },
	suiteXp: 0,
	bestStreak: 0,
	hydrate: () => {
		const suite = loadSuite();
		const progress = progressFor(suite, suite.active);
		spark.setInstrument(suite.active, progress);
		set({
			instrument: suite.active,
			progress,
			plan: spark.getPlan(),
			hydrated: true,
			...fromSuite(suite)
		});
	},
	selectInstrument: (id) => {
		const progress = progressFor(loadSuite(), id);
		const next = spark.setInstrument(id, progress);
		set({
			instrument: id,
			progress: next.progress,
			plan: next.plan,
			session: null,
			lastResult: null,
			...fromSuite(loadSuite())
		});
	},
	markAudioReady: () => set({ audioReady: true }),
	beginDay: () => {
		const { progress, instrument } = get();
		const plan = generateDailyPlan(progress, void 0, instrument);
		set({
			session: startSession(progress, plan),
			plan,
			lastResult: null
		});
	},
	hit: () => {
		const s = get().session;
		if (s) set({ session: recordHit(s) });
	},
	miss: () => {
		const s = get().session;
		if (s) set({ session: recordMiss(s) });
	},
	finishItem: () => {
		const s = get().session;
		if (!s) return;
		set({ session: completeItem(s) });
	},
	skipCurrent: () => {
		const s = get().session;
		if (!s) return;
		set({ session: skipItem(s) });
	},
	finishDay: () => {
		const { session, progress, instrument } = get();
		if (!session) return null;
		const { progress: next, result } = closeSession(progress, session, instrument);
		spark.setProgress(next);
		set({
			progress: next,
			session: null,
			lastResult: result,
			plan: spark.getPlan(),
			...fromSuite(loadSuite())
		});
		return result;
	},
	abortSession: () => {
		const { session, progress, instrument } = get();
		if (!session) return;
		if (session.results.length > 0 || session.itemHits + session.itemMisses > 0) {
			const { progress: next, result } = closeSession(progress, session, instrument);
			spark.setProgress(next);
			set({
				progress: next,
				session: null,
				lastResult: result,
				plan: spark.getPlan(),
				...fromSuite(loadSuite())
			});
			return;
		}
		set({ session: null });
	},
	noteCheckin: (id) => {
		const { progress } = get();
		const next = {
			...progress,
			lastCheckin: id
		};
		spark.setProgress(next);
		set({
			progress: next,
			plan: spark.getPlan()
		});
	},
	resetLocal: () => {
		const fresh = defaultProgress();
		spark.setProgress(fresh);
		set({
			progress: fresh,
			plan: spark.getPlan(),
			session: null,
			lastResult: null,
			hydrated: true,
			...fromSuite(loadSuite())
		});
	}
}));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/theory-2qio2D50.js
var PC_SHARP = [
	"C",
	"C#",
	"D",
	"D#",
	"E",
	"F",
	"F#",
	"G",
	"G#",
	"A",
	"A#",
	"B"
];
var PC_FLAT = [
	"C",
	"Db",
	"D",
	"Eb",
	"E",
	"F",
	"Gb",
	"G",
	"Ab",
	"A",
	"Bb",
	"B"
];
/** Common guitar spellings for the root picker. */
var PICKER_ROOTS = [
	"C",
	"C#",
	"D",
	"Eb",
	"E",
	"F",
	"F#",
	"G",
	"Ab",
	"A",
	"Bb",
	"B"
];
var NAME_TO_PC = {
	C: 0,
	"C#": 1,
	Db: 1,
	D: 2,
	"D#": 3,
	Eb: 3,
	E: 4,
	F: 5,
	"F#": 6,
	Gb: 6,
	G: 7,
	"G#": 8,
	Ab: 8,
	A: 9,
	"A#": 10,
	Bb: 10,
	B: 11
};
var QUALITIES = [
	{
		id: "maj",
		suffix: "",
		name: "Major",
		ivs: [
			0,
			4,
			7
		],
		formula: [
			"1",
			"3",
			"5"
		],
		group: "triad",
		blurb: "Bright triad. The major third sits four semitones above the root — one fret farther than minor."
	},
	{
		id: "min",
		suffix: "m",
		name: "Minor",
		ivs: [
			0,
			3,
			7
		],
		formula: [
			"1",
			"b3",
			"5"
		],
		group: "triad",
		blurb: "Dark triad. Flatten the third one fret and the colour flips. Fifth stays put."
	},
	{
		id: "dim",
		suffix: "dim",
		name: "Diminished",
		ivs: [
			0,
			3,
			6
		],
		formula: [
			"1",
			"b3",
			"b5"
		],
		group: "triad",
		blurb: "Stacked minor thirds. Unstable — the lowered fifth wants to collapse inward."
	},
	{
		id: "aug",
		suffix: "aug",
		name: "Augmented",
		ivs: [
			0,
			4,
			8
		],
		formula: [
			"1",
			"3",
			"#5"
		],
		group: "triad",
		blurb: "Stacked major thirds. Symmetrical and tense; it can resolve in more than one direction."
	},
	{
		id: "sus2",
		suffix: "sus2",
		name: "Sus2",
		ivs: [
			0,
			2,
			7
		],
		formula: [
			"1",
			"2",
			"5"
		],
		group: "triad",
		blurb: "No third, so no major/minor. The 2 hangs open until you let a third back in."
	},
	{
		id: "sus4",
		suffix: "sus4",
		name: "Sus4",
		ivs: [
			0,
			5,
			7
		],
		formula: [
			"1",
			"4",
			"5"
		],
		group: "triad",
		blurb: "The classic suspension. The 4 wants to fall to 3 — that’s the resolution you already know from songs."
	},
	{
		id: "7",
		suffix: "7",
		name: "Dominant 7",
		ivs: [
			0,
			4,
			7,
			10
		],
		formula: [
			"1",
			"3",
			"5",
			"b7"
		],
		group: "seventh",
		blurb: "Major triad plus a minor seventh. The tritone between 3 and b7 is why V7 falls into I."
	},
	{
		id: "maj7",
		suffix: "maj7",
		name: "Major 7",
		ivs: [
			0,
			4,
			7,
			11
		],
		formula: [
			"1",
			"3",
			"5",
			"7"
		],
		group: "seventh",
		blurb: "A major third and a major seventh. Soft, wide, a little jazzy — not a dominant pull."
	},
	{
		id: "m7",
		suffix: "m7",
		name: "Minor 7",
		ivs: [
			0,
			3,
			7,
			10
		],
		formula: [
			"1",
			"b3",
			"5",
			"b7"
		],
		group: "seventh",
		blurb: "Minor colour with a smooth seventh. The workhorse ii chord in a ii–V–I."
	},
	{
		id: "m7b5",
		suffix: "m7b5",
		name: "Half-diminished",
		ivs: [
			0,
			3,
			6,
			10
		],
		formula: [
			"1",
			"b3",
			"b5",
			"b7"
		],
		group: "seventh",
		blurb: "The viiø7 in major, the iiø7 in minor. Dark, and it points at a dominant."
	},
	{
		id: "dim7",
		suffix: "dim7",
		name: "Diminished 7",
		ivs: [
			0,
			3,
			6,
			9
		],
		formula: [
			"1",
			"b3",
			"b5",
			"bb7"
		],
		group: "seventh",
		blurb: "All minor thirds. Four equivalent roots — a hinge you can pivot on."
	},
	{
		id: "6",
		suffix: "6",
		name: "Major 6",
		ivs: [
			0,
			4,
			7,
			9
		],
		formula: [
			"1",
			"3",
			"5",
			"6"
		],
		group: "colour",
		blurb: "A major triad with a sweet sixth. Older popular music, swing, and a lot of western swing guitar."
	},
	{
		id: "m6",
		suffix: "m6",
		name: "Minor 6",
		ivs: [
			0,
			3,
			7,
			9
		],
		formula: [
			"1",
			"b3",
			"5",
			"6"
		],
		group: "colour",
		blurb: "Minor, but the sixth keeps it from sinking. Gypsy jazz and film-noir colour."
	},
	{
		id: "add9",
		suffix: "add9",
		name: "Add9",
		ivs: [
			0,
			4,
			7,
			14
		],
		formula: [
			"1",
			"3",
			"5",
			"9"
		],
		group: "colour",
		blurb: "Major triad plus a ninth. No seventh, so it stays open instead of jazzy."
	},
	{
		id: "9",
		suffix: "9",
		name: "Dominant 9",
		ivs: [
			0,
			4,
			7,
			10,
			14
		],
		formula: [
			"1",
			"3",
			"5",
			"b7",
			"9"
		],
		group: "colour",
		blurb: "Dominant 7 with a ninth on top. Funk, soul, and a rounder blues."
	}
];
var INTERVAL_INFO = {
	"1": {
		name: "Root",
		semitones: 0,
		role: "The note the chord is named after. Everything else is measured from here."
	},
	b2: {
		name: "Minor 2nd",
		semitones: 1,
		role: "A clash. Rare as a chord tone; it wants to resolve immediately."
	},
	"2": {
		name: "Major 2nd",
		semitones: 2,
		role: "The sus2 colour — airy, no major/minor."
	},
	"9": {
		name: "Ninth",
		semitones: 14,
		role: "A 2nd an octave up. Colour, not a new function."
	},
	b3: {
		name: "Minor 3rd",
		semitones: 3,
		role: "The whole minor sound. One fret below the major third."
	},
	"3": {
		name: "Major 3rd",
		semitones: 4,
		role: "The whole major sound. Four semitones above the root."
	},
	"4": {
		name: "Perfect 4th",
		semitones: 5,
		role: "Sus4. Wants to fall a fret to the third."
	},
	b5: {
		name: "Diminished 5th",
		semitones: 6,
		role: "Tritone. Unstable. The engine inside a diminished chord."
	},
	"5": {
		name: "Perfect 5th",
		semitones: 7,
		role: "The frame. Power chords are root + fifth — no colour yet."
	},
	"#5": {
		name: "Augmented 5th",
		semitones: 8,
		role: "Stretches the triad outward. Dreamy and tense at once."
	},
	"6": {
		name: "Major 6th",
		semitones: 9,
		role: "Sweet colour. Same pitch class as the thirteenth."
	},
	bb7: {
		name: "Diminished 7th",
		semitones: 9,
		role: "A 6th spelled as a seventh. Completes the dim7 stack."
	},
	b7: {
		name: "Minor 7th",
		semitones: 10,
		role: "Dominant flavour. Mixolydian. Wants to resolve down."
	},
	"7": {
		name: "Major 7th",
		semitones: 11,
		role: "A half-step below the octave. Lush, not dominant."
	}
};
var MAJOR_SCALE = [
	0,
	2,
	4,
	5,
	7,
	9,
	11
];
var MINOR_SCALE = [
	0,
	2,
	3,
	5,
	7,
	8,
	10
];
var MAJOR_DEGREES = [
	{
		roman: "I",
		roman7: "Imaj7",
		quality: "maj",
		quality7: "maj7",
		fn: "tonic",
		hint: "Home. The chord the key is named after."
	},
	{
		roman: "ii",
		roman7: "ii7",
		quality: "min",
		quality7: "m7",
		fn: "subdominant",
		hint: "Pre-dominant. Soft step toward V."
	},
	{
		roman: "iii",
		roman7: "iii7",
		quality: "min",
		quality7: "m7",
		fn: "mediant",
		hint: "Shares two notes with I — a colour change, not a move."
	},
	{
		roman: "IV",
		roman7: "IVmaj7",
		quality: "maj",
		quality7: "maj7",
		fn: "subdominant",
		hint: "Lift away from home. Often the first place a song goes."
	},
	{
		roman: "V",
		roman7: "V7",
		quality: "maj",
		quality7: "7",
		fn: "dominant",
		hint: "Has the leading tone. Gravity toward I."
	},
	{
		roman: "vi",
		roman7: "vi7",
		quality: "min",
		quality7: "m7",
		fn: "tonic",
		hint: "Relative minor. Same notes as I, darker center of gravity."
	},
	{
		roman: "vii°",
		roman7: "viiø7",
		quality: "dim",
		quality7: "m7b5",
		fn: "leading",
		hint: "Unstable. Almost always a doorway back to I."
	}
];
var MINOR_DEGREES = [
	{
		roman: "i",
		roman7: "i7",
		quality: "min",
		quality7: "m7",
		fn: "tonic",
		hint: "Home in minor. Heavier than I, same job."
	},
	{
		roman: "ii°",
		roman7: "iiø7",
		quality: "dim",
		quality7: "m7b5",
		fn: "subdominant",
		hint: "Points at V. The jazz ii in a minor ii–V–i."
	},
	{
		roman: "III",
		roman7: "IIImaj7",
		quality: "maj",
		quality7: "maj7",
		fn: "mediant",
		hint: "Relative major. The bright side of this key."
	},
	{
		roman: "iv",
		roman7: "iv7",
		quality: "min",
		quality7: "m7",
		fn: "subdominant",
		hint: "Minor subdominant. A deep step away from home."
	},
	{
		roman: "v",
		roman7: "v7",
		quality: "min",
		quality7: "m7",
		fn: "dominant",
		hint: "Natural minor dominant — weaker than V. Raise the third to make it pull."
	},
	{
		roman: "VI",
		roman7: "VImaj7",
		quality: "maj",
		quality7: "maj7",
		fn: "subdominant",
		hint: "Borrowed sunshine. Shares two notes with i."
	},
	{
		roman: "VII",
		roman7: "VII7",
		quality: "maj",
		quality7: "7",
		fn: "dominant",
		hint: "Mixolydian flavour from the flat seventh of the key."
	}
];
var PROGRESSIONS = [
	{
		id: "axis",
		name: "I–V–vi–IV",
		numerals: [
			"I",
			"V",
			"vi",
			"IV"
		],
		mode: "major",
		blurb: "The four-chord loop behind a thousand pop songs."
	},
	{
		id: "sensitive",
		name: "vi–IV–I–V",
		numerals: [
			"vi",
			"IV",
			"I",
			"V"
		],
		mode: "major",
		blurb: "Same four chords, starting on the relative minor. A sadder door into the same room."
	},
	{
		id: "fifties",
		name: "I–vi–IV–V",
		numerals: [
			"I",
			"vi",
			"IV",
			"V"
		],
		mode: "major",
		blurb: "Doo-wop changes. The 6 is a neighbour, not a new key."
	},
	{
		id: "folk",
		name: "I–IV–V",
		numerals: [
			"I",
			"IV",
			"V"
		],
		mode: "major",
		blurb: "Folk, country, hymns. Three functions, the whole map."
	},
	{
		id: "twofive",
		name: "ii–V–I",
		numerals: [
			"ii",
			"V",
			"I"
		],
		mode: "major",
		blurb: "Jazz cadence. ii prepares V; V delivers I."
	},
	{
		id: "twofive7",
		name: "ii7–V7–Imaj7",
		numerals: [
			"ii7",
			"V7",
			"Imaj7"
		],
		mode: "major",
		blurb: "The same cadence with sevenths — how standards actually move."
	},
	{
		id: "mixo",
		name: "I–bVII–IV",
		numerals: [
			"I",
			"bVII",
			"IV"
		],
		mode: "major",
		blurb: "Rock mixolydian. The bVII is a whole step below I — no leading tone, just weight."
	},
	{
		id: "creep",
		name: "I–III–IV–iv",
		numerals: [
			"I",
			"III",
			"IV",
			"iv"
		],
		mode: "major",
		blurb: "Chromatic lift, then a minor-plagal sigh. The iv is borrowed from parallel minor."
	},
	{
		id: "blues",
		name: "12-bar skeleton",
		numerals: [
			"I7",
			"I7",
			"I7",
			"I7",
			"IV7",
			"IV7",
			"I7",
			"I7",
			"V7",
			"IV7",
			"I7",
			"V7"
		],
		mode: "any",
		blurb: "Each chord is dominant. The I7 is already restless — that’s the blues."
	},
	{
		id: "andlus",
		name: "Andalusian",
		numerals: [
			"i",
			"VII",
			"VI",
			"V"
		],
		mode: "minor",
		blurb: "Descending minor tetrachord. Flamenco, baroque, and a lot of rock in A minor."
	},
	{
		id: "mincad",
		name: "iiø–V–i",
		numerals: [
			"iiø7",
			"V7",
			"i"
		],
		mode: "minor",
		blurb: "Minor jazz cadence. Raise the third of v to V so the leading tone appears."
	},
	{
		id: "aeolian",
		name: "i–VI–III–VII",
		numerals: [
			"i",
			"VI",
			"III",
			"VII"
		],
		mode: "minor",
		blurb: "Natural minor loop. No raised leading tone — it doesn’t need to resolve, it orbits."
	}
];
var FIFTHS = [
	0,
	7,
	2,
	9,
	4,
	11,
	6,
	1,
	8,
	3,
	10,
	5
];
var FN_LABEL = {
	tonic: "Tonic",
	subdominant: "Subdominant",
	dominant: "Dominant",
	mediant: "Mediant",
	leading: "Leading"
};
var T = [
	{
		caged: "E",
		quality: "maj",
		openRootPc: 4,
		frets: [
			0,
			2,
			2,
			1,
			0,
			0
		],
		fingers: [
			0,
			2,
			3,
			1,
			0,
			0
		]
	},
	{
		caged: "E",
		quality: "min",
		openRootPc: 4,
		frets: [
			0,
			2,
			2,
			0,
			0,
			0
		],
		fingers: [
			0,
			2,
			3,
			0,
			0,
			0
		]
	},
	{
		caged: "E",
		quality: "7",
		openRootPc: 4,
		frets: [
			0,
			2,
			0,
			1,
			0,
			0
		],
		fingers: [
			0,
			2,
			0,
			1,
			0,
			0
		]
	},
	{
		caged: "E",
		quality: "maj7",
		openRootPc: 4,
		frets: [
			0,
			2,
			1,
			1,
			0,
			0
		],
		fingers: [
			0,
			2,
			1,
			1,
			0,
			0
		]
	},
	{
		caged: "E",
		quality: "m7",
		openRootPc: 4,
		frets: [
			0,
			2,
			0,
			0,
			0,
			0
		],
		fingers: [
			0,
			2,
			0,
			0,
			0,
			0
		]
	},
	{
		caged: "E",
		quality: "sus4",
		openRootPc: 4,
		frets: [
			0,
			2,
			2,
			2,
			0,
			0
		],
		fingers: [
			0,
			2,
			3,
			4,
			0,
			0
		]
	},
	{
		caged: "E",
		quality: "6",
		openRootPc: 4,
		frets: [
			0,
			2,
			2,
			1,
			2,
			0
		],
		fingers: [
			0,
			2,
			3,
			1,
			4,
			0
		]
	},
	{
		caged: "E",
		quality: "m6",
		openRootPc: 4,
		frets: [
			0,
			2,
			2,
			0,
			2,
			0
		],
		fingers: [
			0,
			2,
			3,
			0,
			4,
			0
		]
	},
	{
		caged: "E",
		quality: "add9",
		openRootPc: 4,
		frets: [
			0,
			2,
			2,
			1,
			0,
			2
		],
		fingers: [
			0,
			2,
			3,
			1,
			0,
			4
		]
	},
	{
		caged: "E",
		quality: "9",
		openRootPc: 4,
		frets: [
			0,
			2,
			0,
			1,
			0,
			2
		],
		fingers: [
			0,
			2,
			0,
			1,
			0,
			4
		]
	},
	{
		caged: "E",
		quality: "aug",
		openRootPc: 4,
		frets: [
			0,
			3,
			2,
			1,
			1,
			0
		],
		fingers: [
			0,
			4,
			3,
			1,
			2,
			0
		]
	},
	{
		caged: "E",
		quality: "dim",
		openRootPc: 4,
		frets: [
			0,
			1,
			2,
			0,
			2,
			0
		],
		fingers: [
			0,
			1,
			3,
			0,
			4,
			0
		]
	},
	{
		caged: "E",
		quality: "m7b5",
		openRootPc: 4,
		frets: [
			0,
			1,
			2,
			0,
			3,
			0
		],
		fingers: [
			0,
			1,
			2,
			0,
			4,
			0
		]
	},
	{
		caged: "E",
		quality: "dim7",
		openRootPc: 4,
		frets: [
			0,
			1,
			2,
			0,
			2,
			0
		],
		fingers: [
			0,
			1,
			3,
			0,
			4,
			0
		]
	},
	{
		caged: "A",
		quality: "maj",
		openRootPc: 9,
		frets: [
			null,
			0,
			2,
			2,
			2,
			0
		],
		fingers: [
			null,
			0,
			1,
			2,
			3,
			0
		]
	},
	{
		caged: "A",
		quality: "min",
		openRootPc: 9,
		frets: [
			null,
			0,
			2,
			2,
			1,
			0
		],
		fingers: [
			null,
			0,
			2,
			3,
			1,
			0
		]
	},
	{
		caged: "A",
		quality: "7",
		openRootPc: 9,
		frets: [
			null,
			0,
			2,
			0,
			2,
			0
		],
		fingers: [
			null,
			0,
			1,
			0,
			2,
			0
		]
	},
	{
		caged: "A",
		quality: "maj7",
		openRootPc: 9,
		frets: [
			null,
			0,
			2,
			1,
			2,
			0
		],
		fingers: [
			null,
			0,
			2,
			1,
			3,
			0
		]
	},
	{
		caged: "A",
		quality: "m7",
		openRootPc: 9,
		frets: [
			null,
			0,
			2,
			0,
			1,
			0
		],
		fingers: [
			null,
			0,
			2,
			0,
			1,
			0
		]
	},
	{
		caged: "A",
		quality: "sus2",
		openRootPc: 9,
		frets: [
			null,
			0,
			2,
			2,
			0,
			0
		],
		fingers: [
			null,
			0,
			1,
			2,
			0,
			0
		]
	},
	{
		caged: "A",
		quality: "sus4",
		openRootPc: 9,
		frets: [
			null,
			0,
			2,
			2,
			3,
			0
		],
		fingers: [
			null,
			0,
			1,
			2,
			3,
			0
		]
	},
	{
		caged: "A",
		quality: "6",
		openRootPc: 9,
		frets: [
			null,
			0,
			2,
			2,
			2,
			2
		],
		fingers: [
			null,
			0,
			1,
			2,
			3,
			4
		]
	},
	{
		caged: "A",
		quality: "add9",
		openRootPc: 9,
		frets: [
			null,
			0,
			2,
			4,
			2,
			0
		],
		fingers: [
			null,
			0,
			1,
			3,
			2,
			0
		]
	},
	{
		caged: "A",
		quality: "9",
		openRootPc: 9,
		frets: [
			null,
			0,
			2,
			4,
			2,
			3
		],
		fingers: [
			null,
			0,
			1,
			4,
			2,
			3
		]
	},
	{
		caged: "A",
		quality: "dim",
		openRootPc: 9,
		frets: [
			null,
			0,
			1,
			2,
			1,
			null
		],
		fingers: [
			null,
			0,
			1,
			3,
			2,
			null
		]
	},
	{
		caged: "A",
		quality: "aug",
		openRootPc: 9,
		frets: [
			null,
			0,
			3,
			2,
			2,
			1
		],
		fingers: [
			null,
			0,
			4,
			2,
			3,
			1
		]
	},
	{
		caged: "A",
		quality: "m7b5",
		openRootPc: 9,
		frets: [
			null,
			0,
			1,
			0,
			1,
			3
		],
		fingers: [
			null,
			0,
			1,
			0,
			2,
			4
		]
	},
	{
		caged: "D",
		quality: "maj",
		openRootPc: 2,
		frets: [
			null,
			null,
			0,
			2,
			3,
			2
		],
		fingers: [
			null,
			null,
			0,
			1,
			3,
			2
		]
	},
	{
		caged: "D",
		quality: "min",
		openRootPc: 2,
		frets: [
			null,
			null,
			0,
			2,
			3,
			1
		],
		fingers: [
			null,
			null,
			0,
			2,
			3,
			1
		]
	},
	{
		caged: "D",
		quality: "7",
		openRootPc: 2,
		frets: [
			null,
			null,
			0,
			2,
			1,
			2
		],
		fingers: [
			null,
			null,
			0,
			2,
			1,
			3
		]
	},
	{
		caged: "D",
		quality: "maj7",
		openRootPc: 2,
		frets: [
			null,
			null,
			0,
			2,
			2,
			2
		],
		fingers: [
			null,
			null,
			0,
			1,
			1,
			1
		]
	},
	{
		caged: "D",
		quality: "m7",
		openRootPc: 2,
		frets: [
			null,
			null,
			0,
			2,
			1,
			1
		],
		fingers: [
			null,
			null,
			0,
			2,
			1,
			1
		]
	},
	{
		caged: "D",
		quality: "sus2",
		openRootPc: 2,
		frets: [
			null,
			null,
			0,
			2,
			3,
			0
		],
		fingers: [
			null,
			null,
			0,
			1,
			2,
			0
		]
	},
	{
		caged: "D",
		quality: "sus4",
		openRootPc: 2,
		frets: [
			null,
			null,
			0,
			2,
			3,
			3
		],
		fingers: [
			null,
			null,
			0,
			1,
			2,
			3
		]
	},
	{
		caged: "D",
		quality: "6",
		openRootPc: 2,
		frets: [
			null,
			null,
			0,
			2,
			0,
			2
		],
		fingers: [
			null,
			null,
			0,
			1,
			0,
			2
		]
	},
	{
		caged: "D",
		quality: "add9",
		openRootPc: 2,
		frets: [
			null,
			null,
			0,
			2,
			3,
			0
		],
		fingers: [
			null,
			null,
			0,
			1,
			2,
			0
		]
	},
	{
		caged: "C",
		quality: "maj",
		openRootPc: 0,
		frets: [
			null,
			3,
			2,
			0,
			1,
			0
		],
		fingers: [
			null,
			3,
			2,
			0,
			1,
			0
		]
	},
	{
		caged: "C",
		quality: "min",
		openRootPc: 0,
		frets: [
			null,
			3,
			1,
			0,
			1,
			null
		],
		fingers: [
			null,
			4,
			2,
			0,
			1,
			null
		]
	},
	{
		caged: "C",
		quality: "7",
		openRootPc: 0,
		frets: [
			null,
			3,
			2,
			3,
			1,
			0
		],
		fingers: [
			null,
			3,
			2,
			4,
			1,
			0
		]
	},
	{
		caged: "C",
		quality: "maj7",
		openRootPc: 0,
		frets: [
			null,
			3,
			2,
			0,
			0,
			0
		],
		fingers: [
			null,
			3,
			2,
			0,
			0,
			0
		]
	},
	{
		caged: "C",
		quality: "m7",
		openRootPc: 0,
		frets: [
			null,
			3,
			1,
			3,
			1,
			null
		],
		fingers: [
			null,
			3,
			1,
			4,
			1,
			null
		]
	},
	{
		caged: "G",
		quality: "maj",
		openRootPc: 7,
		frets: [
			3,
			2,
			0,
			0,
			0,
			3
		],
		fingers: [
			2,
			1,
			0,
			0,
			0,
			3
		]
	},
	{
		caged: "G",
		quality: "min",
		openRootPc: 7,
		frets: [
			3,
			1,
			0,
			0,
			3,
			3
		],
		fingers: [
			2,
			1,
			0,
			0,
			3,
			4
		]
	},
	{
		caged: "G",
		quality: "7",
		openRootPc: 7,
		frets: [
			3,
			2,
			0,
			0,
			0,
			1
		],
		fingers: [
			3,
			2,
			0,
			0,
			0,
			1
		]
	},
	{
		caged: "G",
		quality: "m7",
		openRootPc: 7,
		frets: [
			3,
			1,
			0,
			0,
			3,
			1
		],
		fingers: [
			3,
			1,
			0,
			0,
			4,
			1
		]
	}
];
var TRIAD_FALLBACK = {
	"7": "maj",
	maj7: "maj",
	"6": "maj",
	add9: "maj",
	"9": "maj",
	m7: "min",
	m6: "min",
	m7b5: "dim",
	dim7: "dim"
};
function qualityById(id) {
	return QUALITIES.find((q) => q.id === id) ?? QUALITIES[0];
}
function parseRoot(raw) {
	if (typeof raw === "string" && raw in NAME_TO_PC) return raw;
	return "C";
}
function parseQuality(raw) {
	if (typeof raw === "string" && QUALITIES.some((q) => q.id === raw)) return raw;
	return "maj";
}
function pcOf(name) {
	return NAME_TO_PC[name] ?? 0;
}
function useFlats(tonicPc, mode) {
	const majorPc = mode === "minor" ? (tonicPc + 3) % 12 : tonicPc;
	return majorPc === 5 || majorPc === 10 || majorPc === 3 || majorPc === 8;
}
function noteName(pc, flats = false) {
	const n = (pc % 12 + 12) % 12;
	return flats ? PC_FLAT[n] : PC_SHARP[n];
}
function chordPcs(rootPc, qualityId) {
	return qualityById(qualityId).ivs.map((iv) => (rootPc + iv % 12) % 12);
}
function chordLabel(rootPc, qualityId, flats = false) {
	return `${noteName(rootPc, flats)}${qualityById(qualityId).suffix}`;
}
function roleOfPc(rootPc, qualityId, pc) {
	const q = qualityById(qualityId);
	const iv = (pc - rootPc + 12) % 12;
	const idx = q.ivs.findIndex((x) => x % 12 === iv);
	if (idx < 0) return null;
	return q.formula[idx] ?? null;
}
function scalePcs(tonicPc, mode) {
	return (mode === "minor" ? MINOR_SCALE : MAJOR_SCALE).map((iv) => (tonicPc + iv) % 12);
}
function degreesFor(mode) {
	return mode === "minor" ? MINOR_DEGREES : MAJOR_DEGREES;
}
function diatonicChords(tonicPc, mode, sevenths = false) {
	const scale = scalePcs(tonicPc, mode);
	return degreesFor(mode).map((deg, i) => {
		const quality = sevenths ? deg.quality7 : deg.quality;
		const roman = sevenths ? deg.roman7 : deg.roman;
		const rootPc = scale[i];
		return {
			...deg,
			roman,
			quality,
			rootPc,
			label: chordLabel(rootPc, quality, useFlats(tonicPc, mode))
		};
	});
}
var ROMAN_RE = /^(b|#)?(VII|VI|IV|III|II|V|I|vii|vi|iv|iii|ii|v|i)(ø7|maj7|m7|dim7|dim|aug|7|°)?$/;
function parseNumeral(raw, keyPc, mode) {
	const m = raw.match(ROMAN_RE);
	if (!m) return {
		rootPc: keyPc,
		qualityId: "maj",
		numeral: raw,
		label: raw
	};
	const acc = m[1] ?? "";
	const rom = m[2];
	const suf = m[3] ?? "";
	const degree = {
		I: 0,
		II: 1,
		III: 2,
		IV: 3,
		V: 4,
		VI: 5,
		VII: 6
	}[rom.toUpperCase()] ?? 0;
	let rootPc = (keyPc + (mode === "minor" ? MINOR_SCALE : MAJOR_SCALE)[degree]) % 12;
	if (acc === "b") rootPc = (rootPc + 11) % 12;
	if (acc === "#") rootPc = (rootPc + 1) % 12;
	const upper = rom[0] === rom[0].toUpperCase() && rom[0] !== rom[0].toLowerCase();
	let qualityId = "maj";
	if (suf === "°" || suf === "dim") qualityId = "dim";
	else if (suf === "ø7") qualityId = "m7b5";
	else if (suf === "maj7") qualityId = "maj7";
	else if (suf === "m7") qualityId = "m7";
	else if (suf === "dim7") qualityId = "dim7";
	else if (suf === "aug") qualityId = "aug";
	else if (suf === "7") qualityId = upper ? "7" : rom.toUpperCase() === "VII" ? "m7b5" : "m7";
	else if (!upper) qualityId = "min";
	const flats = useFlats(keyPc, mode);
	return {
		rootPc,
		qualityId,
		numeral: raw,
		label: chordLabel(rootPc, qualityId, flats)
	};
}
function transposeTemplate(t, targetPc) {
	const offset = (targetPc - t.openRootPc + 12) % 12;
	const frets = t.frets.map((f) => f == null ? null : f + offset);
	const played = frets.filter((f) => f != null);
	if (played.length < 3) return null;
	const maxF = Math.max(...played);
	if (maxF > 15) return null;
	if (maxF - Math.min(...played) > 5) return null;
	const fingers = t.fingers.map((fin, i) => {
		if (frets[i] == null) return null;
		if (offset === 0) return fin;
		if (fin == null) return null;
		if (fin === 0) return 1;
		return Math.min(4, fin + 1);
	});
	const notes = [];
	const openPcs = [
		4,
		9,
		2,
		7,
		11,
		4
	];
	frets.forEach((f, i) => {
		if (f == null) return;
		notes.push(noteName((openPcs[i] + f) % 12, false));
	});
	return {
		id: `${t.caged}-${offset}-${t.quality}`,
		name: `${chordLabel(targetPc, t.quality)} · ${t.caged} shape`,
		frets,
		fingers,
		notes
	};
}
function templatesForQuality(qualityId) {
	const direct = T.filter((t) => t.quality === qualityId);
	if (direct.length) return direct;
	const fb = TRIAD_FALLBACK[qualityId];
	if (fb) return T.filter((t) => t.quality === fb);
	return T.filter((t) => t.quality === "maj");
}
function listVoicings(rootPc, qualityId) {
	const tpls = templatesForQuality(qualityId);
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const t of tpls) {
		const shape = transposeTemplate(t, rootPc);
		if (!shape) continue;
		const key = shape.frets.map((f) => f == null ? "x" : f).join("-");
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(shape);
	}
	out.sort((a, b) => {
		return Math.min(...a.frets.filter((f) => f != null && f > 0), 99) - Math.min(...b.frets.filter((f) => f != null && f > 0), 99);
	});
	return out.slice(0, 5);
}
function cagedShapes(rootPc, qualityId) {
	const want = qualityId === "min" || qualityId === "m7" || qualityId === "m6" ? "min" : "maj";
	return [
		"C",
		"A",
		"G",
		"E",
		"D"
	].map((caged) => {
		const t = T.find((x) => x.caged === caged && x.quality === want);
		if (!t) return null;
		const shape = transposeTemplate(t, rootPc);
		if (!shape) return null;
		return {
			caged,
			offset: (rootPc - t.openRootPc + 12) % 12,
			shape
		};
	}).filter((x) => x != null);
}
function voicingFreqs(shape) {
	return shape.frets.map((f, i) => f == null ? null : fretToFreq(i, f)).filter((f) => f != null);
}
function fretNote(stringIndex, fret, flats = false) {
	const pc = ([
		4,
		9,
		2,
		7,
		11,
		4
	][stringIndex] + fret) % 12;
	return {
		pc,
		name: noteName(pc, flats),
		freq: fretToFreq(stringIndex, fret)
	};
}
function fretNoteOn(openPc, openFreq, stringIndex, fret, flats = false) {
	const pc = ((openPc[stringIndex] ?? 0) + fret) % 12;
	const base = openFreq[stringIndex] ?? 110;
	return {
		pc,
		name: noteName(pc, flats),
		freq: base * Math.pow(2, fret / 12)
	};
}
/** Closest chord-tone-per-string shape for uke/bass necks. */
function neckVoicing(openPc, pcs, maxFret = 5) {
	const set = new Set(pcs.map((p) => (p % 12 + 12) % 12));
	return openPc.map((open) => {
		for (let f = 0; f <= maxFret; f++) if (set.has((open + f) % 12)) return f;
		return null;
	});
}
function chordMidis(rootPc, qualityId, rootMidi = 60) {
	const q = qualityById(qualityId);
	const root = rootMidi + (rootPc % 12 + 12) % 12;
	return q.ivs.map((iv) => root + iv);
}
var STRING_LABELS = STRING_NAMES;
function parseTab(raw) {
	if (raw === "key" || raw === "changes" || raw === "caged" || raw === "build") return raw;
	return "build";
}
function parseMode(raw) {
	return raw === "minor" ? "minor" : "major";
}
var DEFAULT_THEORY_SEARCH = {
	tab: "build",
	root: "C",
	q: "maj",
	key: "C",
	mode: "major"
};
//#endregion
export { fretToFreq as $, voicingFreqs as A, buildTimeline as B, parseRoot as C, weekPulse as Ct, roleOfPc as D, qualityById as E, OPEN_FREQ as F, comboCue as G, closingCopy as H, PIANO_VOICINGS as I, currentItem as J, consumeHit as K, PROCESS_LABEL as L, CHECKINS as M, CHORDS as N, scalePcs as O, INSTRUMENTS as P, formatFocus as Q, STRING_NAMES as R, parseQuality as S, useSpark as St, pcOf as T, xpProgress as Tt, cn as U, chordsFromCreatePick as V, coachCue as W, defaultProgress as X, dayCue as Y, feelCue as Z, listVoicings as _, streakTone as _t, INTERVAL_INFO as a, itemCloseCopy as at, parseMode as b, summarizeItem as bt, QUALITIES as c, markById as ct, chordLabel as d, patternInWords as dt, howYouPlay as et, chordMidis as f, rankFor as ft, fretNoteOn as g, sparksFor as gt, fretNote as h, roleLabel as ht, FN_LABEL as i, isUnlockedFor as it, AUTO_ADVANCE_MS as j, useFlats as k, STRING_LABELS as l, midiToFreq as lt, diatonicChords as m, rhythmRead as mt, DEFAULT_THEORY_SEARCH as n, isComboGate as nt, PICKER_ROOTS as o, lessonsFor as ot, chordPcs as p, refineLine as pt, countInBeats as q, FIFTHS as r, isSessionDone as rt, PROGRESSIONS as s, localDayKey as st, router_exports as t, instrumentById as tt, cagedShapes as u, newThingLine as ut, neckVoicing as v, stringFreq as vt, parseTab as w, whyThisPiece as wt, parseNumeral as x, tracksFor as xt, noteName as y, successLine as yt, UKE_CHORDS as z };
