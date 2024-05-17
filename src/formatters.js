export {
  headers,
  code,
  lists,
  link,
  hr,
  mono,
  gfont,
  serif,
  fontup,
  fontdown,
  underline,
  italic,
  bold,
};

import weave from "./weave.js";
import { common } from "./commands_base.js";
import { addGoogFont } from "./load.js";
import {
  iloadIntoBody,
  presentFiles,
  convertNonGroupFileData,
} from "./loadymcloadface.js";
import { entries } from "./libs/idb-keyval.js";
import { toMarkdown } from "./parser.js";
import { showModalAndGet } from "./save.js";
import { postfix, toTop } from "./doms.js";
import { createPanel } from "./panel.js";

const underline = {
  text: ["underline", "u"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    document.execCommand("underline", false, null);
  },
  description: "Underline the selected text",
  el: "u",
};

// TODO: document.execCommand is deprecated. I could do the same by playing with selections and ranges.
const italic = {
  text: ["italic", "i"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    document.execCommand("italic", false, null);
  },
  description: "Italicize the selected text",
  el: "i",
};

const bold = {
  text: ["bold", "b"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    document.execCommand("bold", false, null);
  },
  description: "Bold the selected text",
  el: "b",
};

const fontup = {
  text: ["font+", "f+"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const prevBody = document.getElementById(weave.internal.bodyClicks[0]);
    weave.internal.bodyClicks.unshift(weave.internal.bodyClicks[0]); // This is to allow resizing forever
    const fontSize = getComputedStyle(prevBody).fontSize;
    const newFontSize = parseFloat(fontSize) + 2;
    prevBody.style.fontSize = `${newFontSize}px`;
    ev.stopPropagation();
  },
  description: "Increase the document font by 2 pixels (stored in config)",
  el: "u",
};

const fontdown = {
  text: ["font-", "f-"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const prevBody = document.getElementById(weave.internal.bodyClicks[0]);
    weave.internal.bodyClicks.unshift(weave.internal.bodyClicks[0]); // This is to allow resizing forever
    console.log("Copied previous body");
    const fontSize = getComputedStyle(prevBody).fontSize;
    const newFontSize = parseFloat(fontSize) - 2;
    prevBody.style.fontSize = `${newFontSize}px`;
    weave.internal.cancelShifting = true;
  },
  description: "Decrease the document font by 2 pixels (stored in config)",
  el: "u",
};

const serif = {
  text: ["serif"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    body.classList.add("serif");
    body.classList.remove("mono");
    // TODO(me) Does this really need to be stored in config at all? It's part of the saved styling after all
    // config.mono = true;
  },
  description: "Switch to a serif font (Reforma1969) (stored in config)",
  el: "u",
};

const mono = {
  text: ["mono"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    body.classList.remove("serif");
    body.classList.add("mono");

    // TODO(me) This is still pending discussion with myself
    //config.mono = true;
  },
  description: "Switch to a monospace font (Monoid) (stored in config)",
  el: "u",
};

const gfont = {
  text: ["gfont"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const selection = window.getSelection() + "";
    const fontname = selection.replace(" ", "+");
    addGoogFont(fontname);
    const body = document.getElementById(weave.internal.bodyClicks[1]);
    body.style.fontFamily = selection;
    body.dataset.gfont = fontname;
  },
  description: "Fetch a font from Google Fonts and set it on a panel",
  el: "u",
};

const hr = {
  text: ["---"],
  creator: () => {
    const selection = window.getSelection();
    let range = selection.getRangeAt(0);
    range.deleteContents();
    const hr = document.createElement("hr");
    range.insertNode(hr);
    // TODO This is not working reliably, commented
    //const sib = hr.previousElementSibling
    //const emptyText = sib != null && sib.nodeName === "#text" && sib.textContent === ""
    //console.log(sib)
    //if(sib === null || emptyText){
    //  prefix(hr)
    //}
    //postfix(hr);
    prefix(hr);
    postfix(hr);
  },
  action: (ev) => {},
  el: "hr",
};

const link = {
  text: ["link"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const selection = window.getSelection();
    const text = selection + "";
    const range = selection.getRangeAt(0);
    console.log(range);
    const link = document.createElement("a");
    range.deleteContents();
    range.insertNode(link);
    // TODO this screws up cancelling linking
    const showModalHandler = (keys) => (destination) => {
      if (!destination) {
        return;
      }
      link.title = text;
      link.innerText = text;
      let href;
      if (keys.includes(destination)) {
        href = destination;
        link.dataset.internal = true;
        link.textContent = weave.internal.fileTitles[destination];
      } else {
        if (destination.startsWith("http")) {
          href = destination;
        } else {
          href = "https://" + destination;
        }
        link.dataset.internal = false;
      }
      link.href = href;
      //postfix(link);
      link.addEventListener("click", (ev) => {
        ev.preventDefault(); // Prevent default navigation
        ev.stopPropagation();
        const href = ev.target.getAttribute("href"); // To avoid issues with no-protocol
        if (JSON.parse(link.dataset.internal)) {
          const n = weave.bodies().length;
          const bodyId = `b${n}`; // TODO NO, this is not good enough
          createPanel(weave.root, bodyId, weave.buttons(weave.root), weave);
          const body = document.getElementById(bodyId);
          console.log(link);
          iloadIntoBody(href, body);
          toTop(body)();
        } else {
          window.open(href, "_blank");
        }
      });
    };
    const modal = document.getElementById("modal");
    const fileContainer = document.createElement("div");
    fileContainer.id = "fileContainer";
    modal.append(fileContainer);
    entries().then((entries) => {
      const keys = entries.map(([key, value]) => key);
      const files = entries
        .filter(([key, value]) => value && !value.startsWith("g:"))
        .map(([key, value]) => convertNonGroupFileData(key, value));
      console.log(files);
      presentFiles(files, fileContainer);

      const hr = document.createElement("hr");
      modal.appendChild(hr);
      showModalAndGet(
        "where to?",
        fileContainer,
        "name:",
        showModalHandler(keys),
        { dbsearching: true },
      );
    });

    /*
    const selectionParent = range.commonAncestorContainer.parentNode;
    if (
      selectionParent.nodeName === "DIV" &&
      selectionParent.classList.length == 0
    ) {
      selectionParent.remove();
    }*/
  },
};

const headers = {
  matcher: /h[1-4]/,
  action: (match) => (ev) => {
    const selection = window.getSelection();
    // TODO by how I process parsing, I don't allow nested stuff in headers
    const text = selection + "";
    const h = document.createElement(match);
    h.innerText = text;
    let range = selection.getRangeAt(0);

    range.deleteContents();
    range.insertNode(h);
  },
  description: "Headers",
};

const code = {
  text: ["code"],
  action: (ev) => {
    const selection = window.getSelection();
    const text = selection + "";
    if (
      selection.anchorNode.parentNode &&
      selection.anchorNode.parentNode.nodeName === "PRE"
    ) {
      const parent = selection.anchorNode.parentNode;
      const div = document.createElement("div");
      const granny = parent.parentNode;
      div.innerText = text;
      console.log("Granny");
      console.log(granny);
      granny.insertBefore(div, parent.nextSibling);
      parent.remove();
    } else {
      const pre = document.createElement("pre");
      pre.innerText = text; // This might need tweaking due to nested crap
      let range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(pre);
      hilite();
    }
  },
  description: "Code block/uncode block",
};

const lists = {
  text: ["list"],
  action: (ev) => {
    const selection = window.getSelection();
    const text = selection + "";
    const lines = text.split("\n");
    const liNode =
      selection.anchorNode.parentNode &&
      selection.anchorNode.parentNode.nodeName === "LI";
    console.log(lines);
    console.log(selection.anchorNode.parentNode);
    if (lines.length == 1 && liNode) {
      // Our selection is on a single node and we want to un-list it,
      // potentially
      console.log("Single node, unlisting");
      const parent = selection.anchorNode.parentNode;
      const div = document.createElement("div");
      const granny = parent.parentNode;
      let txt = selection.anchorNode.textContent;
      if (text.length == 0) {
        txt = " ";
      }
      div.textContent = txt;
      console.log(selection.anchorNode);
      granny.insertBefore(div, parent.nextSibling);
      parent.remove();
      return;
    }

    if (lines.length > 0 && !liNode) {
      // We have selected several nodes, and the base node parent
      // is not a list: we
      const div = document.createElement("div");
      const cont = document.createElement("div");
      let range = selection.getRangeAt(0);
      const frag = range.cloneContents();
      cont.appendChild(frag);
      console.log(cont.textContent);
      console.log("All:");
      console.log(cont.children);
      console.log(cont.childNodes);
      for (const child of Array.from(cont.childNodes)) {
        const li = document.createElement("li");
        if (child.nodeName === "DIV" && child.classList.length == 0) {
          const span = document.createElement("span");
          Array.from(child.childNodes).forEach((c) => span.appendChild(c));
          li.appendChild(span);
        } else {
          li.appendChild(child); // This might need tweaking due to nested crap
        }
        div.appendChild(li);
      }
      range.deleteContents();
      range.insertNode(div);
      return;
    }
    if (
      selection.anchorNode.parentNode &&
      selection.anchorNode.parentNode.nodeName === "LI"
    ) {
      const htmlContainer = document.createElement("div");
      htmlContainer.appendChild(selection.getRangeAt(0).cloneContents());
      const div = document.createElement("div");
      const newContent = toMarkdown(htmlContainer).replace(/^- /gm, "");
      const fixed = newContent.split("\n").join("\n<br/>\n");
      console.log(fixed);
      parseInto(fixed, div);
      let range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(div);
    }
  },
  description: "Code block/uncode block",
};
