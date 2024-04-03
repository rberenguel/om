export { buttons };

import weave from "./weave.js";
import { createPanel, postfix, prefix } from "./doms.js";
import { common } from "./commands_base.js";
import { configLevels } from "./common.js";
import { wireEverything } from "./load.js";
import { manipulation } from "./panel.js";
import { parseIntoWrapper, parseInto, toMarkdown } from "./parser.js";
import { get, keys, del, set, entries } from "./libs/idb-keyval.js";
import { enterKeyDownEvent } from "./commands_base.js";
import { toTop } from "./doms.js";
import { iload, iloadIntoBody, gload } from "./loadymcloadface.js";
import { presentFiles } from "./loadymcloadface.js";
// Buttons
import { div } from "./dynamicdiv.js";
import {
  saveAll_,
  save,
  isave,
  gsave,
  showModalAndGetFilename,
} from "./save.js";
import { addGoogFont } from "./load.js";
import { jazz } from "./jazz.js";
import { GuillotineJS } from "./guillotine.js";
import { id, eval_, sql } from "./code.js";
import { raw } from "./raw.js";
import { hilite } from "./highlight.js";
weave.idb = {
  keys: () => {
    keys().then((keys) => (weave.idb.allKeys = keys));
    return weave.idb.allKeys;
  },
  del: (key) => {
    del(key);
  },
  set: set,
};

weave.internal.manipulation = manipulation;
weave.internal.toMD = toMarkdown;

/* Investigating notifications

function requestAndTriggerNotification() {
  Notification.requestPermission().then(function(result) {
    if (result === 'granted') {
      // Permission granted, trigger the notification
      var notification = new Notification('Test Notification', {
        body: 'Hello there! This is a sample notification.',
        icon: 'http://mostlymaths.net/weave/src/media/icon.png', // Replace with the path to your icon, if you have one
        requireInteraction: true
      }); 
    }
  });
}

weave.internal.triggerNotif = requestAndTriggerNotification
document.body.onclick = w.internal.triggerNotif

*/

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
      div.innerText = selection.anchorNode.textContent;
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
      const frag = range.cloneContents()
      cont.appendChild(frag)
      console.log(cont.textContent)
      console.log("All:")
      console.log(cont.children)
      console.log(cont.childNodes)
      for (const child of Array.from(cont.childNodes)) {
        console.log("Child")
        console.log(child)
        const li = document.createElement("li");
        li.appendChild(child); // This might need tweaking due to nested crap
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

const getAllThingsAsStrings = {
  text: ["pbcopy"],
  action: (ev) => {
    entries().then((entries) => {
      let lines = [];
      for (const [key, value] of entries) {
        lines.push(`- ${key}: ${value}`);
      }
      navigator.clipboard.writeText(lines.join("\n"));
    });
  },
  description: "Copy whole database to clipboard",
  el: "u",
};

//weave.internal.getAll = getAllThingsAsStrings
const dbdump = {
  text: ["dbdump", "dumpdb"],
  action: (ev) => {
    entries().then((entries) => {
      let lines = [];
      for (const [key, value] of entries) {
        lines.push(`- ${key}: ${value}`);
      }
      const fileBlob = new Blob([lines.join("\n")], {
        type: "application/octet-stream;charset=utf-8",
      });
      const url = URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "weave.db";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  },
  description: "Copy whole database to clipboard",
  el: "u",
};

const link = {
  text: ["link"],
  action: (ev) => {
    const selection = window.getSelection();
    const text = selection + "";
    let range = selection.getRangeAt(0);
    const modal = document.getElementById("modal");
    const fileContainer = document.createElement("div");
    fileContainer.id = "fileContainer";
    modal.append(fileContainer);
    entries().then((entries) => {
      const keys = entries.map(([key, value]) => key);
      const files = entries
        .filter(([key, value]) => !value.startsWith("g:"))
        .map(([key, value]) => key);
      console.log(files);
      presentFiles(files, fileContainer);

      const hr = document.createElement("hr");
      modal.appendChild(hr);
      showModalAndGetFilename(
        "where to?",
        fileContainer,
        "name:",
        (destination) => {
          if (!destination) {
            return;
          }
          const link = document.createElement("a");
          link.title = text;
          link.innerText = text;
          let href;
          if (keys.includes(destination)) {
            href = destination;
            link.dataset.internal = true;
          } else {
            if (destination.startsWith("http")) {
              href = destination;
            } else {
              href = "https://" + destination;
            }
            link.dataset.internal = false;
          }
          link.href = href;
          range.deleteContents();
          range.insertNode(link);
          postfix(link);
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
              toTop(body);
            } else {
              window.open(href, "_blank");
            }
          });
        },
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

const reparse = {
  text: ["reparse"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    const container = body.closest(".body-container");
    parseIntoWrapper(toMarkdown(body), body);
    wireEverything(weave.buttons(weave.root));
  },
  description: "Reparses the current panel through a fake markdown conversion",
  el: "u",
};

const grouping = {
  text: ["group"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    if (weave.internal.grouping) {
      weave.internal.grouping = false;
      Array.from(document.getElementsByClassName("selected")).forEach((e) =>
        e.classList.remove("selected"),
      );

      info.innerHTML = "grouped";
      info.classList.add("fades");
    } else {
      weave.internal.grouping = true;
      weave.internal.group = new Set();
      info.innerHTML = "grouping";
      info.classList.add("fades");
    }
  },
  description: "Group panels",
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

const guillotine = {
  text: ["guillotine"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    GuillotineJS(true);
  },
  description: "Start GuillotineJS",
  el: "u",
};

const pin = {
  text: ["pin"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    const container = body.closest(".body-container");
    manipulation.forcePositionToReality(container);
    manipulation.forceSizeToReality(container);

    // TODO(me) This is still pending discussion with myself
    //config.mono = true;
  },
  description: "Pin to real position to fix a temporary problem",
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

const helpDiv = document.querySelector("#help");

helpDiv.addEventListener("mousedown", (ev) => {
  if (ev.button !== 0) {
    return;
  }
  helpDiv.style.display = "none";
  document.getElementById("content").classList.remove("blur");
});

const help = {
  text: ["help"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    helpDiv.style.display = "block";
    document.getElementById("content").classList.add("blur");
  },
  description: "Display help",
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

const newSession = {
  text: ["new"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    Array.from(document.getElementsByClassName("body-container")).map((e) =>
      e.remove(),
    );
    weave.createPanel(weave.root, "b0", weave.buttons(weave.root), weave);
  },
  description: "Erase everything, no confirmation",
  el: "u",
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

function printDiv(divId) {
  const divElement = document.getElementById(divId);
  // TODO(me) Needs heavy work in styling, based on the chosen font (and font size?)
  const printWindow = window.open("", "", "height=400,width=600");
  printWindow.document.write("<html><head><title>Print</title>");
  printWindow.document.write();
  printWindow.document.write("</head><body>");
  printWindow.document.write(divElement.innerHTML);
  printWindow.document.write("</body></html>");
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

const close_ = {
  text: ["close", "❌"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    // TODO(me) I'm pretty sure closing-saving-loading would fail
    // if I delete an intermediate panel, needs some test
    const bodyToRemove = document.getElementById(weave.internal.bodyClicks[0]);
    const container = bodyToRemove.closest(".body-container");
    const parent = container.parentNode;
    parent.removeChild(container);
  },
  description: "Eliminate a panel",
  el: "u",
};

const clear = {
  text: ["clear", "💨"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const divToClear = document.getElementById(weave.internal.bodyClicks[0]);
    divToClear.innerHTML = "";
  },
  description: "Fully eliminate content of a panel",
  el: "u",
};

const print_ = {
  text: ["print", "🖨️"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    printDiv(weave.internal.bodyClicks[0]);
  },
  description: "Trigger the print dialog",
  el: "u",
};

const title = {
  text: ["title"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    const selection = window.getSelection() + "";
    const body = document.getElementById(weave.internal.bodyClicks[1]);
    body.dataset.filename = selection;
  },
  description: "Sets the title of this pane. Useful to store menus in the URL",
  el: "u",
};

const dbload = {
  text: ["dbload", "loaddb"],
  action: (ev) => {
    filePicker.click();
  },
  description: "Load a pane to disk, you won't be choosing where though",
  el: "u",
};

const filePicker = document.getElementById("filePicker");

const idel = {
  text: ["idel"],
  action: (ev) => {
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    entries().then((entries) => {
      console.log(entries);
      for (const [key, value] of entries) {
        const k = document.createTextNode(key);
        const div = document.createElement("div");
        div.appendChild(k);
        const modal = document.getElementById("modal");
        modal.appendChild(div);
        div.addEventListener("click", (ev) => {
          del(key);
        });
      }
      modal.style.display = "block";
      // TODO dismiss modal in this case
    });
  },
  description: "Delete stuff from IndexedDB",
  el: "u",
};

const loadFromContent = (content, filename, body) => {
  console.log(decodeURIComponent(content));
  const base64Data = content.split(",")[1];
  console.log(base64Data);
  const decoded = decodeURIComponent(content);
  console.log(decoded);
  try {
    const b = JSON.parse(decoded);
    // TODO(me) This is now repeated when we load everything, too
    console.log(weave.internal.bodyClicks);
    body.dataset.filename = filename;
    body.innerHTML = b["data"];
    body.style.width = b["width"];
    body.style.height = b["height"];
    if (b["folded"]) {
      body.classList.add("folded");
    }
    body.style.fontSize = b["fontSize"];
    body.style.fontFamily = b["fontFamily"];
    if (b["gfont"]) {
      addGoogFont(b["gfont"]);
    }
    wireEverything(weave.buttons(weave.root));
  } catch (error) {
    console.error("Error parsing JSON data or building the panels", error);
  }
};

// Kinda deprecated
filePicker.addEventListener("change", (event) => {
  const file = event.target.files[0];

  const reader = new FileReader();
  reader.readAsText(file, "UTF-8");

  reader.onload = (readerEvent) => {
    const content = readerEvent.target.result;
    console.log(content);
    for (const line of content.split("\n")) {
      const splits = line.split(" ");
      const filename = splits[1].slice(0, -1);
      const data = splits[2];
      set(filename, data)
        .then(() => console.log(`Data for ${filename} stored in IndexedDb`))
        .catch((err) =>
          console.log(`Saving in IndexedDb failed for ${filename}`, err),
        );
    }
  };
});

const split = (parentId) => {
  return {
    text: ["split"],
    action: (ev) => {
      console.info(`Splitting for parentId: ${parentId}`);
      if (common(ev)) {
        return;
      }
      const n = weave.bodies().length;
      const id = `b${n}`; // TODO: This will work _badly_ with deletions
      // This is now repeated!
      createPanel(parentId, id, weave.buttons(weave.root), weave); // I might as well send everything once?
    },
    description: "Add a new editing buffer",
    el: "u",
  };
};

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

const dark = {
  text: ["dark"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    for (let body of weave.bodies()) {
      body.classList.add("dark");
      body.classList.remove("light");
    }
    for (let container of weave.containers()) {
      container.classList.add("dark");
      container.classList.remove("light");
    }
    weave.config.dark = true;
    let target = document.getElementById(weave.root);
    if (document.body.id == "weave") {
      target = document.body;
    }
    target.classList.remove("outer-light");
    target.classList.add("outer-dark");
  },
  description: "Switch to dark mode (stored in config)",
  el: "u",
  config: configLevels.kGlobalConfig,
};

const light = {
  text: ["light"],
  action: (ev) => {
    if (common(ev)) {
      return;
    }
    for (let body of weave.bodies()) {
      body.classList.add("light");
      body.classList.remove("dark");
    }
    for (let container of weave.containers()) {
      container.classList.add("light");
      container.classList.remove("dark");
    }
    weave.config.dark = false;
    let target = document.getElementById(weave.root);
    if (document.body.id == "weave") {
      console.info("Changing the whole body info");
      target = document.body;
    }
    target.classList.remove("outer-dark");
    target.classList.add("outer-light");
  },
  description: "Switch to dark mode (stored in config)",
  el: "u",
  config: configLevels.kGlobalConfig,
};

const buttons = (parentId) => {
  return [
    mono,
    serif,
    fontup,
    fontdown,
    newSession,
    print_,
    dark,
    light,
    saveAll_,
    bold, // tested
    italic, // tested
    underline, // tested
    help,
    split(parentId), // tested
    eval_, // tested but needs more
    close_, // tested
    clear, // tested
    gfont, // tested
    save,
    isave,
    dbload,
    dbdump,
    iload,
    title,
    div,
    sql, // tested
    id,
    jazz,
    guillotine,
    hr,
    grouping,
    gsave,
    gload,
    reparse,
    idel,
    pin,
    raw,
    link,
    getAllThingsAsStrings,
    headers,
    code,
    lists,
  ];
};

weave.buttons = buttons;

let helpTable = [`<tr><td>Command</td><td>Help</td></tr>`];
for (let button of buttons()) {
  let commandText;
  if (button.text) {
    commandText = button.text.join("/");
  } else {
    commandText = button.matcher.toString();
  }
  const tr = `<tr><td>${commandText}</td><td>${button.description}</td></tr>`;
  helpTable.push(tr);
}
document.getElementById("commands").innerHTML = helpTable.join("\n");
