export { loadRow, iload, iloadIntoBody, presentFiles, gload, loadAllFromGroup, dbload };

import weave from "./weave.js";
import { set, get, entries } from "./libs/idb-keyval.js";
import { showModalAndGetFilename } from "./save.js";
import { enterKeyDownEvent } from "./commands_base.js";
import { getPropertiesFromFile, parseIntoWrapper } from "./parser.js";
import { manipulation } from "./panel.js";
import { wireEverything } from "./load.js";
import { createPanel } from "./doms.js";

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
  const data = splits[2];
  return set(filename, data)
    .then(() => {
      console.info(`Data for ${filename} stored in IndexedDb`)
      return Promise.resolve(filename)
    })
    .catch((err) =>
      console.info(`Saving in IndexedDb failed for ${filename}`, err),
    );
}


const iloadIntoBody = (filename, body) => {
  get(filename).then((value) => {
    console.info("Loaded from IndexedDb");
    console.info("About to parse")
    let title = ""
          let content = ""
          if(value){
            // Store also the title at the beginning so it's more readable
            const splits = value.split(" ")
            if(splits.length > 1){
              title = splits[0]
              content = splits.slice(-1)[0] // Last one, the rest is assumed to be title
            } else {
              content = splits[0]
            }
          }
    parseIntoWrapper(decodeURIComponent(atob(content)), body);
    const paddingDiv = document.createElement("DIV")
    paddingDiv.id = "padding"
    paddingDiv.innerHTML = "&nbsp;" // This preserves the cursor
    body.appendChild(paddingDiv) // To allow a place for the cursor at the end
    console.info("About to wire")
    wireEverything(weave.buttons(weave.root));
  }).catch((err) => {
    console.error("There was an unexpected error in loading")
    console.error(err)
    throw err;
  });
};

const presentFiles = (files, container) => {
  const modal = document.getElementById("modal");
  container.innerHTML = "";
  for (const file of files) {
    const key = file["key"]
    const value = file["value"]
    let title = key
    if(value && !value.startsWith("g:")){
      const decoded = decodeURIComponent(atob(value))
      const properties =  getPropertiesFromFile(decoded)
      const fileTitle = properties[manipulation.fields.kTitle]
      if(fileTitle){
        title = fileTitle
      }
    } else {
      title = file["title"]
      // And if this fails something broke
    }
    const k = document.createTextNode(title);
    const div = document.createElement("div");
    div.classList.add("hoverable");
    div.appendChild(k);
    container.appendChild(div);
    div.addEventListener("click", (ev) => {
      ev.stopPropagation()
      ev.preventDefault()
      const inp = document.querySelector("input.filename");
      inp.value = key;
      modal.innerHTML = "";
      inp.dispatchEvent(enterKeyDownEvent);

    });
  }
};

const iload = {
  text: ["iload"],
  action: (ev) => {
    console.debug("iloading")
    const body = document.getElementById(weave.internal.bodyClicks[0]);
    const modal = document.getElementById("modal");
    modal.showing = true
    const fileContainer = document.createElement("div");
    fileContainer.id = "fileContainer";
    modal.append(fileContainer);
    entries().then((entries) => {
      const files = entries
        .filter(([key, value]) => value && !value.startsWith("g:"))
        .map(([key, value]) => {
          let title = ""
          let content = ""
          if(value){
            // Store also the title at the beginning so it's more readable
            const splits = value.split(" ")
            if(splits.length > 1){
              title = splits[0]
              content = splits.slice(-1)[0] // Last one, the rest is assumed to be title
            } else {
              content = splits[0]
            }
          }
          return {key: key, value: content}});
      presentFiles(files, fileContainer);
      const hr = document.createElement("hr");
      modal.appendChild(hr);
      showModalAndGetFilename("filename?", fileContainer, "", (filename) => {
        if (!filename) {
          return;
        }
        console.info(`Loading ${filename} from IndexedDB`);
        iloadIntoBody(filename, body);
      });
    });
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
        .map(([key, value]) => { return {key: key, value: value}});
      presentFiles(files, fileContainer);
      const hr = document.createElement("hr");
      modal.appendChild(hr);
      showModalAndGetFilename(
        "group name?",
        fileContainer,
        "name:",
        (groupname) => {
          if (!groupname) {
            return;
          }
          loadAllFromGroup(groupname);
        },
      );
    });
    ev.target.closest(".body-container").remove();
  },
  description: "Load a group of panes",
  el: "u",
};

const loadAllFromGroup = (groupname) => {
  let throwing;
  return get(groupname)
    .then((groupcontent) => {
      const files = groupcontent.substring(2).split("|");
      let n = weave.bodies().length;
      for (const filename of files) {
        const bodyId = `b${n}`; // TODO NO, this is not good enough, but works for now…
        createPanel(weave.root, bodyId, weave.buttons(weave.root), weave);
        const body = document.getElementById(bodyId);
        n += 1;
        console.info(`Loading ${filename} from IndexedDB`);
        get(filename).then((filecontent) => {
          console.info("Loaded from IndexedDb");
          //loadFromContent(atob(filecontent), filename, body);
          parseIntoWrapper(decodeURIComponent(atob(filecontent)), body);
          const paddingDiv = document.createElement("DIV")
          paddingDiv.id = "padding"
          paddingDiv.innerHTML = "&nbsp;" // This preserves the cursor
          body.appendChild(paddingDiv) // To allow a place for the cursor at the end
          wireEverything(weave.buttons(weave.root));
        });
        //const container = body.closest(".body-container")

        wireEverything(weave.buttons(weave.root));
      }
    })
    .catch((err) => {
      console.error("Loading group from IndexedDb failed", err);
      console.error(err);
      throw err;
    });
};
