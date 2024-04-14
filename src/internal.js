export { hookBodies, enableSelectionOnAll, disableSelectionOnAll, constructCurrentGroup };
import weave from "./weave.js";
import { wireEverything } from "./load.js";
import { reset } from "./commands_base.js";
import { zwsr } from "./doms.js";
import { unrawPane } from "./raw.js";
import { manipulation } from "./panel.js";
import {loadRow} from "./loadymcloadface.js"
import { set } from "./libs/idb-keyval.js";


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
        if (ev.target.classList.contains("alive")) {
          return;
        }
        weave.internal.held = false;
        reset();
        weave.internal.clickedId.unshift(body.id);
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
      const pastedText = event.clipboardData.getData('text/plain');
      if(pastedText.startsWith("- f")){
        // TODO this is very naive, I need better data transfer options
        loadRow(pastedText).then(f => {
          console.log(`Loaded ${f} in IndexedDB (possibly replacing it)`)
          info.innerHTML = `Added ${f}`;
          info.classList.add("fades");})
        event.preventDefault()
      }
      setTimeout(() => {
        wireEverything(weave.buttons(weave.root));
      }, 100);
    });
  }
};

const wireButtons = (buttons) => (event) => {
  const selection = window.getSelection();
  if(!selection){
    return
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

const constructCurrentGroup = () => {
  const current = weave.containers()
  let inSession = []
  for(const container of current){
    const filename = manipulation.get(container, manipulation.fields.kFilename)
    inSession.push(filename)
  }
  const filenames = inSession.join("|")
  return `g:${filenames}`
}
