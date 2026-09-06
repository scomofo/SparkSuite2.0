import type { InstrumentId } from "./instruments.ts";

export type LabSearch = { tab: string; chord: string; lesson?: string };

export function labSearchFor(id: InstrumentId): LabSearch {
  switch (id) {
    case "bass":
      return { tab: "alt", chord: "Em" };
    case "drums":
      return { tab: "kick", chord: "" };
    case "piano":
      return { tab: "middlec", chord: "C" };
    case "ukulele":
      return { tab: "down", chord: "C" };
    case "vocals":
      return { tab: "drone", chord: "C" };
    default:
      return { tab: "down", chord: "Em" };
  }
}

export function usesTechLab(id: InstrumentId) {
  return id !== "guitar";
}

export type LabCard = {
  kicker: string;
  title: string;
  body: string;
  cta: string;
};

export function labCardFor(id: InstrumentId): LabCard | null {
  switch (id) {
    case "bass":
      return {
        kicker: "Bass lab",
        title: "Fingerstyle",
        body: "Alternating fingers, ghosts, thumb, rakes, hammer-ons. Four minutes. Then stop.",
        cta: "Four minutes",
      };
    case "drums":
      return {
        kicker: "Drums lab",
        title: "Groove",
        body: "Kick names one. Snare answers on two and four. Hats are the clock. Four minutes. Then stop.",
        cta: "Four minutes",
      };
    case "piano":
      return {
        kicker: "Piano lab",
        title: "Hands",
        body: "Find C, build a triad, invert it, feel G pull you home. Four minutes. Then stop.",
        cta: "Four minutes",
      };
    case "ukulele":
      return {
        kicker: "Ukulele lab",
        title: "Strum",
        body: "Downstrokes, island strum, chunks, fingerpicking. Four minutes. Then stop.",
        cta: "Four minutes",
      };
    case "vocals":
      return {
        kicker: "Voice lab",
        title: "Breath",
        body: "Match a C, hold it four beats, step to a neighbor. Four minutes. Then stop.",
        cta: "Four minutes",
      };
    default:
      return null;
  }
}
