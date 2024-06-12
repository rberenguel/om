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

export { renderCard, editFSRSCard };

import weave from "../src/weave.js";

import { parseIntoWrapper, toMarkdown } from "./parser.js";
import { wireEverything } from "./load.js";
const cardStates = Object.freeze({
  kQuestion: "question",
  kAnswer: "answer",
  kEdit: "edit",
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
const reviewAgainButton = `\`[div] .wrap.weave-skip u .alive answerAgain again\``;
const reviewHardButton = `\`[div] .wrap.weave-skip u .alive answerHard hard\``;
const reviewGoodButton = `\`[div] .wrap.weave-skip u .alive answerGood good\``;
const reviewEasyButton = `\`[div] .wrap.weave-skip u .alive answerEasy easy\``;
const reviewButtonsText = [
  editButtonText,
  reviewAgainButton,
  reviewHardButton,
  reviewGoodButton,
  reviewEasyButton,
].join(" ");
const hr = "--- .weave-skip";

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

const renderCard = (body) => {
  // By default, assume it is in question
  console.warn(body.state);
  const initialState = body.state || cardStates.kQuestion;
  const container = body.closest(".body-container");
  if (!body.baseMarkdown) {
    body.baseMarkdown = toMarkdown(body);
  }
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
    body.contentEditable = false;
    body.style.cursor = "default";
    container._questionEventListener = container.onkeydown;
    container.onkeydown = null;
    container.onkeydown = (ev) => {
      console.warn(ev);
      if (ev.key === "Enter") {
        body.state = cardStates.kAnswer;
        container.onkeydown = container._questionEventListener;
        container._questionEventListener = null;
        renderCard(body);
      }
    };
  }
  if (initialState == cardStates.kAnswer) {
    let markdown = body.baseMarkdown;
    markdown = insertAtTop(markdown, [reviewButtonsText, hr]);
    parseIntoWrapper(markdown, body, { starting: false, keepStill: true });
  }
};
