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

export { renderCard, fsrsAddHandler, addToDeck, reviewDeck };

import weave from "../src/weave.js";
import { set, getMany } from "./libs/idb-keyval.js";
import { parseIntoWrapper, parseInto, toMarkdown } from "./parser.js";
import { wireEverything } from "./load.js";
import { createEmptyCard, Rating } from "./libs/fsrs.js";
import { manipulation } from "./manipulation.js";
import { createNextPanel, close_ } from "./panel.js";
import { iloadIntoBody } from "./loadymcloadface.js";

const emptyCard = "question\n---\nanswer\n";

const cardStates = Object.freeze({
  kQuestion: "question",
  kAnswer: "answer",
  kEdit: "edit",
  kAdd: "adding",
  kReview: "reviewign",
});

const fields = Object.freeze({
  kAnswerDues: "answerDues",
});

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

const editButton = (container) => {
  const div = document.createElement("div");
  div.classList.add("wrap", "alive");
  div.textContent = "edit";
  const edit = () => {
    const body = container.querySelector(".body"); // This always edits itself. ALWAYS
    body.fsrsState = cardStates.kEdit;
    renderCard(body);
  };
  div.addEventListener("click", edit);
  if (!container.cardEditListener) {
    container.addEventListener("keyup", (ev) => {
      if (container.raw) {
        return;
      }
      if (ev.key === "e") {
        edit();
      }
    });
    container.cardEditListener = true;
  }
  return div;
};

const goToAnswerButton = (container) => {
  const div = document.createElement("div");
  div.classList.add("wrap", "alive");
  div.style.float = "right";
  div.textContent = "answer";
  div.addEventListener("click", () => {
    reveal(container);
  });
  return div;
};

const addToDeck = {
  // TODO I want this as a separate button in deck-started panels instead, but this is faster to write
  text: ["add-deck"],
  action: (ev) => {
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    const container = body.closest(".body-container");
    const bodyId = body.id; // TODO this should come from manipulation too
    const cardPanel = createNextPanel(weave.root);
    const cardBody = cardPanel.querySelector(".body");
    container.relatedContainers = [
      // TODO "relatedcontainers" has body ids… Maybe it is time to move these ids
      cardBody.id,
    ];
    console.log(cardBody);
    cardBody.fsrsDeck = bodyId;
    cardBody.fsrsState = cardStates.kAdd;
    //cardBody.contentEditable = "false" // This is also needed for the state edit to work. TODO This is not good.
    parseInto(emptyCard, cardBody);
    renderCard(cardBody);
  },
  description: "Reparses the current panel through a fake markdown conversion",
  el: "u",
};

const extractCardId = (line) => {
  const match = line.match(/\[\[(c\d+)\]\]/);
  return match ? match[1] : null;
};

const reviewDeck = {
  // TODO I want this as a separate button in deck-started panels instead, but this is faster to write
  text: ["review-deck"],
  action: (ev) => {
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    const container = body.closest(".body-container");
    const markdown = toMarkdown(body);
    let cardIds = [];
    for (const line of markdown.split("\n")) {
      const id = extractCardId(line);
      if (id) {
        cardIds.push(id);
      }
    }
    console.warn(cardIds);
    const cardPanel = createNextPanel(weave.root);
    const cardBody = cardPanel.querySelector(".body");
    container.relatedContainers = [
      // TODO "relatedcontainers" has body ids… Maybe it is time to move these ids
      cardBody.id,
    ];
    console.log(cardBody);
    //cardBody.fsrsDeck = bodyId
    cardBody.fsrsState = cardStates.kReview;
    cardBody.fsrsQuestions = cardIds;
    console.warn(cardBody.fsrsQuestions);
    renderCard(cardBody);
    /*getMany(cardIds).then(cards => {
      for(const card of cards){
        try{
          console.warn(card)
          const value = card.split(" ").slice(-1) // Cards always have the file title… or more like, don't care
          const decoded = decodeURIComponent(atob(value))
        
          console.warn(decoded)
        }catch(err){
          console.error(err)
        }
      }
    }).catch(err => {
      console.error(err)
    })*/
  },
  description: "Review due cards",
  el: "u",
};

const answerButton = (container) => (rating) => {
  const div = document.createElement("div");
  let baseText = Rating[rating].toLowerCase();
  div.classList.add("wrap", "alive", "fsrs", baseText);
  const scheduleInfo = container[fields.kAnswerDues][rating];
  const days = scheduleInfo.card.scheduled_days;
  div.innerHTML = `${baseText}&VeryThinSpace;(${days})`;
  div.addEventListener("click", (ev) => {
    const body = container.querySelector(".body");
    console.info(scheduleInfo);
    manipulation.set(
      container,
      manipulation.fields.kFSRSSchedule,
      scheduleInfo.card,
    );
    save(container);
    body.fsrsQuestions = body.fsrsQuestions.slice(1);
    console.warn(body.fsrsQuestions);
    body.fsrsState = cardStates.kReview;
    renderCard(body);
  });
  return div;
};

const buttonWrapper = (container, buttons) => {
  const id = "fsrs-wrapper";
  let wrapper = container.querySelector(`#${id}`);
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = id;
    container.prepend(wrapper);
  } else {
    wrapper.innerHTML = "";
  }
  for (const button of buttons) {
    wrapper.append(button);
  }
  const hr = document.createElement("hr");
  hr.classList.add("clicky-answer");
  wrapper.append(hr);
};

// TODO I just got this from panel because saving is not properly scoped

const save = (container) => {
  // TODO this is very repeated with isave
  console.log("AAAAEOEOEEOEOEOEOEOEOEOEOEOEOEOEOEOEOEOE");
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

const reveal = (container) => {
  const body = container.querySelector(".body");
  body.fsrsState = cardStates.kAnswer;
  container.onkeydown = container._questionEventListener;
  container._questionEventListener = null;
  renderCard(body);
};

const renderCard = (body) => {
  // By default, assume it is in question
  const atHandle = body.closest(".better-handle");

  console.warn(`state: ${body.fsrsState}`);
  const initialState = body.fsrsState || cardStates.kQuestion;
  const container = body.closest(".body-container");
  if (!body.baseMarkdown) {
    body.baseMarkdown = toMarkdown(body);
  }
  console.warn(body.baseMarkdown);
  if (initialState == cardStates.kEdit) {
    // TODO this is bad, it is not only checking the state but also handling the state machine
    console.warn(body.contentEditable, body.contentEditable == "false");
    if (body.contentEditable == "false" || !body.contentEditable) {
      console.warn("A");
      body.contentEditable = true;
      body.style.cursor = "auto";
      //let markdown = insertAtTop(body.baseMarkdown, [editButtonText, hr]);
      let markdown = body.baseMarkdown;
      parseIntoWrapper(markdown, body, { starting: false, keepStill: true }); // A hack to prevent a cycle of parsing
      // wireEverything is a very hard hammer. Should wire only new panels, will be faster
      wireEverything(weave.buttons(weave.root));
      buttonWrapper(atHandle, [editButton(container)]);
      // There seems to be no onkeydown handler
      container.onkeydown = null;
      container._questionEventListener = null;
    } else {
      console.warn("B");
      body.fsrsState = cardStates.kQuestion;
      renderCard(body);
    }
  }
  if (initialState == cardStates.kReview) {
    const shouldQuery = body.fsrsQuestions[0];
    const filename = manipulation.get(body, manipulation.fields.kFilename);
    console.warn(shouldQuery, filename);
    if (filename != shouldQuery) {
      if (!shouldQuery) {
        console.warn("Closing");
        close_.action(null, body.id);
        return;
      }
      iloadIntoBody(shouldQuery, body, {
        starting: false,
        keepStill: true,
        callback: () => renderCard(body), // FFS
      });
      body.fsrsState = cardStates.kQuestion;
    }
    // The else case should never happen?
  }
  if (initialState == cardStates.kQuestion) {
    if (!body.fsrsQuestions) {
      console.warn("No questions to ask, this should be weird");
      return;
    }
    const split = body.baseMarkdown.split("---");
    let question = split[0];
    let answer = split[1];
    //question = insertAtTop(question, [editButtonText, hr]);

    // Hacked around having a "real markdown" and a "presented markdown", used for raw / unraw for now
    // I need to make sure it is consistent all around though. For now saving updates it, so it's close
    // to being consistent
    parseIntoWrapper(question + "``` .hide" + answer + "```", body, {
      starting: false,
      keepStill: true,
    }); // A hack to prevent a cycle of parsing
    // wireEverything is a very hard hammer. Should wire only new panels, will be faster
    wireEverything(weave.buttons(weave.root));
    buttonWrapper(atHandle, [
      editButton(container),
      goToAnswerButton(container),
    ]);
    const f = fsrs();
    let cardInfo = manipulation.get(body, manipulation.fields.kFSRSSchedule);
    console.warn(cardInfo);
    if (!cardInfo) {
      cardInfo = createEmptyCard(new Date());
      manipulation.set(body, manipulation.fields.kFSRSSchedule, cardInfo);
      console.warn(manipulation.get(body, manipulation.fields.kFSRSSchedule));
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    console.warn(today, new Date(cardInfo.due), new Date(cardInfo.due) > today);
    if (new Date(cardInfo.due) > today) {
      console.error("This is not due today");
      // This is not due to be reviewed "now"
      console.warn(body.fsrsQuestions);
      body.fsrsQuestions = body.fsrsQuestions.slice(1);
      console.warn(body.fsrsQuestions);
      body.fsrsState = cardStates.kReview;
      renderCard(body);
    }

    container[fields.kAnswerDues] = f.repeat(cardInfo, new Date());

    body.contentEditable = false;
    body.style.cursor = "default";
    container._questionEventListener = container.onkeydown;
    container.onkeydown = null;
    container.onkeydown = (ev) => {
      console.warn(ev);
      if (ev.key === "Enter") {
        reveal(container);
      }
    };
    container
      .querySelector(".clicky-answer")
      .addEventListener("click", (ev) => {
        reveal(container);
      });
  }
  if (initialState == cardStates.kAnswer) {
    let markdown = body.baseMarkdown;
    console.warn(markdown);
    /*markdown = insertAtTop(markdown, [
      reviewButtonsText(container[fields.kAnswerDues]),
      hr,
    ]);
    */
    parseIntoWrapper(markdown, body, { starting: false, keepStill: true });
    wireEverything(weave.buttons(weave.root));
    const buttons = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].map(
      (r) => answerButton(container)(r),
    );
    buttonWrapper(atHandle, buttons);
  }
  if (initialState == cardStates.kAdd) {
    console.warn(body.fsrsState);
    // Adding cards. Should have a linked document to store them.
  }
};

const fsrsAddHandler = (body) => {
  // When adding, Cmd-S saves and creates a new identifier for this panel.
  const container = body.closest(".body-container");
  if (!body.fsrsDeck) {
    throw NoDeckError("nothing here");
  }
  const deckBody = document.getElementById(`${body.fsrsDeck}`);
  if (!deckBody) {
    throw NoDeckError(body.fsrsDeck);
  }
  const deckContainer = deckBody.closest(".body-container");
  // Rename the file to "card", save it and add it to the deck
  let filename = manipulation
    .get(body, manipulation.fields.kFilename)
    .replace("f", "c");
  manipulation.set(body, manipulation.fields.kFilename, filename);
  save(container);

  let markdown = toMarkdown(deckBody);
  // Replaces to cID
  markdown = markdown + `\n[[${filename}]]`;
  parseIntoWrapper(markdown, deckBody, { starting: false, keepStill: true });
  save(deckContainer);
  // Now prepare an empty card to add more
  body.innerHTML = "";
  parseInto(emptyCard, body);
  const d = new Date();
  const seconds = d.getTime();

  manipulation.set(body, manipulation.fields.kFilename, `c${seconds}`);
  // TODO this wire everything is becoming a problem
  // This should keep in "add mode"
  body.baseMarkdon = null;
  body.fsrsState = cardStates.kAdd;
  wireEverything(weave.buttons(weave.root));
};

const NoDeckError = (id) => {
  return {
    name: "WeaveFSRSError",
    message: `There is no deck associated to this card (id=${id})`,
  };
};
