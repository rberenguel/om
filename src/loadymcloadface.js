export {
  loadRow,
  iload,
  idel,
  iloadIntoBody,
  presentFiles,
  gload,
  loadAllFromGroup,
  dbload,
  convertNonGroupFileData,
  iload2,
};

import weave from "./weave.js";
import { del, set, get, entries } from "./libs/idb-keyval.js";
import { showModalAndGet } from "./save.js";
import { enterKeyDownEvent } from "./commands_base.js";
import { getPropertiesFromFile, parseIntoWrapper } from "./parser.js";
import { parseGroupFromMarkdown } from "./internal.js";
import { manipulation } from "./manipulation.js";
import { wireEverything } from "./load.js";
import { createPanel } from "./panel.js";
import { parseInto } from "./parser.js";
const DEBUG = false;

const dbload = {
  text: ["dbload", "loaddb"],
  action: (ev) => {
    filePicker.click();
  },
  description: "Load a pane to disk, you won't be choosing where though",
  el: "u",
};

const loadRow = (row) => {
  const splits = row.split(" ");
  const filename = splits[1].slice(0, -1);
  const data = splits.slice(2).join(" ");
  return set(filename, data)
    .then(() => {
      const filedata = convertNonGroupFileData(filename, data);
      console.info(`Data for ${filename} stored in IndexedDb`);
      return Promise.resolve(filedata);
    })
    .catch((err) =>
      console.info(`Saving in IndexedDb failed for ${filename}`, err),
    );
};

const iloadIntoBody = (filename, body) => {
  get(filename)
    .then((dbContent) => {
      console.info(`Loaded ${filename} from IndexedDB`);
      const { _, value } = convertNonGroupFileData(filename, dbContent);
      if (DEBUG) console.debug(value);
      parseIntoWrapper(decodeURIComponent(atob(value)), body);
      const paddingDiv = document.createElement("DIV");
      paddingDiv.id = "padding";
      paddingDiv.innerHTML = "&nbsp;"; // This preserves the cursor
      body.appendChild(paddingDiv); // To allow a place for the cursor at the end
      if (DEBUG) console.info("About to wire");
      body.focus();
      wireEverything(weave.buttons(weave.root));
    })
    .catch((err) => {
      console.error("There was an unexpected error in loading");
      console.error(err);
      throw err;
    });
};

const presentFiles = (files, container) => {
  // Expects files as { key: key, value: content, title: title }
  const modal = document.getElementById("modal");
  container.innerHTML = "";
  const hovering = document.createElement("div");
  hovering.classList.add("raw-preview");
  container.appendChild(hovering);
  console.log(files);
  for (const file of files) {
    console.log;
    const key = file["key"];
    const title = file["title"];
    const k = document.createTextNode(title);
    const div = document.createElement("div");
    div.classList.add("hoverable");
    div.dataset.filekey = file["key"];
    div.dataset.filetitle = file["title"];
    div.appendChild(k);
    container.appendChild(div);
    div.addEventListener("click", (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      const inp = document.querySelector("input.filename");
      if (DEBUG) console.log(key);
      inp.value = key;
      modal.innerHTML = "";
      inp.dispatchEvent(enterKeyDownEvent);
    });
    div.addEventListener("mouseover", (ev) => {
      console.log(file);
      hovering.innerHTML = "";
      console.log(file["value"]);
      const content = decodeURIComponent(atob(file["value"])).split("\n");
      let count = -1;
      for (const line of content) {
        if (count >= 0) {
          const p = document.createElement("P");
          p.textContent = line;
          hovering.appendChild(p);
          count += 1;
        }
        if (line == "-->") {
          count = 0;
        }
        if (count == 4) {
          return;
        }
      }
    });
    div.addEventListener("mouseout", (ev) => {
      hovering.innerHTML = "";
    });
  }
};

const convertNonGroupFileData = (key, value) => {
  let title = undefined;
  let content = "";
  if (value) {
    // Store also the title at the beginning so it's more readable
    const splits = value.split(" ");
    const len = splits.length;
    console.log(splits);
    console.log(len);
    if (splits.length > 1) {
      title = splits.slice(0, len - 1).join(" ");
      content = splits.slice(-1)[0]; // Last one, the rest is assumed to be title
    } else {
      content = splits[0];
    }
  }
  title = title ? title : key;
  console.log(content);
  return { key: key, value: content, title: title };
};

const iload = {
  text: ["iload"],
  action: (ev) => {
    console.info("iload triggered");
    if (DEBUG) console.debug("iloading");
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    const modal = document.getElementById("modal");
    modal.showing = true;
    const fileContainer = document.createElement("div");
    fileContainer.id = "fileContainer";
    modal.append(fileContainer);
    entries()
      .then((entries) => {
        console.log(entries);
        const files = entries
          .filter(
            ([key, value]) =>
              value && !value.startsWith("g:") && !key.startsWith("d"),
          )
          .map(([key, value]) => convertNonGroupFileData(key, value));
        presentFiles(files, fileContainer);
        const hr = document.createElement("hr");
        modal.appendChild(hr);
        showModalAndGet(
          "filename?",
          fileContainer,
          "",
          (filename) => {
            if (!filename) {
              console.info("No file selected in modal, returning empty");
              return;
            }
            console.info(`Loading ${filename} from IndexedDB`);
            iloadIntoBody(filename, body);
          },
          { dbsearching: true },
        );
      })
      .catch((err) => console.error(err));
  },
  description: "Load stuff",
  el: "u",
};

const idel = {
  text: ["idel"],
  action: (ev) => {
    /*const body = document.getElementById(weave.internal.bodyClicks[0]);
    entries().then((entries) => {
      if (DEBUG) console.log(entries);
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
    });*/

    console.info("iload triggered");
    if (DEBUG) console.debug("iloading");
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    const modal = document.getElementById("modal");
    modal.showing = true;
    const fileContainer = document.createElement("div");
    fileContainer.id = "fileContainer";
    modal.append(fileContainer);
    entries()
      .then((entries) => {
        console.log(entries);
        const files = entries
          .filter(([key, value]) => value && !value.startsWith("g:"))
          .map(([key, value]) => convertNonGroupFileData(key, value));
        presentFiles(files, fileContainer);
        const hr = document.createElement("hr");
        modal.appendChild(hr);
        showModalAndGet(
          "filename?",
          fileContainer,
          "",
          (filename) => {
            if (!filename) {
              console.info("No file selected in modal, returning empty");
              return;
            }
            console.info(`Would delete ${filename} from IndexedDB`);
            console.log(files);
            const toDelete = files.filter((f) => f.key === filename)[0];
            console.log(toDelete);
            set(toDelete["key"].replace("f", "d"), toDelete["value"]).then(() =>
              del(filename),
            );
            //iloadIntoBody(filename, body);
          },
          { dbsearching: true },
        );
      })
      .catch((err) => console.error(err));
  },
  description: "Delete stuff from IndexedDB",
  el: "u",
};

const iload2 = {
  text: ["iload2"],
  action: (ev) => {
    console.info("iload triggered");
    if (DEBUG) console.debug("iloading");
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    const modal = document.getElementById("modal");
    modal.showing = true;
    const fileContainer = document.createElement("div");
    fileContainer.id = "fileContainer";
    modal.append(fileContainer);
    entries()
      .then((entries) => {
        const files = entries
          .filter(([key, value]) => value && !value.startsWith("g:"))
          .map(([key, value]) => convertNonGroupFileData(key, value));
        presentFiles(files, fileContainer);
        const hr = document.createElement("hr");
        modal.appendChild(hr);
        showModalAndGet(
          "filename?",
          fileContainer,
          "",
          (filename) => {
            if (!filename) {
              console.info("No file selected in modal, returning empty");
              return;
            }
            console.info(`Loading ${filename} from IndexedDB`);
            iloadIntoBody(filename, body);
          },
          { dbsearching: true },
        );
      })
      .catch((err) => console.error(err));
  },
  description: "???",
  el: "u",
};

const gload = {
  text: ["gload"],
  action: (ev) => {
    const modal = document.getElementById("modal");
    const fileContainer = document.createElement("div");
    fileContainer.id = "fileContainer";
    modal.append(fileContainer);
    entries().then((entries) => {
      const files = entries
        .filter(([key, value]) => value.startsWith("g:"))
        .map(([key, value]) => convertNonGroupFileData(key, value));
      presentFiles(files, fileContainer);
      const hr = document.createElement("hr");
      modal.appendChild(hr);
      showModalAndGet(
        "group name?",
        fileContainer,
        "name:",
        (groupname) => {
          if (!groupname) {
            return;
          }
          loadAllFromGroup(groupname);
        },
        { dbsearching: true },
      );
    });
    ev.target.closest(".body-container").remove();
  },
  description: "Load a group of panes",
  el: "u",
};

const loadAllFromGroup = (groupname) => {
  return get(groupname)
    .then((groupcontent) => {
      const text = groupcontent.substring(2); // Discarg g:
      if (true) console.log(text);
      const group = decodeURIComponent(atob(text));
      try {
        parseGroupFromMarkdown(group);
      } catch (err) {
        console.error("Group is unparsable as markdown: ");
        console.error(err);
      }
      // const files = groupcontent.substring(2).split("|");
      // let n = weave.bodies().length;
      // for (const filename of files) {
      //   const bodyId = `b${n}`; // TODO NO, this is not good enough, but works for now…
      //   createPanel(weave.root, bodyId, weave.buttons(weave.root), weave);
      //   const body = document.getElementById(bodyId);
      //   n += 1;
      //   console.info(`Loading ${filename} from IndexedDB`);
      //   get(filename).then((filecontent) => {
      //     const {key, value} = convertNonGroupFileData(filename, filecontent)
      //     console.info(`Loaded ${key} from IndexedDb`);
      //     parseIntoWrapper(decodeURIComponent(atob(value)), body);
      //     const paddingDiv = document.createElement("DIV")
      //     paddingDiv.id = "padding"
      //     paddingDiv.innerHTML = "&nbsp;" // This preserves the cursor
      //     body.appendChild(paddingDiv) // To allow a place for the cursor at the end
      //     wireEverything(weave.buttons(weave.root));
    })
    .catch((err) => {
      console.error("Loading group from IndexedDb failed", err);
      console.error(err);
      throw err;
    });
};
