export { wireBodies, wireButtons };

import weave from "./weave.js";
import { reset } from "./commands_base.js";
import { toMarkdown, parseInto } from "./parser.js";
import { wireEverything } from "./load.js";
import { loadRow } from "./loadymcloadface.js";
import { enableSelectionOnAll, disableSelectionOnAll } from "./internal.js";

const DEBUG = false;

const wireBodies = (buttons) => {
  for (let body of weave.bodies()) {
    if (!body.clickAttached) {
      body.addEventListener("click", (ev) => {
        if (ev.target.classList.contains("alive")) {
          return;
        }
        weave.internal.held = false;
        reset();
        weave.internal.clickedId.unshift(body.id);
        Array.from(
          document.getElementsByClassName("mildly-highlighted"),
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
        } else {
          weave.internal.cancelShifting = false;
        }
        if (!ev.target.classList.contains("wired")) {
          const wired = document.getElementsByClassName("code wired");
          // Try to undo edit mode
          for (let block of wired) {
            if (block.editing) {
              block.editing = false;
              block.innerText = block.oldText;
            }
          }
        }
      });
      body.clickAttached = true;
    }
    // TODO: check what range.extractContents() can simplify
    body.addEventListener("contextmenu", (ev) => {
      if (ev.target.closest("svg")) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
        }
        return;
      }
      const selection = window.getSelection();
      if (selection.toString() === "") {
        const range = document.createRange();
        range.setStartBefore(ev.target.firstChild);
        range.setEndAfter(ev.target.lastChild);
        wireButtons(buttons)(ev);
      } else {
        wireButtons(buttons)(ev);
      }
    });
    interact(body).on("hold", (ev) => {
      if (ev.target.closest("svg")) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
        }
        return;
      }
      console.info("Wiring on hold");
      weave.internal.held = true;
      const selection = window.getSelection() + "";
      if (selection === "") {
      } else {
        wireButtons(buttons)(ev);
        window.getSelection().removeAllRanges();
      }
    });
    body.addEventListener("paste", (event) => {
      // Paste takes a slight bit to modify the DOM, if I trigger
      // the wiring without waiting a pasted button might not be wired
      // properly.
      console.log(event);
      console.log(event.clipboardData.types);
      const pastedText = event.clipboardData.getData("text/plain");
      console.log(pastedText);
      if (pastedText.startsWith("- f")) {
        // TODO this is very naive, I need better data transfer options
        loadRow(pastedText).then((value) => {
          console.log(value);
          console.info(
            `Loaded ${value.title} in IndexedDB (possibly replacing it)`,
          );
          info.innerHTML = `Added ${value.title}`;
          info.classList.add("fades");
        });
        event.preventDefault();
      }
      const pastedHTML = event.clipboardData.getData("text/html");
      if (pastedHTML) {
        console.log(pastedHTML);
        console.log(pastedHTML.children);
        event.preventDefault();
        if (DEBUG) console.log(pastedHTML);
        if (DEBUG) console.log("This is HTML stuff");
        const div = document.createElement("DIV");
        div.innerHTML = pastedHTML;
        if (pastedHTML.includes("google-sheets-html-origin")) {
          // Hopefully it's a table
          const rowToCSV = (tr) => {
            const tds = Array.from(tr.children);
            let row = [];
            for (const td of tds) {
              row.push(td.textContent);
            }
            return row.join(" | ");
          };
          const trs = Array.from(div.querySelector("tbody").children);
          let rows = [];
          for (const tr of trs) {
            rows.push(rowToCSV(tr));
          }
          const gsheetPaste = rows.join("\n");
          console.log(gsheetPaste);
          FS.writeFile("gsheet", gsheetPaste);
          info.innerHTML = `Pasted from google sheet to filesystem (experimental)`;
          info.classList.add("fades");
          return;
        }
        if (DEBUG) console.log(div);
        const md = toMarkdown(div, true); // this is a fragment
        if (DEBUG) console.log(md);
        div.innerHTML = "";
        parseInto(md, div);
        const selection = window.getSelection();
        let range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(div);
        info.innerHTML = `Converted pasted HTML (experimental)`;
        info.classList.add("fades");
      }
      setTimeout(() => {
        wireEverything(weave.buttons(weave.root));
      }, 100);
    });
  }
};

const wireButtons = (buttons) => (event) => {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
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
  if (DEBUG) console.log("all buttons");
  if (DEBUG) console.log(buttons);
  for (const button of buttons) {
    if (DEBUG) console.log(button);
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
    event.stopPropagation();
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
