# Making stems for the Stem Lab

The Stem Lab plays a song that has already been split into stems — one audio
file each for vocals, drums, bass, guitar, piano, and everything else. It
mixes and rebalances those stems while you practise: mute the part you play
and play it against the band.

SparkSuite does not split songs itself. Separation takes a trained model,
and that model does not run in a web page. The splitting happens on your own
computer, with Demucs, before the Stem Lab ever sees the song. Your audio
files are never uploaded anywhere.

## Split a song with Demucs

Install Demucs once (it needs Python):

```sh
pip install demucs
```

Then split a song with the six-stem model:

```sh
demucs -n htdemucs_6s "song.mp3"
```

That writes a folder:

```text
separated/htdemucs_6s/song/
  vocals.wav
  drums.wav
  bass.wav
  guitar.wav
  piano.wav
  other.wav
```

Open the Stem Lab, choose **Add a folder**, and pick that song folder.
Every stem lands on its own mixer strip. Loose stem files work too — the
lab places them by file name, and anything it cannot place waits in a tray
for you to assign by hand.

The plain four-stem command also works:

```sh
demucs "song.mp3"
```

Guitar and piano then live inside `other.wav`, and the lab simply has no
separate strips for them.

## Keep the files exactly as Demucs writes them

Do not trim the silence at the start of a stem, and do not shift a stem to
"line it up". The Stem Lab keeps every stem on the song's original timeline
by design: sample 0 of every stem is the start of the song, a stem shorter
than the song simply ends early, and nothing is padded, trimmed or
re-aligned in between. A stem whose leading silence was trimmed would drift
against the original recording — and against every other stem.

## What the lab remembers

Audio lives in memory for the session only; drop the stems again next
visit. Your mix for a song — volumes, mutes, solos, master — is saved on
this device, keyed by the stem file names and durations, so the same set
dropped again picks its mix back up.
