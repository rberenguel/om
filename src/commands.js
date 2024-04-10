export { buttons };

import weave from "./weave.js";
import { createPanel, postfix, prefix } from "./doms.js";
import { common } from "./commands_base.js";
import { configLevels } from "./common.js";
import { wireEverything } from "./load.js";
import { manipulation } from "./panel.js";
import { parseIntoWrapper, parseInto, toMarkdown } from "./parser.js";
import { get, keys, del, set, entries } from "./libs/idb-keyval.js";
import { arrow } from "./arrow.js";
import { headers, code, lists, link, hr, gfont, mono, fontup, fontdown, serif, underline, italic, bold } from "./formatters.js";
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

      function ccopy(text) {
        console.log(text)
        return new Promise((resolve, reject) => {
          if (typeof navigator !== "undefined" && typeof navigator.clipboard !== "undefined" && navigator.permissions !== "undefined") {
            console.log("Copying")
            const type = "text/plain";
            const blob = new Blob([text], { type });
            const data = [new ClipboardItem({ [type]: blob })];
            navigator.permissions.query({name: "clipboard-write"}).then((permission) => {
              if (permission.state === "granted" || permission.state === "prompt") {
                console.log("Copying")
                navigator.clipboard.write(data).then(resolve, reject).catch(reject);
              }
              else {
                console.log("Rejecting")
                reject(new Error("Permission not granted!"));
              }
            });
          }
          else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
            console.log("Fallback case")
            var textarea = document.createElement("textarea");
            textarea.textContent = text;
            textarea.style.position = "fixed";
            textarea.style.width = '2em';
            textarea.style.height = '2em';
            textarea.style.padding = 0;
            textarea.style.border = 'none';
            textarea.style.outline = 'none';
            textarea.style.boxShadow = 'none';
            textarea.style.background = 'transparent';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            try {
              document.execCommand("copy");
              document.body.removeChild(textarea);
              resolve();
            }
            catch (e) {
              document.body.removeChild(textarea);
              reject(e);
            }
          }
          else {
            console.log("Fully rejecting")
            reject(new Error("None of copying methods are supported by this browser!"));
          }
        });

      }

const getAllThingsAsStrings = {
  text: ["pbcopy"],
  action: (ev) => {
    /*navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
            if (result.state === "granted" || result.state === "prompt") {
              // Permission granted or will be prompted, you can copy
              copyTextToClipboard("Your text here"); 
            } else {
              // Permission denied, handle this case
              console.log("Clipboard permission denied");
            }
          });*/
              //navigator.clipboard.writeText("foo\nbar")
              ccopy("foo")
              entries().then((entries) => {
                //return new Promise((resolve, reject) => {
                let lines = [];
                for (const [key, value] of entries) {
                  lines.push(`- ${key}: ${value}`);
                }
                ccopy(lines.join("\n")).then(() => console.log(success)).catch(err => console.error(err))
                //alert(lines.join("\n"))
                //resolve(lines.join("\n"))
              }
              )
    //                })
    /*.then(text => {
                  console.log(text)
                  navigator.clipboard.writeText(text)
                }).then(() => {
                  console.log("successfully copied");
                })
            .catch((err) => {
              console.error(err);
            });*/
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

// TODO(me) I might not need this? Or…

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
  description: "(deprecating?) Sets the title of this pane. Useful to store menus in the URL",
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
    arrow
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
