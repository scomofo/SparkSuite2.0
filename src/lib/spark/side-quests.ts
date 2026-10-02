import type { InstrumentId } from "./instruments.ts";
import type { LearningLevel } from "./curriculum.ts";

export type SideQuest = {
  id: string;
  instrument: InstrumentId;
  level: LearningLevel;
  title: string;
  purpose: string;
  challenge: string;
  listenFor: string;
};

type QuestSeed = Omit<SideQuest, "id" | "instrument">;
const q = (instrument: InstrumentId, seeds: QuestSeed[]): SideQuest[] =>
  seeds.map((seed) => ({ ...seed, id: `${instrument}-side-${seed.level}`, instrument }));

export const SIDE_QUESTS: SideQuest[] = [
  ...q("guitar", [
    { level: "foundations", title: "Find the same note twice", purpose: "Start seeing the neck as repeating musical geography, not six unrelated strings.", challenge: "Play open low E, then find another E on the guitar. Compare them without worrying about speed.", listenFor: "Same note name, different register and colour." },
    { level: "beginner", title: "Make one chord groove three ways", purpose: "Separate rhythm creativity from chord-changing difficulty.", challenge: "Stay on Em and invent three four-beat strums: sparse, steady eighths, and one with silence.", listenFor: "Which pattern makes your picking hand feel most automatic?" },
    { level: "intermediate", title: "Answer yourself", purpose: "Turn a scale pattern into a short question and answer.", challenge: "Play a tiny A-minor-pentatonic idea, leave a beat of space, then answer it with a changed ending.", listenFor: "A question, a breath, and an answer—not a scale run." },
    { level: "advanced", title: "Arrange by subtraction", purpose: "Learn that arrangement is often about removing material.", challenge: "Take an eight-bar idea and make a second version using fewer strums or fewer notes.", listenFor: "Whether the simpler version gives the important moments more weight." },
  ]),
  ...q("piano", [
    { level: "foundations", title: "Black-key landmarks", purpose: "Build instant keyboard orientation without memorizing every key independently.", challenge: "Close your eyes, land near the middle of the keyboard, then use the two-black/three-black pattern to find C and F.", listenFor: "How quickly your hands can re-orient after moving to a new octave." },
    { level: "beginner", title: "Melody over a held home", purpose: "Feel how a steady bass note changes the meaning of a melody.", challenge: "Hold a low C and improvise for one minute using only C, D, E, G, and A above it.", listenFor: "Which notes feel settled over C and which feel like they want to move." },
    { level: "intermediate", title: "Voice-leading detective", purpose: "Train your ear to notice the small motions hiding inside chord changes.", challenge: "Play C to F to G to C using close inversions. Name one note that stays or moves by step at each change.", listenFor: "Smooth inner motion rather than the chord names themselves." },
    { level: "advanced", title: "Reharmonize four bars", purpose: "Use harmony as an expressive choice instead of a theory label.", challenge: "Take a four-bar C-major melody and make two accompaniments: one plain, one using at least one seventh or secondary dominant.", listenFor: "Where the richer harmony changes expectation or emotional colour." },
  ]),
  ...q("ukulele", [
    { level: "foundations", title: "Hear the re-entrant string", purpose: "Notice what makes ukulele tuning sound different from a small guitar.", challenge: "Pick G-C-E-A slowly, then pick C-E-A-G. Notice that the first string you touched was not the lowest pitch.", listenFor: "The high G floating above the middle of the chord." },
    { level: "beginner", title: "Strum under an imaginary singer", purpose: "Make accompaniment leave room for a vocal line.", challenge: "Loop C-G-Am-F and deliberately make bar 1 busy, bar 2 sparse, then choose a pattern you could sing over.", listenFor: "Whether the strum supports the phrase or crowds it." },
    { level: "intermediate", title: "Chord-tone melody", purpose: "Connect chord shapes to melody notes.", challenge: "Hold C, F, and G shapes and find one top-string note in each shape that could form a three-note melody.", listenFor: "How the melody feels glued to the harmony because the notes come from the chords." },
    { level: "advanced", title: "Texture switch", purpose: "Create arrangement contrast without learning new chords.", challenge: "Play eight bars: first four with full strums, next four with only selected strings or single notes.", listenFor: "The moment the texture changes and the arrangement opens up." },
  ]),
  ...q("bass", [
    { level: "foundations", title: "One note, four lengths", purpose: "Learn that note length is part of bass rhythm.", challenge: "Play the same E on four beats, first letting each ring, then making every note short and separated.", listenFor: "How the groove changes even though pitch and tempo stay the same." },
    { level: "beginner", title: "Kick-drum shadow", purpose: "Build the habit of hearing bass as part of the rhythm section.", challenge: "Tap a kick pattern with your foot and play a root only when the foot lands. Then add one passing note.", listenFor: "Whether the bass still feels attached to the kick after the extra note appears." },
    { level: "intermediate", title: "Approach from above or below", purpose: "Make chord changes feel directed instead of mechanical.", challenge: "Before each new root, approach it once from a semitone below and once from a semitone above.", listenFor: "Which approach creates more pull into the downbeat." },
    { level: "advanced", title: "Serve the song with fewer notes", purpose: "Practise arranging from the bassist's point of view.", challenge: "Create two versions of the same progression: one active and one using only roots with deliberate note lengths.", listenFor: "Which version makes the imaginary singer or drummer feel more supported." },
  ]),
  ...q("drums", [
    { level: "foundations", title: "Find the backbeat in real music", purpose: "Connect the kit pattern to the music you already hear.", challenge: "Put on a familiar song and tap only where you think the snare lands for 30 seconds.", listenFor: "The repeated 2-and-4 feeling that makes the groove easy to clap with." },
    { level: "beginner", title: "One groove, three hi-hat feels", purpose: "Learn that feel can change while kick and snare stay fixed.", challenge: "Keep the same kick/snare pattern and play quarter-note hats, eighth-note hats, then leave the hats out.", listenFor: "How density changes energy without changing the backbeat." },
    { level: "intermediate", title: "Move one accent", purpose: "Hear how a tiny orchestration choice changes a groove.", challenge: "Play steady eighths and accent one different subdivision each bar.", listenFor: "Which accent makes the groove lean forward, settle back, or feel syncopated." },
    { level: "advanced", title: "Design a fill that lands", purpose: "Treat fills as transitions, not interruptions.", challenge: "Create a one-bar fill using only two drums and make beat 1 of the next bar unmistakable.", listenFor: "Whether the listener could still predict where the next downbeat arrives." },
  ]),
  ...q("vocals", [
    { level: "foundations", title: "Speak it before you sing it", purpose: "Separate rhythm and diction from pitch pressure.", challenge: "Speak a short lyric in time for four bars, then sing it on one comfortable note.", listenFor: "Whether the words stay clear when pitch is added." },
    { level: "beginner", title: "Three ways into one note", purpose: "Explore onset without forcing volume.", challenge: "Sing the same comfortable note with a gentle breathy start, a clean start, and a slightly firmer start—never pushing.", listenFor: "Which onset feels easiest and keeps the pitch most stable." },
    { level: "intermediate", title: "Harmony by listening sideways", purpose: "Develop independence from the main melody.", challenge: "Play or imagine a simple melody, then sustain one chord tone beneath each phrase instead of following every note.", listenFor: "When your note blends and when it rubs against the melody." },
    { level: "advanced", title: "Interpret one lyric three ways", purpose: "Use emphasis and timing to make a lyric’s meaning clear.", challenge: "Sing the same line three times: intimate, urgent, then restrained. Keep pitch and tempo roughly constant.", listenFor: "What changed through dynamics, consonants, timing, and breath rather than extra notes." },
  ]),
  ...q("mandolin", [
    { level: "foundations", title: "Let short notes be short", purpose: "Use the instrument's quick decay instead of fighting it.", challenge: "Pick one open course four times, alternating between letting it ring and stopping it cleanly.", listenFor: "The edge where a note ends—and how that ending becomes rhythm." },
    { level: "beginner", title: "Chop without squeezing", purpose: "Build rhythmic punctuation with relaxation.", challenge: "Hold a chord shape, strum on 2 and 4, and release pressure immediately after each hit without lifting away.", listenFor: "A short, dry chop with no extra ringing." },
    { level: "intermediate", title: "Cross-pick a chord", purpose: "Turn a held shape into a moving texture.", challenge: "Hold one chord and pick three neighboring courses in a repeating pattern for four bars.", listenFor: "Even volume and a pattern that keeps rolling through the bar line." },
    { level: "advanced", title: "Melody then chop", purpose: "Switch roles the way a mandolin often does in an ensemble.", challenge: "Play a two-bar melody, then two bars of backbeat chop over the same harmony.", listenFor: "A clear role change without the tempo moving." },
  ]),
  ...q("banjo", [
    { level: "foundations", title: "Hear the fifth-string drone", purpose: "Notice the sound that makes five-string banjo harmony distinctive.", challenge: "Pick the long strings slowly, then add the short fifth string between notes.", listenFor: "The high G staying present while the lower notes move beneath it." },
    { level: "beginner", title: "Accent inside the roll", purpose: "Make a roll phrase rather than merely repeat a picking pattern.", challenge: "Keep one forward roll going and make a different picked note slightly louder each bar.", listenFor: "A melody seeming to appear inside an unchanged roll." },
    { level: "intermediate", title: "Decorate one chord change", purpose: "Use a left-hand ornament as punctuation.", challenge: "Play a G-to-C change plain, then repeat it with one hammer-on or slide leading into the new chord.", listenFor: "Whether the ornament points toward the change instead of delaying it." },
    { level: "advanced", title: "Trade backup and lead", purpose: "Practise switching musical roles without losing time.", challenge: "Play two bars of quiet backup, two bars of a forward-roll break, then return to backup.", listenFor: "A clear change in foreground/background while the pulse stays identical." },
  ]),
  ...q("violin", [
    { level: "foundations", title: "Open-string tone lab", purpose: "Discover that bow contact changes tone before the left hand enters the problem.", challenge: "On open D, try three slow bows: nearer the fingerboard, middle lane, then slightly nearer the bridge.", listenFor: "Where the tone feels clearest without scratching or fading." },
    { level: "beginner", title: "Drone-check your finger", purpose: "Use resonance and beating to guide intonation.", challenge: "Let open D ring briefly, then play first-finger E several times from silence, adjusting by tiny amounts.", listenFor: "A repeatable E that stops sounding obviously high or low." },
    { level: "intermediate", title: "Bow-distribution experiment", purpose: "Use bow amount to shape a phrase while keeping its pulse steady.", challenge: "Play the same four notes once using equal bow, then again saving extra bow for the final note.", listenFor: "How the second version creates direction without changing pitch." },
    { level: "advanced", title: "Choose your fingering for a phrase", purpose: "Treat fingering and string choice as expressive decisions.", challenge: "Find two ways to play the same short phrase using different strings where possible.", listenFor: "Changes in colour, connection, and ease—not just correctness." },
  ]),
  ...q("lapsteel", [
    { level: "foundations", title: "Tune the bar with your ear", purpose: "Build the tiny correction habit that fretless bar playing needs.", challenge: "Pick one string open, then slide to fret 5 and settle the bar by ear before looking closely at the marker.", listenFor: "The pitch centre where the note stops sounding sharp or flat." },
    { level: "beginner", title: "Block the silence", purpose: "Make note endings as intentional as slides.", challenge: "Play four long notes, then four short notes using palm blocking to stop each one exactly on the next beat.", listenFor: "A clean edge to the silence with no leftover string wash." },
    { level: "intermediate", title: "Slide past, then return", purpose: "Use pitch motion expressively while keeping the destination in tune.", challenge: "Slide into one target note normally, then approach it by briefly overshooting and returning very gently.", listenFor: "The destination remaining clear even when the path becomes expressive." },
    { level: "advanced", title: "Answer a vocal phrase", purpose: "Practise the conversational role lap steel often plays.", challenge: "Sing or hum a two-bar phrase, leave space, then answer it with a two-bar steel phrase using only three positions.", listenFor: "Whether the steel sounds like a reply rather than an unrelated lick." },
  ]),
];

export function sideQuestsFor(instrument: InstrumentId, level?: LearningLevel) {
  return SIDE_QUESTS.filter(
    (quest) => quest.instrument === instrument && (!level || quest.level === level),
  );
}
