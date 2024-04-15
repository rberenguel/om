export { hookBodies, enableSelectionOnAll, disableSelectionOnAll, constructCurrentGroupAsMarkdown, constructCurrentGroup, parseGroupFromMarkdown };
import weave from "./weave.js";
import { wireEverything } from "./load.js";
import { reset } from "./commands_base.js";

import { iloadIntoBody} from "./loadymcloadface.js";
import { unrawPane } from "./raw.js";
import { createPanel } from "./doms.js";
import { manipulation } from "./panel.js";
import {loadRow} from "./loadymcloadface.js"

import { toMarkdown,parseInto } from "./parser.js";


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
          console.debug(
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
      const selection = window.getSelection()+""
      if(selection===""){
      } else {
        wireButtons(buttons)(ev);
        window.getSelection().removeAllRanges();
      }
   });
    body.addEventListener("paste", (event) => {
      // Paste takes a slight bit to modify the DOM, if I trigger
      // the wiring without waiting a pasted button might not be wired
      // properly.
      const pastedText = event.clipboardData.getData('text/plain');
      if(pastedText.startsWith("- f")){
        // TODO this is very naive, I need better data transfer options
        loadRow(pastedText).then(f => {
          console.info(`Loaded ${f} in IndexedDB (possibly replacing it)`)
          info.innerHTML = `Added ${f}`;
          info.classList.add("fades");})
        event.preventDefault()
      }
      const pastedHTML = event.clipboardData.getData('text/html')
      if(pastedHTML){
        event.preventDefault()
        console.log(pastedHTML)
        console.log("This is HTML stuff")
        const div = document.createElement("DIV")
        div.innerHTML = pastedHTML
        console.log(div)
        const md = toMarkdown(div)
        console.log(md)
        div.innerHTML = ""
        parseInto(md, div)
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

const constructCurrentGroupAsMarkdown = () => {
  const current = weave.containers()
  let lines = []
  for(const container of current){
    const filename = manipulation.get(container, manipulation.fields.kFilename)
    const title = manipulation.get(container, manipulation.fields.kTitle)
    lines.push(`# ${filename} (${title})`)
    const x = manipulation.get(container, manipulation.fields.kX)
    lines.push(`${manipulation.fields.kX}: ${x}`)
    const y = manipulation.get(container, manipulation.fields.kY)
    lines.push(`${manipulation.fields.kY}: ${y}`)
    const height = manipulation.get(container, manipulation.fields.kHeight)
    lines.push(`${manipulation.fields.kHeight}: ${height}`)
    const width = manipulation.get(container, manipulation.fields.kWidth)
    lines.push(`${manipulation.fields.kWidth}: ${width}`)
    lines.push("\n")
  }
  for(const arrow of weave.internal.arrows){
    const [srcbid, dstbid] = arrow.split("-");
    const srcCt = document.getElementById(srcbid).closest(".body-container")
    const dstCt = document.getElementById(dstbid).closest(".body-container")
    const srcFn = manipulation.get(srcCt, manipulation.fields.kFilename)
    const dstFn = manipulation.get(dstCt, manipulation.fields.kFilename)
    lines.push(`${srcFn}-${dstFn}`)
  }
  if(weave.internal.arrows.length > 0){
    lines.push("# Arrows")
  }
  return lines.join("\n")
}

const parseGroupFromMarkdown = (text) => {
  let n = 0
  let fileBodyMap = {}
  let arrowMode = false
  const lines = text.split("\n").filter(l => l.trim().length > 0)
  for(const line of lines){
    if(line.startsWith("# f")){
      // Parsing a file, matches the above
      const filename = line.split(" ")[1]
      const bodyId = `b${n}`; // TODO NO, this is not good enough
      createPanel(weave.root, bodyId, weave.buttons(weave.root), weave);
      const body = document.getElementById(bodyId);
      console.info(`Loading ${filename}`);
      iloadIntoBody(filename, body);
      fileBodyMap[filename] = bodyId
      n+=1
      // TODO this should start file details state, doesn't yet
    }
    if(arrowMode){
      const [srcFn, dstFn] = line.split("-");
      const srcB = fileBodyMap[srcFn]
      const dstB = fileBodyMap[dstFn]
      weave.internal.arrows.push(`${srcB}-${dstB}`)
    }
    if(line === "# Arrows"){
      arrowMode = true
    }
  }
}

const constructCurrentGroup = () => {
  console.log(constructCurrentGroupAsMarkdown())
  const current = weave.containers()
  let inSession = []
  for(const container of current){
    const filename = manipulation.get(container, manipulation.fields.kFilename)
    inSession.push(filename)
  }
  const filenames = inSession.join("|")
  return `g:${filenames}`
}
