export { jazz };

import weave from "./weave.js";
import { common } from "./commands_base.js";

let transpose = 0;
let currentChordChoice;
let chordIndex = 0;
let noteIndex = 0;
let note = 21;
let noteCount = 0;

// Got these chords as the basic building blocks from jazzkeys by Plan8 (plan8.co)
// I added a few more at the end that mix well. I'll add a few more as I get any ideas.

const baseChords = [
  [48, 55, 57, 59, 64],
  [48, 55, 57, 62],
  [60, 64, 67, 69, 74, 76, 81],
  [48, 52, 55, 59, 62, 66],
  [60, 62, 64, 67, 71, 74, 78],
  [60, 65, 69, 70], // BbMaj7 inversion
  [60, 70, 71, 77], // EbMaj7 inversion
  [60, 64, 67, 69], // Am7b5 inversion
];

const highChords = [
  [72, 79, 83, 90],
  [79, 83, 84, 86],
  [71, 74, 76, 79, 81, 86, 88, 93],
  [72, 76, 79, 81, 86, 90],
];

// The following is based on https://github.com/tambien/Piano, including the
// excellent Internet Archive samples.

const allNotes = [
  21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75,
  78, 81, 84, 87, 90, 93, 96, 99, 102, 105, 108,
];

function getNotesInRange(min, max) {
  return allNotes.filter((note) => min <= note && note <= max);
}

function midiToNote(midi) {
  const frequency = new Tone.Frequency(midi, "midi");
  const ret = frequency.toNote();
  return ret;
}

function getNotesUrl(midi, vel) {
  return `${midiToNote(midi).replace("#", "s")}v${vel}.mp3`;
}
const notes = getNotesInRange(21, 108);
let noteUrls = {};
notes.forEach((note) => (noteUrls[midiToNote(note)] = getNotesUrl(note, 2)));

weave.pianoNoteSampler = null;

let rhythm = 0;
let keysPerBeat = 3;

let keypressTimestamps = []; // Array to store the last 10 keypress timestamps
let keypressesPerSecond = 0; // Initialize our result

const jazz = {
  text: ["jazz"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    if (!weave.pianoNoteSampler) {
      weave.pianoNoteSampler = new Tone.Sampler({
        attack: 0,
        urls: noteUrls,
        baseUrl: "piano/",
        curve: "exponential",
        release: 0.8,
        volume: -10,
        onload: () => {
          info.classList.remove("fades");
          console.info("Note samples loaded");
          info.innerHTML = "&#x1F3B9;";
          info.classList.add("fades");
        },
      }).toDestination();
    }
    // These drum samples are from the Salamander drum kit https://sfzinstruments.github.io/drums/salamander/
    // by Alexander Holm. They are excellent! I wonder what kind of drum machine I can build here.
    if (!weave.drumNoteSampler) {
      weave.drumNoteSampler = new Tone.Sampler({
        attack: 0,
        urls: {
          c0: "ride1_OH_FF_1.mp3",
          d0: "hihatClosed_OH_F_1.mp3",
          e0: "snare_OH_F_1.mp3",
          f0: "crash1_OH_FF_1.mp3",
          g0: "snareStick_OH_F_3.mp3",
          a0: "snare2OFF_OH_F_2.mp3",
        },
        baseUrl: "drums/",
        curve: "exponential",
        release: 0.3,
        volume: -20,
        onload: () => {
          info.classList.remove("fades");
          console.info("Drum samples loaded");
          info.innerHTML = "&#x1F941;";
          info.classList.add("fades");
        },
      }).toDestination();
    }

    const body = document.getElementById(weave.lastBodyClickId());
    if (body.jazz) {
      body.removeEventListener("keydown", jazzKeyboardListener);
      body.jazz = false;
      return;
    }
    body.addEventListener("keydown", jazzKeyboardListener);
    body.jazz = true;
  },
  description: "Free rollin' piano jazz inspired by jazzkeys by Plan8",
  el: "u",
};

const jazzKeyboardListener = (ev) => {
  if (ev.key === "Backspace") {
    if (note > 21) {
      note--;
      weave.pianoNoteSampler.triggerAttackRelease(midiToNote(note), 0.5);
      return;
    }
  }

  if (noteCount % 3 == 0) {
    if (Math.random(10) < 5) {
      currentChordChoice = baseChords;
    } else {
      currentChordChoice = highChords;
    }
  }
  keypressTimestamps.push(weave.pianoNoteSampler.now());
  console.log(keypressTimestamps);
  if (keypressTimestamps.length > 10) {
    keypressTimestamps.shift();
  }

  let totalDelta = 0;
  for (let i = 1; i < keypressTimestamps.length; i++) {
    const delta = keypressTimestamps[i] - keypressTimestamps[i - 1];
    totalDelta += delta;
  }
  console.log(totalDelta);
  keypressesPerSecond = totalDelta / keypressTimestamps.length;

  console.info(`Keypresses per second ${keypressesPerSecond}`);

  chordIndex = Math.floor(Math.random() * currentChordChoice.length);
  if (noteCount == 0) {
    transpose = 24 + -6 + Math.floor(Math.random(12));
  }

  noteCount = noteCount + 1;
  noteCount = noteCount % 10;
  noteIndex = Math.floor(Math.random() * currentChordChoice[chordIndex].length);
  note = currentChordChoice[chordIndex][noteIndex] + transpose;
  console.log(`Triggering: ${midiToNote(note)}`);
  const sustain = 0.5 + Math.random() * 1.3;
  let play;
  console.log(ev.key);
  if (ev.key === "Enter" || ev.key == " ") {
    play = currentChordChoice[chordIndex].map((n) => midiToNote(n + transpose));
  } else if ("!()[]{},.".includes(ev.key)) {
    play = null;
    if (ev.key === "!") {
      weave.drumNoteSampler.triggerAttackRelease("f0", 1);
    } else if (ev.key === ".") {
      weave.drumNoteSampler.triggerAttackRelease("a0", 1);
    } else {
      weave.drumNoteSampler.triggerAttackRelease("g0", 1);
    }
  } else {
    play = midiToNote(note);
  }
  if (Math.random() * 10 > 3 && play) {
    weave.pianoNoteSampler.triggerAttackRelease(play, sustain);
  }
  // TODO converter from drum name to midi note I set
  console.log(rhythm);
  if (rhythm == 0) {
    console.log(`Current keysPerBeat: ${keysPerBeat}`);
    weave.drumNoteSampler.triggerAttackRelease("c0", 1);
  }
  if (rhythm == keysPerBeat) {
    weave.drumNoteSampler.triggerAttackRelease(["c0"], 1.2);
    weave.drumNoteSampler.triggerAttackRelease(["d0"], 1.4);
    weave.drumNoteSampler.triggerAttackRelease(["e0"], 0.9);
    const now = weave.drumNoteSampler.now();
    // This 0.4 ideally would depend on the previous speed of key cadences
    weave.drumNoteSampler.triggerAttackRelease("c0", 0.7, now + 0.4);
  }
  if (rhythm == 3 * keysPerBeat) {
    const now = weave.drumNoteSampler.now();
    weave.drumNoteSampler.triggerAttackRelease(["c0", "d0", "e0"], 1.2);
  }
  rhythm += 1;
  keysPerBeat = Math.max(1, Math.floor((0.5 * 1) / keypressesPerSecond)); // TODO Ideally this should be updated only at the end of a phrase
  console.log(`Current keysPerBeat: ${keysPerBeat}`);
  rhythm = rhythm % (4 * keysPerBeat);
};
