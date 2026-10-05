import { getCtx, pianoTone, scheduleRun } from "./audio.ts";

const ONSETS = [
  [0, 1, 2, 3],
  [0, 1, 1.5, 2, 3],
  [0, 1, 2, 3],
  [0, 1, 1.5, 2],
];

export function sharedPhrasePattern({ slow = false, oneBar = false } = {}) {
  const bars = oneBar ? [ONSETS[1]] : ONSETS;
  return {
    beat: 60 / (slow ? 48 : 72),
    beats: bars.length * 4,
    onsets: bars.flatMap((bar, index) => bar.map((offset) => index * 4 + offset)),
  };
}

export function playSharedPhrase({ beat, onsets }: ReturnType<typeof sharedPhrasePattern>) {
  return scheduleRun(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const start = ctx.currentTime;
    onsets.forEach((onset, index) => {
      // Separate the paired eighth notes, and release beat 3 before the final rest.
      const gap = Math.min(1, (onsets[index + 1] ?? onset + 1) - onset);
      pianoTone(261.63, start + onset * beat, 0.22, gap * beat * 0.9);
    });
  });
}
