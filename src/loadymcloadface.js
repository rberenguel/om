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
};

import weave from "./weave.js";
import { del, set, get, entries } from "./libs/idb-keyval.js";
import { showModalAndGet } from "./save.js";
import { enterKeyDownEvent } from "./commands_base.js";
import { parseIntoWrapper } from "./parser.js";
import { parseGroupFromMarkdown } from "./internal.js";
import { wireEverything } from "./load.js";
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

const iloadIntoBody = (filename, body, options = {}) => {
  get(filename)
    .then((dbContent) => {
      const defaults = {
        starting: true,
      };
      console.info(`Loaded ${filename} from IndexedDB`);
      const { _, value } = convertNonGroupFileData(filename, dbContent);
      if (DEBUG) console.debug(value);
      let content = value;
      if (value.startsWith("g:")) {
        content = value.slice(2);
        // TODO this is not enough to directly load groups
      }
      const markdown = decodeURIComponent(atob(content));
      console.warn(markdown);
      body.baseMarkdown = markdown;
      parseIntoWrapper(markdown, body, { ...defaults, ...options }); // This is likely to always be a "starting"
      const paddingDiv = document.createElement("DIV");
      paddingDiv.id = "padding";
      paddingDiv.innerHTML = "&nbsp;"; // This preserves the cursor
      body.appendChild(paddingDiv); // To allow a place for the cursor at the end
      if (DEBUG) console.info("About to wire");
      body.focus();
      wireEverything(weave.buttons(weave.root));
      if (options.callback) {
        options.callback();
      }
    })
    .catch((err) => {
      console.error("There was an unexpected error in loading");
      console.error(err);
      throw err;
    });
};

const presentFiles = (files, container, options = {}) => {
  console.log("Presenting");
  console.log(files);
  // Expects files as { key: key, value: content, title: title }
  const modal = document.getElementById("modal");
  container.innerHTML = "";
  const hovering = document.createElement("div");
  hovering.classList.add("raw-preview");
  container.appendChild(hovering);
  for (const file of files) {
    const key = file["key"];
    if (options.filterOutKeys) {
      if (options.filterOutKeys.includes(key[0])) continue;
    }
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
      if (DEBUG) console.log(file);
      hovering.innerHTML = "";
      if (DEBUG) console.log(file["value"]);
      const value = file["value"];

      let content = [""];
      let count = -1;
      if (value.startsWith("g:")) {
        count = 0; // Groups have no header
        content = decodeURIComponent(atob(value.slice(2))).split("\n");
      } else {
        content = decodeURIComponent(atob(value)).split("\n");
      }

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
  console.log(key, value);
  if (value) {
    // Store also the title at the beginning so it's more readable
    const splits = value.split(" ");
    const len = splits.length;
    if (splits.length > 1) {
      title = splits.slice(0, len - 1).join(" ");
      content = splits.slice(-1)[0]; // Last one, the rest is assumed to be title
    } else {
      content = splits[0];
    }
  }
  title = title ? title : key;
  return { key: key, value: content, title: title };
};

const iload = {
  text: ["iload"],
  action: (ev, body) => {
    console.info("iload triggered");
    if (DEBUG) console.debug("iloading");
    body = body || document.getElementById(weave.internal.bodyClicks[0]);
    const modal = document.getElementById("modal");
    modal.showing = true;
    const fileContainer = document.createElement("div");
    fileContainer.id = "fileContainer";
    modal.append(fileContainer);
    entries()
      .then((entries) => {
        const files = entries
          .filter(
            ([key, value]) =>
              value &&
              //!value.startsWith("g:") &&
              !key.startsWith("d") &&
              !key.startsWith("c"), // Avoid loading deletions, groups or cards
          )
          .map(([key, value]) => convertNonGroupFileData(key, value));
        console.warn(files);
        presentFiles(files, fileContainer, { filterOutKeys: "cd" });
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
          { dbsearching: true, filterOutKeys: "cd" },
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
    if (DEBUG) console.debug("idel");
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    const modal = document.getElementById("modal");
    modal.showing = true;
    const fileContainer = document.createElement("div");
    fileContainer.id = "fileContainer";
    modal.append(fileContainer);
    entries()
      .then((entries) => {
        if (DEBUG) console.log(entries);
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
            console.info(`Would delete ${filename} from IndexedDB`);
            if (DEBUG) console.log(files);
            const toDelete = files.filter((f) => f.key === filename)[0];
            if (DEBUG) console.log(toDelete);
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

const gload = {
  text: ["gload"],
  action: (ev) => {
    const modal = document.getElementById("modal");
    const fileContainer = document.createElement("div");
    fileContainer.id = "fileContainer";
    modal.append(fileContainer);
    entries().then((entries) => {
      const files = entries
        .filter(([key, value]) => value && value.startsWith("g:"))
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
    if (ev) {
      // TODO. Is this really a good idea?
      ev.target.closest(".body-container").remove();
    }
  },
  description: "Load a group of panes",
  el: "u",
};

const loadAllFromGroup = (groupname) => {
  return get(groupname)
    .then((groupcontent) => {
      console.warn(groupcontent);
      const text = groupcontent.substring(2); // Discarg g:
      if (DEBUG) console.log(text);
      const group = decodeURIComponent(atob(text));
      console.warn(group);
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
