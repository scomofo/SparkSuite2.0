//#region node_modules/.nitro/vite/services/ssr/assets/audio-DIq8nkMh.js
/** Web Audio guitar pluck + metronome. Unlock on first gesture. */
var ctx = null;
var master = null;
var sfx = null;
var music = null;
var visibilityBound = false;
function bindVisibility() {
	if (visibilityBound || typeof document === "undefined") return;
	visibilityBound = true;
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible") resumeIfNeeded();
	});
}
function unlockAudio() {
	if (!ctx) {
		ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
		master = ctx.createGain();
		sfx = ctx.createGain();
		music = ctx.createGain();
		sfx.gain.value = .9;
		music.gain.value = .7;
		master.gain.value = .85;
		sfx.connect(master);
		music.connect(master);
		master.connect(ctx.destination);
	}
	if (ctx.state === "suspended") ctx.resume();
	bindVisibility();
	return ctx;
}
function noiseBuffer(length) {
	if (!ctx) return null;
	const buf = ctx.createBuffer(1, length, ctx.sampleRate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
	return buf;
}
/** Karplus–Strong-ish pluck at `freq` Hz. */
function pluck(freq, when, gain = .45) {
	const ac = unlockAudio();
	if (!sfx) return;
	const t = when ?? ac.currentTime;
	const burst = noiseBuffer(Math.max(20, Math.round(ac.sampleRate / freq)));
	if (!burst) return;
	const src = ac.createBufferSource();
	src.buffer = burst;
	const comb = ac.createDelay();
	comb.delayTime.value = 1 / freq;
	const fb = ac.createGain();
	fb.gain.value = .96;
	const lp = ac.createBiquadFilter();
	lp.type = "lowpass";
	lp.frequency.value = Math.min(4200, freq * 8);
	const g = ac.createGain();
	g.gain.setValueAtTime(gain, t);
	g.gain.exponentialRampToValueAtTime(8e-4, t + 1.6);
	src.connect(comb);
	comb.connect(fb);
	fb.connect(lp);
	lp.connect(comb);
	lp.connect(g);
	g.connect(sfx);
	src.start(t);
	src.stop(t + .04);
}
function strum(freqs, when) {
	const ac = unlockAudio();
	const t = when ?? ac.currentTime;
	freqs.forEach((f, i) => pluck(f, t + i * .012, .32));
}
function strumUp(freqs, when) {
	const ac = unlockAudio();
	const t = when ?? ac.currentTime;
	[...freqs].reverse().forEach((f, i) => pluck(f, t + i * .01, .26));
}
/** Soft piano-like tone (sine + quiet odd harmonic). */
function pianoTone(freq, when, gain = .28) {
	const ac = unlockAudio();
	if (!sfx) return;
	const t = when ?? ac.currentTime;
	const g = ac.createGain();
	g.gain.setValueAtTime(gain, t);
	g.gain.exponentialRampToValueAtTime(8e-4, t + 1.4);
	g.connect(sfx);
	[
		1,
		2,
		3
	].forEach((h, i) => {
		const o = ac.createOscillator();
		o.type = i === 0 ? "sine" : "triangle";
		o.frequency.value = freq * h;
		const hg = ac.createGain();
		hg.gain.value = i === 0 ? 1 : .18 / h;
		o.connect(hg);
		hg.connect(g);
		o.start(t);
		o.stop(t + 1.5);
	});
}
function pianoChord(freqs, when) {
	const ac = unlockAudio();
	const t = when ?? ac.currentTime;
	freqs.forEach((f, i) => pianoTone(f, t + i * .008, .2));
}
/** Longer piano tone for vocal holds. */
function pianoHold(freq, seconds = 4, when) {
	const ac = unlockAudio();
	if (!sfx) return;
	const t = when ?? ac.currentTime;
	const g = ac.createGain();
	g.gain.setValueAtTime(.001, t);
	g.gain.exponentialRampToValueAtTime(.22, t + .08);
	g.gain.setValueAtTime(.22, t + Math.max(.2, seconds - .4));
	g.gain.exponentialRampToValueAtTime(8e-4, t + seconds);
	g.connect(sfx);
	const o = ac.createOscillator();
	o.type = "sine";
	o.frequency.value = freq;
	o.connect(g);
	o.start(t);
	o.stop(t + seconds + .05);
}
/** Round bass note — sine floor, quiet octave, short click. */
function bassTone(freq, when, gain = .46) {
	const ac = unlockAudio();
	if (!sfx) return;
	const t = when ?? ac.currentTime;
	const g = ac.createGain();
	g.gain.setValueAtTime(gain, t);
	g.gain.exponentialRampToValueAtTime(8e-4, t + 1.9);
	const lp = ac.createBiquadFilter();
	lp.type = "lowpass";
	lp.frequency.value = Math.min(720, freq * 8);
	g.connect(lp);
	lp.connect(sfx);
	const fund = ac.createOscillator();
	fund.type = "sine";
	fund.frequency.value = freq;
	fund.connect(g);
	fund.start(t);
	fund.stop(t + 2);
	const h2 = ac.createOscillator();
	h2.type = "triangle";
	h2.frequency.value = freq * 2;
	const hg = ac.createGain();
	hg.gain.value = .14;
	h2.connect(hg);
	hg.connect(g);
	h2.start(t);
	h2.stop(t + 1.3);
	const burst = noiseBuffer(Math.max(24, Math.floor(ac.sampleRate * .01)));
	if (burst) {
		const src = ac.createBufferSource();
		src.buffer = burst;
		const cg = ac.createGain();
		cg.gain.setValueAtTime(.16, t);
		cg.gain.exponentialRampToValueAtTime(8e-4, t + .028);
		const clickLp = ac.createBiquadFilter();
		clickLp.type = "lowpass";
		clickLp.frequency.value = 380;
		src.connect(clickLp);
		clickLp.connect(cg);
		cg.connect(sfx);
		src.start(t);
		src.stop(t + .04);
	}
}
/** Hammer-on / pull-off — same pitch engine, no pick click, soft swell. */
function bassLegato(freq, when, gain = .4) {
	const ac = unlockAudio();
	if (!sfx) return;
	const t = when ?? ac.currentTime;
	const g = ac.createGain();
	g.gain.setValueAtTime(.001, t);
	g.gain.exponentialRampToValueAtTime(gain, t + .028);
	g.gain.exponentialRampToValueAtTime(8e-4, t + 1.35);
	const lp = ac.createBiquadFilter();
	lp.type = "lowpass";
	lp.frequency.value = Math.min(720, freq * 8);
	g.connect(lp);
	lp.connect(sfx);
	const fund = ac.createOscillator();
	fund.type = "sine";
	fund.frequency.value = freq;
	fund.connect(g);
	fund.start(t);
	fund.stop(t + 1.5);
	const h2 = ac.createOscillator();
	h2.type = "triangle";
	h2.frequency.value = freq * 2;
	const hg = ac.createGain();
	hg.gain.value = .12;
	h2.connect(hg);
	hg.connect(g);
	h2.start(t);
	h2.stop(t + 1.1);
}
/** Muted thud — no pitch. The space between notes. */
function ghostNote(when) {
	const ac = unlockAudio();
	if (!sfx) return;
	const t = when ?? ac.currentTime;
	const burst = noiseBuffer(Math.floor(ac.sampleRate * .05));
	if (!burst) return;
	const src = ac.createBufferSource();
	src.buffer = burst;
	const lp = ac.createBiquadFilter();
	lp.type = "lowpass";
	lp.frequency.value = 220;
	const g = ac.createGain();
	g.gain.setValueAtTime(.28, t);
	g.gain.exponentialRampToValueAtTime(8e-4, t + .08);
	src.connect(lp);
	lp.connect(g);
	g.connect(sfx);
	src.start(t);
	src.stop(t + .09);
}
function kick(when) {
	const ac = unlockAudio();
	if (!sfx) return;
	const t = when ?? ac.currentTime;
	const o = ac.createOscillator();
	const g = ac.createGain();
	o.type = "sine";
	o.frequency.setValueAtTime(140, t);
	o.frequency.exponentialRampToValueAtTime(42, t + .18);
	g.gain.setValueAtTime(.7, t);
	g.gain.exponentialRampToValueAtTime(8e-4, t + .28);
	o.connect(g);
	g.connect(sfx);
	o.start(t);
	o.stop(t + .3);
}
function snare(when) {
	const ac = unlockAudio();
	if (!sfx) return;
	const t = when ?? ac.currentTime;
	const burst = noiseBuffer(Math.floor(ac.sampleRate * .12));
	if (!burst) return;
	const src = ac.createBufferSource();
	src.buffer = burst;
	const bp = ac.createBiquadFilter();
	bp.type = "bandpass";
	bp.frequency.value = 1800;
	const g = ac.createGain();
	g.gain.setValueAtTime(.45, t);
	g.gain.exponentialRampToValueAtTime(8e-4, t + .16);
	src.connect(bp);
	bp.connect(g);
	g.connect(sfx);
	src.start(t);
	src.stop(t + .18);
}
function hat(when) {
	const ac = unlockAudio();
	if (!sfx) return;
	const t = when ?? ac.currentTime;
	const burst = noiseBuffer(Math.floor(ac.sampleRate * .04));
	if (!burst) return;
	const src = ac.createBufferSource();
	src.buffer = burst;
	const hp = ac.createBiquadFilter();
	hp.type = "highpass";
	hp.frequency.value = 7e3;
	const g = ac.createGain();
	g.gain.setValueAtTime(.22, t);
	g.gain.exponentialRampToValueAtTime(8e-4, t + .05);
	src.connect(hp);
	hp.connect(g);
	g.connect(sfx);
	src.start(t);
	src.stop(t + .06);
}
function tom(when) {
	const ac = unlockAudio();
	if (!sfx) return;
	const t = when ?? ac.currentTime;
	const o = ac.createOscillator();
	const g = ac.createGain();
	o.type = "sine";
	o.frequency.setValueAtTime(220, t);
	o.frequency.exponentialRampToValueAtTime(110, t + .16);
	g.gain.setValueAtTime(.4, t);
	g.gain.exponentialRampToValueAtTime(8e-4, t + .22);
	o.connect(g);
	g.connect(sfx);
	o.start(t);
	o.stop(t + .24);
}
function drumHit(pad, when) {
	if (pad === 0) kick(when);
	else if (pad === 1) snare(when);
	else if (pad === 2) hat(when);
	else tom(when);
}
function click(accent, when) {
	const ac = unlockAudio();
	if (!sfx) return;
	const t = when ?? ac.currentTime;
	const o = ac.createOscillator();
	const g = ac.createGain();
	o.type = "square";
	o.frequency.value = accent ? 1320 : 880;
	g.gain.setValueAtTime(accent ? .12 : .06, t);
	g.gain.exponentialRampToValueAtTime(1e-4, t + .06);
	o.connect(g);
	g.connect(sfx);
	o.start(t);
	o.stop(t + .07);
}
function hitSfx(kind) {
	const ac = unlockAudio();
	if (!sfx) return;
	const t = ac.currentTime;
	if (kind === "miss") {
		const o = ac.createOscillator();
		const g = ac.createGain();
		o.type = "sawtooth";
		o.frequency.setValueAtTime(180, t);
		o.frequency.exponentialRampToValueAtTime(70, t + .12);
		g.gain.setValueAtTime(.08, t);
		g.gain.exponentialRampToValueAtTime(1e-4, t + .14);
		o.connect(g);
		g.connect(sfx);
		o.start(t);
		o.stop(t + .15);
		return;
	}
	const freq = kind === "perfect" ? 880 : kind === "good" ? 660 : 520;
	const o = ac.createOscillator();
	const g = ac.createGain();
	o.type = "sine";
	o.frequency.value = freq;
	g.gain.setValueAtTime(.07, t);
	g.gain.exponentialRampToValueAtTime(1e-4, t + .08);
	o.connect(g);
	g.connect(sfx);
	o.start(t);
	o.stop(t + .1);
}
function comboSting(combo) {
	const ac = unlockAudio();
	if (!sfx) return;
	const t = ac.currentTime;
	const root = combo >= 12 ? 523.25 : combo >= 8 ? 392 : 329.63;
	(combo >= 12 ? [
		0,
		4,
		7,
		12
	] : combo >= 8 ? [
		0,
		7,
		12
	] : [0, 7]).forEach((semi, i) => {
		const o = ac.createOscillator();
		const g = ac.createGain();
		o.type = "triangle";
		o.frequency.value = root * Math.pow(2, semi / 12);
		const at = t + i * .055;
		g.gain.setValueAtTime(1e-4, at);
		g.gain.exponentialRampToValueAtTime(.07, at + .02);
		g.gain.exponentialRampToValueAtTime(1e-4, at + .18);
		o.connect(g);
		g.connect(sfx);
		o.start(at);
		o.stop(at + .2);
	});
}
function markSting() {
	const ac = unlockAudio();
	if (!sfx) return;
	const t = ac.currentTime;
	[
		392,
		523.25,
		659.25
	].forEach((freq, i) => {
		const o = ac.createOscillator();
		const g = ac.createGain();
		o.type = "sine";
		o.frequency.value = freq;
		const at = t + i * .07;
		g.gain.setValueAtTime(.06, at);
		g.gain.exponentialRampToValueAtTime(1e-4, at + .22);
		o.connect(g);
		g.connect(sfx);
		o.start(at);
		o.stop(at + .24);
	});
}
function resumeIfNeeded() {
	if (ctx?.state === "suspended") ctx.resume();
}
//#endregion
export { drumHit as a, kick as c, pianoHold as d, pianoTone as f, unlockAudio as g, strumUp as h, comboSting as i, markSting as l, strum as m, bassTone as n, ghostNote as o, pluck as p, click as r, hitSfx as s, bassLegato as t, pianoChord as u };
