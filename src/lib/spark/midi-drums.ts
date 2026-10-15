/**
 * General MIDI drum map → SparkSuite drum pads.
 *
 * Electronic kits send drum hits as MIDI notes, almost always on the
 * General MIDI percussion map. This translates those note numbers to the
 * app's four pads (0 kick, 1 snare, 2 hat, 3 tom — the same indices
 * `drumHit` and `DrumPads` use). Anything unmapped returns null so callers
 * can ignore it.
 *
 * Crash (49) and ride (51) have no dedicated voice in the kit; they land on
 * the hat pad, the closest cymbal sound available.
 */
export function gmNoteToPad(note: number): 0 | 1 | 2 | 3 | null {
  switch (note) {
    case 36: // Bass Drum 1
      return 0;
    case 38: // Acoustic Snare
    case 40: // Electric Snare (snare rim on many kits)
      return 1;
    case 42: // Closed Hi-Hat
    case 44: // Pedal Hi-Hat
    case 46: // Open Hi-Hat
    case 49: // Crash Cymbal 1 → hat voice (no crash in the kit)
    case 51: // Ride Cymbal 1 → hat voice (no ride in the kit)
      return 2;
    case 41: // Low Floor Tom
    case 43: // High Floor Tom
    case 45: // Low Tom
    case 47: // Low-Mid Tom
    case 48: // Hi-Mid Tom
    case 50: // High Tom
      return 3;
    default:
      return null;
  }
}
