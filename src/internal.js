import weave from "./weave.js";
import { wireEverything } from "./load.js";
export { hookBodies, enableSelectionOnAll, disableSelectionOnAll };
import { reset } from "./commands_base.js";
import { saveAll } from "./save.js";
import { zwsr } from "./doms.js";
import { unrawPane } from "./raw.js";

const enableSelectionOnAll = () => {
  const containers = document.getElementsByClassName("body-container");
  for (const container of containers) {
    container.classList.remove("no-select");
  }
};

const disableSelectionOnAll = () => {
  const containers = document.getElementsByClassName("body-container");
  for (const container of containers) {
    container.classList.add("no-select");
  }
};

const hookBodies = (buttons) => {
  for (let body of weave.bodies()) {
    if (!body.clickAttached) {
      //body.addEventListener("mousedown", ())
      body.addEventListener("click", (ev) => {
        console.log("Click handler on body");
        console.log(ev.target);
        if (ev.target.classList.contains("alive")) {
          return;
        }
        weave.internal.held = false;
        reset();
        weave.internal.clickedId.unshift(body.id);
        console.log(body.closest(".body-container").classList);
        Array.from(
          document.getElementsByClassName("mildly-highlighted")
        ).forEach((e) => e.classList.remove("mildly-highlighted"));
        weave.internal.clickedId.length = 2;
        if (weave.internal.grouping) {
          if (weave.internal.group.has(body.id)) {
            weave.internal.group.delete(body.id);
            body.closest(".body-container").classList.remove("selected");
          } else {
            weave.internal.group.add(body.id);
            body.closest(".body-container").classList.add("selected");
          }
        } else {
          body.closest(".body-container").classList.add("mildly-highlighted");
        }
        if (!weave.internal.cancelShifting) {
          weave.internal.bodyClicks.unshift(body.id);
          weave.internal.bodyClicks.length = 2;
          console.log(`Shifted previous: ${weave.internal.bodyClicks}`);
        } else {
          weave.internal.cancelShifting = false;
        }
        if (!ev.target.classList.contains("wired")) {
          const wired = document.getElementsByClassName("code wired");
          console.log(wired);
          // Try to undo edit mode
          for (let block of wired) {
            console.log(block);
            if (block.editing) {
              block.editing = false;
              block.innerText = block.oldText;
            }
          }
        }
      });
      body.clickAttached = true;
    }
    if (!body.dblClickAttached) {
      interact(body.parentElement).on("doubletap", (ev) => {
        const container = body.closest(".body-container");
        if (ev.target === body || body.contains(ev.target)) {
          // This should be the body proper only
          return;
        }
        const selection = window
          .getSelection()
          .toString()
          .replace(/\s+/g, "").length;
        if (selection.length > 0) {
          console.log(
            `You have selected something ('${selection}'), not folding`
          );
          return;
        } else {
          if (container.raw) {
            unrawPane(body, container);
            return;
          }
          if (!weave.internal.preventFolding) {
            body.classList.toggle("folded");
            // TODO All these should be part of a method that is then reused when loading the folded state
            container.classList.toggle("folded-bc");
            container.classList.toggle("unfit");
            if (body.classList.contains("folded")) {
              // Just folded everything. Need to preserve the height of the container before folding
              body.dataset.unfoldedHeight = container.style.height;
              container.style.height = "";
              interact(container)
                .resizable({
                  edges: { top: false, left: true, bottom: false, right: true },
                })
                .draggable({
                  autoscroll: false,
                  listeners: {
                    start(event) {
                      disableSelectionOnAll();
                    },
                    end(event) {
                      enableSelectionOnAll();
                    },
                  },
                });
              //body.style.height = "1.5em";
            } else {
              container.style.height = body.dataset.unfoldedHeight;
              interact(container)
                .resizable({
                  edges: { top: true, left: true, bottom: true, right: true },
                })
                .draggable({
                  autoscroll: false,
                  listeners: {
                    start(event) {
                      disableSelectionOnAll();
                    },
                    end(event) {
                      enableSelectionOnAll();
                    },
                  },
                });
            }
          } else {
            weave.internal.preventFolding = false;
          }
        }
      });
      body.dblClickAttached = true;
    }

    body.addEventListener("contextmenu", wireButtons(buttons));
    interact(body).on("hold", (ev) => {
      weave.internal.held = true
      wireButtons(buttons)(ev);
      window.getSelection().removeAllRanges();
    });
    body.addEventListener("paste", (event) => {
      // Paste takes a slight bit to modify the DOM, if I trigger
      // the wiring without waiting a pasted button might not be wired
      // properly.
      setTimeout(() => {
        wireEverything(weave.buttons(weave.root));
      }, 100);
    });
  }
};

const wireButtons = (buttons) => (event) => {
  const selection = window.getSelection();
  const selectedText = selection.toString().toLowerCase();
  console.info(`Wiring button for ${selectedText}`);
  const range = selection.getRangeAt(0);
  if (
    event.srcElement.classList.length > 0 &&
    event.srcElement.classList.contains("alive")
  ) {
    return;
  }
  let node, result;
  console.log(buttons);
  for (let button of buttons) {
    if (button.matcher && button.matcher.test(selectedText)) {
      if (button.creator) {
        event.preventDefault();
        // An override to have autoformatted selections
        button.creator();
        return;
      }
      result = button;
      node = button.el
        ? document.createElement(button.el)
        : document.createElement("span");
      break;
    }
    if (button.text && button.text.includes(`${selectedText}`)) {
      if (button.creator) {
        event.preventDefault();
        // An override to have autoformatted selections
        button.creator();
        return;
      }
      result = button;
      node = button.el
        ? document.createElement(button.el)
        : document.createElement("span");
      break;
    }
  }

  if (node) {
    // The event needs to be stopped _if_ we successfully generated a button
    event.preventDefault();
    let div = document.createElement("div");
    node.innerHTML = `${selectedText}`.trim();
    div.contentEditable = false;
    if (result.matcher) {
      div.addEventListener("mousedown", result.action(selectedText));
    } else {
      div.addEventListener("mousedown", result.action);
    }

    div.alive = true;
    node.alive = true;
    // TODO I don't have all this prevention when I rewire everything?
    div.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
    });
    div.addEventListener("dblclick", (ev) => {
      console.log("Preventing folding");
      weave.internal.preventFolding = true;
    });
    node.dataset.action = `${selectedText}`;
    div.classList.toggle("wrap");
    node.classList.toggle("alive");
    range.deleteContents();
    div.appendChild(node);
    range.insertNode(div);
    div.insertAdjacentHTML("beforebegin", "&thinsp;");
    div.insertAdjacentHTML("afterend", "&thinsp;");
  }
};

/*

Removing the whole keyboard-driven state machine

let keyStack = {};
let listing = {};
const hookBody = (body) => {
  keyStack[body.id] = ["Enter"]; // TODO Fishy on load though
  listing[body.id] = false; // TODO Horrible state machine
  body.addEventListener("keyup", (event) => {
    const ek = event.key; // TODO ref
    if (event.ctrlKey && event.key === "s") {
      saveAll();
    } else {
      if (event.key !== "Control") {
        reset();
      }
    }
    if (!["-", "Enter", " ", "#", "Shift", "`"].includes(ek)) {
      keyStack[body.id] = [];
    }

    const deleteCurrentWord = (selection) => {
      selection.extend(selection.anchorNode, 0);
      let range = selection.getRangeAt(0);
      range.deleteContents();
      return range;
    };
    //console.log(event.key);
    //console.log(keyStack);
    if (event.key === "-") {
      // State machine for lists and horizontal separators.
      // Keeps track of state in keyStack.
      if (keyStack[body.id][0] == "Enter") {
        keyStack[body.id].push("-");
        if (keyStack[body.id].slice(1).join("") === "---") {
          const zws = zwsr();
          keyStack[body.id] = ["Enter"]; // We want possibly lists in this case
          const selection = window.getSelection();
          let range = deleteCurrentWord(selection);
          const hr = document.createElement("hr");
          range.insertNode(zws);
          range.insertNode(hr);
          let newRange = document.createRange();
          newRange.setStartAfter(zws);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
        }
      }
    }
    if (event.key === "#") {
      // State machine for headings
      if (keyStack[body.id][0] == "Enter") {
        console.log("Pushed");
        keyStack[body.id].push("#");
      }
    }
    if (event.key === "`") {
      // State machine for code blocks
      if (keyStack[body.id][0] == "Enter") {
        keyStack[body.id].push("`");
      }
    }
    if (event.key === "Enter") {
      //hilite();
      const selection = window.getSelection();
      if (listing[body.id] && keyStack[body.id].length == 0) {
        // Push the anchor where we pressed enter.
        // This is useful if we want to delete up to here.
        const range = selection.getRangeAt(0);
        listing[body.id].push(selection.anchorNode); // That should be the li
      }
      if (
        keyStack[body.id].length &&
        keyStack[body.id][0] == "Enter" &&
        listing[body.id]
      ) {
        // Deletion mode after an empty list item (i.e. we have written a few list items, press Enter
        // which starts a new list item which we do not want).
        const zws = zwsr();
        let range = document.createRange();
        range.setStartBefore(listing[body.id][listing[body.id].length - 1]); //selection.anchorNode)
        range.setEndAfter(selection.anchorNode);
        range.deleteContents();
        // Zero width space, TODO: remove on save
        range.insertNode(zws);
        selection.removeAllRanges();
        range.setStartAfter(zws); //listing[0]);
        selection.addRange(range);
        listing[body.id] = false; // Hah!
      }
      if (!listing[body.id] && selection.anchorNode.nodeName == "LI") {
        listing[body.id] = [selection.anchorNode];
      }
      keyStack[body.id] = [];
      keyStack[body.id].push("Enter");
    }
    if (event.key === " ") {
      if (
        keyStack[body.id][0] == "Enter" &&
        keyStack[body.id].slice(1)[0] == "#"
      ) {
        const hashes = keyStack[body.id]
          .slice(1)
          .filter((c) => c == "#").length;
        const headingLevel = Math.min(hashes, 6);
        const selection = window.getSelection();
        const zws = zwsr();
        let range = deleteCurrentWord(selection);
        let heading = document.createElement(`h${headingLevel}`);
        heading.appendChild(zws);
        range.insertNode(heading);
        range.collapse(false);
        let newRange = document.createRange();
        newRange.setStartAfter(heading);
        selection.removeAllRanges();
        selection.addRange(newRange);
        keyStack[body.id] = [];
      }
      if (
        keyStack[body.id].length == 4 &&
        keyStack[body.id].slice(1).join("") === "```"
      ) {
        console.log("Code block");
        // This is almost verbatim what I have for li and for h*
        const selection = window.getSelection();
        const zws = zwsr();
        let range = deleteCurrentWord(selection);
        let pre = document.createElement("pre");
        let div = document.createElement("div");
        div.appendChild(zwsr());
        pre.appendChild(zws);
        range.insertNode(div);
        //range.insertNode(pre);
        body.insertBefore(pre, div);
        range.collapse(false);
        let newRange = document.createRange();
        newRange.setStartBefore(pre);
        selection.removeAllRanges();
        selection.addRange(newRange);
        keyStack[body.id] = [];
      }
      if (keyStack[body.id][0] == "Enter" && keyStack[body.id][1] == "-") {
        // We have pressed "enter - space", meaning, we want a list.
        // Delete the current text (the - space part) and insert a
        // list item with a zero-width-space to place the cursor where
        // we want.
        const selection = window.getSelection();
        const zws = zwsr();
        let range = deleteCurrentWord(selection);
        li = document.createElement("li");
        li.appendChild(zws);
        range.insertNode(li);
        range.collapse(false);
        let newRange = document.createRange();
        newRange.setStartAfter(li);
        selection.removeAllRanges();
        selection.addRange(newRange);
        listing[body.id] = [li];
        keyStack[body.id] = [];
      }
    }
  });
};
*/
