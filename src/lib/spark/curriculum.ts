import type { InstrumentId } from "./instruments.ts";

export const LEARNING_LEVELS = [
  {
    id: "foundations",
    title: "Start from zero",
    outcome: "Find your instrument and a steady pulse.",
  },
  {
    id: "beginner",
    title: "Build the basics",
    outcome: "Connect notes, rhythm, and simple musical ideas.",
  },
  {
    id: "intermediate",
    title: "Make musical choices",
    outcome: "Control movement, time, and expression.",
  },
  {
    id: "advanced",
    title: "Create and refine",
    outcome: "Apply the ideas in an independent performance.",
  },
] as const;

export type LearningLevel = (typeof LEARNING_LEVELS)[number]["id"];
export type LearningLesson = {
  id: string;
  instrument: InstrumentId;
  level: LearningLevel;
  title: string;
  outcome: string;
  explanation: string;
  example: string;
  practice: [string, string, string];
  question: string;
  options: [string, string, string];
  answer: number;
  feedback: string;
  prerequisite?: string;
  /** Optional synthesized pitch reference; each entry is one beat, [] is a rest. */
  demo?: { label: string; notes: number[][] };
};

type Seed = Omit<LearningLesson, "id" | "instrument" | "prerequisite"> & { slug: string };
function path(instrument: InstrumentId, lessons: Seed[]): LearningLesson[] {
  return lessons.map(({ slug, ...lesson }, index) => ({
    ...lesson,
    id: `${instrument}-${slug}`,
    instrument,
    prerequisite: index ? `${instrument}-${lessons[index - 1].slug}` : undefined,
  }));
}

const guitar = path("guitar", [
  {
    slug: "first-sound",
    level: "foundations",
    title: "Your first clear sound",
    outcome: "Name the six strings and make one note ring.",
    explanation:
      "A string played without pressing a fret is open. In standard tuning, the thickest to thinnest strings are E–A–D–G–B–E. A fret is a metal divider; pressing just behind it shortens the vibrating string and raises the pitch.",
    example: "Open low E → first fret F → open E. Use only enough pressure to get a clear sound.",
    practice: [
      "Rest the guitar securely and find the thickest string.",
      "Pluck it open, then press just behind the first fret and pluck again.",
      "Release, repeat three times, and notice which note sounds higher.",
    ],
    question: "What does an open string mean?",
    options: [
      "A string played without fretting",
      "A string pressed at fret twelve",
      "A string played as loudly as possible",
    ],
    answer: 0,
    feedback:
      "Open means no fret is pressed. Fretting changes the vibrating length; loudness does not define an open string.",
    demo: { label: "Low E, F, then E", notes: [[40], [41], [40], []] },
  },
  {
    slug: "pulse",
    level: "foundations",
    title: "Give four beats a home",
    outcome: "Keep counting while a sound or a rest happens.",
    explanation:
      "The beat is the regular pulse. In 4/4, four quarter-note beats make one bar. A rhythm chooses where sounds and silences sit on that pulse. You can miss a strum and keep the beat moving.",
    example: "Count 1–2–3–4. Strum on 1 and 3; let 2 and 4 pass silently.",
    practice: [
      "Tap your foot and count four evenly, twice.",
      "Lightly mute the strings with your fretting hand; brush down on 1 and 3.",
      "Keep counting through the silent beats for four bars.",
    ],
    question: "If you miss the strum on beat 3, what preserves the pulse?",
    options: [
      "Restart every time",
      "Keep counting and join the next beat",
      "Squeeze two strums into beat 4",
    ],
    answer: 1,
    feedback:
      "The pulse continues through a missed sound. Rejoin it; restarting or rushing changes the timing.",
  },
  {
    slug: "em-to-g",
    level: "beginner",
    title: "Two shapes, one moving pulse",
    outcome: "Change between Em and G without rushing.",
    explanation:
      "A chord sounds several notes together. Em uses E–G–B; G major uses G–B–D. For Em, fret the A and D strings at fret 2. For G, use low E fret 3, A fret 2, and high E fret 3; the middle strings stay open.",
    example: "One bar Em, one bar G. Give yourself beats 3 and 4 to prepare the next shape.",
    practice: [
      "Place Em and pluck each string slowly to find a clear sound.",
      "Make G, then silently move back to Em three times.",
      "Count four per shape. Strum only beat 1 for four bars.",
    ],
    question: "Which notes form Em?",
    options: ["E–G♯–B", "G–B–D", "E–G–B"],
    answer: 2,
    feedback: "Em is E–G–B. G is its minor third; E–G♯–B would be E major.",
    demo: { label: "Em then G", notes: [[52, 55, 59], [], [55, 59, 62], []] },
  },
  {
    slug: "eighths",
    level: "beginner",
    title: "The space between beats",
    outcome: "Place an upstroke between two downbeats.",
    explanation:
      "Two equal eighth notes fit inside one quarter-note beat. Say 1-and-2-and-3-and-4-and. Keep your hand moving down on numbers and up on ands; a silent pass still takes time. This is subdivision: dividing the beat evenly.",
    example: "Down on 1, down-up on 2-and, down on 3, down-up on 4-and.",
    practice: [
      "Count the eight syllables over muted strings.",
      "Keep a continuous down-up motion, touching strings only at the example's positions.",
      "Use Em for four bars and check that the ands sit halfway between numbers.",
    ],
    question: "In straight eighth notes, where is the and of 2?",
    options: ["Halfway between beats 2 and 3", "At the same time as beat 2", "After beat 4"],
    answer: 0,
    feedback:
      "Straight eighths divide the beat into two equal parts. The and of 2 lies halfway to beat 3.",
  },
  {
    slug: "triads",
    level: "intermediate",
    title: "Small chords, smaller movements",
    outcome: "Build major and minor triads and keep a common note.",
    explanation:
      "A triad uses a root, third, and fifth. A major third is four semitones above the root; a minor third is three. One fret is one semitone. An inversion changes which chord tone is lowest without changing the chord's notes.",
    example: "On G–B–high E strings, C is 5–5–3 (C–E–G). Am is 5–5–5 (C–E–A): two notes stay put.",
    practice: [
      "Sound the three-string C shape slowly and name C–E–G.",
      "Change only the high E string to fret 5 for Am.",
      "Alternate the shapes for four bars, then explain which two notes stayed.",
    ],
    question: "Why is C–E–A still an Am chord?",
    options: [
      "Every chord starting on C is Am",
      "It contains A–C–E in a different order",
      "Its notes are all a semitone apart",
    ],
    answer: 1,
    feedback:
      "A–C–E defines Am. Putting C at the bottom makes an inversion, not a new set of chord tones.",
    demo: { label: "C to an Am inversion", notes: [[60, 64, 67], [], [60, 64, 69], []] },
  },
  {
    slug: "pentatonic",
    level: "intermediate",
    title: "Make a two-bar answer",
    outcome: "Build a short phrase from A minor pentatonic.",
    explanation:
      "A minor pentatonic uses A–C–D–E–G: five notes, with room for silence. A motif is a short idea you repeat or vary. A phrase can answer an earlier phrase by keeping its rhythm and changing the ending.",
    example:
      "On high E: fret 5 is A and 8 is C. On B: fret 5 is E and 8 is G. Try A–C–A, rest; E–G–A, rest.",
    practice: [
      "Find the four positions in the example and play each slowly.",
      "Play A–C–A over four counted beats, leaving beat 4 silent.",
      "Answer with E–G–A in the next bar. Repeat the pair twice.",
    ],
    question: "What turns a scale exercise into a repeated musical idea?",
    options: [
      "Playing every note as fast as possible",
      "Removing all rests",
      "Using a recognizable rhythm and ending",
    ],
    answer: 2,
    feedback:
      "A recognizable rhythm and ending make a motif. Repetition, variation, and space help a listener follow it.",
    demo: { label: "Question and answer", notes: [[69], [72], [69], [], [64], [67], [69], []] },
  },
  {
    slug: "secondary-dominant",
    level: "advanced",
    title: "Borrow a little tension",
    outcome: "Explain why E7 leads toward Am in C major.",
    explanation:
      "A dominant seventh chord combines a major triad with a minor seventh. E7 is E–G♯–B–D. In C major, E7 borrows G♯ to point toward Am: G♯ rises a semitone to A. This is a secondary dominant, often written V7/vi.",
    example:
      "C → E7 → Am → G. Guitar E7: 0–2–0–1–0–0 from low E to high E. Am: x–0–2–2–1–0; x means omit that string.",
    practice: [
      "Play E7 then Am slowly, using the example shapes.",
      "Isolate the G string: fret 1 to fret 2, G♯ to A.",
      "Play the four-chord loop and describe where the tension resolves.",
    ],
    question: "Which note gives E7 its pull toward Am?",
    options: ["G♯ rising to A", "G natural falling to F", "C staying on C"],
    answer: 0,
    feedback:
      "G♯ is outside C major and leads upward to A. That directed motion helps E7 briefly point toward Am.",
    demo: { label: "E7 resolving to Am", notes: [[52, 56, 59, 62], [], [57, 60, 64], []] },
  },
  {
    slug: "arrangement",
    level: "advanced",
    title: "Arrange an eight-bar miniature",
    outcome: "Create contrast and revise one deliberate choice.",
    explanation:
      "An arrangement changes how an idea is presented: register, rhythm, density, or dynamics. A useful revision changes one variable, then compares the result. Finishing a short piece gives you something concrete to assess.",
    example:
      "Bars 1–4: Em–G–Em–G with one strum per bar. Bars 5–8: Em–G–Em–Em with eighth-note strums. Let the final Em ring.",
    practice: [
      "Choose the example or your own two-chord loop and count eight bars.",
      "Play two versions: sparse, then busier. Keep the tempo the same.",
      "Choose the version with the clearer contrast; replay it with an intentional ending.",
    ],
    question: "Which comparison best tests the effect of a denser rhythm?",
    options: [
      "Change the chords, tempo, and rhythm together",
      "Keep chords and tempo, change only the rhythm",
      "Play both versions without listening",
    ],
    answer: 1,
    feedback:
      "Keeping other choices steady lets you hear what the rhythm changed. Your finished miniature is a starting point for further refinement.",
  },
]);

const piano = path("piano", [
  {
    slug: "find-c",
    level: "foundations",
    title: "Find your way around the keys",
    outcome: "Find C and name the seven repeating white-key letters.",
    explanation:
      "Black keys repeat in groups of two and three. C is the white key immediately left of a group of two. White-key names move C–D–E–F–G–A–B, then repeat at the next C, an octave higher. Middle C is the C near the keyboard's centre.",
    example: "Find two different Cs. Walk C–D–E and back E–D–C on white keys.",
    practice: [
      "Find a group of two black keys and the C just to its left.",
      "Say C–D–E while playing three neighboring white keys.",
      "Find another C and notice the repeated pattern.",
    ],
    question: "Where is C relative to a group of two black keys?",
    options: [
      "Immediately to its left",
      "Between the black keys",
      "Immediately right of a group of three",
    ],
    answer: 0,
    feedback:
      "The white key immediately left of two black keys is C. That landmark repeats across the keyboard.",
    demo: { label: "C–D–E, then back", notes: [[60], [62], [64], [64], [62], [60]] },
  },
  {
    slug: "pulse-and-rest",
    level: "foundations",
    title: "Let a rest have its beat",
    outcome: "Play and release one key inside a four-beat bar.",
    explanation:
      "A steady beat keeps time even when you are silent. In 4/4, four quarter-note beats make a bar. A rest is a measured silence. Releasing a key deliberately is part of the rhythm, just like pressing it.",
    example: "Count 1–2–3–4. Play C on 1, release on 2; play C on 3, release on 4.",
    practice: [
      "Count four evenly and tap your knee twice through the count.",
      "Play the example on any C with a relaxed hand.",
      "Repeat four bars without speeding up during the silent beats.",
    ],
    question: "What happens to the beat during a rest?",
    options: [
      "It pauses until the next note",
      "It continues at the same pace",
      "It doubles in speed",
    ],
    answer: 1,
    feedback:
      "The beat continues through silence. Counting rests helps the next note arrive in its intended place.",
  },
  {
    slug: "major-minor",
    level: "beginner",
    title: "Hear what the third changes",
    outcome: "Build C major and C minor by changing one note.",
    explanation:
      "A triad uses a root, third, and fifth. C major is C–E–G. Lower E by one semitone to E♭ and you have C minor, C–E♭–G. A semitone is the distance to the very next key, black or white.",
    example: "C–E–G → C–E♭–G. Keep C and G in place; E♭ is the black key immediately left of E.",
    practice: [
      "Find C, E, and G separately, then sound them together.",
      "Move only E to E♭ and listen to the change.",
      "Alternate three times, naming major or minor before you play.",
    ],
    question: "Which change turns C major into C minor?",
    options: ["Raise G to A", "Lower C to B", "Lower E to E♭"],
    answer: 2,
    feedback: "Lowering the third, E, to E♭ changes major to minor. The root C and fifth G remain.",
    demo: { label: "C major, then C minor", notes: [[60, 64, 67], [], [60, 63, 67], []] },
  },
  {
    slug: "hands-together",
    level: "beginner",
    title: "Give each hand one job",
    outcome: "Coordinate a bass note with a simple right-hand pattern.",
    explanation:
      "Hands-together playing becomes easier to organize when each hand has a clear role. The left can hold a root while the right divides the bar into individual chord tones. Practise each role separately before combining them.",
    example: "Left hand: hold low C for four beats. Right hand: C–E–G–E, one note per beat.",
    practice: [
      "Play the right-hand pattern slowly twice.",
      "Play and hold a lower C with the left hand while counting four.",
      "Combine: start both hands on beat 1 and let the left stay still.",
    ],
    question: "If the combined pattern falls apart, what is a useful next attempt?",
    options: [
      "Practise each hand, then combine more slowly",
      "Increase the tempo",
      "Add more notes to both hands",
    ],
    answer: 0,
    feedback:
      "Separating roles and slowing down reduces the coordination demand while preserving the intended pattern.",
  },
  {
    slug: "voice-leading",
    level: "intermediate",
    title: "Move chords the short way",
    outcome: "Use an inversion to connect C and F with less motion.",
    explanation:
      "An inversion changes a chord's lowest note while keeping its pitch classes. Voice leading describes how individual notes move between chords. Keeping a shared note and moving other notes to nearby chord tones can make a transition smoother.",
    example:
      "C–E–G → C–F–A. The second chord is F major with C at the bottom; C stays, E rises to F, G rises to A.",
    practice: [
      "Play C–E–G near middle C.",
      "Keep C and move E to F, G to A.",
      "Alternate for four bars, then compare with jumping to F–A–C in root position.",
    ],
    question: "What chord is C–F–A?",
    options: ["C minor", "F major in an inversion", "A diminished"],
    answer: 1,
    feedback:
      "F–A–C defines F major. Reordering the notes to C–F–A makes an inversion of the same chord.",
    demo: { label: "C to F with a shared C", notes: [[60, 64, 67], [], [60, 65, 69], []] },
  },
  {
    slug: "seventh-cadence",
    level: "intermediate",
    title: "Add the seventh, hear the return",
    outcome: "Build Dm7–G7–Cmaj7 in C major.",
    explanation:
      "A seventh chord adds one more stacked third to a triad. In C major, Dm7 is D–F–A–C, G7 is G–B–D–F, and Cmaj7 is C–E–G–B. Together they form ii–V–I: a preparation, a dominant, and a return home.",
    example:
      "Play the root in your left hand and the other three notes in your right, one chord per bar.",
    practice: [
      "Find and name each chord's four notes separately.",
      "Play Dm7 → G7 → Cmaj7 slowly, with a pause if needed.",
      "Repeat while listening for F in G7 moving down to E in Cmaj7.",
    ],
    question: "Which seventh belongs in G7?",
    options: ["F♯", "E", "F"],
    answer: 2,
    feedback:
      "G7 contains F natural, a minor seventh above G. F♯ would give Gmaj7, a different chord.",
    demo: {
      label: "ii–V–I in C",
      notes: [[50, 57, 60, 65], [], [43, 55, 59, 65], [], [48, 55, 59, 64], []],
    },
  },
  {
    slug: "secondary-dominant",
    level: "advanced",
    title: "Point the harmony somewhere new",
    outcome: "Use D7 to lead to G inside a C-major phrase.",
    explanation:
      "A secondary dominant temporarily points at a chord other than the home chord. D7 is D–F♯–A–C. Its F♯ leads up to G, so D7 can lead to G even in a C-major piece. This is V7/V: the dominant of the dominant.",
    example:
      "C → D7 → G7 → C. Compare D minor with D7 in the second bar and listen for the changed third.",
    practice: [
      "Play D–F–A, then D–F♯–A–C.",
      "Resolve D7 to G7 slowly; follow F♯ moving to G.",
      "Play the four-bar phrase twice and choose a comfortable voicing.",
    ],
    question: "Why is F♯ useful in D7 → G?",
    options: [
      "It leads upward by a semitone to G",
      "It is the home note of C major",
      "It makes D7 a minor chord",
    ],
    answer: 0,
    feedback:
      "F♯ acts as a leading tone to G. It briefly directs the harmony toward G without requiring the whole piece to change key.",
    demo: {
      label: "D7 to G7 to C",
      notes: [[50, 54, 57, 60], [], [43, 55, 59, 65], [], [48, 55, 60, 64], []],
    },
  },
  {
    slug: "miniature",
    level: "advanced",
    title: "Build a miniature with a return",
    outcome: "Compose and assess an eight-bar piano piece.",
    explanation:
      "A small form gives the listener something to recognize. In an A–A′ design, a phrase returns with one change. Use a motif, clear harmonic direction, and an ending; complexity is optional. Evaluate balance between the melody and accompaniment.",
    example:
      "Bars 1–4: a three-note melody over C–F–G–C. Bars 5–8: repeat it with a different final rhythm and end on C.",
    practice: [
      "Choose C–D–E for a melody and one left-hand root per bar.",
      "Play an eight-bar A–A′ version with the melody louder than the accompaniment.",
      "Identify one crowded moment; remove a note or soften the left hand and replay.",
    ],
    question: "Which revision directly improves melody balance?",
    options: [
      "Make every note louder",
      "Soften the accompaniment while keeping the melody clear",
      "Add faster bass notes everywhere",
    ],
    answer: 1,
    feedback:
      "Reducing the accompaniment's volume makes room for the melody. Compare the same phrase before and after the change.",
  },
]);

const ukulele = path("ukulele", [
  {
    slug: "gcea",
    level: "foundations",
    title: "Four strings and a first note",
    outcome: "Locate G–C–E–A and sound each string separately.",
    explanation:
      "Standard ukulele tuning is G–C–E–A, from the string nearest your face to the one nearest the floor in playing position. Many ukuleles use a high G, so that order is not lowest-to-highest pitch. An open string has no fret pressed.",
    example: "Say G, C, E, A as you pluck each open string once.",
    practice: [
      "Support the instrument comfortably and find the string nearest your face.",
      "Pluck the four strings one at a time, naming each.",
      "Repeat slowly without judging loudness; aim to hear four separate sounds.",
    ],
    question: "Why can the first G string sound higher than C?",
    options: [
      "All ukuleles are tuned incorrectly",
      "Standard high-G tuning is re-entrant",
      "C is always the highest string",
    ],
    answer: 1,
    feedback:
      "High-G tuning is re-entrant: the string pitches do not run strictly low to high. Low-G setups also exist.",
    demo: { label: "High-G G–C–E–A tuning", notes: [[67], [60], [64], [69]] },
  },
  {
    slug: "first-c",
    level: "foundations",
    title: "One finger, four beats",
    outcome: "Play C on beat 1 and keep counting to 4.",
    explanation:
      "A chord combines notes. To make C major on standard GCEA tuning, press fret 3 on the A string and leave the other strings open. Count four steady beats for a bar of 4/4. Let the chord ring while you keep counting.",
    example: "GCEA frets 0–0–0–3. Strum down on 1, count 2–3–4 without another strum.",
    practice: [
      "Place a finger just behind fret 3 on the A string.",
      "Pluck each string, then gently brush all four.",
      "Play one strum per four-beat bar for four bars.",
    ],
    question: "Which string is fretted for the basic C shape?",
    options: ["G at fret 3", "E at fret 1", "A at fret 3"],
    answer: 2,
    feedback: "The basic C shape is 0–0–0–3 in GCEA order: only the A string is fretted.",
  },
  {
    slug: "c-f-am",
    level: "beginner",
    title: "Connect C, Am, and F",
    outcome: "Change chords by noticing what can stay still.",
    explanation:
      "In GCEA fret order, Am is 2–0–0–0 and F is 2–0–1–0. Moving from Am to F adds one finger while the G-string finger stays. Looking for shared fingers gives each change a smaller job.",
    example: "C (0–0–0–3) → Am (2–0–0–0) → F (2–0–1–0), one chord per bar.",
    practice: [
      "Move silently from Am to F three times, keeping the G-string finger down.",
      "Strum each shape once and check the E string rings clearly in F.",
      "Play the three-chord example twice, allowing a full bar per shape.",
    ],
    question: "What changes from Am to F in these shapes?",
    options: [
      "Add E-string fret 1 while keeping G-string fret 2",
      "Move every finger up two frets",
      "Fret only the A string",
    ],
    answer: 0,
    feedback:
      "Am's G-string fret 2 stays. Adding E-string fret 1 changes the open E to F and makes the F shape.",
    demo: { label: "C, Am, then F", notes: [[60, 64, 67], [], [57, 60, 64], [], [53, 57, 60], []] },
  },
  {
    slug: "island-rhythm",
    level: "beginner",
    title: "Keep the hand moving through silence",
    outcome: "Play a down/down-up/up-down-up rhythm with steady subdivision.",
    explanation:
      "Count 1-and-2-and-3-and-4-and. Your hand moves down on numbers and up on ands. A skipped string contact is a silence, not a stopped hand. The common island pattern skips the and of 1 and the downstroke on 3.",
    example: "Sound: 1, 2, and-of-2, and-of-3, 4, and-of-4. Motion: down, down-up, up-down-up.",
    practice: [
      "Mute the strings and move down-up evenly for one bar.",
      "Keep moving but miss the strings on and-of-1 and on beat 3.",
      "Add a C chord and repeat four slow bars.",
    ],
    question: "In this pattern, what happens on beat 3?",
    options: [
      "The beat disappears",
      "The hand moves down without sounding the strings",
      "Two upstrokes happen together",
    ],
    answer: 1,
    feedback:
      "Beat 3 still takes its full time. The silent downstroke keeps the following upstroke aligned with and-of-3.",
  },
  {
    slug: "fingerpicking",
    level: "intermediate",
    title: "Turn a chord into a pattern",
    outcome: "Separate chord notes into an even fingerpicked figure.",
    explanation:
      "An arpeggio sounds a chord's notes one after another. On a high-G ukulele, a string-order pattern may move up and down in pitch. Keep the timing even before changing chords or adding speed.",
    example:
      "Hold C. Pluck C string, E string, A string, E string, one per beat. The notes are C–E–C–E.",
    practice: [
      "Assign thumb to C string, index to E, middle to A.",
      "Play the four-note example without a chord change for four bars.",
      "Change to Am and repeat the same string order, listening to the changed A-string note.",
    ],
    question: "What makes this an arpeggio?",
    options: [
      "It must move only upward",
      "It uses every fret",
      "It sounds chord tones one after another",
    ],
    answer: 2,
    feedback:
      "An arpeggio separates a chord into successive notes. It can repeat notes or move in either direction.",
    demo: { label: "C-shape picked notes", notes: [[60], [64], [72], [64]] },
  },
  {
    slug: "transpose",
    level: "intermediate",
    title: "Move a progression to a new key",
    outcome: "Keep chord functions while changing the home chord.",
    explanation:
      "Roman numerals describe chords relative to a key. In C major, I–IV–V is C–F–G. In G major, the same functions are G–C–D. Transposing changes the pitches while preserving the relationships; use new shapes, not the old chord names.",
    example: "C–F–G–C becomes G–C–D–G. G shape: 0–2–3–2; D shape: 2–2–2–0 in GCEA order.",
    practice: [
      "Say the new progression aloud before touching the strings.",
      "Find G, C, and D; sound each slowly with a comfortable fingering.",
      "Play one strum per bar through G–C–D–G twice.",
    ],
    question: "What is IV in G major?",
    options: ["C major", "F major", "D major"],
    answer: 0,
    feedback: "Count G–A–B–C: C is scale degree four, so C major is IV in G major.",
  },
  {
    slug: "melody-chord",
    level: "advanced",
    title: "Put the melody on top",
    outcome: "Bring out a top note while keeping the chord lighter.",
    explanation:
      "Chord melody combines harmony and a featured melody note. The highest note often attracts attention, but volume and timing help it stand out. Use a light chord brush followed by a deliberate top-string note; do not make every note equally strong.",
    example:
      "Over C, alternate shapes 0–0–0–3 and 0–0–0–7: the top note moves C to E while the chord tones underneath stay.",
    practice: [
      "Find A-string frets 3 and 7 and play C–E–C alone.",
      "Add a light brush of the open G–C–E strings before each melody note.",
      "Play a four-bar phrase, ending on the fret-3 C, and listen for a clear top line.",
    ],
    question: "What helps a listener follow the melody?",
    options: [
      "Making the accompaniment louder",
      "Keeping accompaniment light and melody distinct",
      "Removing all planned endings",
    ],
    answer: 1,
    feedback:
      "A lighter accompaniment gives the melody room. The top line can remain clear without making the entire instrument louder.",
    demo: { label: "Top notes C–E–C", notes: [[72], [], [76], [], [72], []] },
  },
  {
    slug: "arrange",
    level: "advanced",
    title: "Make one loop tell a story",
    outcome: "Arrange an eight-bar piece with a change of texture.",
    explanation:
      "Texture describes how musical parts combine. Fingerpicking leaves space; strumming fills more of it. Keeping a progression while changing texture creates contrast without requiring new chords. An intentional ending helps a short performance feel complete.",
    example:
      "C–Am–F–G twice. Fingerpick the first four bars; strum the next four. Add a final C and let it ring.",
    practice: [
      "Prepare each chord and choose one comfortable tempo.",
      "Play the two textures through the example, counting bars aloud if helpful.",
      "Compare the sections and revise one transition so the beat stays steady.",
    ],
    question: "Which change creates texture contrast without changing harmony?",
    options: [
      "Use unrelated chords in every bar",
      "Stop counting halfway",
      "Fingerpick, then strum the same progression",
    ],
    answer: 2,
    feedback:
      "Fingerpicking and strumming present the same harmony with different density. A steady pulse makes the contrast easier to hear.",
  },
]);

const bass = path("bass", [
  {
    slug: "one-note",
    level: "foundations",
    title: "Find one note and its silence",
    outcome: "Name E–A–D–G and stop a note deliberately.",
    explanation:
      "Standard four-string bass tuning is E–A–D–G, thickest to thinnest. An open string has no fret pressed. Muting means stopping unwanted vibration with a light touch. The end of a bass note is part of the groove.",
    example:
      "Pluck open E, then gently touch the string to stop it. Sound and silence are two separate actions.",
    practice: [
      "Find and name the four open strings slowly.",
      "Pluck E once and stop it with a light touch after two counted beats.",
      "Repeat four times, listening for a clean space after the note.",
    ],
    question: "What is muting for?",
    options: [
      "Stopping unwanted string vibration",
      "Changing E into G",
      "Making every note louder",
    ],
    answer: 0,
    feedback:
      "Muting controls when a string stops sounding and keeps unused strings quiet. It does not choose a new pitch.",
    demo: { label: "Open E–A–D–G pitches", notes: [[28], [33], [38], [43]] },
  },
  {
    slug: "quarter-pulse",
    level: "foundations",
    title: "Be the pulse",
    outcome: "Place one bass note on each quarter-note beat.",
    explanation:
      "A bar of 4/4 has four quarter-note beats. Bass and drums often reinforce a shared pulse. Tempo is the pulse's speed, measured in beats per minute. Start slowly enough that each note can begin and end deliberately.",
    example: "Count 1–2–3–4 and play open E once on each number. Four bars is sixteen notes.",
    practice: [
      "Count four evenly twice before playing.",
      "Play open E on the four numbers, using a light pluck.",
      "Continue for four bars; if a note is late, rejoin the next number.",
    ],
    question: "How many quarter-note beats are in four bars of 4/4?",
    options: ["4", "16", "8"],
    answer: 1,
    feedback:
      "Four beats per bar multiplied by four bars gives sixteen beats. The pulse continues even if one note is missed.",
  },
  {
    slug: "follow-roots",
    level: "beginner",
    title: "Follow the chord's root",
    outcome: "Support Em and G using one root note each.",
    explanation:
      "A root names a chord. Em's root is E; G major's root is G. Bass can state these roots while another instrument fills in the chord. On the E string, open is E and fret 3 is G.",
    example:
      "One bar of E, one bar of G. Use quarter notes and change pitch on the next bar's beat 1.",
    practice: [
      "Find E open and G at fret 3 of the same string.",
      "Play each note four times while counting.",
      "Alternate for four bars and mute cleanly when changing notes.",
    ],
    question: "What is the root of Em?",
    options: ["G", "B", "E"],
    answer: 2,
    feedback:
      "E names the chord and is its root. G and B are other chord tones, but they do not name Em.",
    demo: { label: "E root then G root", notes: [[28], [28], [28], [28], [31], [31], [31], [31]] },
  },
  {
    slug: "fifth-octave",
    level: "beginner",
    title: "Expand one root into a line",
    outcome: "Find a fifth and an octave from G.",
    explanation:
      "A perfect fifth is seven semitones above a root; an octave is twelve. On standard bass tuning, from a fretted root, the fifth is one string thinner and two frets higher. The octave is two strings thinner and two frets higher.",
    example: "G: E-string fret 3. D: A-string fret 5. Higher G: D-string fret 5. Play G–D–G–D.",
    practice: [
      "Find the three notes slowly and name them.",
      "Play root–fifth–octave–fifth, one note per beat.",
      "Repeat four bars, muting the string you just left.",
    ],
    question: "Starting at E-string fret 3, where is the G an octave higher?",
    options: ["D-string fret 5", "A-string fret 3", "E-string fret 4"],
    answer: 0,
    feedback:
      "Two strings thinner and two frets higher gives D-string fret 5: G, twelve semitones above the root.",
    demo: { label: "G–D–G–D", notes: [[31], [38], [43], [38]] },
  },
  {
    slug: "offbeats",
    level: "intermediate",
    title: "Make an offbeat land",
    outcome: "Place a note on an and without losing the next beat.",
    explanation:
      "Straight eighth notes divide a beat in half: number, and. Syncopation emphasizes a weaker part of the beat. An offbeat bass note still belongs to the same steady grid; counting the silent strong beats helps keep its place.",
    example:
      "Play E on 1, and-of-2, and 4. Keep counting all eight syllables: 1-and-2-and-3-and-4-and.",
    practice: [
      "Tap the example on your knee while saying the full count.",
      "Play it on open E for two bars, leaving the other positions silent.",
      "Repeat for four bars and check that the next beat 1 arrives on time.",
    ],
    question: "Where is and-of-2 in a straight eighth-note grid?",
    options: ["Exactly on beat 2", "Halfway from beat 2 to beat 3", "After beat 4"],
    answer: 1,
    feedback:
      "The and is halfway between quarter-note beats. The silence on beat 3 still takes time.",
  },
  {
    slug: "approach-note",
    level: "intermediate",
    title: "Aim at the next root",
    outcome: "Use a chromatic approach note to connect E and G.",
    explanation:
      "A chromatic approach is a note a semitone away from a target. It creates motion when it resolves promptly. Put a stable chord tone on the strong beat and use the approach near the end of the previous bar.",
    example:
      "Before G on the next beat 1, play F♯ on beat 4. On the E string, F♯ is fret 2 and G is fret 3.",
    practice: [
      "Play F♯ at fret 2, then G at fret 3, and hear the small step.",
      "Play E on beats 1–2–3, F♯ on 4, then G on the next 1.",
      "Repeat, making the G arrival sound settled rather than rushed.",
    ],
    question: "What is the target in the approach F♯ → G?",
    options: ["E", "F♯", "G"],
    answer: 2,
    feedback:
      "G is the destination. F♯ is a semitone below it and gains meaning from that resolution.",
    demo: {
      label: "E, approach F♯, arrive on G",
      notes: [[28], [28], [28], [30], [31], [], [], []],
    },
  },
  {
    slug: "walking",
    level: "advanced",
    title: "Walk through ii–V–I",
    outcome: "Build a quarter-note line that connects chord tones.",
    explanation:
      "A walking line places notes on a steady quarter-note pulse and connects the harmony. In C major, ii–V–I is Dm7–G7–Cmaj7. Start each bar on its root, then use chord tones or nearby approach notes to reach the next root.",
    example:
      "Dm7 bar: D–F–A–F♯. G7 bar: G–B–D–B. Cmaj7 bar: C–E–G–E. F♯ approaches G; B approaches C.",
    practice: [
      "Locate D, F, G, B, C, E, A, and F♯ in a comfortable neck area.",
      "Play the three-bar example slowly, pausing between bars to prepare if needed.",
      "Connect all three bars with even quarter notes and compare each beat-1 arrival.",
    ],
    question: "Why does F♯ work at the end of the Dm7 bar here?",
    options: [
      "It approaches the next G root by a semitone",
      "It is the minor third of D",
      "All bass notes must belong to one chord",
    ],
    answer: 0,
    feedback:
      "F♯ is not a Dm7 chord tone; here its purpose is to lead into G on the next strong beat.",
    demo: {
      label: "Three-bar walking example",
      notes: [[38], [41], [45], [42], [43], [47], [38], [35], [36], [40], [43], [40]],
    },
  },
  {
    slug: "support-and-fill",
    level: "advanced",
    title: "Leave space, then answer",
    outcome: "Arrange a bass part with a planned fill and return.",
    explanation:
      "A fill is a brief departure from the main pattern. Its usefulness depends on timing, space, and a clear return. Keep most of the phrase supportive and place one fill near the boundary; compare whether it helps the next section arrive.",
    example:
      "Eight bars of Em–G. Keep roots in bars 1–7. In bar 8, use G–D–F♯–G, then return to E on the next 1.",
    practice: [
      "Play eight bars with roots only and count the bars.",
      "Repeat with the single bar-8 fill; keep the tempo steady.",
      "Choose the cleaner version and revise the fill if it crowds the return.",
    ],
    question: "What is the best evidence that a fill serves the groove?",
    options: [
      "It contains the most notes",
      "It lands clearly back in the pattern",
      "It changes tempo every time",
    ],
    answer: 1,
    feedback:
      "A clear return lets the fill support the phrase. More notes alone do not make it more effective.",
  },
]);

const drums = path("drums", [
  {
    slug: "pulse",
    level: "foundations",
    title: "Find the pulse before the kit",
    outcome: "Count a four-beat bar and name the main kit voices.",
    explanation:
      "The kick is the low drum usually played with a foot pedal; the snare has a crisp sound; the hi-hat is a pair of cymbals. You can begin on your knees or the app's pads. In 4/4, count four quarter-note beats per bar.",
    example: "Say 1–2–3–4 at a steady pace. Tap your knee once on each number.",
    practice: [
      "Count four evenly twice, without playing.",
      "Tap sixteen steady beats and say 1 again after each 4.",
      "Name kick, snare, and hi-hat; choose a knee or pad for each voice.",
    ],
    question: "How many quarter-note beats make one bar of 4/4?",
    options: ["3", "8", "4"],
    answer: 2,
    feedback:
      "The top 4 says four beats per bar; the bottom 4 makes the quarter note the beat unit.",
  },
  {
    slug: "backbeat",
    level: "foundations",
    title: "Build your first backbeat",
    outcome: "Alternate kick and snare across a four-beat bar.",
    explanation:
      "A common backbeat places the snare on beats 2 and 4. Begin with kick on 1 and 3. The different sounds give the bar a shape while the space between beats stays equal. The hi-hat can wait until this pair feels clear.",
    example: "1 kick · 2 snare · 3 kick · 4 snare.",
    practice: [
      "Speak kick–snare–kick–snare with an even count.",
      "Play the pattern on pads or alternate a foot tap and hand tap.",
      "Repeat for four bars, keeping the snare on 2 and 4.",
    ],
    question: "Where is the snare in this backbeat?",
    options: ["2 and 4", "1 and 3", "Only between beats"],
    answer: 0,
    feedback:
      "The snare emphasizes 2 and 4. The kick on 1 and 3 gives you a simple complementary pattern.",
  },
  {
    slug: "eighth-hats",
    level: "beginner",
    title: "Add the hi-hat clock",
    outcome: "Layer even eighth notes over kick and snare.",
    explanation:
      "Eighth notes divide each quarter-note beat into two equal parts. Count 1-and-2-and-3-and-4-and. The hi-hat can play all eight positions while the kick and snare keep their four-beat pattern. Some sounds happen together.",
    example: "Hi-hat on every number and and. Kick on 1 and 3; snare on 2 and 4.",
    practice: [
      "Tap eight even hi-hat strokes while speaking the count.",
      "Add kick on 1 and 3 for two bars.",
      "Add snare on 2 and 4. Slow down or remove a layer if needed.",
    ],
    question: "How many hi-hat eighth notes fit in one bar of 4/4?",
    options: ["4", "8", "16"],
    answer: 1,
    feedback:
      "Two eighth notes per beat across four beats gives eight hi-hat strokes. They stay even through the snare hits.",
  },
  {
    slug: "first-fill",
    level: "beginner",
    title: "A fill with a landing place",
    outcome: "Replace beat 4 with a short fill and return to 1.",
    explanation:
      "A fill briefly changes the regular groove, often near a phrase ending. It uses existing time; it does not add an extra beat. Plan the return before adding more strokes. Two eighth notes can fill beat 4.",
    example:
      "Three bars of backbeat. In bar 4, play snare on 4 and and-of-4, then kick on the next 1.",
    practice: [
      "Count four bars and say fill before the final beat.",
      "Play two snare taps on 4-and in that last bar.",
      "Return to kick on the very next 1 and repeat the whole phrase.",
    ],
    question: "What must a one-beat fill do?",
    options: [
      "Add a fifth beat to the bar",
      "Always get louder",
      "Fit its sounds inside the original beat",
    ],
    answer: 2,
    feedback:
      "The bar stays four beats long. A fill replaces time in the groove; a clear next beat 1 is the landing.",
  },
  {
    slug: "sixteenths",
    level: "intermediate",
    title: "Four spaces inside one beat",
    outcome: "Count sixteenths and play a deliberate gap.",
    explanation:
      "Sixteenth notes divide a quarter-note beat into four equal parts: 1-e-and-a. In 4/4 there are sixteen positions per bar. Use the spoken grid to place notes and rests accurately before adding limb coordination.",
    example:
      "On one drum, play number, e, and; leave a silent. Repeat the same shape on beats 2, 3, and 4.",
    practice: [
      "Say 1-e-and-a slowly with four equal syllables.",
      "Tap the first three positions and keep the fourth silent.",
      "Continue for one whole bar, then repeat twice without closing the gaps.",
    ],
    question: "How many sixteenth-note positions fit in one quarter-note beat?",
    options: ["4", "2", "6"],
    answer: 0,
    feedback:
      "A quarter-note beat contains four sixteenths. A silent position still takes one quarter of that beat.",
  },
  {
    slug: "accents",
    level: "intermediate",
    title: "One pattern, two sound levels",
    outcome: "Distinguish a strong backbeat from a softer extra note.",
    explanation:
      "An accent is a deliberately stronger note. A ghost note is a much softer stroke that adds detail between accents. Practise the volume contrast on one surface before adding the whole kit. Stick height can help control volume without forcing the stroke.",
    example:
      "Snare accents on 2 and 4. Add a very soft snare on and-of-3 while the strong beats remain easy to hear.",
    practice: [
      "Alternate one soft tap and one stronger tap at a slow pace.",
      "Count a bar and place strong snare taps on 2 and 4.",
      "Add the soft and-of-3 tap; compare whether 2 and 4 still lead the pattern.",
    ],
    question: "What makes a ghost note different from an accent?",
    options: [
      "It adds an extra beat",
      "It is deliberately much softer",
      "It must use a different tempo",
    ],
    answer: 1,
    feedback:
      "The ghost note sits at a lower volume. Its quieter role lets it add detail without replacing the backbeat's emphasis.",
  },
  {
    slug: "three-over-two",
    level: "advanced",
    title: "Feel three against two",
    outcome: "Build a 3:2 relationship using a shared six-part grid.",
    explanation:
      "A 3:2 polyrhythm places three evenly spaced hits against two evenly spaced hits over the same span. Divide that span into six equal parts. One hand plays slots 1–3–5; the other plays 1–4. Both begin together and return together on the next 1.",
    example:
      "Count six equally: 1 2 3 4 5 6. Right hand 1,3,5; left hand 1,4. This is a six-slot practice grid, not six extra quarter-note beats.",
    practice: [
      "Tap each hand's pattern separately while counting the six slots.",
      "Combine slowly: together, rest, right, left, right, rest.",
      "Repeat four cycles and listen for two even streams, not one rushed cluster.",
    ],
    question: "Which slots give the two equally spaced hits in this six-slot grid?",
    options: ["1 and 2", "1 and 6", "1 and 4"],
    answer: 2,
    feedback:
      "Slots 1 and 4 are three subdivisions apart. Slots 1, 3, and 5 are two subdivisions apart, producing three against two.",
  },
  {
    slug: "arrange",
    level: "advanced",
    title: "Design a groove with a section change",
    outcome: "Arrange eight bars with contrast and a reliable return.",
    explanation:
      "A drum arrangement supports the shape of a piece. Contrast can come from hi-hat density, dynamics, or a short fill, while tempo stays stable. Assess the transition as carefully as the busiest bar: the band needs a clear next 1.",
    example:
      "Bars 1–4: quarter-note hats. Bars 5–8: eighth-note hats. Add a two-eighth fill on the last beat, then return to the first texture.",
    practice: [
      "Speak or write the eight-bar map before playing.",
      "Play it on a kit, pads, or knees with one steady tempo.",
      "Repeat after changing only the fill; choose the version with the clearest return.",
    ],
    question: "Which change increases density while preserving tempo?",
    options: [
      "Move hats from quarters to eighths at the same pulse",
      "Speed the entire beat up halfway",
      "Add an extra bar without counting it",
    ],
    answer: 0,
    feedback:
      "Eighth-note hats create more events over the same quarter-note pulse. The tempo need not change.",
  },
]);

const vocals = path("vocals", [
  {
    slug: "easy-tone",
    level: "foundations",
    title: "Begin with an easy sound",
    outcome: "Make a short, comfortable hum and leave room to breathe.",
    explanation:
      "Pitch describes how high or low a sound is; volume describes how loud it is. Begin near your natural speaking range with an easy hum. A reference tone is a guide, not a requirement to sing outside a comfortable range. Listen-only practice also counts as an attempt.",
    example: "Hum one comfortable note for two counts, rest for two. Keep it easy and short.",
    practice: [
      "Sit or stand comfortably and take an ordinary, unforced breath.",
      "Hum gently for two counts, then rest for two; stop if it feels uncomfortable.",
      "Repeat twice or listen instead, noticing pitch separately from loudness.",
    ],
    question: "If a reference note feels outside your comfortable range, what can you do?",
    options: [
      "Force it louder",
      "Use a comfortable octave or listen instead",
      "Hold it until you run out of air",
    ],
    answer: 1,
    feedback:
      "A comfortable octave or listening keeps the musical task accessible. Matching a reference never requires forcing your voice.",
  },
  {
    slug: "pitch-direction",
    level: "foundations",
    title: "Hear up, down, and same",
    outcome: "Identify pitch direction before trying to match it.",
    explanation:
      "A melody moves between pitches. Higher, lower, and repeated are useful first descriptions; note names can come later. Listen to a pair, describe its direction, then echo gently in a comfortable range if you want to.",
    example:
      "The reference is C–D, then D–C: one step up, one step down. You may echo in any comfortable octave.",
    practice: [
      "Listen to the reference or play two neighboring white keys.",
      "Say up for C–D and down for D–C.",
      "Echo each pair softly, or point upward and downward as you listen.",
    ],
    question: "If the second note has a higher pitch, which direction did the melody move?",
    options: ["Down", "Same", "Up"],
    answer: 2,
    feedback:
      "A higher second pitch means upward motion. Louder and softer describe volume, not pitch direction.",
    demo: { label: "C–D, then D–C", notes: [[60], [62], [], [62], [60], []] },
  },
  {
    slug: "phrase-and-rest",
    level: "beginner",
    title: "Give a phrase a breathing place",
    outcome: "Plan a short phrase and a deliberate rest.",
    explanation:
      "A phrase is a musical thought. A planned rest gives it shape and creates a place to breathe. Begin with short, comfortable phrases, without trying to maximize breath length. The musical pulse continues through your silence.",
    example: "Speak or sing 'here we go' on beats 1–2–3, then rest on 4.",
    practice: [
      "Speak the phrase over an even four-beat count.",
      "Try it on a single easy pitch, or remain with speech.",
      "Repeat four bars, keeping beat 4 silent and each new 1 steady.",
    ],
    question: "What is the role of the rest on beat 4?",
    options: [
      "It gives the phrase space while time continues",
      "It stops the tempo",
      "It requires a louder next note",
    ],
    answer: 0,
    feedback:
      "The rest creates space and a breathing opportunity. Its beat still belongs to the ongoing pulse.",
  },
  {
    slug: "thirds",
    level: "beginner",
    title: "Hear a major and a minor third",
    outcome: "Compare two interval sizes from the same starting note.",
    explanation:
      "An interval is the distance between pitches. A major third spans four semitones; a minor third spans three. C to E is a major third, while C to E♭ is a minor third. Compare the sound from the same root instead of relying only on mood words.",
    example: "Listen to C–E, then C–E♭. E♭ is one semitone below E.",
    practice: [
      "Listen once to each pair without singing.",
      "Name which pair has the smaller gap.",
      "Echo one pair in a comfortable octave, or identify it again by listening.",
    ],
    question: "Which pair is a minor third?",
    options: ["C–E", "C–E♭", "C–G"],
    answer: 1,
    feedback:
      "C–E♭ spans three semitones, a minor third. C–E spans four, a major third; C–G is a perfect fifth.",
    demo: { label: "Major third, then minor third", notes: [[60], [64], [], [60], [63], []] },
  },
  {
    slug: "rhythmic-phrasing",
    level: "intermediate",
    title: "Enter after the beat",
    outcome: "Place a phrase on an offbeat with a clear ending.",
    explanation:
      "An entrance can fall between the main beats. Straight eighths divide each beat into a number and an and. Speak the rhythm first so pitch and timing do not both need attention at once. Keep counting silently until your entrance.",
    example: "Count 1-and-2-and-3-and-4-and. Say 'come back home' on and-of-2, 3, and 4.",
    practice: [
      "Tap the quarter-note pulse and speak the full eighth-note count.",
      "Speak the phrase at the example's three positions.",
      "Try one easy pitch, keeping the same entrance, or repeat with speech.",
    ],
    question: "Where does and-of-2 fall?",
    options: ["On beat 1", "After beat 4", "Halfway between beats 2 and 3"],
    answer: 2,
    feedback:
      "The and of 2 is the midpoint between quarter-note beats 2 and 3. Counting the earlier silence prepares the entrance.",
  },
  {
    slug: "harmony-line",
    level: "intermediate",
    title: "Hold your place in a harmony",
    outcome: "Identify melody and harmony as separate note lines.",
    explanation:
      "Harmony combines pitches at the same time. A line a third above a melody follows the notes of the key, so the interval may switch between major and minor thirds. Learn each line separately before listening to both together.",
    example:
      "In C major, melody C–D–E can pair with E–F–G above it. C–E is major; D–F and E–G are minor thirds.",
    practice: [
      "Listen to or play C–D–E, then E–F–G separately.",
      "Choose one line and hum it gently, or trace its notes while listening.",
      "Hear the pairs together and identify which line you are following.",
    ],
    question: "Why does D pair with F rather than F♯ in this C-major example?",
    options: [
      "F belongs to the C-major scale",
      "Every third is four semitones",
      "Harmony must always repeat the melody",
    ],
    answer: 0,
    feedback:
      "The harmony follows C-major scale notes. D–F is a minor third, showing why diatonic thirds are not all the same semitone size.",
    demo: {
      label: "Melody, harmony, then together",
      notes: [[60], [62], [64], [], [64], [65], [67], [], [60, 64], [62, 65], [64, 67]],
    },
  },
  {
    slug: "interpretation",
    level: "advanced",
    title: "Change the meaning of a phrase",
    outcome: "Use emphasis and timing to communicate an intention.",
    explanation:
      "Interpretation is a set of deliberate choices about a phrase. Stressing a different word can change its meaning even when the notes stay the same. Explore with speech first, then use a comfortable melody. Greater expression does not require greater vocal effort.",
    example:
      "'I will come home.' Emphasize I in one version, home in the next. Keep the same four-beat length.",
    practice: [
      "Speak both versions and name the different intention.",
      "Sing or speak them over the same pulse with a planned rest afterward.",
      "Choose the clearer version, then repeat it with the same emphasis.",
    ],
    question: "Which comparison isolates the effect of word emphasis?",
    options: [
      "Change the words, tempo, and notes together",
      "Keep the phrase and timing, change the stressed word",
      "Make both versions as loud as possible",
    ],
    answer: 1,
    feedback:
      "Keeping the phrase and timing steady lets you hear what the stressed word contributes to meaning.",
  },
  {
    slug: "performance-plan",
    level: "advanced",
    title: "Shape a short performance",
    outcome: "Plan, perform, and revise two connected phrases.",
    explanation:
      "A performance plan connects pitch, rhythm, text, and breathing places. Work on a short comfortable excerpt so you can make a specific comparison. Evaluate one musical criterion at a time; a completed lesson is a practice milestone, not a vocal assessment.",
    example:
      "Phrase A: 'I will come home.' Phrase B: 'Leave the light on.' In each phrase, place the first two words on beat 1-and, the remaining words on beats 2 and 3, then rest on beat 4; vary the emphasis in B.",
    practice: [
      "Choose speech or a comfortable three-note melody; plan each rest.",
      "Perform both phrases twice, keeping a steady pulse and an easy sound.",
      "Choose one criterion—clear words, pitch direction, or entrance timing—and revise just that.",
    ],
    question: "Which review gives you a usable next step?",
    options: [
      "Label the entire performance good or bad",
      "Attempt a much higher range immediately",
      "Identify one entrance to place more clearly next time",
    ],
    answer: 2,
    feedback:
      "A specific, changeable observation gives the next attempt a clear task. Broad judgments do not tell you what to practise.",
  },
]);

const mandolin = path("mandolin", [
  {
    slug: "gdae",
    level: "foundations",
    title: "Four pairs, one pick",
    outcome: "Name the G–D–A–E courses and sound each pair as one note.",
    explanation:
      "A mandolin has eight strings arranged in four pairs called courses. Each pair is tuned in unison, so it sounds like one string. From the thickest to the thinnest course the tuning is G–D–A–E, a fifth apart each time. Hold the pick lightly and let it pass through both strings of a pair.",
    example: "Pick each open course once, thickest to thinnest: G, D, A, E.",
    practice: [
      "Rest the mandolin against you and find the thickest course.",
      "Pick down through both strings of that pair; listen for one sound, not two.",
      "Move to each next course and name it aloud, four times in a row.",
    ],
    question: "What is a course on a mandolin?",
    options: [
      "A pair of strings tuned to the same note",
      "The distance between two frets",
      "A lesson in a method book",
    ],
    answer: 0,
    feedback:
      "A course is a unison pair that plays as one string. Frets divide the neck, and the tuning runs G–D–A–E across the four courses.",
    demo: { label: "Open G, D, A, then E", notes: [[55], [62], [69], [76]] },
  },
  {
    slug: "down-pulse",
    level: "foundations",
    title: "Downstrokes on a pulse",
    outcome: "Keep counting four while picking only on beats 1 and 3.",
    explanation:
      "The beat is the regular pulse. In 4/4, four beats make one bar. A downstroke moves the pick toward the floor. Playing only on beats 1 and 3 leaves 2 and 4 silent; those silent beats still take their full time, so keep counting through them.",
    example: "Count 1–2–3–4. Pick the open D course down on 1 and 3; let 2 and 4 pass.",
    practice: [
      "Tap your foot and count four evenly, twice, without picking.",
      "Pick the open D course down on 1 and 3 for one bar.",
      "Keep counting through 2 and 4 for four bars in a row.",
    ],
    question: "If you miss the downstroke on beat 3, what keeps the pulse?",
    options: [
      "Start the bar again",
      "Keep counting and pick on the next beat 1",
      "Add two quick strokes on beat 4",
    ],
    answer: 1,
    feedback:
      "The pulse continues through a missed stroke. Rejoin it on the next beat; restarting or catching up changes the timing.",
  },
  {
    slug: "g-and-c",
    level: "beginner",
    title: "Two fingers, two chords",
    outcome: "Change between G and C without rushing beat 1.",
    explanation:
      "A chord sounds several notes together. In G–D–A–E fret order, a two-finger G is 0–0–2–3 and C is 0–2–3–0. Press just behind the fret on both strings of the course. Change shapes during beats 3 and 4 so the new chord is ready on beat 1.",
    example: "One bar G, one bar C. Strum down on beat 1 only; prepare the next shape on 3 and 4.",
    practice: [
      "Place G and pick each course slowly until both strings of every pair ring.",
      "Make C, then move silently back to G three times.",
      "Count four per shape and strum only beat 1 for four bars.",
    ],
    question: "Which frets make the two-finger G shape in G–D–A–E order?",
    options: ["0–2–3–0", "0–0–2–3", "2–0–0–2"],
    answer: 1,
    feedback:
      "G is 0–0–2–3: the A course at fret 2 and the E course at fret 3. 0–2–3–0 is C, and 2–0–0–2 is D.",
    demo: { label: "G then C", notes: [[55, 62, 71, 79], [], [55, 64, 72, 76], []] },
  },
  {
    slug: "down-up",
    level: "beginner",
    title: "Down on numbers, up on ands",
    outcome: "Alternate pick direction through straight eighth notes.",
    explanation:
      "Two equal eighth notes fit inside one beat. Say 1-and-2-and-3-and-4-and. Alternate picking moves the pick down on the numbers and up on the ands, so the hand never has to change direction in a hurry. Keep the motion small and let the wrist do the work.",
    example: "On the D course: D open, E fret 2, F♯ fret 4, G fret 5. Down, up, down, up.",
    practice: [
      "Count the eight syllables while moving the pick down and up above the strings.",
      "Pick open D down-up for one bar with an even sound on both directions.",
      "Play D–E–F♯–G up and back down, one note per syllable, for four bars.",
    ],
    question: "In alternate picking, where do the upstrokes fall?",
    options: ["On the ands", "On beats 1 and 3", "Only at the end of a bar"],
    answer: 0,
    feedback:
      "Downstrokes take the numbers and upstrokes take the ands. That pairing keeps the hand moving evenly through the subdivision.",
    demo: { label: "D, E, F♯, G", notes: [[62], [64], [66], [67]] },
  },
  {
    slug: "chop",
    level: "intermediate",
    title: "The chop on two and four",
    outcome: "Alternate a ringing downstroke with a short muted chop.",
    explanation:
      "A chop is a chord struck while the fretting fingers release pressure, so the strings click instead of ringing. Placed on beats 2 and 4 it works like a snare drum under a melody. The chord shape stays in place; only the pressure changes. Keep the stroke short and let beats 1 and 3 ring fully.",
    example:
      "Hold G. Beat 1: strum and let it ring. Beat 2: release pressure and chop. Repeat on 3 and 4.",
    practice: [
      "Hold G and practise releasing pressure without lifting the fingers off the strings.",
      "Strum on 1, chop on 2, strum on 3, chop on 4 for one slow bar.",
      "Repeat for four bars and listen for a clear difference between ring and click.",
    ],
    question: "What makes a chop sound short?",
    options: [
      "Releasing finger pressure so the strings cannot ring",
      "Picking much harder than usual",
      "Lifting the pick away before it touches the strings",
    ],
    answer: 0,
    feedback:
      "The fingers stay on the strings but stop pressing, so the strings are damped. Force and pick height do not create the muted click.",
  },
  {
    slug: "tremolo",
    level: "intermediate",
    title: "Sustain from motion",
    outcome: "Hold one note with even, rapid down-up strokes.",
    explanation:
      "A plucked note fades quickly. Tremolo repeats the pick stroke fast enough that the ear hears one continuous tone. Start with four even strokes per beat, counted 1-e-and-a. The wrist stays loose and the strokes stay small; speed comes from ease, not effort.",
    example:
      "Open A course. Count 1-e-and-a 2-e-and-a with a stroke on every syllable, then rest for two beats.",
    practice: [
      "Say 1-e-and-a slowly and move the pick down-up-down-up above the strings.",
      "Play four strokes per beat on open A for two beats, then rest for two.",
      "Repeat twice and check that the last strokes sound as even as the first.",
    ],
    question: "What turns repeated strokes into a sustained tone?",
    options: [
      "Playing as loudly as possible",
      "Even, closely spaced strokes",
      "Changing the note on every stroke",
    ],
    answer: 1,
    feedback:
      "Evenness is what the ear hears as one continuous sound. Volume and pitch changes do not create the effect.",
    demo: { label: "Tremolo on A, then rest", notes: [[69], [69], [], []] },
  },
  {
    slug: "melody-with-chops",
    level: "advanced",
    title: "Melody, then backing",
    outcome: "Play a short melody and support it with a chop backing.",
    explanation:
      "The mandolin plays two roles in a group: lead melody and rhythmic backing. A melody on the D and A courses uses the alternate picking you already have. Backing under a singer or another player uses chords with a chop on 2 and 4. Practising both over the same chords makes it easier to switch roles mid-tune.",
    example:
      "Two bars of melody: D–E–F♯–G, then A–G–F♯–D. Two bars of backing: G with chops, then D with chops, back to G.",
    practice: [
      "Play the two melody bars alone with alternate picking at a slow tempo.",
      "Play two bars of chop backing on G and D without the melody.",
      "Join them: melody, then backing, keeping the same count throughout.",
    ],
    question: "What stays the same when the mandolin changes from melody to backing?",
    options: [
      "The pulse and the chord progression",
      "The pick must stop moving",
      "The fretting hand leaves the neck",
    ],
    answer: 0,
    feedback:
      "The count and the harmony carry through both roles. The picking pattern and the fretting job change, not the underlying pulse.",
    demo: {
      label: "Melody then a G chop",
      notes: [[62], [64], [66], [67], [55, 62, 71, 79], [], [55, 62, 71, 79], []],
    },
  },
  {
    slug: "arrangement",
    level: "advanced",
    title: "Arrange a short tune",
    outcome: "Plan, perform, and revise a four-bar arrangement with a clear ending.",
    explanation:
      "An arrangement decides how a melody and its chords are presented over time. Contrast can come from texture: single-note melody, then strummed chords. An ending that lands on the home chord, G, tells the listener the piece is finished. Choose one criterion to revise after each attempt; a finished lesson is a practice milestone, not a performance grade.",
    example:
      "Bars 1–2: melody D–E–F♯–G, A–G–F♯–D. Bars 3–4: strum G, C, then D. Land on a final G and let it ring.",
    practice: [
      "Play the melody bars, then the strummed bars, at one steady tempo.",
      "Add the final G on the next beat 1 and let it ring for a full count.",
      "Choose one thing to change, such as the ending or the texture switch, and repeat.",
    ],
    question: "Which review gives you a usable next step?",
    options: [
      "Decide the whole take was good or bad",
      "Name one transition to place more clearly next time",
      "Double the tempo immediately",
    ],
    answer: 1,
    feedback:
      "A specific, changeable observation gives the next attempt a task. Broad judgments and sudden tempo jumps do not tell you what to practise.",
  },
]);

const banjo = path("banjo", [
  {
    slug: "open-g",
    level: "foundations",
    title: "Five strings that already agree",
    outcome: "Name the five strings and hear that the open strings make G major.",
    explanation:
      "A five-string banjo in open G is tuned g–D–G–B–D. The fifth string is the short one: it starts at the fifth fret and is tuned to a high g, so the string nearest your face is not the lowest. With no fingers down, the open strings sound a G major chord.",
    example:
      "Pick D, G, B, D on the four long strings, then the short g with the thumb. Then brush all five.",
    practice: [
      "Rest the banjo against you and find the short fifth string with your thumb.",
      "Pick each long string once, thickest to thinnest, naming D, G, B, D.",
      "Brush all five open strings and listen for one chord.",
    ],
    question: "What is unusual about the fifth string on a five-string banjo?",
    options: [
      "It is short, starts at fret 5, and is tuned high",
      "It is the lowest string",
      "It must always be fretted",
    ],
    answer: 0,
    feedback:
      "The fifth string is shorter than the others and tuned to a high g. It is usually played open, never as the bass.",
    demo: {
      label: "Long strings, short g, then the open chord",
      notes: [[50], [55], [59], [62], [67], [], [67, 50, 55, 59, 62], []],
    },
  },
  {
    slug: "pulse-brush",
    level: "foundations",
    title: "A pulse over an open chord",
    outcome: "Keep counting while a brush or a rest happens.",
    explanation:
      "The beat is the regular pulse. In 4/4, four beats make one bar. A brush drags the fingers across all strings on one beat. Brushing on 1 and 3 leaves 2 and 4 silent; those beats still take their full time, so keep counting through them.",
    example: "Count 1–2–3–4. Brush the open strings down on 1 and 3; let 2 and 4 pass.",
    practice: [
      "Tap your foot and count four evenly, twice.",
      "Lightly mute the strings with your fretting hand; brush down on 1 and 3.",
      "Keep counting through the silent beats for four bars.",
    ],
    question: "If you miss the brush on beat 3, what preserves the pulse?",
    options: [
      "Restart every time",
      "Keep counting and join the next beat",
      "Brush twice on beat 4",
    ],
    answer: 1,
    feedback:
      "The pulse continues through a missed sound. Rejoin it; restarting or rushing changes the timing.",
  },
  {
    slug: "g-to-d7",
    level: "beginner",
    title: "The first change",
    outcome: "Move between open G and D7 without rushing beat 1.",
    explanation:
      "Open G needs no fingers. D7 in g–D–G–B–D fret order is 0–0–2–1–2: the third string at fret 2, the second at fret 1, the first at fret 2. This beginner D7 leaves out the chord's third, which is why it sounds open. Skip the short fifth string when you brush D7; its high g rubs against the shape. Rolls still use it. Place the shape during beats 3 and 4 so it is ready on beat 1.",
    example: "One bar of open G, one bar of D7. Brush on beat 1 only; place the shape on 3 and 4.",
    practice: [
      "Place D7 and pick each string slowly to find a clear sound.",
      "Lift to open G, then place D7 again, three times, without brushing.",
      "Count four per shape and brush only beat 1 for four bars.",
    ],
    question: "Which strings are fretted for the beginner D7 shape?",
    options: [
      "The third, second, and first strings",
      "The short fifth string only",
      "All five strings",
    ],
    answer: 0,
    feedback:
      "D7 is 0–0–2–1–2 on the long strings: the third string at fret 2, second at fret 1, first at fret 2. The fourth string stays open and the fifth is skipped when brushing.",
    demo: { label: "Open G then D7", notes: [[67, 50, 55, 59, 62], [], [67, 50, 57, 60, 64], []] },
  },
  {
    slug: "forward-roll",
    level: "beginner",
    title: "Eight notes, three fingers",
    outcome: "Play a forward roll as eight even eighth notes.",
    explanation:
      "A roll is a repeating right-hand pattern that keeps a steady stream of notes going. The forward roll uses thumb, index, and middle in order. Count 1-and-2-and-3-and-4-and; each syllable gets one note. The fingers follow a fixed string order, so the same motion works under any chord shape.",
    example: "Strings 3–2–1–5–2–1–3–1 with T–I–M–T–I–M–T–M, one note per syllable, over open G.",
    practice: [
      "Say the eight syllables while tapping thumb, index, middle on your leg.",
      "Play strings 3, 2, 1 with T, I, M slowly until the three notes are even.",
      "Add the thumb on the short g and play the full roll for four bars.",
    ],
    question: "What stays the same when a roll is played under a new chord?",
    options: [
      "The finger and string order",
      "The pitches of every note",
      "The number of fingers that fret",
    ],
    answer: 0,
    feedback:
      "The roll is a right-hand pattern. The fretting hand changes the pitches, but the finger and string order repeats unchanged.",
    demo: {
      label: "Forward roll over open G",
      notes: [[55], [59], [62], [67], [59], [62], [55], [62]],
    },
  },
  {
    slug: "three-chord-loop",
    level: "intermediate",
    title: "G, C, D7, and home",
    outcome: "Keep a roll going through a I–IV–V7–I progression.",
    explanation:
      "In G major, G is I, C is IV, and D7 is V7. C in g–D–G–B–D order is 0–2–0–1–2. Notice that C and D7 both fret the second string at fret 1, so that finger can stay while the others move. Keeping the roll going while the shape changes is the main skill; the right hand must not pause for the left.",
    example: "One bar each: G, C, D7, G. Forward roll throughout; change shapes on beat 1.",
    practice: [
      "Place C, then D7, three times without picking, keeping the fret-1 finger down.",
      "Roll one bar of C into one bar of D7 at a slow tempo.",
      "Play the four-bar loop twice, listening for the roll to stay even through each change.",
    ],
    question: "Which finger can stay in place between C and D7?",
    options: [
      "The second-string finger at fret 1",
      "The fourth-string finger at fret 2",
      "No finger can stay",
    ],
    answer: 0,
    feedback:
      "Both shapes fret the second string at fret 1. Keeping it down makes the change smaller and the roll steadier.",
    demo: {
      label: "G, C, D7, G",
      notes: [
        [67, 50, 55, 59, 62],
        [],
        [67, 52, 55, 60, 64],
        [],
        [67, 50, 57, 60, 64],
        [],
        [67, 50, 55, 59, 62],
        [],
      ],
    },
  },
  {
    slug: "hammer-and-slide",
    level: "intermediate",
    title: "Notes that move after the pick",
    outcome: "Sound a second note with a hammer-on or a slide instead of a pick.",
    explanation:
      "A hammer-on lands a fretting finger firmly on a ringing string so a higher note sounds without a new pick. A slide keeps the finger pressed and moves it along the string to a new fret. Both connect notes smoothly and are part of the banjo's voice. Firm landing and steady pressure matter more than force.",
    example:
      "Pick the open third string, hammer onto fret 2. Pick fret 2, slide to fret 4. Pick open again.",
    practice: [
      "Pick the open third string, then land a finger at fret 2 without picking; listen for the new note.",
      "Pick fret 2 and slide the same finger to fret 4, keeping pressure the whole way.",
      "Play the example for four bars at a slow tempo, leaving beat 4 empty.",
    ],
    question: "What makes a hammer-on sound?",
    options: [
      "Landing the finger firmly on a ringing string",
      "Picking the string twice quickly",
      "Lifting the finger off the string",
    ],
    answer: 0,
    feedback:
      "The finger's landing sets the string vibrating at the new fret. No second pick is used; lifting off is a pull-off, a different technique.",
    demo: { label: "Open, hammer, pick, slide, open", notes: [[55], [57], [57], [59], [55], []] },
  },
  {
    slug: "backup-and-break",
    level: "advanced",
    title: "Two jobs in one tune",
    outcome: "Play backup under a chord loop and switch to a rolled break.",
    explanation:
      "In a group the banjo either plays backup, a rhythmic vamp behind a singer or another instrument, or takes a break, a rolled melody pass. A vamp brushes the chord on 1 and 3 and chops it short on 2 and 4 by releasing finger pressure. The break rolls the same shapes. Practising both over one progression makes the switch dependable.",
    example: "Two bars of vamp on G and D7, then two bars of forward roll on G and D7.",
    practice: [
      "Vamp G and D7 for two bars, releasing pressure for the chops.",
      "Roll G and D7 for two bars with the forward roll.",
      "Join them and keep the count steady across the switch on beat 1 of bar 3.",
    ],
    question: "What changes when the banjo moves from backup to a break?",
    options: ["The right-hand pattern", "The chord progression", "The pulse"],
    answer: 0,
    feedback:
      "The chords and the pulse carry through both roles. The right hand switches from vamp brushes and chops to a roll.",
    demo: {
      label: "Vamp, then roll, on G",
      notes: [[67, 50, 55, 59, 62], [], [67, 50, 55, 59, 62], [], [55], [59], [62], [67]],
    },
  },
  {
    slug: "arrangement",
    level: "advanced",
    title: "Arrange a short tune",
    outcome: "Plan, perform, and revise a four-bar arrangement with a clear ending.",
    explanation:
      "An arrangement decides how the right hand presents a progression over time. Rolling two bars and brushing the next two gives contrast without new chords. An ending that lands on the home chord, open G, tells the listener the piece is finished. Choose one criterion to revise after each attempt; a finished lesson is a practice milestone, not a performance grade.",
    example:
      "Bars 1–2: forward roll on G, then C. Bars 3–4: brush D7 on 1 and 3, then G on 1. Land on a full open-G brush.",
    practice: [
      "Play the rolled bars, then the brushed bars, at one steady tempo.",
      "Add the final brush on the next beat 1 and let it ring for a full count.",
      "Choose one thing to change, such as the ending or the texture switch, and repeat.",
    ],
    question: "Which review gives you a usable next step?",
    options: [
      "Decide the whole take was good or bad",
      "Name one transition to place more clearly next time",
      "Double the tempo immediately",
    ],
    answer: 1,
    feedback:
      "A specific, changeable observation gives the next attempt a task. Broad judgments and sudden tempo jumps do not tell you what to practise.",
  },
]);

const violin = path("violin", [
  {
    slug: "open-strings-and-bow",
    level: "foundations",
    title: "Four strings and one straight bow",
    outcome: "Name G–D–A–E and draw one straight bow on each open string.",
    explanation:
      "A violin has four strings tuned G–D–A–E, from lowest to highest, a fifth apart. The bow makes the sound: hold it with a relaxed, rounded hand and draw it across one string between the bridge and the fingerboard. A straight bow stays parallel to the bridge for the whole stroke. Speed and weight, not force, shape the tone.",
    example: "One whole down-bow on open G, then D, then A, then E, each lasting a slow bar.",
    practice: [
      "Rest the violin on your shoulder and place the bow on the D string near the frog.",
      "Draw one slow, straight bow to the tip and stop; listen for one even sound.",
      "Repeat on G, A, and E, naming each string.",
    ],
    question: "What keeps a bow stroke sounding even from frog to tip?",
    options: [
      "Keeping the bow parallel to the bridge",
      "Pressing harder as the bow moves",
      "Moving the bow toward the scroll",
    ],
    answer: 0,
    feedback:
      "A straight bow keeps the contact point steady, so the sound stays even. Extra pressure or a drifting bow changes the tone mid-stroke.",
    demo: { label: "Open G, D, A, then E", notes: [[55], [62], [69], [76]] },
  },
  {
    slug: "bow-pulse",
    level: "foundations",
    title: "Down-bow on one, up-bow on three",
    outcome: "Keep counting while the bow stops on a rest.",
    explanation:
      "A down-bow moves from the frog toward the tip; an up-bow moves back. The symbol ⊓ marks a down-bow and ∨ marks an up-bow. In 4/4, four beats make one bar. Bowing on 1 and 3 leaves 2 and 4 silent; the bow rests on the string but the count continues.",
    example: "Open D. Count 1–2–3–4: ⊓ on 1, rest on 2, ∨ on 3, rest on 4.",
    practice: [
      "Count four evenly with the bow resting on the D string.",
      "Play ⊓ on 1 and ∨ on 3, stopping the bow on the string for 2 and 4.",
      "Repeat for four bars without letting the rests shorten.",
    ],
    question: "What does the bow do during a rest in this exercise?",
    options: [
      "Stops on the string while the count continues",
      "Lifts and returns to the frog",
      "Keeps sounding softly",
    ],
    answer: 0,
    feedback:
      "The bow stays on the string, silent, while the beat goes on. Lifting or sounding through the rest changes the rhythm.",
    demo: { label: "Down, rest, up, rest", notes: [[62], [], [62], []] },
  },
  {
    slug: "first-finger",
    level: "beginner",
    title: "One finger, one whole step",
    outcome: "Place the first finger a whole step above an open string.",
    explanation:
      "There are no frets, so the finger's position sets the pitch. The first finger lands a whole step above the open string: E on the D string, B on the A string. Keep the thumb opposite the first finger and the wrist relaxed. Listen for the same-sized step every time; a small move changes the note.",
    example: "Open D, first-finger E, open D. Then open A, first-finger B, open A.",
    practice: [
      "Place the first finger on the D string a whole step up and bow E slowly.",
      "Lift to open D and place E again three times, checking the step by ear.",
      "Do the same on the A string with B, then play the example with a rest on beat 4.",
    ],
    question: "What decides the pitch of a fingered note on the violin?",
    options: [
      "Where the finger stops the string",
      "How hard the bow presses",
      "Which direction the bow moves",
    ],
    answer: 0,
    feedback:
      "Pitch comes from the vibrating length of the string, which the finger sets. Bow weight and direction change tone and volume, not pitch.",
    demo: { label: "D, E, D, then A, B, A", notes: [[62], [64], [62], [], [69], [71], [69], []] },
  },
  {
    slug: "d-tetrachord",
    level: "beginner",
    title: "Four notes on one string",
    outcome: "Play D–E–F♯–G with fingers 0, 1, 2, 3 and a half step at the top.",
    explanation:
      "A tetrachord is four consecutive scale notes. On the D string, D–E–F♯–G uses the open string and fingers 1, 2, and 3. The steps are whole, whole, half: fingers 2 and 3 sit close together for the half step from F♯ to G. Keep earlier fingers down as you add the next one.",
    example: "D (open), E (1), F♯ (2), G (3, touching 2), then back down.",
    practice: [
      "Place fingers 1, 2, 3 one at a time without bowing, keeping each one down.",
      "Bow the four notes up slowly, one per beat, alternating down and up.",
      "Play up and down for four bars and listen for the small step at the top.",
    ],
    question: "Why do fingers 2 and 3 touch in this pattern?",
    options: [
      "F♯ to G is a half step",
      "Every step on the violin is a half step",
      "The bow needs a smaller stroke",
    ],
    answer: 0,
    feedback:
      "F♯ to G is the half step of the pattern, so the fingers sit close. The other steps are whole steps and need more space.",
    demo: { label: "D, E, F♯, G", notes: [[62], [64], [66], [67]] },
  },
  {
    slug: "slurs",
    level: "intermediate",
    title: "Two notes in one bow",
    outcome: "Change the finger while the bow keeps moving in one direction.",
    explanation:
      "A slur joins two or more notes in a single bow stroke. The bow keeps moving; only the left-hand finger changes. Count 1-and-2-and: the first note falls on the number, the second on the and, both inside one stroke. Divide the bow evenly so the second note has as much bow as the first.",
    example: "⊓ D–E, ∨ F♯–G, ⊓ G–F♯, ∨ E–D. Two notes per bow, one bow per beat.",
    practice: [
      "Bow open D slowly and place the first finger halfway through the stroke without stopping.",
      "Play D–E in one down-bow and F♯–G in one up-bow at a slow tempo.",
      "Play the four-slur example for four bars, keeping each stroke the same length.",
    ],
    question: "What changes during a slur?",
    options: ["The left-hand finger", "The bow direction", "The string tension"],
    answer: 0,
    feedback:
      "In a slur the bow continues in one direction while the finger changes the note. A change of bow direction would separate the notes.",
    demo: { label: "D–E slurred, F♯–G slurred", notes: [[62], [64], [], [66], [67], []] },
  },
  {
    slug: "string-crossing",
    level: "intermediate",
    title: "Crossing without a bump",
    outcome: "Move the bow between two strings on the pulse while shaping the volume.",
    explanation:
      "Each string sits at a different level under the bow. Crossing from D to A means rolling the whole bow arm from the elbow so the bow meets the new string cleanly. A crescendo, a gradual increase in volume, comes from faster bow speed and a little more weight, not from squeezing. Grow the sound over several bars rather than all at once.",
    example: "Open D, open A, D, A on the four beats. Bar 1 soft, bar 4 full.",
    practice: [
      "Rest the bow on D, then tilt the arm to A without sounding; feel the level change.",
      "Play D–A–D–A for one bar at a soft, even level.",
      "Play four bars, each slightly louder than the last, keeping the crossings clean.",
    ],
    question: "What mainly makes a violin note louder?",
    options: [
      "Faster bow speed with a little more weight",
      "Pressing the string harder",
      "Moving closer to the scroll",
    ],
    answer: 0,
    feedback:
      "Volume comes from the bow: more speed and some added weight. Left-hand pressure and playing over the fingerboard do not add volume.",
    demo: { label: "D and A crossing", notes: [[62], [69], [62], [69]] },
  },
  {
    slug: "phrase-shaping",
    level: "advanced",
    title: "Give the phrase a direction",
    outcome: "Choose a high point and shape bow speed toward it.",
    explanation:
      "A phrase is a musical sentence. Shaping means deciding where it grows and where it settles, usually one high point per phrase. On the violin, the shape comes from bow speed and distribution: more bow for the goal note, less as the phrase relaxes. Play the notes evenly first, then add the shape as a separate decision.",
    example: "D E F♯ G | A G F♯ D | E F♯ G A | D held. Let the A in bar 3 be the loudest note.",
    practice: [
      "Play the four bars evenly with alternating bows at a slow tempo.",
      "Choose the high point and mark which note gets the most bow.",
      "Play again with the shape and compare the two versions by ear.",
    ],
    question: "What gives a phrase a clear direction?",
    options: [
      "One planned high point",
      "Playing every note as loud as possible",
      "Changing tempo on every bar",
    ],
    answer: 0,
    feedback:
      "A single goal note gives the listener something to follow. Uniform loudness or shifting tempo blurs the shape.",
    demo: {
      label: "A four-bar phrase in D",
      notes: [[62], [64], [66], [67], [69], [67], [66], [62]],
    },
  },
  {
    slug: "performance-plan",
    level: "advanced",
    title: "Plan two phrases",
    outcome: "Plan, perform, and revise two connected phrases with chosen bowings.",
    explanation:
      "A performance plan decides bow direction, rests, and the ending before you play. Two short phrases that answer each other are enough to practise the whole cycle: plan, perform, compare, revise one thing. Evaluate one criterion at a time; a completed lesson is a practice milestone, not a performance grade.",
    example:
      "Phrase A: D E F♯ G, then A with three counts of rest. Phrase B: G F♯ E D, then E with three counts of rest. End on a held D.",
    practice: [
      "Write or say the bow direction for every note in both phrases.",
      "Perform both phrases twice, keeping the rests full and the bow on the string.",
      "Choose one criterion, such as clean bow changes or first-finger pitch, and revise just that.",
    ],
    question: "Which review gives you a usable next step?",
    options: [
      "Decide the whole take was good or bad",
      "Name one bow change to place more cleanly next time",
      "Play the piece twice as fast",
    ],
    answer: 1,
    feedback:
      "A specific, changeable observation gives the next attempt a task. Broad judgments and sudden tempo jumps do not tell you what to practise.",
  },
]);

export const CURRICULUM: LearningLesson[] = [
  ...guitar,
  ...piano,
  ...ukulele,
  ...bass,
  ...drums,
  ...vocals,
  ...mandolin,
  ...banjo,
  ...violin,
];
export const learningPath = (instrument: InstrumentId) =>
  CURRICULUM.filter((lesson) => lesson.instrument === instrument);
export const learningLesson = (id: string) => CURRICULUM.find((lesson) => lesson.id === id);
