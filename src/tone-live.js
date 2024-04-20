export { live };

import weave from "./weave.js";
import { common } from "./commands_base.js";
import { mono } from "./formatters.js";
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

const initPiano = (dest) => {
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
    }).connect(dest);
    weave.pianoNoteSampler.t = weave.pianoNoteSampler.triggerAttackRelease
    weave.piano = weave.pianoNoteSampler
  }
}

const drums = (samples, options={}) => {
  options = { volume: -12, attack: 0.02, ...options }
  let players = new Tone.Players(samples, options)
  const s = {
    symbols: Object.keys(samples),
    t: (key, duration, time, velocity) => {
      if (!players.has(key)) {
        console.warn(`key ${key} not found for playback`);
        return;
      }
      const player = players.player(key);
      player.start(time);
      player.stop(time + duration);
    },
    connect: (dest) => {
      players.connect(dest);
      return s;
    }
  }
  return s
}

const initDrums = (dest) => {
  // These drum samples are from the Salamander drum kit https://sfzinstruments.github.io/drums/salamander/
    // by Alexander Holm. They are excellent! I wonder what kind of drum machine I can build here.
  if (!weave.drumNoteSampler) {
    weave.drumNoteSampler = drums({
      "kick": "drums/kick_OH_F_1.mp3",
      "ride": "drums/ride1_OH_FF_1.mp3",
      "snare": "drums/snare_OH_F_1.mp3",
      "snareS": "drums/snareStick_OH_F_3.mp3",
      "snare2": "drums/snare2OFF_OH_F_2.mp3",
      "hihat": "drums/hihatClosed_OH_F_1.mp3",
      "crash": "drums/crash1_OH_FF_1.mp3",}).connect(dest)
    weave.drums = weave.drumNoteSampler
  }
}

const live = {
  text: ["live"],
  action: async (ev) => {
    if (common(ev)) {
      return;
    }
    const body = document.getElementById(weave.lastBodyClickId());
    console.log(body)
    Tone.start()
    Tone.Transport.bpm.value = 30;
    Tone.Transport.start()
    mono.action()
    const volPiano = new Tone.Volume(-6).toDestination();
    const volDrums = new Tone.Volume(-12).toDestination();
    initDrums(volDrums)
    initPiano(volPiano)
    await Tone.loaded
      weave.seq = new Tone.Sequence(function(time, idx)
      {
        const contents = Array.from(body.querySelectorAll("pre")).map(b => b.textContent)
        const content = contents.join("\n")
        try{
          eval(content);
          weave.liveTone.validContent = content
        } catch(err){
          console.log(err)
          if(weave.liveTone.validContent){
            eval(weave.liveTone.validContent)
          }
        }
      }, 
          [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], "4n");
  
      weave.seq.start()

    Tone.Transport.bpm.value = 80;
  },
  description: "Live play in a 16 / 4n sequencer with Tone.js",
  el: "u",
};
