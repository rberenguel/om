export { div, dndDynamicDiv, dynamicDiv };

import weave from "./weave.js";
import { draggy } from "./betterDragging.js";
import { parseInto, toMarkdown } from "./parser.js";

import { common } from "./commands_base.js";
import { postfix } from "./doms.js";

const div = {
  text: ["div"],
  action: (ev) => {
    if(weave.internal.held === undefined){
    return
    }
    if (common(ev, weave.internal.held)) {
      return;
    }
    const selection = window.getSelection();
    const htmlContainer = document.createElement("div");
    htmlContainer.appendChild(selection.getRangeAt(0).cloneContents());
    const div = dynamicDiv(toMarkdown(htmlContainer));
    let range = selection.getRangeAt(0);
    //const [div, handle] = divWithDraggableHandle();
    //div.classList.add("dynamic-div");
    //div.innerHTML = selectedHTML;
    draggy(div);
    // The following is to remove the phantom divs that can appear when editing in a contenteditable.
    // I mighta s well do this anywhere I manupulate selections too
    // TODO this might backfire if the selection for some reason picks up something else! Test this thing
    const selectionParent = range.commonAncestorContainer.parentNode;
    if (
      selectionParent.nodeName === "DIV" &&
      selectionParent.classList.length == 0
    ) {
      selectionParent.remove();
    }
    range.deleteContents();
    range.insertNode(div);
    // Either I do inline-block and postfix or don't postfix
    postfix(div);
    //addListeners(handle, div, "dynamic-div");
  },
};

const dynamicDiv = (text) => {
  console.info(`Preparing dynamic div with "${text}"`)
  const div = document.createElement("div");
  // First extract the classes present
  const splits = text.split(/\s+/);
  console.log(splits);
  let i = 0,
    classes = [];
  while (splits.length >= i + 1 && splits[i].startsWith(".")) {
    console.log(`Extracted class: ${splits[i]}`);
    classes.push(splits[i].trim());
    i += 1;
  }
  for (const klass of classes) {
    if (klass.startsWith(".")) {
      div.classList.add(klass.slice(1));
    } else {
      div.classList.add(klass);
    }
  }
  div.classList.add("dynamic-div");
  if (div.classList.contains("task")) {
    const label = document.createElement("label");
    label.for = "fakeCheckbox";
    label.classList.add("task-label");
    div.appendChild(label);
    const check = (doIt) => {
      // I'm not using toggle here because it behaves weirdly with how I load divs
      if (doIt) {
        label.classList.add("checked");
        label.closest(".dynamic-div").classList.add("checked");
      } else {
        label.classList.remove("checked");
        label.closest(".dynamic-div").classList.remove("checked");
      }
    };
    if (div.classList.contains("checked")) {
      check(true);
    }
    label.addEventListener("click", (ev) => {
      check(!label.classList.contains("checked"));
      ev.preventDefault();
      ev.stopPropagation();
    });
  }
  const cleanText = splits.slice(i).join(" ").replaceAll("\\n", "\n");
  console.log(`Text ready to be parsed into a div: ${cleanText}`);
  parseInto(cleanText, div);
  //const tn = document.createTextNode(cleanText);
  //div.appendChild(tn);
  draggy(div);
  return div;
};

const dndDynamicDiv = (target, targetBody, dropY) => {
  let childMap = {};
  for (const child of targetBody.children) {
    if (child.classList.contains("div-dnd-placeholder")) {
      continue;
    }
    const childRect = child.getBoundingClientRect();
    const mid = childRect.top + childRect.height / 2;
    // In particular here. I could instead store an array if there are several in the same line
    childMap[mid] = child;
  }
  if (target.parentNode) {
    target.parentNode.removeChild(target);
  }
  const clearStyles = () => {
    target.classList.remove("dragging");
    target.style.transform = "";
  };
  const appendOn = (ancestor) => {
    clearStyles();
    ancestor.appendChild(target);
  };
  const sortedKeys = Array.from(Object.keys(childMap))
    .map((e) => parseFloat(e))
    .sort((a, b) => a - b);

  if (sortedKeys.length == 0) {
    appendOn(targetBody);
    return;
  }
  if (sortedKeys[0] > dropY) {
    const key = sortedKeys[0];
    clearStyles();
    childMap[key].parentNode.insertBefore(target, childMap[key]);
    return;
  }
  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    if (key > dropY) {
      clearStyles();
      childMap[key].parentNode.insertBefore(target, childMap[key]);
      return;
    }
  }
  const key = sortedKeys[sortedKeys.length - 1];
  clearStyles();
  childMap[key].parentNode.appendChild(target);
  return;
};
