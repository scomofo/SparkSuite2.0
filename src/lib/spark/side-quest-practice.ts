import type { LessonExercise, PracticeCue, PracticeSubdivision } from "./lesson-practice.ts";
import { sideQuestsFor, SIDE_QUESTS } from "./side-quests.ts";
import type { InstrumentId } from "./instruments.ts";

type QuestPattern = {
  bpm: number;
  beats?: number;
  subdivision?: PracticeSubdivision;
  cues: PracticeCue[];
};

const n = (beat: number, label: string, midi: number | number[], detail: string, duration = 0.8): PracticeCue => ({
  beat, label, detail, notes: Array.isArray(midi) ? midi : [midi], duration,
});
const r = (beat: number, detail = "Leave space and keep counting."): PracticeCue => ({
  beat, label: "Rest", detail, notes: [],
});
const d = (beat: number, label: string, pads: number[], detail: string): PracticeCue => ({
  beat, label, pads, detail,
});

const PATTERNS: Record<string, QuestPattern> = {
  "guitar-side-foundations": { bpm: 50, cues: [
    n(0, "Low E", 40, "Open sixth string: hear the low E."),
    r(1), n(2, "E again", 52, "Find the same note name an octave higher."),
    r(3), n(4, "Low E", 40, "Return to the original register."),
    n(5, "Compare", 52, "Same letter name, brighter register."),
    r(6), n(7, "Choose", 52, "Land on the E you can find fastest.", 1.6),
  ]},
  "guitar-side-beginner": { bpm: 70, subdivision: 2, cues: [
    n(0, "Em · sparse", [52,55,59], "One clean chord on beat 1.", 1.6), r(2),
    n(4, "Em · eighths", [52,55,59], "Start a steadier down-up feel."),
    n(4.5, "and", [52,55,59], "Light upstroke."),
    n(5, "2", [52,55,59], "Keep the wrist moving."),
    n(5.5, "and", [52,55,59], "Even subdivision."),
    n(6, "3", [52,55,59], "Do not rush."),
    r(6.5, "Leave one eighth-note hole."),
    n(7, "4", [52,55,59], "Finish with space.", 1.2),
  ]},
  "guitar-side-intermediate": { bpm: 70, cues: [
    n(0,"A",69,"Question starts on A."), n(1,"C",72,"Rise to C."), n(2,"A",69,"Return."), r(3,"Leave a full beat."),
    n(4,"E",64,"Answer begins somewhere else."), n(5,"G",67,"Keep the rhythm recognizable."), n(6,"A",69,"Resolve the answer."), r(7,"Let the answer breathe."),
  ]},
  "guitar-side-advanced": { bpm: 60, cues: [
    n(0,"Em full",[40,47,52,55,59,64],"Full voicing."), n(1,"G full",[43,47,50,55,59,67],"Full voicing."),
    n(2,"Em full",[40,47,52,55,59,64],"Keep it dense."), n(3,"G full",[43,47,50,55,59,67],"End version one."),
    n(4,"Em top",[59,64],"Now remove low voices."), r(5,"Let the thinner texture breathe."),
    n(6,"G top",[59,67],"Fewer notes, same harmony."), r(7,"Notice whether subtraction creates more space."),
  ]},

  "piano-side-foundations": { bpm: 50, cues: [
    n(0,"C",60,"C sits immediately left of two black keys."), n(1,"F",65,"F sits immediately left of three black keys."),
    n(2,"C",72,"Find the same landmark an octave up."), n(3,"F",77,"Repeat the three-black-key landmark."),
    n(4,"C",48,"Jump lower without counting keys."), n(5,"F",53,"Use the black-key group."),
    n(6,"C",60,"Return to middle C."), n(7,"Home",60,"Let the landmark feel automatic.",1.6),
  ]},
  "piano-side-beginner": { bpm: 60, cues: [
    n(0,"C + C",[48,60],"Low C stays home; melody starts on C."), n(1,"D",[48,62],"Keep the bass C held in your ear."),
    n(2,"E",[48,64],"E sounds settled over C."), n(3,"G",[48,67],"G also belongs strongly."),
    n(4,"A",[48,69],"A adds colour."), n(5,"G",[48,67],"Return inward."), n(6,"E",[48,64],"Settle."), n(7,"C",[48,60],"Land home.",1.6),
  ]},
  "piano-side-intermediate": { bpm: 60, cues: [
    n(0,"C",[60,64,67],"C major root position."), n(2,"F/C",[60,65,69],"Keep C; move E→F and G→A."),
    n(4,"G/B",[59,62,67],"Small motions into G."), n(6,"C",[60,64,67],"Resolve with close voices.",1.8),
  ]},
  "piano-side-advanced": { bpm: 60, cues: [
    n(0,"C",[48,60,64,67],"Plain home harmony."), n(2,"F",[53,60,65,69],"Plain IV."),
    n(4,"D7",[50,60,66,69],"Secondary dominant adds F-sharp."), n(6,"G7",[43,59,62,65],"Hear the stronger pull toward C."),
    n(7,"C",[48,60,64,67],"Resolve.",1.8),
  ]},

  "ukulele-side-foundations": { bpm: 50, cues: [
    n(0,"G high",67,"High G: notice it is not the lowest pitch."), n(1,"C",60,"C drops below that first string."),
    n(2,"E",64,"Rise again."), n(3,"A",69,"Highest open string here."),
    n(4,"C",60,"Now reorder by pitch."), n(5,"E",64,"Middle."), n(6,"G",67,"Drone-like high G."), n(7,"A",69,"Top.",1.5),
  ]},
  "ukulele-side-beginner": { bpm: 70, cues: [
    n(0,"C",[60,64,67],"Full strum."), r(1), n(2,"G",[59,62,67],"Leave room between changes."), r(3),
    n(4,"Am",[57,60,64],"Keep accompaniment light."), n(5,"Am",[57,60,64],"One extra pulse."),
    n(6,"F",[57,60,65],"Support, don't crowd."), r(7,"Imagine the singer using this space."),
  ]},
  "ukulele-side-intermediate": { bpm: 60, cues: [
    n(0,"C top E",64,"Take a melody note from C."), n(2,"F top F",65,"Move one note with the chord."),
    n(4,"G top G",67,"Chord tone becomes melody."), n(6,"C top E",64,"Return to a chord tone at home.",1.5),
  ]},
  "ukulele-side-advanced": { bpm: 70, cues: [
    n(0,"Full C",[60,64,67],"Full texture."), n(1,"Full G",[59,62,67],"Keep all voices."),
    n(2,"Full Am",[57,60,64],"Dense accompaniment."), n(3,"Full F",[57,60,65],"End full version."),
    n(4,"Top C",64,"Now select one note."), n(5,"Top G",67,"Thin texture."), n(6,"Top Am",69,"Let melody lead."), n(7,"Top F",65,"Finish sparse.",1.5),
  ]},

  "bass-side-foundations": { bpm: 60, cues: [
    n(0,"Long E",28,"Let E ring almost a full beat.",0.95), n(1,"Long E",28,"Same pitch, connected.",0.95),
    n(2,"Long E",28,"Feel the legato weight.",0.95), n(3,"Long E",28,"Last long note.",0.95),
    n(4,"Short E",28,"Now stop it quickly.",0.25), n(5,"Short E",28,"Silence is part of the groove.",0.25),
    n(6,"Short E",28,"Keep the attack identical.",0.25), n(7,"Short E",28,"Compare the feel.",0.25),
  ]},
  "bass-side-beginner": { bpm: 70, cues: [
    n(0,"E + kick",28,"Root lands with the imagined kick."), r(1), n(2,"E + kick",28,"Lock again."), r(3),
    n(4,"E + kick",28,"Stay attached to the downbeat."), n(5,"F#",30,"Passing tone between kicks."),
    n(6,"G + kick",31,"Arrive on the next root."), r(7,"Leave space after the landing."),
  ]},
  "bass-side-intermediate": { bpm: 60, cues: [
    n(0,"G",31,"Target root G."), n(1,"F#",30,"Approach G from below."), n(2,"G",31,"Land."),
    n(3,"Ab",32,"Approach G from above."), n(4,"G",31,"Land again."),
    n(5,"C#",37,"Approach D from below."), n(6,"D",38,"New root."), r(7),
  ]},
  "bass-side-advanced": { bpm: 60, cues: [
    n(0,"Active E",28,"Root."), n(1,"G",31,"Colour tone."), n(2,"A",33,"Motion."), n(3,"B",35,"Lead onward."),
    n(4,"Simple E",28,"Now one long root.",1.8), r(5), n(6,"Simple G",31,"Another deliberate root.",1.8), r(7),
  ]},

  "drums-side-foundations": { bpm: 80, cues: [
    d(0,"1",[],"Count one."), d(1,"Snare",[1],"Backbeat on 2."), d(2,"3",[],"Count three."), d(3,"Snare",[1],"Backbeat on 4."),
    d(4,"1",[],"New bar."), d(5,"Snare",[1],"Find 2 again."), d(6,"3",[],"Keep counting."), d(7,"Snare",[1],"And 4."),
  ]},
  "drums-side-beginner": { bpm: 80, beats: 12, subdivision: 2, cues: [
    d(0,"Kick + hat",[0,2],"Quarter-note groove starts."), d(1,"Snare + hat",[1,2],"Backbeat."),
    d(2,"Kick + hat",[0,2],"Keep anchors."), d(3,"Snare + hat",[1,2],"Backbeat."),
    d(4,"Kick + hat",[0,2],"Now eighth-note hats."), d(4.5,"hat",[2],"and"),
    d(5,"Snare + hat",[1,2],"2"), d(5.5,"hat",[2],"and"), d(6,"Kick + hat",[0,2],"3"), d(6.5,"hat",[2],"and"),
    d(7,"Snare + hat",[1,2],"4"), d(7.5,"hat",[2],"and"),
    d(8,"Kick",[0],"Now the hats drop out."), d(9,"Snare",[1],"Backbeat, nothing else."),
    d(10,"Kick",[0],"Anchors only."), d(11,"Snare",[1],"Same backbeat, emptier."),
  ]},
  "drums-side-intermediate": { bpm: 80, subdivision: 2, cues: [
    d(0,"Kick + ACCENT",[0,2],"Accent on 1 — kick stays in."), d(0.5,"hat",[2],"Light."),
    d(1,"Snare + hat",[1,2],"Backbeat."), d(1.5,"hat",[2],"Light."),
    d(2,"Kick + hat",[0,2],"Keep groove stable."), d(2.5,"hat",[2],"Light."),
    d(3,"Snare + hat",[1,2],"Backbeat."), d(3.5,"hat",[2],"Light."),
    d(4,"Kick + hat",[0,2],"Second bar — the accent moves."), d(4.5,"hat",[2],"Light."),
    d(5,"Snare + hat",[1,2],"Backbeat."), d(5.5,"hat",[2],"Light."),
    d(6,"Kick + hat",[0,2],"Keep groove stable."), d(6.5,"ACCENT",[2],"Accent on the and of 3."),
    d(7,"Snare + hat",[1,2],"Backbeat."), d(7.5,"hat",[2],"Light."),
  ]},
  "drums-side-advanced": { bpm: 80, beats: 9, subdivision: 2, cues: [
    d(0,"Kick + hat",[0,2],"Groove."), d(1,"Snare + hat",[1,2],"Backbeat."), d(2,"Kick + hat",[0,2],"Groove."), d(3,"Snare + hat",[1,2],"Backbeat."),
    d(4,"Tom",[3],"Fill begins."), d(4.5,"Snare",[1],"Keep subdivision."), d(5,"Tom",[3],"Continue."), d(5.5,"Snare",[1],"Do not rush."),
    d(6,"Tom + kick",[0,3],"Build toward the bar line."), d(6.5,"Snare",[1],"Keep building."), d(7,"Tom",[3],"Final fill note."), d(7.5,"Snare",[1],"Last setup note."),
    d(8,"Kick + snare",[0,1],"Beat 1 — the landing."),
  ]},

  "vocals-side-foundations": { bpm: 60, beats: 20, cues: [
    n(0,"Speak",60,"Speak the syllable in time; pitch is only a reference."), r(1),
    n(2,"Speak",60,"Repeat with clear consonants."), r(3),
    n(4,"Speak",60,"Bar two: same syllable, same time."), r(5),
    n(6,"Speak",60,"Keep the consonants clear."), r(7),
    n(8,"Speak",60,"Bar three: stay in time."), r(9),
    n(10,"Speak",60,"Words first; pitch can wait."), r(11),
    n(12,"Speak",60,"Last spoken bar."), r(13),
    n(14,"Speak",60,"One more in time, then sing."), r(15),
    n(16,"Sing",60,"Now sustain the same syllable on C.",1.5), r(18), n(19,"Release",60,"Easy final onset.",0.6),
  ]},
  "vocals-side-beginner": { bpm: 50, cues: [
    n(0,"Gentle",60,"Breathy-light onset, no push.",1.2), r(2),
    n(3,"Clean",60,"Balanced onset: air and tone together.",1.2), r(5),
    n(6,"Firm",60,"Slightly firmer onset without extra volume.",1.2), r(7),
  ]},
  "vocals-side-intermediate": { bpm: 60, beats: 16, cues: [
    n(0,"You hold E",64,"Phrase one: your note is E, the third of the C chord. Start it and keep it going — the melody is about to move underneath.",7.6),
    n(1,"Melody · C",60,"Reference melody — listen, don't follow."),
    n(2,"Melody · D",62,"The melody steps up. Your E stays."),
    n(3,"Melody · E",64,"The melody lands on your note — hear it blend."),
    n(4,"Melody · D",62,"It steps away again. You don't."),
    n(5,"Melody · C",60,"The melody comes home. Your E is still holding."),
    n(6,"Still E",64,"Last beats of the phrase: check your E hasn't drifted.",1.6),
    r(7,"Release and breathe. The next phrase holds a different note."),
    n(8,"You hold C",60,"Phrase two: your note is C, the root itself. Sustain it while a new melody moves overhead.",7.6),
    n(9,"Melody · G",67,"Reference melody, starting high — listen, don't follow."),
    n(10,"Melody · F",65,"The melody steps down. Your C stays."),
    n(11,"Melody · E",64,"Still moving. You're still on C."),
    n(12,"Melody · D",62,"Now the melody passes below you."),
    n(13,"Melody · C",60,"It lands on your note — root and melody meet."),
    n(14,"Still C",60,"Hold to the end of the phrase.",1.6),
    r(15,"Release. Notice where your note blended and where it rubbed — that was the quest."),
  ]},
  "vocals-side-advanced": { bpm: 60, cues: [
    n(0,"Intimate",60,"Same pitch: softer onset, longer vowel.",1.2), r(2),
    n(3,"Urgent",60,"Same pitch: clearer consonant, slightly earlier energy.",1.2), r(5),
    n(6,"Restrained",60,"Same pitch: contained dynamic, clean release.",1.2), r(7),
  ]},

  "mandolin-side-foundations": { bpm: 60, cues: [
    n(0,"Ring G",55,"Let the course ring.",0.95), n(1,"Stop G",55,"Short note.",0.25),
    n(2,"Ring G",55,"Long again.",0.95), n(3,"Stop G",55,"Short again.",0.25),
    n(4,"Ring D",62,"Move to another course.",0.95), n(5,"Stop D",62,"Control the ending.",0.25),
    n(6,"Ring D",62,"Long."), n(7,"Stop D",62,"Short.",0.25),
  ]},
  "mandolin-side-beginner": { bpm: 80, cues: [
    r(0), n(1,"Chop",[55,59,62],"Short backbeat chop.",0.2), r(2), n(3,"Chop",[55,59,62],"Release pressure after the hit.",0.2),
    r(4), n(5,"Chop",[55,59,62],"Same dry sound."), r(6), n(7,"Chop",[55,59,62],"Finish clean.",0.2),
  ]},
  "mandolin-side-intermediate": { bpm: 70, beats: 16, subdivision: 2, cues: [
    n(0,"G",55,"Course 1 — G course, open."), n(.5,"D",62,"Course 2 — D course, open."), n(1,"B",71,"Course 3 — A course, fret 2."),
    n(1.5,"G",55,"Pattern repeats."), n(2,"D",62,"Keep volume even."), n(2.5,"B",71,"No accent spike."),
    n(3,"G",55,"Cross the bar line smoothly."), n(3.5,"D",62,"Continue."), n(4,"B",71,"Even."), n(4.5,"G",55,"Roll."),
    n(5,"D",62,"Even."), n(5.5,"B",71,"Even."), n(6,"G",55,"Return."), n(6.5,"D",62,"Prepare the middle."), n(7,"B",71,"Continue."),
    n(7.5,"G",55,"Halfway."), n(8,"D",62,"Even."), n(8.5,"B",71,"No accent spike."), n(9,"G",55,"Roll."),
    n(9.5,"D",62,"Even."), n(10,"B",71,"Even."), n(10.5,"G",55,"Cross the bar line smoothly."), n(11,"D",62,"Continue."),
    n(11.5,"B",71,"Even."), n(12,"G",55,"Final bar."), n(12.5,"D",62,"Even."), n(13,"B",71,"Prepare ending."),
    n(13.5,"G",55,"Roll home."), n(14,"D",62,"Even."), n(14.5,"B",71,"One more course."), n(15,"G",55,"Land on the G course.",1.2),
  ]},
  "mandolin-side-advanced": { bpm: 70, beats: 16, cues: [
    n(0,"Melody G",67,"Lead voice."), n(1,"A",69,"Melody."), n(2,"B",71,"Peak."), n(3,"G",67,"Close phrase."),
    n(4,"A",69,"Second bar answers."), n(5,"G",67,"Melody."), n(6,"F♯",66,"Melody."), n(7,"D",62,"Close on D.",1.2),
    r(8), n(9,"Chop",[55,59,62],"Switch to backup.",0.2), r(10), n(11,"Chop",[55,59,62],"Keep tempo identical.",0.25),
    r(12), n(13,"Chop",[55,59,62],"Second bar of backbeat.",0.2), r(14), n(15,"Chop",[55,59,62],"Finish clean.",0.25),
  ]},

  "banjo-side-foundations": { bpm: 60, cues: [
    n(0,"D",50,"Fourth string."), n(1,"G",55,"Third string."), n(2,"B",59,"Second string."), n(3,"D",62,"First string."),
    n(4,"High g",67,"Now add the short fifth-string drone."), n(5,"D",50,"Low note moves under it."),
    n(6,"High g",67,"Drone returns."), n(7,"G",55,"Hear the high G remain part of the texture.",1.3),
  ]},
  "banjo-side-beginner": { bpm: 80, subdivision: 2, beats: 16, cues: [
    n(0,"T · ACCENT",55,"G · 3rd string, T — one forward roll for four bars; make this thumb note slightly louder.",0.4), n(.5,"I",59,"G · 2nd string, I",0.4), n(1,"M",62,"G · 1st string, M",0.4), n(1.5,"T",67,"G · short g string, T",0.4),
    n(2,"I",59,"G · 2nd string, I",0.4), n(2.5,"M",62,"G · 1st string, M",0.4), n(3,"T",55,"G · 3rd string, T",0.4), n(3.5,"M",62,"G · 1st string, M",0.4),
    n(4,"T",55,"G · 3rd string, T",0.4), n(4.5,"I · ACCENT",59,"G · 2nd string, I — the accent moves to the index note this bar.",0.4), n(5,"M",62,"G · 1st string, M",0.4), n(5.5,"T",67,"G · short g string, T",0.4),
    n(6,"I",59,"G · 2nd string, I",0.4), n(6.5,"M",62,"G · 1st string, M",0.4), n(7,"T",55,"G · 3rd string, T",0.4), n(7.5,"M",62,"G · 1st string, M",0.4),
    n(8,"T",55,"G · 3rd string, T",0.4), n(8.5,"I",59,"G · 2nd string, I",0.4), n(9,"M · ACCENT",62,"G · 1st string, M — the accent moves to the middle note this bar.",0.4), n(9.5,"T",67,"G · short g string, T",0.4),
    n(10,"I",59,"G · 2nd string, I",0.4), n(10.5,"M",62,"G · 1st string, M",0.4), n(11,"T",55,"G · 3rd string, T",0.4), n(11.5,"M",62,"G · 1st string, M",0.4),
    n(12,"T",55,"G · 3rd string, T — final bar: no accent; let the roll run plain.",0.4), n(12.5,"I",59,"G · 2nd string, I",0.4), n(13,"M",62,"G · 1st string, M",0.4), n(13.5,"T",67,"G · short g string, T",0.4),
    n(14,"I",59,"G · 2nd string, I",0.4), n(14.5,"M",62,"G · 1st string, M",0.4), n(15,"T",55,"G · 3rd string, T",0.4), n(15.5,"M",62,"G · 1st string, M — let it ring; the roll could start again.",1.2),
  ]},
  "banjo-side-intermediate": { bpm: 70, subdivision: 2, beats: 16, cues: [
    n(0,"G ↓",[67,50,55,59,62],"Plain pass: brush open G on beat 1.",1.8),
    r(1,"Count 2."),
    r(2,"Place the C shape during 3 and 4."),
    r(3),
    n(4,"C ↓",[67,52,55,60,64],"Plain: brush C on beat 1 — all five strings; the fifth stays open in C and is a chord tone.",1.8),
    r(5,"Count 2."),
    r(6,"Return to open G during 3 and 4."),
    r(7),
    n(8,"G ↓",[67,50,55,59,62],"Decorated pass: brush G again, exactly like the plain pass.",1.8),
    r(9,"Count 2."),
    n(10,"G",55,"Pick the open 3rd string — the ornament starts here, not at the chord.",0.4),
    n(10.5,"H",57,"Hammer on to fret 2; no pick.",0.4),
    n(11,"A",57,"Pick fret 2 on the 3rd string.",0.4),
    n(11.5,"S",59,"Slide to fret 4; no pick.",0.4),
    n(12,"C ↓",[67,52,55,60,64],"Arrive: brush C — the ornament pointed at the change, not past it.",1.8),
    r(13,"Count 2."),
    r(14),
    r(15,"Stop there. Did the ornament make the arrival clearer, or just busier?"),
  ]},
  "banjo-side-advanced": { bpm: 80, subdivision: 2, beats: 20, cues: [
    n(0,"G ↓",[67,50,55,59,62],"Backup: brush G on 1, under an imaginary singer.",0.9),
    { beat: 1, label: "Chop", detail: "Muted click on 2: touch all five strings lightly and strike.", muted: true, chord: "G" },
    n(2,"G ↓",[67,50,55,59,62],"Brush G on 3.",0.9),
    { beat: 3, label: "Chop", detail: "Muted click on 4.", muted: true, chord: "G" },
    n(4,"D7 ↓",[50,57,60,62],"Backup: brush D7 on 1 — four strings; the fifth string sits out the D7 shape.",0.9),
    { beat: 5, label: "Chop", detail: "Muted click on 2.", muted: true, chord: "D7" },
    n(6,"D7 ↓",[50,57,60,62],"Brush D7 on 3.",0.9),
    { beat: 7, label: "Chop", detail: "Muted click on 4 — the break starts next bar.", muted: true, chord: "D7" },
    n(8,"T",55,"Break: forward roll on G — the lead comes forward.",0.4), n(8.5,"I",59,"G · 2nd string, I",0.4), n(9,"M",62,"G · 1st string, M",0.4), n(9.5,"T",67,"G · short g string, T",0.4),
    n(10,"I",59,"G · 2nd string, I",0.4), n(10.5,"M",62,"G · 1st string, M",0.4), n(11,"T",55,"G · 3rd string, T",0.4), n(11.5,"M",62,"G · 1st string, M",0.4),
    n(12,"T",57,"Break: the same roll over D7 — 3rd string sounds from fret 2 now.",0.4), n(12.5,"I",60,"D7 · 2nd string, I",0.4), n(13,"M",62,"D7 · 1st string, M",0.4), n(13.5,"T",67,"D7 · short g string, T — the drone still sounds in D7.",0.4),
    n(14,"I",60,"D7 · 2nd string, I",0.4), n(14.5,"M",62,"D7 · 1st string, M",0.4), n(15,"T",57,"D7 · 3rd string, T",0.4), n(15.5,"M",62,"D7 · 1st string, M",0.4),
    n(16,"G ↓",[67,50,55,59,62],"Return: brush G on 1 — back in the backup job.",0.9),
    { beat: 17, label: "Chop", detail: "Muted click on 2.", muted: true, chord: "G" },
    n(18,"G ↓",[67,50,55,59,62],"Brush G on 3; let it ring a little.",1.6),
    r(19,"The roles switched and switched back; the pulse never moved."),
  ]},

  "violin-side-foundations": { bpm: 50, cues: [
    n(0,"D · soft contact",62,"Reference pitch; play nearer fingerboard.",1.5), r(2),
    n(3,"D · middle",62,"Same pitch, middle contact lane.",1.5), r(5),
    n(6,"D · focused",62,"Same pitch, slightly nearer bridge.",1.5), r(7),
  ]},
  "violin-side-beginner": { bpm: 50, cues: [
    n(0,"Open D",62,"Hear the open-string reference.",1.5), r(2),
    n(3,"E target",64,"First finger: compare the whole-step size.",1.2), r(5),
    n(6,"E again",64,"Repeat from silence and adjust by ear.",1.2), r(7),
  ]},
  "violin-side-intermediate": { bpm: 60, cues: [
    n(0,"D",62,"Equal bow version."), n(1,"E",64,"Equal bow."), n(2,"F#",66,"Equal bow."), n(3,"G",67,"Equal bow."),
    n(4,"D",62,"Second version begins."), n(5,"E",64,"Save bow."), n(6,"F#",66,"Save more bow."), n(7,"G · goal",67,"Spend extra bow on the goal note.",1.6),
  ]},
  "violin-side-advanced": { bpm: 60, cues: [
    n(0,"D string E",64,"First colour."), n(1,"F#",66,"Stay on lower string where possible."), n(2,"G",67,"Warm register."), r(3),
    n(4,"E string E",76,"Second colour: the same phrase an octave up, starting on open E."), n(5,"F#",78,"First finger on the E string."), n(6,"G",79,"Second finger low on the E string; compare ease and connection."), r(7),
  ]},

  "lapsteel-side-foundations": { bpm: 50, cues: [
    n(0,"Open E",64,"Reference open string.",1.4), r(2),
    n(3,"A target",69,"Slide toward fret 5 and settle by ear.",1.4), r(5),
    n(6,"A again",69,"Repeat the arrival without staring at the marker.",1.4), r(7),
  ]},
  "lapsteel-side-beginner": { bpm: 60, cues: [
    n(0,"Long C",[60,64],"Let it ring.",0.95), n(1,"Long C",[60,64],"Ring."),
    n(2,"Long F",[65,69],"New position, same ring.",0.95), n(3,"Long F",[65,69],"Ring."),
    n(4,"Short C",[60,64],"Palm-block quickly.",0.25), n(5,"Short C",[60,64],"Block."),
    n(6,"Short F",[65,69],"New position, same block."), n(7,"Short F",[65,69],"Clean edge.",0.25),
  ]},
  "lapsteel-side-intermediate": { bpm: 50, subdivision: 2, cues: [
    n(0,"G",67,"Start below target."), n(1,"A",69,"Normal arrival."),
    n(2,"G",67,"Reset."), n(3,"Bb",70,"Briefly overshoot A."), n(3.5,"A",69,"Return gently to target."),
    n(5,"G",67,"One more setup."), n(6,"A",69,"Clean final arrival.",1.5), r(7),
  ]},
  "lapsteel-side-advanced": { bpm: 60, cues: [
    n(0,"Hum C",60,"Imagine the vocal question."), n(1,"E",64,"Question rises."), n(2,"G",67,"Question peaks."), r(3,"Singer leaves space."),
    n(4,"Steel E",64,"Answer begins differently."), n(5,"G",67,"Move through familiar position."), n(6,"A",69,"Answer reaches out."), n(7,"C",60,"Resolve the reply — open 2nd string.",1.5),
  ]},
};

export function sideQuestExercise(id: string | undefined): LessonExercise | undefined {
  const quest = SIDE_QUESTS.find((item) => item.id === id);
  const pattern = id ? PATTERNS[id] : undefined;
  if (!quest || !pattern) return undefined;
  return {
    lessonId: quest.id,
    title: quest.title,
    goal: quest.challenge,
    setup: quest.purpose,
    hint: quest.listenFor,
    takeaway: "Notice one useful thing, then stop. Side quests are experiments, not tests.",
    bpm: pattern.bpm,
    beats: pattern.beats ?? 8,
    subdivision: pattern.subdivision,
    cues: pattern.cues,
  };
}

export function sideQuestById(id: string | undefined) {
  return SIDE_QUESTS.find((quest) => quest.id === id);
}

export function sideQuestExercisesFor(instrument: InstrumentId) {
  return sideQuestsFor(instrument)
    .map((quest) => sideQuestExercise(quest.id))
    .filter((exercise): exercise is LessonExercise => !!exercise);
}

export const SIDE_QUEST_PATTERNS = PATTERNS;
