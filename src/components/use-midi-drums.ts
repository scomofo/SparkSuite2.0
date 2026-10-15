import { useEffect, useRef, useState } from "react";
import { gmNoteToPad } from "@/lib/spark/midi-drums";

export type MidiKitStatus = "off" | "on" | "no-device" | "denied" | "unavailable";

/**
 * Opt-in MIDI input for drums sessions. Does nothing until `toggle` turns it
 * on; then it listens to every connected MIDI input and forwards kit hits
 * (GM drum map, see midi-drums.ts) to `onPad`. Playing along only — hits are
 * never scored or judged. Hot-plug is handled through the access
 * `statechange` event; everything detaches on toggle-off and unmount.
 */
export function useMidiDrums(onPad: (pad: number) => void): {
  supported: boolean;
  status: MidiKitStatus;
  toggle: () => void;
} {
  const [supported] = useState(
    () => typeof navigator !== "undefined" && typeof navigator.requestMIDIAccess === "function",
  );
  const [status, setStatus] = useState<MidiKitStatus>("off");
  const onPadRef = useRef(onPad);
  onPadRef.current = onPad;
  const accessRef = useRef<MIDIAccess | null>(null);
  const onRef = useRef(false);

  const detach = () => {
    const access = accessRef.current;
    if (!access) return;
    access.inputs.forEach((input) => {
      input.onmidimessage = null;
    });
    access.onstatechange = null;
    accessRef.current = null;
  };

  useEffect(
    () => () => {
      onRef.current = false;
      detach();
    },
    [],
  );

  const toggle = () => {
    if (onRef.current) {
      onRef.current = false;
      detach();
      setStatus("off");
      return;
    }
    if (!supported) {
      setStatus("unavailable");
      return;
    }
    onRef.current = true;
    navigator
      .requestMIDIAccess()
      .then((access) => {
        if (!onRef.current) return;
        accessRef.current = access;
        const attach = () => {
          access.inputs.forEach((input) => {
            input.onmidimessage = (event) => {
              const data = event.data;
              if (!data || data.length < 3) return;
              // Note-on only (0x90 with velocity); note-offs are ignored.
              if ((data[0] & 0xf0) !== 0x90 || data[2] === 0) return;
              const pad = gmNoteToPad(data[1]);
              if (pad !== null) onPadRef.current(pad);
            };
          });
          setStatus(access.inputs.size > 0 ? "on" : "no-device");
        };
        attach();
        access.onstatechange = attach;
      })
      .catch(() => {
        if (!onRef.current) return;
        onRef.current = false;
        setStatus("denied");
      });
  };

  return { supported, status, toggle };
}
