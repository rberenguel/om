export {
  addSelectedTextTo,
  createButton,
  events,
  stringDiffer,
  assertTwoWayConversion,
};
import weave from "../src/weave.js";
import { parseIntoWrapper, toMarkdown } from "../src/parser.js";
import { wireEverything } from "../src/load.js";
const stringDiffer = (s1, s2) => {
  console.log(`Lengths: ${s1.length}, ${s2.length}`);
  const mlen = Math.min(s1.length, s2.length);
  let diff = false;
  for (let i = 0; i < mlen; i++) {
    if (s1[i] === s2[i]) {
      continue;
    } else {
      console.log(
        `First differing charatcter is at index ${i}, ${s1[i]} !=  ${s2[i]} `,
      );
      diff = true;
    }
  }

  if (diff) {
    console.log(s1);
    console.log(s2);
  }
};

const assertTwoWayConversion = (body) => {
  const md1 = toMarkdown(body);
  parseIntoWrapper(md1, body);
  const md2 = toMarkdown(body);
  stringDiffer(md1, md2);
  wireEverything(weave.buttons(weave.root));
  chai.expect(md1).to.equal(md2);
};

const addSelectedTextTo = (text, destination) => {
  let first, last;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let node;
    const textNode = document.createTextNode(lines[i]);
    if (i == 0) {
      first = textNode;
    }
    if (i == lines.length - 1) {
      last = textNode;
    }
    if (i == 0) {
      node = textNode;
    } else {
      const div = document.createElement("div");
      div.appendChild(textNode);
      node = div;
    }
    destination.appendChild(node);
  }

  const selection = window.getSelection();
  selection.removeAllRanges();
  const range = document.createRange();
  range.setStartBefore(first);
  range.setEndAfter(last);
  selection.addRange(range);
};

const createButton = (text, panelBody) => {
  addSelectedTextTo(text, panelBody);
  const contextMenuEvent = new CustomEvent("contextmenu");
  panelBody.dispatchEvent(contextMenuEvent);
};

const events = {
  mousedown: new MouseEvent("mousedown"),
  click: new MouseEvent("click"),
};
