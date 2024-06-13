// Place to have spaced repetition in Weave

// Sketch of design

// File with either "initial" or custom settings with a property "deck".
// This autogenerates buttons on it for "create", "review"
// Create will create a new panel, normal edit mode. The file handle will
// be of the form cTIMESTAMP (c for card). kind card. Additional field in
// header for FSRS scheduling.
// kind card can be in add mode (which is a superset of) edit mode or review mode.
// Edit mode shows it as normally would. Pressing Cmd-Enter overrides maximise
// and instead saves. If it's in add mode it has a reference to the corresponding
// deck: saving adds a line to the deck with the card identifier, as a link (to make
// decks "normal" files) and replaces itself with a new panel (updates all identifiers
// without creating a new panel)
// A card in review mode can be in two modes then, question or answer.
// In answer renders (edits itself technically) with a row of buttons on the top:
// edit again hard good easy edit goes to edit mode, as does pressing E
// In question only edit shows, pressing enter switches from question to answer
// again-hard-good-easy only appear on the answer side.
// Pressing each of these buttons updates the internal FSRS information of the card,
// stored in the header. It also saves.
// Note: deck -> review necessarily needs to load all the cards present (to decide
// which require review _now_ or are overdue)
// minimal thing to get working: card side.
// A card has a "front" and a "back", I.e. a question side and an answer side.
// Still unclear how to easily split them: hr? Then cannot use it for styling.
// Specific headings? A bit verbose

export { renderCard, fsrsButtons };

import weave from "../src/weave.js";
import { set } from "./libs/idb-keyval.js";
import { parseIntoWrapper, toMarkdown } from "./parser.js";
import { wireEverything } from "./load.js";
import { createEmptyCard, Rating } from "./libs/fsrs.js";
import { manipulation } from "./manipulation.js";

const cardStates = Object.freeze({
  kQuestion: "question",
  kAnswer: "answer",
  kEdit: "edit",
});

const fields = Object.freeze({
  kAnswerDues: "answerDues",
});

/*const reparse = (body) => {
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    const container = body.closest(".body-container");
    parseIntoWrapper(toMarkdown(body), body);
    wireEverything(weave.buttons(weave.root));
}
*/

// Assumes insertion is a list of lines
const insertAtTop = (markdown, insertion) => {
  let insert = false;
  const lines = markdown.split("\n");
  let output = [];
  for (const line of lines) {
    if (insert) {
      console.warn(output);
      output.push(...insertion);
      insert = false;
    }
    output.push(line);
    if (line.trim() === "-->") {
      insert = true;
    }
  }
  return output.join("\n");
};

const editButtonText = `\`[div] .wrap.weave-skip u .alive editFSRSCard edit\``;
const reviewAgainButton = (days) =>
  `\`[div] .wrap.fsrs-again.weave-skip u .alive againFSRSCard again (${days}d)\``;
const reviewHardButton = (days) =>
  `\`[div] .wrap.fsrs-hard.weave-skip u .alive hardFSRSCard hard (${days}d)\``;
const reviewGoodButton = (days) =>
  `\`[div] .wrap.fsrs-good.weave-skip u .alive goodFSRSCard good (${days}d)\``;
const reviewEasyButton = (days) =>
  `\`[div] .wrap.fsrs-easy.weave-skip u .alive easyFSRSCard easy (${days}d)\``;

const reviewButtonsText = (scheduling) => {
  const again = reviewAgainButton(scheduling[Rating.Again].card.scheduled_days);
  const hard = reviewHardButton(scheduling[Rating.Hard].card.scheduled_days);
  const easy = reviewEasyButton(scheduling[Rating.Easy].card.scheduled_days);
  const good = reviewGoodButton(scheduling[Rating.Good].card.scheduled_days);

  return [editButtonText, again, hard, good, easy].join(" ");
};
const hr = "--- .weave-skip.clicky-answer";

// All these skips are all good and well, but it's better if I just store the "real" markdown and
// raw uses that then. I'll keep the skips in place because it is a potentially useful feature, particularly because
// when editing it _still_ has the button there, and then saving causes havoc if I don't do something anyway

const editFSRSCard = {
  text: ["editFSRSCard"], // Bogus name I'm not expecting anybody to write ever
  action: (ev) => {
    const body = ev.target.closest(".body"); // This always edits itself. ALWAYS
    body.state = cardStates.kEdit;
    renderCard(body);
  },
  description: "Somethingsomething",
  el: "u",
};

// TODO I just got this from panel because saving is not properly scoped

const save = (container) => {
  // TODO this is very repeated with isave
  const body = container.querySelector(".body");
  const filename = manipulation.get(body, manipulation.fields.kFilename);
  body.baseMarkdown = toMarkdown(body);
  const content = btoa(encodeURIComponent(body.baseMarkdown));

  const title = manipulation.get(body, manipulation.fields.kTitle);
  const saveString = `${title} ${content}`;
  set(filename, saveString)
    .then(() => {
      console.info("Data saved in IndexedDb");
      body.saved = true;
    })
    .catch((err) => console.info("Saving in IndexedDb failed", err));
};

const answerButtonGenerator = (shortname, rating) => {
  console.warn(shortname, rating);
  return {
    text: [`${shortname}FSRSCard`], // Bogus name I'm not expecting anybody to write ever
    action: (ev) => {
      const container = ev.target.closest(".body-container"); // This always affects itself. ALWAYS
      const scheduleInfo = container[fields.kAnswerDues][rating];
      console.info(scheduleInfo);
      manipulation.set(
        container,
        manipulation.fields.kFSRSSchedule,
        scheduleInfo.card,
      );
      save(container);
    },
    description: "Somethingsomething",
    el: "u",
  };
};

const answerButtons = [
  ["again", Rating.Again],
  ["good", Rating.Good],
  ["hard", Rating.Hard],
  ["easy", Rating.Easy],
].map(([sn, r]) => answerButtonGenerator(sn, r));

console.warn();

const fsrsButtons = [editFSRSCard, ...answerButtons];

const renderCard = (body) => {
  // By default, assume it is in question
  console.warn(body.state);
  const initialState = body.state || cardStates.kQuestion;
  const container = body.closest(".body-container");
  if (!body.baseMarkdown) {
    body.baseMarkdown = toMarkdown(body);
  }
  console.warn(body.baseMarkdown);
  if (initialState == cardStates.kEdit) {
    console.warn(body.contentEditable, body.contentEditable == "false");
    if (body.contentEditable == "false" || !body.contentEditable) {
      console.warn("A");
      body.contentEditable = true;
      body.style.cursor = "auto";
      let markdown = insertAtTop(body.baseMarkdown, [editButtonText, hr]);
      parseIntoWrapper(markdown, body, { starting: false, keepStill: true }); // A hack to prevent a cycle of parsing
      // wireEverything is a very hard hammer. Should wire only new panels, will be faster
      wireEverything(weave.buttons(weave.root));
      // There seems to be no onkeydown handler
      container.onkeydown = null;
      container._questionEventListener = null;
    } else {
      body.state = cardStates.kQuestion;
      renderCard(body);
    }
  }
  if (initialState == cardStates.kQuestion) {
    const split = body.baseMarkdown.split("---");
    let question = split[0];
    let answer = split[1];
    question = insertAtTop(question, [editButtonText, hr]);

    // Hacked around having a "real markdown" and a "presented markdown", used for raw / unraw for now
    // I need to make sure it is consistent all around though. For now saving updates it, so it's close
    // to being consistent
    parseIntoWrapper(question + "``` .hide" + answer + "```", body, {
      starting: false,
      keepStill: true,
    }); // A hack to prevent a cycle of parsing
    // wireEverything is a very hard hammer. Should wire only new panels, will be faster
    wireEverything(weave.buttons(weave.root));

    const f = fsrs();
    let cardInfo = manipulation.get(body, manipulation.fields.kFSRSSchedule);
    console.warn(cardInfo);
    if (!cardInfo) {
      cardInfo = createEmptyCard(new Date());
      manipulation.set(body, manipulation.fields.kFSRSSchedule, cardInfo);
      console.warn(manipulation.get(body, manipulation.fields.kFSRSSchedule));
    }

    container[fields.kAnswerDues] = f.repeat(cardInfo, new Date());

    body.contentEditable = false;
    body.style.cursor = "default";
    const reveal = () => {
      body.state = cardStates.kAnswer;
      container.onkeydown = container._questionEventListener;
      container._questionEventListener = null;
      renderCard(body);
    };
    container._questionEventListener = container.onkeydown;
    container.onkeydown = null;
    container.onkeydown = (ev) => {
      console.warn(ev);
      if (ev.key === "Enter") {
        reveal();
      }
    };
    container
      .querySelector(".clicky-answer")
      .addEventListener("click", (ev) => {
        reveal();
      });
  }
  if (initialState == cardStates.kAnswer) {
    let markdown = body.baseMarkdown;
    console.warn(markdown);
    markdown = insertAtTop(markdown, [
      reviewButtonsText(container[fields.kAnswerDues]),
      hr,
    ]);
    parseIntoWrapper(markdown, body, { starting: false, keepStill: true });
    wireEverything(weave.buttons(weave.root));
  }
};
